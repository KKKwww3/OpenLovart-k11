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
  preprocessMaterialImages: () => Promise<string | undefined>;
}

async function uploadAndGenerateMaterialPreview(
  productFileMapRef: React.MutableRefObject<Map<string, File>>,
  materialFileMapRef: React.MutableRefObject<Map<string, File>>,
  edgeFileMapRef: React.MutableRefObject<Map<string, File>>,
  selectedModel: number | undefined,
  aspectRatio: string,
  imageSize: string,
  supabase?: SupabaseClient,
): Promise<string> {
  const productEntries = Array.from(productFileMapRef.current.values());
  const materialEntries = Array.from(materialFileMapRef.current.values());
  const edgeEntries = Array.from(edgeFileMapRef.current.values());
  const productFile = productEntries[0];
  const materialFile = materialEntries[0];
  const edgeFile = edgeEntries[0];

  if (!productFile || !materialFile) {
    throw new Error("缺少产品图或材质图");
  }

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
      modelId: selectedModel,
      aspectRatio,
      imageSize,
    },
    supabase,
  );

  if (!result.imageUrl) {
    throw new Error(result.textResponse || "材质预处理未生成图片");
  }

  return result.imageUrl;
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
    setIsMaterialPreviewing(true);
    setMaterialPreviewError(null);
    setMaterialPreviewResult(null);

    try {
      const url = await uploadAndGenerateMaterialPreview(
        params.productFileMapRef,
        params.materialFileMapRef,
        params.edgeFileMapRef,
        params.selectedModel,
        params.aspectRatio,
        params.imageSize,
        params.supabase,
      );
      setMaterialPreviewResult(url);
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

  const preprocessMaterialImages = useCallback(async () => {
    try {
      return await uploadAndGenerateMaterialPreview(
        params.productFileMapRef,
        params.materialFileMapRef,
        params.edgeFileMapRef,
        params.selectedModel,
        params.aspectRatio,
        params.imageSize,
        params.supabase,
      );
    } catch {
      return undefined;
    }
  }, [params]);

  return {
    materialPreviewResult,
    isMaterialPreviewing,
    materialPreviewError,
    handleMaterialPreview,
    handleMaterialPreviewConfirm,
    handleMaterialPreviewRetry,
    preprocessMaterialImages,
  };
}
