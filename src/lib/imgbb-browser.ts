export interface ImgbbResult {
  url: string;
  delete_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
}

export async function uploadImageToImgbbBrowser(
  image: File | string,
): Promise<ImgbbResult | null> {
  try {
    const phpSessionId = process.env.NEXT_PUBLIC_IMGBB_PHPSESSID;
    const authToken = process.env.NEXT_PUBLIC_IMGBB_AUTH_TOKEN;

    if (!phpSessionId || !authToken) {
      console.error("[imgbb-browser] IMGBB credentials not configured");
      console.error("[imgbb-browser] Please set NEXT_PUBLIC_IMGBB_PHPSESSID and NEXT_PUBLIC_IMGBB_AUTH_TOKEN in .env.local");
      return null;
    }

    let file: File;
    if (typeof image === "string") {
      const base64Str = image.includes("base64,") ? image.split("base64,")[1] : image;
      const byteCharacters = atob(base64Str);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      file = new File([byteArray], "image.jpg", { type: "image/jpeg" });
    } else {
      file = image;
    }

    console.log("[imgbb-browser] Uploading file:", file.name, "size:", file.size);

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
      console.error("[imgbb-browser] API error:", response.status, errorText);
      return null;
    }

    const result = await response.json();
    if (result.status_code !== 200 || !result.image?.url) {
      console.error("[imgbb-browser] Upload failed, result:", JSON.stringify(result));
      return null;
    }

    console.log("[imgbb-browser] Upload successful, URL:", result.image.url);
    return {
      url: result.image.url,
      delete_url: result.image.delete_url,
      thumbnail_url: result.image.thumb?.url,
      medium_url: result.image.medium?.url,
    };
  } catch (err) {
    console.error("[imgbb-browser] Exception:", err instanceof Error ? err.message : err);
    return null;
  }
}
