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
    const { prompt, seconds, size, referenceImage } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
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

    return new Response(
      JSON.stringify({ taskId: data.id, status: data.status }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error generating video:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to generate video", details: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
