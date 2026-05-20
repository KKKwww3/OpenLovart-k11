import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  requireAuth,
  corsHeaders,
} from "../_shared/auth.ts";
import { uploadImageToImgbb } from "../_shared/imgbb.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return createOptionsResponse();

  try {
    await requireAuth(req);

    const body = await req.json();
    const { sourceImage, prompt, quality = 70 } = body;

    if (!sourceImage) return createErrorResponse("sourceImage is required", 400);
    if (!prompt) return createErrorResponse("prompt is required", 400);

    const NB2_API_URL = Deno.env.get("NB2_API_BASE_URL");
    const NB2_API_KEY = Deno.env.get("NB2_API_KEY");

    if (!NB2_API_URL || !NB2_API_KEY) {
      return createErrorResponse("NB2 API not configured", 500);
    }

    // 组装 NB2 请求 body — 提示词驱动，传递原图作为参考
    const nb2Body = {
      image: sourceImage,
      prompt,
      output_format: "png",
    };

    const nb2Res = await fetch(NB2_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NB2_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nb2Body),
    });

    if (!nb2Res.ok) {
      const errText = await nb2Res.text();
      return createErrorResponse(`NB2 error: ${errText.slice(0, 200)}`, 502);
    }

    const nb2Data = await nb2Res.json();
    const resultBase64 = nb2Data.image || nb2Data.result || nb2Data.data;

    if (!resultBase64) {
      return createErrorResponse("NB2 returned no image", 502);
    }

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