import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = Deno.env.get("VIDEO_API_KEY");
    const baseUrl =
      Deno.env.get("VIDEO_API_BASE_URL") || "https://www.clockapi.fun/v1";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "VIDEO_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(`${baseUrl}/videos/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get video status");
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status,
        progress: data.progress || 0,
        videoUrl: data.video_url,
        model: data.model,
        createdAt: data.created_at,
        size: data.size,
        seconds: data.seconds,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error getting video status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to get video status", details: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
