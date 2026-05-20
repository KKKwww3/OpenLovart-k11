"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { stylePreprocess } from "@/lib/stylePreprocess";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";
import type { UploadedFile } from "../UploadZone";
import type { ResultItem } from "../ResultPreview";
import type { StepStatus, ModeType } from "./types";

export interface UseProductReplaceOptions {
  supabase?: SupabaseClient;
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
}

export function useProductReplace({ supabase, onAddToCanvas }: UseProductReplaceOptions) {
  const [sceneFiles, setSceneFiles] = useState<UploadedFile[]>([]);
  const [productFiles, setProductFiles] = useState<UploadedFile[]>([]);
  const productFileMapRef = useRef<Map<string, File>>(new Map());
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
    cancelBatch,
    clearTasks,
    retryTask,
  } = useBatchGeneration(supabase);

  const handleSceneChange = useCallback((files: UploadedFile[]) => {
    setSceneFiles(files);
    setProcessedSceneUrl(null);
    setOriginalSceneUrl(null);
    setStyleStepStatus("idle");
    setStyleStepError(null);
  }, []);

  const handleProductChange = useCallback((files: UploadedFile[]) => {
    files.forEach((f) => {
      if (f.file) {
        productFileMapRef.current.set(f.id, f.file);
      }
    });
    setProductFiles(files);
  }, []);

  const handleModeChange = useCallback((newMode: ModeType) => {
    setMode(newMode);
    setSceneFiles([]);
    setSceneItems([]);
    setProcessedSceneUrl(null);
    setOriginalSceneUrl(null);
    setStyleStepStatus("idle");
    setStyleStepError(null);
    setResults([]);
    clearTasks();
  }, [clearTasks]);

  const handleSceneItemsChange = useCallback((items: Array<{
    file: UploadedFile;
    processedUrl: string | null;
    styleStatus: StepStatus;
  }>) => {
    setSceneItems(items.map((item) => ({
      ...item,
      originalUrl: null,
      styleMessage: "",
      styleError: null,
    })));
  }, []);

  const needsStylePreprocess = useCallback(() => {
    return similarity < 100 || keepItems.trim() !== "" || changeItems.trim() !== "";
  }, [similarity, keepItems, changeItems]);

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

  const handleGenerate = useCallback(async () => {
    if (productFiles.length === 0) return;

    if (mode === "single") {
      if (sceneFiles.length === 0) return;
      const sceneFile = sceneFiles[0];
      if (!sceneFile?.file) return;

      setResults([]);
      clearTasks();
      setStyleStepError(null);

      setStyleStepStatus("processing");
      setStyleStepMessage("正在上传场景图...");

      const uploadResult = await uploadImageToImgbbBrowser(sceneFile.file);
      if (!uploadResult?.url) {
        setStyleStepStatus("error");
        setStyleStepError("场景图上传失败");
        setStyleStepMessage("场景图上传失败，请重试");
        return;
      }

      let sceneImageUrl = uploadResult.url;
      setOriginalSceneUrl(sceneImageUrl);

      if (needsStylePreprocess()) {
        setStyleStepMessage("正在预处理场景图风格...");
        const processedUrl = await doStylePreprocess(sceneImageUrl);
        if (!processedUrl) {
          return;
        }
        sceneImageUrl = processedUrl;
      } else {
        setStyleStepStatus("done");
        setStyleStepMessage("跳过风格预处理");
      }

      const tasksToCreate = productFiles.map((pf) => ({
        id: uuidv4(),
        prompt: currentPrompt,
        referenceImage: sceneImageUrl,
        productImage: productFileMapRef.current.get(pf.id),
      }));

      await startBatch({
        tasks: tasksToCreate,
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
      setStyleStepStatus("processing");
      setStyleStepMessage("正在处理多场景图...");

      const allTasks: Array<{ id: string; prompt: string; referenceImage: string; productImage?: File }> = [];

      for (const sceneItem of sceneItems) {
        if (!sceneItem.file?.file) continue;

        let sceneImageUrl: string;

        if (sceneItem.processedUrl) {
          sceneImageUrl = sceneItem.processedUrl;
        } else {
          setStyleStepMessage(`正在上传场景图...`);
          const uploadResult = await uploadImageToImgbbBrowser(sceneItem.file.file);
          if (!uploadResult?.url) continue;
          sceneImageUrl = uploadResult.url;
        }

        for (const pf of productFiles) {
          allTasks.push({
            id: uuidv4(),
            prompt: currentPrompt,
            referenceImage: sceneImageUrl,
            productImage: productFileMapRef.current.get(pf.id),
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
    currentPrompt,
    needsStylePreprocess,
    doStylePreprocess,
    selectedModel,
    aspectRatio,
    imageSize,
    startBatch,
    clearTasks,
    supabase,
  ]);

  const handleRetryStylePreprocess = useCallback(async () => {
    if (!originalSceneUrl) return;

    setStyleStepStatus("processing");
    setStyleStepMessage("正在重试风格预处理...");
    setStyleStepError(null);

    const processedUrl = await doStylePreprocess(originalSceneUrl);
    if (processedUrl) {
      const tasksToCreate = productFiles.map((pf) => ({
        id: uuidv4(),
        prompt: currentPrompt,
        referenceImage: processedUrl,
        productImage: productFileMapRef.current.get(pf.id),
      }));

      await startBatch({
        tasks: tasksToCreate,
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
    productFiles,
    currentPrompt,
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

  const handleAddToCanvas = useCallback(
    (result: ResultItem) => {
      onAddToCanvas(result.imageUrl);
    },
    [onAddToCanvas],
  );

  const handleAddAllToCanvas = useCallback(() => {
    results.forEach((result, index) => {
      const offsetX = (index % 3) * 320;
      const offsetY = Math.floor(index / 3) * 320;
      onAddToCanvas(result.imageUrl, offsetX, offsetY);
    });
  }, [results, onAddToCanvas]);

  const hasSceneFile = mode === "single"
    ? sceneFiles.length > 0 && sceneFiles[0]?.file != null
    : sceneItems.length > 0;

  const isGenerating = styleStepStatus === "processing" || isProcessing;
  const hasFailedTasks = tasks.some((t) => t.status === "failed");

  const totalCount = mode === "single"
    ? productFiles.length
    : sceneItems.length * productFiles.length;

  return {
    // State
    sceneFiles,
    productFiles,
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

    // Setters
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

    // Handlers
    handleSceneChange,
    handleProductChange,
    handleModeChange,
    handleSceneItemsChange,
    handleGenerate,
    handleRetryStylePreprocess,
    handleRetryProductReplace,
    handleAddToCanvas,
    handleAddAllToCanvas,
    clearTasks,
  };
}