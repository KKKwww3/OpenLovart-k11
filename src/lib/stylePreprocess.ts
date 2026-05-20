import type { SupabaseClient } from "@supabase/supabase-js";

export interface StylePreprocessOptions {
  sceneImageUrl: string;
  similarity: number;
  keepItems: string[];
  changeItems: string[];
  modelId?: number;
}

export interface StylePreprocessResult {
  imageUrl: string;
  textResponse?: string;
}

export interface StylePreprocessCallbacks {
  onStatus?: (stage: string, message: string) => void;
  onProgress?: (text: string, accumulated: string) => void;
  onComplete?: (result: StylePreprocessResult) => void;
  onError?: (error: string) => void;
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

export async function stylePreprocess(
  options: StylePreprocessOptions,
  callbacks: StylePreprocessCallbacks,
  supabase?: SupabaseClient,
): Promise<void> {
  const accessToken = await getAccessToken(supabase);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch("/api/style-preprocess", {
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
      String(data.details || data.error || "Failed to preprocess style"),
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
        }
      }
    }

    callbacks.onError?.("Stream ended unexpectedly");
  } catch (err) {
    callbacks.onError?.(
      err instanceof Error ? err.message : "Stream read failed",
    );
  }
}
