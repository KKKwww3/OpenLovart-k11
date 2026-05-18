import { NextRequest, NextResponse } from "next/server";
import { callGenerateVideo } from "@/lib/server-edge-functions";
import { createServerSupabaseClient } from "@/hooks/useSupabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const authHeader = request.headers.get("Authorization");
    let accessToken: string | undefined;

    if (authHeader) {
      accessToken = authHeader.replace("Bearer ", "");
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      accessToken = session?.access_token;
    }

    const { prompt, seconds, size, referenceImage } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const result = await callGenerateVideo(
      {
        prompt,
        seconds,
        size,
        referenceImage,
      },
      accessToken,
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error generating video:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("登录")) {
      return NextResponse.json(
        { error: message, needsAuth: true },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate video",
        details: message,
      },
      { status: 500 },
    );
  }
}
