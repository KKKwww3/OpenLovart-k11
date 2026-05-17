const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getEdgeFunctionUrl(functionName: string): string {
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not configured");
  }
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

async function invokeEdgeFunction<T>(
  functionName: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    searchParams?: Record<string, string>;
    accessToken?: string;
  } = {},
): Promise<T> {
  const url = new URL(getEdgeFunctionUrl(functionName));

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  } else if (SUPABASE_ANON_KEY) {
    headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
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

export async function callGenerateDesign(
  prompt: string,
  accessToken?: string,
): Promise<string> {
  const response = await invokeEdgeFunction<GenerateDesignResponse>(
    "generate-design",
    {
      body: { prompt },
      accessToken,
    },
  );
  return response.suggestion;
}

export async function callGenerateImage(
  options: {
    prompt: string;
    referenceImage?: string;
    mimeType?: string;
    model?: string;
  },
  accessToken?: string,
): Promise<GenerateImageResponse> {
  return invokeEdgeFunction<GenerateImageResponse>("generate-image", {
    body: options,
    accessToken,
  });
}

export async function callGenerateVideo(
  options: {
    prompt: string;
    seconds?: number;
    size?: string;
    referenceImage?: string;
  },
  accessToken?: string,
): Promise<GenerateVideoResponse> {
  return invokeEdgeFunction<GenerateVideoResponse>("generate-video", {
    body: options,
    accessToken,
  });
}

export async function callGetVideoStatus(
  taskId: string,
  accessToken?: string,
): Promise<VideoStatusResponse> {
  return invokeEdgeFunction<VideoStatusResponse>("video-status", {
    searchParams: { taskId },
    accessToken,
  });
}
