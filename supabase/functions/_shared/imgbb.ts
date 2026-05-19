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

    const apiKey = Deno.env.get("IMGBB_API_KEY");
    if (!apiKey) {
      console.error("[imgbb] IMGBB_API_KEY not configured");
      return null;
    }

    const formData = new FormData();
    formData.append("image", base64Str);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      { method: "POST", body: formData },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[imgbb] API error:", response.status, errorText);
      return null;
    }

    const result = await response.json();
    if (!result.success || !result.data?.url) {
      console.error("[imgbb] Upload failed:", JSON.stringify(result));
      return null;
    }

    return {
      url: result.data.url,
      delete_url: result.data.delete_url,
      thumbnail_url: result.data.thumb?.url,
      medium_url: result.data.medium?.url,
      mime: result.data.image?.mime,
    };
  } catch (err) {
    console.error(
      "[imgbb] Exception:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
