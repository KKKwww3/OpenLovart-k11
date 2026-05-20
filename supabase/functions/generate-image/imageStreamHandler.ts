import { parseAiSseChunk } from "./parseSseChunk.ts";
import { uploadImageToImgbb } from "../_shared/imgbb.ts";

export interface ImageStreamOptions {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: unknown }[];
  aspectRatio?: string;
  imageSize?: string;
  writeSse: (event: string, data: string) => Promise<void>;
}

export async function handleImageStream(
  options: ImageStreamOptions,
): Promise<void> {
  const {
    apiBaseUrl,
    apiKey,
    model,
    messages,
    aspectRatio,
    imageSize,
    writeSse,
  } = options;
  let textAccumulator = "";
  let imageData: string | null = null;

  try {
    await writeSse(
      "status",
      JSON.stringify({
        stage: "connecting",
        message: "正在连接 AI 服务...",
      }),
    );

    await writeSse(
      "status",
      JSON.stringify({
        stage: "generating",
        message: "AI 正在生成图片...",
      }),
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600_000);

    const heartbeatInterval = setInterval(async () => {
      try {
        await writeSse(
          "status",
          JSON.stringify({
            stage: "generating",
            message: "AI 正在生成图片，请稍候...",
          }),
        );
      } catch {
        // heartbeat send failed, ignore
      }
    }, 15_000);

    const imageConfig: Record<string, string> = {};
    if (aspectRatio) {
      imageConfig.aspect_ratio = aspectRatio;
    }
    if (imageSize) {
      imageConfig.image_size = imageSize;
    }

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      modalities: ["image", "text"],
      stream: true,
    };
    if (Object.keys(imageConfig).length > 0) {
      requestBody.image_config = imageConfig;
    }

    let aiResponse: Response;
    try {
      aiResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      clearInterval(heartbeatInterval);
      const isTimeout = fetchErr instanceof Error &&
        fetchErr.name === "AbortError";
      await writeSse(
        "error",
        JSON.stringify({
          error: isTimeout ? "AI 服务响应超时" : "AI 服务连接失败",
          details: isTimeout
            ? "120 秒内未收到 AI 响应，请稍后重试"
            : String(fetchErr),
        }),
      );
      return;
    }

    clearInterval(heartbeatInterval);
    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      await writeSse(
        "error",
        JSON.stringify({
          error: "AI 服务连接失败",
          details: `状态码 ${aiResponse.status}: ${errorText.slice(0, 200)}`,
        }),
      );
      return;
    }

    const aiBody = aiResponse.body;
    if (!aiBody) {
      await writeSse(
        "error",
        JSON.stringify({
          error: "AI 服务返回空响应",
        }),
      );
      return;
    }

    const reader = aiBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const rawData = trimmed.slice(6);
        if (rawData === "[DONE]") continue;

        const chunk = parseAiSseChunk(rawData);
        if (!chunk) continue;

        if (chunk.content) {
          textAccumulator += chunk.content;
          await writeSse(
            "progress",
            JSON.stringify({
              text: chunk.content,
              accumulated: textAccumulator.slice(-200),
            }),
          );
        }

        if (chunk.imageData && !imageData) {
          imageData = chunk.imageData;
        }

        if (chunk.done) {
          break;
        }
      }
    }

    if (!imageData && textAccumulator) {
      const base64Match = textAccumulator.match(
        /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
      );
      if (base64Match) {
        imageData = base64Match[0];
        textAccumulator = textAccumulator
          .replace(base64Match[0], "")
          .trim();
      }
    }

    let imageUrl: string | null = null;
    if (imageData) {
      await writeSse(
        "status",
        JSON.stringify({
          stage: "uploading",
          message: "正在上传图片...",
        }),
      );
      const result = await uploadImageToImgbb(imageData);
      if (result) {
        imageUrl = result.url;
      }
    }

    if (!imageData && !textAccumulator) {
      await writeSse(
        "error",
        JSON.stringify({
          error: "AI 未生成图片",
          details: "未收到任何数据",
        }),
      );
    } else if (!imageData && textAccumulator) {
      await writeSse(
        "error",
        JSON.stringify({
          error: "AI 返回了文本而非图片",
          details: textAccumulator.slice(0, 500),
        }),
      );
    } else if (!imageUrl) {
      await writeSse(
        "error",
        JSON.stringify({
          error: "图片上传失败",
          details: "请检查 IMGBB_API_KEY 配置",
        }),
      );
    } else {
      await writeSse(
        "complete",
        JSON.stringify({
          imageUrl,
          textResponse: textAccumulator.replace(/\n+/g, "\n").trim(),
        }),
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown stream error";
    let userMsg = msg;
    if (
      msg.includes("error reading a body from connection") ||
      msg.includes("connection") ||
      msg.includes("reset")
    ) {
      userMsg = "AI 服务连接中断，可能是网络不稳定或模型响应超时，请稍后重试";
    }
    await writeSse(
      "error",
      JSON.stringify({ error: "流处理失败", details: userMsg }),
    );
  }
}
