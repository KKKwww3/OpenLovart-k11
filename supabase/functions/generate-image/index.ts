import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  createOptionsResponse,
  createErrorResponse,
  createJsonResponse,
  requireAuth,
} from "../_shared/auth.ts";
import { uploadImageToImgbb } from "../_shared/imgbb.ts";

interface SseChunk {
  content: string;
  done: boolean;
  error?: string;
  imageData?: string;
}

function parseAiSseChunk(data: string): SseChunk | null {
  try {
    if (data === "[DONE]") return null;

    const parsed = JSON.parse(data);
    const choice = parsed.choices?.[0];
    if (!choice) return null;

    const delta = choice.delta || choice.message || {};

    let content = "";
    let imageData: string | undefined;

    if (typeof delta.content === "string") {
      content = delta.content;
    } else if (Array.isArray(delta.content)) {
      for (const part of delta.content) {
        if (part.type === "text" && part.text) {
          content += part.text;
        } else if (part.type === "image_url" && part.image_url?.url) {
          imageData = part.image_url.url;
        } else if (part.type === "image" && part.image_url?.url) {
          imageData = part.image_url.url;
        } else if (part.inlineData) {
          imageData = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
    }

    if (delta.images && Array.isArray(delta.images)) {
      for (const img of delta.images) {
        if (img.url && !imageData) imageData = img.url;
        if (img.image_url?.url && !imageData) imageData = img.image_url.url;
      }
    }

    const finishReason = choice.finish_reason;
    const done =
      finishReason === "stop" ||
      finishReason === "length" ||
      finishReason === "content_filter";

    return { content, done, imageData };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createOptionsResponse();
  }

  try {
    const user = await requireAuth(req);

    const { prompt, referenceImage, productImage, model } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return createErrorResponse("Prompt is required", 400);
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

    console.log(
      "Starting streaming image generation for user:",
      user.id,
      "model:",
      actualModel,
    );

    const userContent: {
      type: string;
      text?: string;
      image_url?: { url: string };
    }[] = [{ type: "text", text: prompt }];

    const addImage = (
      content: { type: string; text?: string; image_url?: { url: string } }[],
      imageUrl: string,
    ) => {
      content.push({
        type: "image_url",
        image_url: { url: imageUrl },
      });
    };

    if (referenceImage) {
      addImage(userContent, referenceImage);
    }
    if (productImage) {
      addImage(userContent, productImage);
    }

    const messages = [{ role: "user", content: userContent }];

    console.log("Calling streaming image API with model:", actualModel);

    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const writeSse = async (event: string, data: string) => {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      await writer.ready;
    };

    // Start background task for AI API call and stream processing
    // This allows us to return the Response immediately to the client
    (async () => {
      let textAccumulator = "";
      let imageData: string | null = null;

      try {
        // Send status immediately - client will receive this right after connection
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

        let aiResponse: Response;
        try {
          aiResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: actualModel,
              messages,
              modalities: ["image", "text"],
              stream: true,
            }),
            signal: controller.signal,
          });
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          const isTimeout =
            fetchErr instanceof Error && fetchErr.name === "AbortError";
          console.error(
            "AI API fetch error:",
            isTimeout ? "timeout" : fetchErr,
          );
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

        clearTimeout(timeoutId);

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error("Image API error:", aiResponse.status, errorText);
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
        console.error("Stream processing error:", err);
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
      } finally {
        await writer.close();
      }
    })();

    // Return Response immediately - the background task handles AI API and SSE events
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Authentication")) {
      return createErrorResponse(message, 401);
    }

    return createJsonResponse(
      {
        error: "Failed to generate image",
        details: message,
      },
      500,
    );
  }
});
