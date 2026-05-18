import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getEdgeFunctionUrl(functionName: string): string {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

async function getAccessToken(
  supabase?: SupabaseClient,
): Promise<string | null> {
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }
  return null;
}

async function invokeEdgeFunction<T>(
  functionName: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    searchParams?: Record<string, string>;
    supabase?: SupabaseClient;
  } = {},
): Promise<T> {
  const url = new URL(getEdgeFunctionUrl(functionName));

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const accessToken = await getAccessToken(options.supabase);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else if (supabaseAnonKey) {
    headers["Authorization"] = `Bearer ${supabaseAnonKey}`;
  }

  const response = await fetch(url.toString(), {
    method: options.method || (options.body ? "POST" : "GET"),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(
      data.details || data.error || `Edge function failed: ${response.status}`,
    );
  }

  return data as T;
}

export interface GenerateDesignResponse {
  suggestion: string;
}

export interface GenerateImageResponse {
  imageData: string;
  textResponse: string;
}

export interface GenerateVideoResponse {
  taskId: string;
  status: string;
}

export interface VideoStatusResponse {
  id: string;
  status: string;
  progress: number;
  videoUrl?: string;
  model?: string;
  createdAt?: string;
  size?: string;
  seconds?: number;
}

export async function generateDesign(
  prompt: string,
  supabase?: SupabaseClient,
): Promise<string> {
  const response = await invokeEdgeFunction<GenerateDesignResponse>(
    "generate-design",
    {
      body: { prompt },
      supabase,
    },
  );
  return response.suggestion;
}

export async function generateImage(
  options: {
    prompt: string;
    referenceImage?: string;
    mimeType?: string;
    model?: string;
  },
  supabase?: SupabaseClient,
): Promise<GenerateImageResponse> {
  return invokeEdgeFunction<GenerateImageResponse>("generate-image", {
    body: options,
    supabase,
  });
}

export async function generateVideo(
  options: {
    prompt: string;
    seconds?: number;
    size?: string;
    referenceImage?: string;
  },
  supabase?: SupabaseClient,
): Promise<GenerateVideoResponse> {
  return invokeEdgeFunction<GenerateVideoResponse>("generate-video", {
    body: options,
    supabase,
  });
}

export async function getVideoStatus(
  taskId: string,
  supabase?: SupabaseClient,
): Promise<VideoStatusResponse> {
  return invokeEdgeFunction<VideoStatusResponse>("video-status", {
    searchParams: { taskId },
    supabase,
  });
}

export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
