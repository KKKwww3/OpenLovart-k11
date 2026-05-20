import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  requireAuth,
  getServiceSupabase,
  corsHeaders,
} from "../_shared/auth.ts";
import { uploadImageToImgbb } from "../_shared/imgbb.ts";

interface SseChunk {
  content: string;
  done: boolean;
  imageData?: string;
}

function parseSseChunk(data: string): SseChunk | null {
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
  if (req.method === "OPTIONS") return createOptionsResponse();

  try {
    await requireAuth(req);

    const body = await req.json();
    const { sourceImage, prompt, modelId } = body;

    if (!sourceImage) return createErrorResponse("sourceImage is required", 400);
    if (!prompt) return createErrorResponse("prompt is required", 400);

    const apiBaseUrl = Deno.env.get("IMAGE_API_BASE_URL");
    const apiKey = Deno.env.get("IMAGE_API_KEY");

    if (!apiBaseUrl) return createErrorResponse("IMAGE_API_BASE_URL not configured", 500);
    if (!apiKey) return createErrorResponse("IMAGE_API_KEY not configured", 500);

    // 从数据库读取模型配置（通过 ai_models 表管理，用户在 Dashboard 填）
    const supabase = getServiceSupabase();

    let model: string;
    if (modelId != null) {
      const { data: modelData, error: modelError } = await supabase
        .from("ai_models")
        .select("value")
        .eq("id", modelId)
        .eq("is_active", true)
        .single<{ value: string }>();

      if (modelError || !modelData) {
        return createErrorResponse(`Model with id ${modelId} not found or inactive`, 500);
      }
      model = modelData.value;
    } else {
      const { data: modelData, error: modelError } = await supabase
        .from("ai_models")
        .select("value")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1)
        .single<{ value: string }>();

      if (modelError || !modelData) {
        return createErrorResponse("No active model found in ai_models", 500);
      }
      model = modelData.value;
    }

    const messages = [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: prompt },
          { type: "image_url" as const, image_url: { url: sourceImage } },
        ],
      },
    ];

    const requestBody = {
      model,
      messages,
      modalities: ["image", "text"],
      stream: true,
    };

    const aiResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return createErrorResponse(`AI error: ${errText.slice(0, 200)}`, 502);
    }

    const aiBody = aiResponse.body;
    if (!aiBody) {
      return createErrorResponse("AI returned empty body", 502);
    }

    // 流式解析 SSE 响应，提取图片数据
    const reader = aiBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let imageData: string | null = null;
    let textAccumulator = "";

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

        const chunk = parseSseChunk(rawData);
        if (!chunk) continue;

        if (chunk.content) {
          textAccumulator += chunk.content;
        }

        if (chunk.imageData && !imageData) {
          imageData = chunk.imageData;
        }
      }
    }

    // 如果流中没提取到，尝试从累计文本中正则提取
    if (!imageData && textAccumulator) {
      const base64Match = textAccumulator.match(
        /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
      );
      if (base64Match) {
        imageData = base64Match[0];
      }
    }

    if (!imageData) {
      const snippet = textAccumulator.slice(0, 200);
      return createErrorResponse(
        `AI returned no image data. Response text: ${snippet}`,
        502,
      );
    }

    const imgbbResult = await uploadImageToImgbb(imageData);
    if (!imgbbResult) {
      return createErrorResponse("Image upload failed", 500);
    }

    return new Response(
      JSON.stringify({
        imageUrl: imgbbResult.url,
        prompt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Authentication")) {
      return createErrorResponse(msg, 401);
    }
    return createErrorResponse(msg, 500);
  }
});