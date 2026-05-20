import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  requireAuth,
  getServiceSupabase,
  corsHeaders,
} from "../_shared/auth.ts";
import { uploadImageToImgbb } from "../_shared/imgbb.ts";

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
      // 用户指定了模型 ID，按 ID 查询
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
      // 未指定 — 取第一个启用模型
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

    // 构造 OpenAI 兼容的 messages 格式
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
      stream: false,
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

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    if (!choice) {
      return createErrorResponse("AI returned no choices", 502);
    }

    // 从 response 中提取图片 base64
    let resultBase64: string | undefined;
    const messageContent = choice.message?.content;

    if (typeof messageContent === "string") {
      const base64Match = messageContent.match(
        /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
      );
      if (base64Match) resultBase64 = base64Match[0];
    } else if (Array.isArray(messageContent)) {
      for (const part of messageContent) {
        if (part.type === "image_url" && part.image_url?.url) {
          resultBase64 = part.image_url.url;
          break;
        }
        if (part.inlineData) {
          resultBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultBase64) {
      return createErrorResponse("AI returned no image data", 502);
    }

    // 上传到 imgbb
    const imgbbResult = await uploadImageToImgbb(resultBase64);
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