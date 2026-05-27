"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { stylePreprocess } from "@/lib/stylePreprocess";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";
import type { UploadedFile } from "../../UploadZone";
import type { ResultItem } from "../../ResultPreview";
import type { StepStatus, ModeType } from "../types";
import { COMBINED_APPEND_PROMPT } from "./prompts";
import { useFileHandlers } from "./useFileHandlers";
import { usePreview } from "./usePreview";
import { useCanvasActions } from "./useCanvasActions";

export interface UseProductReplaceOptions {
  supabase?: SupabaseClient;
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
}

export function useProductReplace({ supabase, onAddToCanvas }: UseProductReplaceOptions) {
  const [sceneFiles, setSceneFiles] = useState<UploadedFile[]>([]);
  const [productFiles, setProductFiles] = useState<UploadedFile[]>([]);
  const productFileMapRef = useRef<Map<string, File>>(new Map());
  const [materialFiles, setMaterialFiles] = useState<UploadedFile[]>([]);
  const materialFileMapRef = useRef<Map<string, File>>(new Map());
  const [edgeFiles, setEdgeFiles] = useState<UploadedFile[]>([]);
  const edgeFileMapRef = useRef<Map<string, File>>(new Map());
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<number | undefined>(undefined);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [similarity, setSimilarity] = useState(50);
  const [keepItems, setKeepItems] = useState("");
  const [changeItems, setChangeItems] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);

  const [styleStepStatus, setStyleStepStatus] = useState<StepStatus>("idle");
  const [styleStepMessage, setStyleStepMessage] = useState("");
  const [processedSceneUrl, setProcessedSceneUrl] = useState<string | null>(null);
  const [processedMaterialUrl, setProcessedMaterialUrl] = useState<string | null>(null);
  const [styleStepError, setStyleStepError] = useState<string | null>(null);
  const [originalSceneUrl, setOriginalSceneUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [mode, setMode] = useState<ModeType>("single");
  const [sceneItems, setSceneItems] = useState<Array<{
    file: UploadedFile;
    processedUrl: string | null;
    originalUrl: string | null;
    styleStatus: StepStatus;
    styleMessage: string;
    styleError: string | null;
  }>>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    clearTasks,
    retryTask,
  } = useBatchGeneration(supabase);

  const fileHandlers = useFileHandlers({
    setSceneFiles,
    setProcessedSceneUrl,
    setOriginalSceneUrl,
    setStyleStepStatus,
    setStyleStepError,
    productFileMapRef,
    setProductFiles,
    materialFileMapRef,
    setMaterialFiles,
    edgeFileMapRef,
    setEdgeFiles,
    setMode,
    setSceneItems,
    setResults,
    clearTasks,
  });

  const preview = usePreview({
    productFileMapRef,
    materialFileMapRef,
    edgeFileMapRef,
    selectedModel,
    aspectRatio,
    imageSize,
    supabase,
  });

  const canvasActions = useCanvasActions({ onAddToCanvas, results });

  const syncedTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const completedTasks = tasks.filter(t => t.status === "completed" && t.result);
    if (completedTasks.length === 0) return;

    const newCompletions = completedTasks.filter(t => !syncedTaskIdsRef.current.has(t.id));
    if (newCompletions.length === 0) return;

    newCompletions.forEach(t => syncedTaskIdsRef.current.add(t.id));

    const rafId = requestAnimationFrame(() => {
      setResults(prev => {
        const updated = [...prev];
        let changed = false;
        for (const task of newCompletions) {
          const idx = updated.findIndex(r => r.id === task.id);
          if (idx >= 0) {
            if (updated[idx].imageUrl !== task.result) {
              updated[idx] = { id: task.id, imageUrl: task.result! };
              changed = true;
            }
          } else {
            updated.push({ id: task.id, imageUrl: task.result! });
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [tasks]);

  const needsStylePreprocess = useCallback(() => {
    return similarity < 100 || keepItems.trim() !== "" || changeItems.trim() !== "";
  }, [similarity, keepItems, changeItems]);

  const buildPrompt = useCallback(() => {
    let prompt = currentPrompt;
    if (materialFiles.length > 0) {
      prompt += COMBINED_APPEND_PROMPT;
    }
    return prompt;
  }, [currentPrompt, materialFiles]);

  const doStylePreprocess = useCallback(async (sceneImageUrl: string): Promise<string | null> => {
    const keepItemsArray = keepItems.split(",").map((s) => s.trim()).filter(Boolean);
    const changeItemsArray = changeItems.split(",").map((s) => s.trim()).filter(Boolean);

    return new Promise((resolve) => {
      stylePreprocess(
        {
          sceneImageUrl,
          similarity,
          keepItems: keepItemsArray,
          changeItems: changeItemsArray,
          modelId: selectedModel,
        },
        {
          onStatus: (_stage, message) => {
            setStyleStepMessage(message);
          },
          onComplete: (result) => {
            setProcessedSceneUrl(result.imageUrl);
            setStyleStepStatus("done");
            setStyleStepMessage("风格预处理完成");
            resolve(result.imageUrl);
          },
          onError: (error) => {
            setStyleStepStatus("error");
            setStyleStepError(error);
            setStyleStepMessage(`风格预处理失败: ${error}`);
            resolve(null);
          },
        },
        supabase,
      );
    });
  }, [similarity, keepItems, changeItems, selectedModel, supabase]);

  const preprocessedMaterialUrlRef = useRef<string | null>(null);

  const buildTasks = useCallback(
    (sceneImageUrl: string) =>
      productFiles.map((pf) => ({
        id: uuidv4(),
        prompt: buildPrompt(),
        referenceImage: sceneImageUrl,
        productImage: productFileMapRef.current.get(pf.id),
        materialImage: preprocessedMaterialUrlRef.current || undefined,
      })),
    [productFiles, buildPrompt],
  );

  const handleGenerate = useCallback(async () => {
    if (productFiles.length === 0) return;

    if (mode === "single") {
      if (sceneFiles.length === 0) return;
      const sceneFile = sceneFiles[0];
      if (!sceneFile?.file) return;

      setResults([]);
      clearTasks();
      setStyleStepError(null);
      preprocessedMaterialUrlRef.current = null;
      setProcessedMaterialUrl(null);

      setStyleStepStatus("processing");
      setStyleStepMessage("正在处理...");

      const hasMaterial = materialFiles.length > 0;

      const sceneFileObj = sceneFile.file;

      const processScene = async (): Promise<string | null> => {
        const uploadResult = await uploadImageToImgbbBrowser(sceneFileObj);
        if (!uploadResult?.url) {
          setStyleStepStatus("error");
          setStyleStepError("场景图上传失败");
          setStyleStepMessage("场景图上传失败，请重试");
          return null;
        }

        let url = uploadResult.url;
        setOriginalSceneUrl(url);

        if (needsStylePreprocess()) {
          const processedUrl = await doStylePreprocess(url);
          if (!processedUrl) return null;
          url = processedUrl;
        } else {
          setStyleStepStatus("done");
          setStyleStepMessage("跳过风格预处理");
        }
        return url;
      };

      const [sceneImageUrl, preprocessedMaterialUrl] = await Promise.all([
        processScene(),
        hasMaterial ? preview.preprocessMaterialImages() : Promise.resolve(undefined),
      ]);

      if (!sceneImageUrl) return;

      if (hasMaterial && preprocessedMaterialUrl) {
        preprocessedMaterialUrlRef.current = preprocessedMaterialUrl;
        setProcessedMaterialUrl(preprocessedMaterialUrl);
      }

      await startBatch({
        tasks: buildTasks(sceneImageUrl),
        modelId: selectedModel,
        aspectRatio,
        imageSize,
        concurrency: 2,
        onTaskComplete: (taskId, result) => {
          setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
        },
      });
    } else {
      if (sceneItems.length === 0) return;

      setResults([]);
      clearTasks();
      setStyleStepError(null);
      preprocessedMaterialUrlRef.current = null;
      setProcessedMaterialUrl(null);
      setStyleStepStatus("processing");
      setStyleStepMessage("正在处理多场景图...");

      const hasMaterial = materialFiles.length > 0;
      const sceneUrlMap = new Map<string, string>();

      const processSceneItems = async (): Promise<void> => {
        for (const sceneItem of sceneItems) {
          if (!sceneItem.file?.file) continue;

          if (sceneItem.processedUrl) {
            sceneUrlMap.set(sceneItem.file.id, sceneItem.processedUrl);
          } else {
            const uploadResult = await uploadImageToImgbbBrowser(sceneItem.file.file);
            if (uploadResult?.url) {
              sceneUrlMap.set(sceneItem.file.id, uploadResult.url);
            }
          }
        }
      };

      const [, preprocessedMaterialUrl] = await Promise.all([
        processSceneItems(),
        hasMaterial ? preview.preprocessMaterialImages() : Promise.resolve(undefined),
      ]);

      if (hasMaterial && preprocessedMaterialUrl) {
        preprocessedMaterialUrlRef.current = preprocessedMaterialUrl;
        setProcessedMaterialUrl(preprocessedMaterialUrl);
      }

      const allTasks = [];
      for (const sceneItem of sceneItems) {
        const sceneUrl = sceneUrlMap.get(sceneItem.file.id);
        if (!sceneUrl) continue;

        for (const pf of productFiles) {
          allTasks.push({
            id: uuidv4(),
            prompt: buildPrompt(),
            referenceImage: sceneUrl,
            productImage: productFileMapRef.current.get(pf.id),
            materialImage: preprocessedMaterialUrlRef.current || undefined,
          });
        }
      }

      if (allTasks.length === 0) {
        setStyleStepStatus("error");
        setStyleStepError("没有可生成的任务");
        setStyleStepMessage("没有可生成的任务");
        return;
      }

      setStyleStepMessage(`正在批量生成 ${allTasks.length} 张图片...`);

      await startBatch({
        tasks: allTasks,
        modelId: selectedModel,
        aspectRatio,
        imageSize,
        concurrency: 2,
        onTaskComplete: (taskId, result) => {
          setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
        },
      });

      setStyleStepStatus("done");
      setStyleStepMessage("批量生成完成");
    }
  }, [
    mode,
    productFiles,
    sceneFiles,
    sceneItems,
    materialFiles,
    buildPrompt,
    needsStylePreprocess,
    doStylePreprocess,
    selectedModel,
    aspectRatio,
    imageSize,
    startBatch,
    clearTasks,
    buildTasks,
    preview,
  ]);

  const handleRetryStylePreprocess = useCallback(async () => {
    if (!originalSceneUrl) return;

    setStyleStepStatus("processing");
    setStyleStepMessage("正在重试风格预处理...");
    setStyleStepError(null);

    const processedUrl = await doStylePreprocess(originalSceneUrl);
    if (processedUrl) {
      await startBatch({
        tasks: buildTasks(processedUrl),
        modelId: selectedModel,
        aspectRatio,
        imageSize,
        concurrency: 2,
        onTaskComplete: (taskId, result) => {
          setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
        },
      });
    }
  }, [
    originalSceneUrl,
    doStylePreprocess,
    buildTasks,
    selectedModel,
    aspectRatio,
    imageSize,
    startBatch,
  ]);

  const handleRetryProductReplace = useCallback(async () => {
    if (!processedSceneUrl && !originalSceneUrl) return;
    const failedTasks = tasks.filter((t) => t.status === "failed");
    if (failedTasks.length === 0) return;
    for (const task of failedTasks) {
      await retryTask(task.id);
    }
  }, [tasks, processedSceneUrl, originalSceneUrl, retryTask]);

  const hasSceneFile = mode === "single"
    ? sceneFiles.length > 0 && sceneFiles[0]?.file != null
    : sceneItems.length > 0;

  const isGenerating = styleStepStatus === "processing" || isProcessing;
  const hasFailedTasks = tasks.some((t) => t.status === "failed");

  const totalCount = mode === "single"
    ? productFiles.length
    : sceneItems.length * productFiles.length;

  return {
    sceneFiles,
    productFiles,
    materialFiles,
    edgeFiles,
    currentPrompt,
    selectedModel,
    aspectRatio,
    imageSize,
    similarity,
    keepItems,
    changeItems,
    results,
    styleStepStatus,
    styleStepMessage,
    styleStepError,
    processedSceneUrl,
    processedMaterialUrl,
    previewImage,
    mode,
    sceneItems,
    tasks,
    isProcessing,
    overallProgress,
    hasSceneFile,
    isGenerating,
    hasFailedTasks,
    totalCount,

    setCurrentPrompt,
    setSelectedModel,
    setAspectRatio,
    setImageSize,
    setSimilarity,
    setKeepItems,
    setChangeItems,
    setPreviewImage,
    setProcessedSceneUrl,
    setStyleStepStatus,
    setStyleStepMessage,
    setStyleStepError,

    ...fileHandlers,
    ...preview,
    ...canvasActions,

    handleGenerate,
    handleRetryStylePreprocess,
    handleRetryProductReplace,
    clearTasks,
  };
}
