import { NextRequest, NextResponse } from "next/server";
import { callGetVideoStatus } from "@/lib/server-edge-functions";
import { createServerSupabaseClient } from "@/hooks/useSupabase";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const result = await callGetVideoStatus(taskId, accessToken);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error getting video status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("登录")) {
      return NextResponse.json(
        { error: message, needsAuth: true },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to get video status",
        details: message,
      },
      { status: 500 },
    );
  }
}
