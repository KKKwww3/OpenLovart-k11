import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/hooks/useSupabase";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const authHeader = request.headers.get("Authorization");
    let accessToken: string | undefined;

    if (authHeader) {
      accessToken = authHeader.replace("Bearer ", "");
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      accessToken = session?.access_token;
    }

    const { prompt, referenceImage, productImage, mimeType, model } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    if (!SUPABASE_URL) {
      return NextResponse.json(
        { error: "SUPABASE_URL not configured" },
        { status: 500 },
      );
    }

    const edgeUrl = `${SUPABASE_URL}/functions/v1/generate-image`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const edgeResponse = await fetch(edgeUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        referenceImage,
        productImage,
        mimeType,
        model,
      }),
    });

    if (!edgeResponse.ok) {
      let errorData: Record<string, unknown>;
      try {
        errorData = await edgeResponse.json();
      } catch {
        errorData = { error: "Edge function failed", details: `Status ${edgeResponse.status}` };
      }

      if (edgeResponse.status === 401) {
        return NextResponse.json(
          { error: "请先登录后再使用此功能", needsAuth: true },
          { status: 401 },
        );
      }

      return NextResponse.json(errorData, { status: edgeResponse.status });
    }

    const stream = edgeResponse.body;
    if (!stream) {
      return NextResponse.json(
        { error: "No response from edge function" },
        { status: 500 },
      );
    }

    return new Response(stream as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("登录")) {
      return NextResponse.json(
        { error: message, needsAuth: true },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: message,
      },
      { status: 500 },
    );
  }
}