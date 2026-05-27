import { useState, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateImage } from "@/lib/api";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";
import { MATERIAL_PREVIEW_PROMPT } from "./prompts";

export interface UsePreviewParams {
  productFileMapRef: React.MutableRefObject<Map<string, File>>;
  materialFileMapRef: React.MutableRefObject<Map<string, File>>;
  edgeFileMapRef: React.MutableRefObject<Map<string, File>>;
  selectedModel: number | undefined;
  aspectRatio: string;
  imageSize: string;
  supabase?: SupabaseClient;
}

export interface UsePreviewReturn {
  materialPreviewResult: string | null;
  isMaterialPreviewing: boolean;
  materialPreviewError: string | null;
  handleMaterialPreview: () => Promise<void>;
  handleMaterialPreviewConfirm: () => void;
  handleMaterialPreviewRetry: () => void;
}

export function usePreview(params: UsePreviewParams): UsePreviewReturn {
  const [materialPreviewResult, setMaterialPreviewResult] = useState<
    string | null
  >(null);
  const [isMaterialPreviewing, setIsMaterialPreviewing] = useState(false);
  const [materialPreviewError, setMaterialPreviewError] = useState<
    string | null
  >(null);

  const handleMaterialPreview = useCallback(async () => {
    const productEntries = Array.from(
      params.productFileMapRef.current.values(),
    );
    const materialEntries = Array.from(
      params.materialFileMapRef.current.values(),
    );
    const edgeEntries = Array.from(params.edgeFileMapRef.current.values());
    const productFile = productEntries[0];
    const materialFile = materialEntries[0];
    const edgeFile = edgeEntries[0];
    if (!productFile || !materialFile) return;

    setIsMaterialPreviewing(true);
    setMaterialPreviewError(null);
    setMaterialPreviewResult(null);

    try {
      const productImageResult = await uploadImageToImgbbBrowser(productFile);
      if (!productImageResult?.url) throw new Error("产品图上传失败");

      const materialImageResult = await uploadImageToImgbbBrowser(materialFile);
      if (!materialImageResult?.url) throw new Error("材质图上传失败");

      let edgeImageUrl: string | undefined;
      if (edgeFile) {
        const edgeImageResult = await uploadImageToImgbbBrowser(edgeFile);
        if (!edgeImageResult?.url) throw new Error("锁边图上传失败");
        edgeImageUrl = edgeImageResult.url;
      }

      const result = await generateImage(
        {
          prompt: MATERIAL_PREVIEW_PROMPT,
          productImage: productImageResult.url,
          materialImage: materialImageResult.url,
          edgeImage: edgeImageUrl,
          modelId: params.selectedModel,
          aspectRatio: params.aspectRatio,
          imageSize: params.imageSize,
        },
        params.supabase,
      );

      if (!result.imageUrl)
        throw new Error(result.textResponse || "未生成图片");
      setMaterialPreviewResult(result.imageUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "材质预览失败";
      setMaterialPreviewError(msg);
    } finally {
      setIsMaterialPreviewing(false);
    }
  }, [params]);

  const handleMaterialPreviewConfirm = useCallback(() => {
    setMaterialPreviewResult(null);
  }, []);

  const handleMaterialPreviewRetry = useCallback(() => {
    handleMaterialPreview();
  }, [handleMaterialPreview]);

  return {
    materialPreviewResult,
    isMaterialPreviewing,
    materialPreviewError,
    handleMaterialPreview,
    handleMaterialPreviewConfirm,
    handleMaterialPreviewRetry,
  };
}
