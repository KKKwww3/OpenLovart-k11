import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  createJsonResponse,
  requireAuth,
} from "../_shared/auth.ts";
import { createSseStream, createSseResponse } from "../generate-image/sseWriter.ts";
import { parseAiSseChunk } from "../generate-image/parseSseChunk.ts";
import { uploadImageToImgbb } from "../_shared/imgbb.ts";

interface StylePreprocessRequest {
  sceneImageUrl: string;
  similarity: number;
  keepItems: string[];
  changeItems: string[];
  model?: string;
}

function buildStylePrompt(config: StylePreprocessRequest): string {
  const lines: string[] = [];

  lines.push("请帮我调整这张室内场景图，用于电商产品展示。");

  if (config.changeItems.length > 0) {
    lines.push(`你需要调整${config.changeItems.join("、")}等元素。`);
  }

  if (config.keepItems.length > 0) {
    lines.push(`注意保持${config.keepItems.join("、")}不变。`);
  }

  if (config.similarity < 100) {
    lines.push(`整体风格与原图保持${config.similarity}%相似度即可，不必完全一致。`);
  }

  lines.push("保持照片级真实感，无AI痕迹。");

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createOptionsResponse();
  }

  try {
    const user = await requireAuth(req);

    const { sceneImageUrl, similarity, keepItems, changeItems, model } = await req.json();

    if (!sceneImageUrl || typeof sceneImageUrl !== "string") {
      return createErrorResponse("sceneImageUrl is required", 400);
    }

    const apiBaseUrl = Deno.env.get("IMAGE_API_BASE_URL");
    const apiKey = Deno.env.get("IMAGE_API_KEY");

    if (!apiBaseUrl) {
      return createErrorResponse("IMAGE_API_BASE_URL not configured", 500);
    }

    if (!apiKey) {
      return createErrorResponse("IMAGE_API_KEY not configured", 500);
    }

    const actualModel = model || Deno.env.get("IMAGE_API_MODEL");

    if (!actualModel) {
      return createErrorResponse(
        "IMAGE_API_MODEL not configured and no model provided in request",
        500,
      );
    }

    const stylePrompt = buildStylePrompt({
      sceneImageUrl,
      similarity: similarity || 100,
      keepItems: keepItems || [],
      changeItems: changeItems || [],
    });

    const userContent: {
      type: string;
      text?: string;
      image_url?: { url: string };
    }[] = [
      { type: "text", text: stylePrompt },
      { type: "image_url", image_url: { url: sceneImageUrl } },
    ];

    const messages = [{ role: "user", content: userContent }];

    const { readable, writeSse, close } = createSseStream();

    (async () => {
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
            stage: "preprocessing",
            message: "AI 正在处理场景图风格...",
          }),
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600_000);

        const heartbeatInterval = setInterval(async () => {
          try {
            await writeSse("status", JSON.stringify({
              stage: "preprocessing",
              message: "AI 正在处理场景图风格，请稍候...",
            }));
          } catch {
          }
        }, 15_000);

        const requestBody: Record<string, unknown> = {
          model: actualModel,
          messages,
          modalities: ["image", "text"],
          stream: true,
        };

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
          const isTimeout =
            fetchErr instanceof Error && fetchErr.name === "AbortError";
          await writeSse(
            "error",
            JSON.stringify({
              error: isTimeout ? "AI 服务响应超时" : "AI 服务连接失败",
              details: isTimeout
                ? "600 秒内未收到 AI 响应，请稍后重试"
                : String(fetchErr),
            }),
          );
          await close();
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
          await close();
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
          await close();
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
              message: "正在上传处理后的场景图...",
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
          userMsg =
            "AI 服务连接中断，可能是网络不稳定或模型响应超时，请稍后重试";
        }
        await writeSse(
          "error",
          JSON.stringify({ error: "流处理失败", details: userMsg }),
        );
      }

      await close();
    })();

    return createSseResponse(readable);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Authentication")) {
      return createErrorResponse(message, 401);
    }

    return createJsonResponse(
      {
        error: "Failed to preprocess style",
        details: message,
      },
      500,
    );
  }
});
