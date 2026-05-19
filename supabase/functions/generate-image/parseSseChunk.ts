export interface SseChunk {
  content: string;
  done: boolean;
  error?: string;
  imageData?: string;
}

export function parseAiSseChunk(data: string): SseChunk | null {
  try {
    if (data === "[DONE]") return null;

    const parsed = JSON.parse(data);
    const choice = parsed.choices?.[0];
    if (!choice) return null;

    const delta = choice.delta || choice.message || {};

    let content = "";
    let imageData: string | undefined;

    if (typeof delta.content === "string") {
      content = delta.content;
    } else if (Array.isArray(delta.content)) {
      for (const part of delta.content) {
        if (part.type === "text" && part.text) {
          content += part.text;
        } else if (part.type === "image_url" && part.image_url?.url) {
          imageData = part.image_url.url;
        } else if (part.type === "image" && part.image_url?.url) {
          imageData = part.image_url.url;
        } else if (part.inlineData) {
          imageData = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
    }

    if (delta.images && Array.isArray(delta.images)) {
      for (const img of delta.images) {
        if (img.url && !imageData) imageData = img.url;
        if (img.image_url?.url && !imageData) imageData = img.image_url.url;
      }
    }

    const finishReason = choice.finish_reason;
    const done =
      finishReason === "stop" ||
      finishReason === "length" ||
      finishReason === "content_filter";

    return { content, done, imageData };
  } catch {
    return null;
  }
}