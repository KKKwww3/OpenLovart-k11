import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  createJsonResponse,
  requireAuth,
} from "../_shared/auth.ts";
import OpenAI from "https://esm.sh/openai@4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createOptionsResponse();
  }

  try {
    const user = await requireAuth(req);

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return createErrorResponse("Prompt is required", 400);
    }

    const apiKey = Deno.env.get("XAI_API_KEY");

    if (!apiKey) {
      return createErrorResponse("XAI_API_KEY not configured", 500);
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
      timeout: 360000,
    });

    console.log("Generating design for user:", user.id);

    const completion = await client.chat.completions.create({
      model: "grok-4-1-fast-non-reasoning",
      messages: [
        {
          role: "system",
          content:
            "You are a professional design assistant. Based on user's description, provide detailed design suggestions including layout, colors, typography, and visual elements. Be specific and creative.",
        },
        {
          role: "user",
          content: `Create a design concept for: ${prompt}`,
        },
      ],
    });

    const designSuggestion = completion.choices[0].message.content;

    return createJsonResponse({
      suggestion: designSuggestion,
    });
  } catch (error: unknown) {
    console.error("Error generating design:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("Authentication")) {
      return createErrorResponse(message, 401);
    }
    
    return createJsonResponse(
      {
        error: "Failed to generate design",
        details: message,
      },
      500,
    );
  }
});
