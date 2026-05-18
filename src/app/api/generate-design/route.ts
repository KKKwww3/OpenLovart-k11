import { NextRequest, NextResponse } from "next/server";
import { callGenerateDesign } from "@/lib/server-edge-functions";
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

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const suggestion = await callGenerateDesign(prompt, accessToken);

    return NextResponse.json({ suggestion });
  } catch (error: unknown) {
    console.error("Error generating design:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("登录")) {
      return NextResponse.json(
        { error: message, needsAuth: true },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate design",
        details: message,
      },
      { status: 500 },
    );
  }
}
