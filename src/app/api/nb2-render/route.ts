import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/hooks/useSupabase";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EDGE_FUNCTIONS_BASE_URL =
  process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;

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

    const { sourceImage, prompt, modelId } = await request.json();

    if (!sourceImage || typeof sourceImage !== "string") {
      return NextResponse.json(
        { error: "sourceImage is required (base64 string)" },
        { status: 400 },
      );
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    if (!EDGE_FUNCTIONS_BASE_URL && !SUPABASE_URL) {
      return NextResponse.json(
        { error: "EDGE_FUNCTIONS_URL or SUPABASE_URL not configured" },
        { status: 500 },
      );
    }

    const edgeUrl = `${EDGE_FUNCTIONS_BASE_URL || SUPABASE_URL}/functions/v1/nb2-render`;

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
      body: JSON.stringify({ sourceImage, prompt, modelId }),
    });

    const data = await edgeResponse.json();

    if (!edgeResponse.ok) {
      if (edgeResponse.status === 401) {
        return NextResponse.json(
          { error: "请先登录后再使用此功能", needsAuth: true },
          { status: 401 },
        );
      }
      return NextResponse.json(data, { status: edgeResponse.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("登录")) {
      return NextResponse.json(
        { error: message, needsAuth: true },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to render multi-angle image",
        details: message,
      },
      { status: 500 },
    );
  }
}