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
    const done = finishReason === "stop" || finishReason === "length" || finishReason === "content_filter";

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

    const {
      prompt,
      referenceImage,
      productImage,
      model,
    } = await req.json();

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
      return createErrorResponse("IMAGE_API_MODEL not configured and no model provided in request", 500);
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

    const aiResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
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
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Image API error:", aiResponse.status, errorText);
      return createJsonResponse(
        {
          error: "Image generation failed",
          details: `API responded with status ${aiResponse.status}`,
        },
        502,
      );
    }

    const aiBody = aiResponse.body;
    if (!aiBody) {
      return createJsonResponse(
        { error: "No response body from AI API" },
        502,
      );
    }

    // Build SSE response
    let textAccumulator = "";
    let imageData: string | null = null;
    let encoder = new TextEncoder();

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const writeSse = (event: string, data: string) => {
      writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
    };

    // Process stream in background, write chunks
    (async () => {
      try {
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
              writeSse("progress", JSON.stringify({
                text: chunk.content,
                accumulated: textAccumulator.slice(-200),
              }));

              // Force flush each progress event to ensure real-time delivery
              await writer.ready;
            }

            if (chunk.imageData && !imageData) {
              imageData = chunk.imageData;
            }

            if (chunk.done) {
              break;
            }
          }
        }

        // Final: check if we have image data or try to extract from text
        if (!imageData && textAccumulator) {
          const base64Match = textAccumulator.match(
            /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
          );
          if (base64Match) {
            imageData = base64Match[0];
            textAccumulator = textAccumulator.replace(base64Match[0], "").trim();
          }
        }

        // Upload generated image to imgbb and return URL
        let imageUrl: string | null = null;
        if (imageData) {
          const result = await uploadImageToImgbb(imageData);
          if (result) {
            imageUrl = result.url;
          }
        }

        if (!imageData && !textAccumulator) {
          writeSse("error", JSON.stringify({
            error: "No image was generated",
            details: "No data received from AI API.",
          }));
        } else if (!imageData && textAccumulator) {
          writeSse("error", JSON.stringify({
            error: "Model returned text instead of image",
            details: textAccumulator,
          }));
        } else {
          writeSse("complete", JSON.stringify({
            imageUrl: imageUrl || "",
            textResponse: textAccumulator.replace(/\n+/g, "\n").trim(),
          }));
        }
      } catch (err) {
        console.error("Stream processing error:", err);
        const msg = err instanceof Error ? err.message : "Unknown stream error";
        writeSse("error", JSON.stringify({ error: "Stream processing failed", details: msg }));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
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