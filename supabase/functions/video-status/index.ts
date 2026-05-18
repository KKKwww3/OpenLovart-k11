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

    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");

    if (!taskId) {
      return createErrorResponse("Task ID is required", 400);
    }

    const apiKey = Deno.env.get("VIDEO_API_KEY");
    const baseUrl = Deno.env.get("VIDEO_API_BASE_URL");

    if (!apiKey) {
      return createErrorResponse("VIDEO_API_KEY not configured", 500);
    }

    if (!baseUrl) {
      return createErrorResponse("VIDEO_API_BASE_URL not configured", 500);
    }

    console.log("Checking video status for user:", user.id, "task:", taskId);

    const response = await fetch(`${baseUrl}/videos/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get video status");
    }

    return createJsonResponse({
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      videoUrl: data.video_url,
      model: data.model,
      createdAt: data.created_at,
      size: data.size,
      seconds: data.seconds,
    });
  } catch (error) {
    console.error("Error getting video status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Authentication")) {
      return createErrorResponse(message, 401);
    }

    return createJsonResponse(
      { error: "Failed to get video status", details: message },
      500,
    );
  }
});
