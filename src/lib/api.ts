import type { SupabaseClient } from "@supabase/supabase-js";

export interface GenerateDesignResponse {
  suggestion: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  imageData?: string;
  textResponse: string;
}

export interface GenerateImageCallbacks {
  onProgress?: (text: string, accumulated: string) => void;
  onStatus?: (stage: string, message: string) => void;
}

export interface GenerateImageStreamCallbacks extends GenerateImageCallbacks {
  onComplete?: (result: GenerateImageResponse) => void;
  onError?: (error: string) => void;
}

export const ASPECT_RATIOS: Record<string, string> = {
  "1:1": "1:1",
  "2:3": "2:3",
  "3:2": "3:2",
  "3:4": "3:4",
  "4:3": "4:3",
  "4:5": "4:5",
  "5:4": "5:4",
  "9:16": "9:16",
  "16:9": "16:9",
  "21:9": "21:9",
  "1:4": "1:4",
  "4:1": "4:1",
  "1:8": "1:8",
  "8:1": "8:1",
} as const;

export const IMAGE_SIZES = ["0.5K", "1K", "2K", "4K"] as const;

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

export interface ImageGenerationOptions {
  prompt: string;
  referenceImage?: string;
  productImage?: string;
  mimeType?: string;
  modelId?: number;
  aspectRatio?: string;
  imageSize?: string;
}

export async function generateImage(
  options: ImageGenerationOptions,
  supabase?: SupabaseClient,
  callbacks?: GenerateImageCallbacks,
): Promise<GenerateImageResponse> {
  const accessToken = await getAccessToken(supabase);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const bodyStr = JSON.stringify(options);
  if (bodyStr.length > 4 * 1024 * 1024) {
    throw new Error("图片数据过大，请压缩图片后重试（建议单张图片不超过2MB）");
  }

  let response: Response;
  try {
    response = await fetch("/api/generate-image", {
      method: "POST",
      headers,
      body: JSON.stringify(options),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "网络请求失败";
    throw new Error(`网络请求失败: ${message}`);
  }

  if (!response.ok) {
    let errorData: Record<string, unknown>;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    if (response.status === 401 || errorData.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(
      String(
        errorData.details || errorData.error || "Failed to generate image",
      ),
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let textAccumulator = "";

  return new Promise<GenerateImageResponse>((resolve, reject) => {
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const lines = chunk.split("\n");
            let eventType = "";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice(6).trim();
              }
            }

            if (!dataStr) continue;

            try {
              const payload = JSON.parse(dataStr);

              switch (eventType) {
                case "status":
                  callbacks?.onStatus?.(
                    payload.stage || "",
                    payload.message || "",
                  );
                  break;
                case "progress":
                  if (payload.text) {
                    textAccumulator += payload.text;
                  }
                  callbacks?.onProgress?.(
                    payload.text || "",
                    payload.accumulated || textAccumulator.slice(-200),
                  );
                  break;
                case "complete":
                  resolve({
                    imageUrl: payload.imageUrl || "",
                    imageData: payload.imageData || undefined,
                    textResponse: payload.textResponse || "",
                  });
                  return;
                case "error":
                  reject(
                    new Error(
                      payload.error || payload.details || "Generation failed",
                    ),
                  );
                  return;
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        reject(new Error("Stream ended without completion event"));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Stream read failed"));
      }
    })();
  });
}

export async function generateImageStream(
  options: ImageGenerationOptions,
  callbacks: GenerateImageStreamCallbacks,
  supabase?: SupabaseClient,
): Promise<void> {
  const accessToken = await getAccessToken(supabase);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const bodyStr = JSON.stringify(options);
  if (bodyStr.length > 4 * 1024 * 1024) {
    callbacks.onError?.(
      "图片数据过大，请压缩图片后重试（建议单张图片不超过2MB）",
    );
    return;
  }

  let response: Response;
  try {
    response = await fetch("/api/generate-image", {
      method: "POST",
      headers,
      body: JSON.stringify(options),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "网络请求失败";
    callbacks.onError?.(`网络请求失败: ${message}`);
    return;
  }

  if (!response.ok) {
    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (response.status === 401 || data.needsAuth) {
      callbacks.onError?.("请先登录后再使用此功能");
      return;
    }
    callbacks.onError?.(
      String(data.details || data.error || "Failed to generate image"),
    );
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let eventType = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const payload = JSON.parse(dataStr);

          switch (eventType) {
            case "status":
              callbacks.onStatus?.(payload.stage || "", payload.message || "");
              break;
            case "progress":
              callbacks.onProgress?.(
                payload.text || "",
                payload.accumulated || "",
              );
              break;
            case "complete":
              callbacks.onComplete?.({
                imageUrl: payload.imageUrl || "",
                imageData: payload.imageData || undefined,
                textResponse: payload.textResponse || "",
              });
              return;
            case "error":
              callbacks.onError?.(
                payload.error || payload.details || "Unknown error",
              );
              return;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    // Stream ended without complete/error event
    callbacks.onError?.("Stream ended unexpectedly");
  } catch (err) {
    callbacks.onError?.(
      err instanceof Error ? err.message : "Stream read failed",
    );
  }
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

export interface NB2RenderRequest {
  sourceImage: string;   // base64
  prompt: string;        // 角度提示词，如 "0° horizontal angle, 0° vertical angle, medium shot"
  modelId?: number;      // 可选，用户选择的 AI 模型 ID
}

export interface NB2RenderResponse {
  imageUrl: string;
  prompt: string;
}

export async function nb2Render(
  options: NB2RenderRequest,
  supabase?: SupabaseClient,
): Promise<NB2RenderResponse> {
  const accessToken = await getAccessToken(supabase);

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const response = await fetch("/api/nb2-render", {
    method: "POST",
    headers,
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || data.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(data.error || data.details || "NB2 渲染失败");
  }

  return response.json();
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

  const response = await fetch(
    `/api/video-status?taskId=${encodeURIComponent(taskId)}`,
    {
      method: "GET",
      headers,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 || data.needsAuth) {
      throw new Error("请先登录后再使用此功能");
    }
    throw new Error(data.details || data.error || "Failed to get video status");
  }

  return data;
}
