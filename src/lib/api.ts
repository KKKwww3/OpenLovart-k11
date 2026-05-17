import type { SupabaseClient } from "@supabase/supabase-js";

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

async function getAccessToken(supabase?: SupabaseClient): Promise<string | null> {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }
  return null;
}

export async function generateDesign(
  prompt: string,
  supabase?: SupabaseClient,
): Promise<string> {
  const accessToken = await getAccessToken(supabase);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch("/api/generate-design", {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 || data.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(data.details || data.error || "Failed to generate design");
  }

  return data.suggestion;
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
  const accessToken = await getAccessToken(supabase);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers,
    body: JSON.stringify(options),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 || data.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(data.details || data.error || "Failed to generate image");
  }

  return data;
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
  const accessToken = await getAccessToken(supabase);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch("/api/generate-video", {
    method: "POST",
    headers,
    body: JSON.stringify(options),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 || data.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(data.details || data.error || "Failed to generate video");
  }

  return data;
}

export async function getVideoStatus(
  taskId: string,
  supabase?: SupabaseClient,
): Promise<VideoStatusResponse> {
  const accessToken = await getAccessToken(supabase);
  
  const headers: HeadersInit = {};
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`/api/video-status?taskId=${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 || data.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(data.details || data.error || "Failed to get video status");
  }

  return data;
}
