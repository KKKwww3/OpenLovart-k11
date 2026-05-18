export interface ImgbbResult {
  url: string;
  delete_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  mime?: string;
}

export async function uploadImageToImgbb(
  imageData: string,
): Promise<ImgbbResult | null> {
  try {
    const base64Str = imageData.includes("base64,")
      ? imageData.split("base64,")[1]
      : imageData;

    const phpSessionId = Deno.env.get("IMGBB_PHPSESSID");
    const authToken = Deno.env.get("IMGBB_AUTH_TOKEN");

    if (!phpSessionId || !authToken) {
      console.error("[imgbb] IMGBB credentials not configured");
      return null;
    }

    const binaryString = atob(base64Str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const file = new File([bytes], "image.jpg", { type: "image/jpeg" });

    const timestamp = Date.now().toString();
    const formData = new FormData();
    formData.append("source", file);
    formData.append("type", "file");
    formData.append("action", "upload");
    formData.append("timestamp", timestamp);
    formData.append("auth_token", authToken);

    const response = await fetch("https://imgbb.com/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Cookie": `PHPSESSID=${phpSessionId}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[imgbb] API error:", response.status, errorText);
      return null;
    }

    const result = await response.json();
    if (result.status_code !== 200 || !result.image?.url) {
      console.error("[imgbb] Upload failed, result:", JSON.stringify(result));
      return null;
    }

    return {
      url: result.image.url,
      delete_url: result.image.delete_url,
      thumbnail_url: result.image.thumb?.url,
      medium_url: result.image.medium?.url,
      mime: result.image.mime,
    };
  } catch (err) {
    console.error("[imgbb] Exception:", err instanceof Error ? err.message : err);
    return null;
  }
}
