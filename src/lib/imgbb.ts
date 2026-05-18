export interface ImgbbResult {
  url: string;
  delete_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
}

export async function uploadImageToImgbb(
  imageData: string,
): Promise<ImgbbResult | null> {
  try {
    const base64Str = imageData.includes("base64,")
      ? imageData.split("base64,")[1]
      : imageData;

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error(
        "[imgbb] IMGBB_API_KEY not configured in environment variables",
      );
      console.error(
        "[imgbb] Please add IMGBB_API_KEY=your_key to your .env.local file",
      );
      return null;
    }

    console.log("[imgbb] Uploading image, base64 length:", base64Str.length);

    const formData = new FormData();
    formData.append("image", base64Str);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?expiration=600&key=${apiKey}`,
      { method: "POST", body: formData },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[imgbb] API error:", response.status, errorText);
      return null;
    }

    const result = await response.json();
    if (!result.success || !result.data?.url) {
      console.error("[imgbb] Upload failed, result:", JSON.stringify(result));
      return null;
    }

    console.log("[imgbb] Upload successful, URL:", result.data.url);
    return {
      url: result.data.url,
      delete_url: result.data.delete_url,
      thumbnail_url: result.data.thumb?.url,
      medium_url: result.data.medium?.url,
    };
  } catch (err) {
    console.error(
      "[imgbb] Exception:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
