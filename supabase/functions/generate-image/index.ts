import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createOptionsResponse,
  createErrorResponse,
  createJsonResponse,
  requireAuth,
} from "../_shared/auth.ts";
import { createSseStream, createSseResponse } from "./sseWriter.ts";
import { handleImageStream } from "./imageStreamHandler.ts";

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

    const { readable, writeSse, close } = createSseStream();

    (async () => {
      await handleImageStream({
        apiBaseUrl,
        apiKey,
        model: actualModel,
        messages,
        writeSse,
      });
      await close();
    })();

    return createSseResponse(readable);
  } catch (error: unknown) {
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