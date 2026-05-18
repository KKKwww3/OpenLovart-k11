import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  createJsonResponse,
  requireAuth,
} from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createOptionsResponse();
  }

  try {
    const user = await requireAuth(req);

    const { prompt, seconds, size, referenceImage } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return createErrorResponse("Prompt is required", 400);
    }

    const apiKey = Deno.env.get("VIDEO_API_KEY");
    const baseUrl = Deno.env.get("VIDEO_API_BASE_URL");

    if (!apiKey) {
      return createErrorResponse("VIDEO_API_KEY not configured", 500);
    }

    if (!baseUrl) {
      return createErrorResponse("VIDEO_API_BASE_URL not configured", 500);
    }

    console.log("Generating video for user:", user.id);

    const form = new FormData();
    form.append("model", "sora-2");
    form.append("prompt", prompt);

    if (seconds) form.append("seconds", seconds.toString());
    if (size) form.append("size", size);

    if (referenceImage) {
      const base64Data = referenceImage.includes("base64,")
        ? referenceImage.split("base64,")[1]
        : referenceImage;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/jpeg" });
      form.append("input_reference", blob, "reference.jpg");
    }

    const response = await fetch(`${baseUrl}/videos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to start video generation");
    }

    return createJsonResponse({ taskId: data.id, status: data.status });
  } catch (error) {
    console.error("Error generating video:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Authentication")) {
      return createErrorResponse(message, 401);
    }

    return createJsonResponse(
      { error: "Failed to generate video", details: message },
      500,
    );
  }
});
