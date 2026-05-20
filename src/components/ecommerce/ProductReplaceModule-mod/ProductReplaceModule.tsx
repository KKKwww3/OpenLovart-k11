"use client";

import React, { useState, useCallback, useRef } from "react";
import { Zap, ChevronDown, RefreshCw, X } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "../UploadZone";
import { BatchProgress } from "../BatchProgress";
import { ResultPreview, ResultItem } from "../ResultPreview";
import { ModelSelector } from "../ModelSelector";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { ProductReplacePrompt } from "./ProductReplacePrompt";
import { v4 as uuidv4 } from "uuid";
import { ASPECT_RATIOS, IMAGE_SIZES } from "@/lib/api";
import { stylePreprocess } from "@/lib/stylePreprocess";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";

export interface ProductReplaceModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

type StepStatus = "idle" | "processing" | "done" | "error";

export function ProductReplaceModule({
  onAddToCanvas,
  supabase,
}: ProductReplaceModuleProps) {
  const [sceneFiles, setSceneFiles] = useState<UploadedFile[]>([]);
  const [productFiles, setProductFiles] = useState<UploadedFile[]>([]);
  const productFileMapRef = useRef<Map<string, File>>(new Map());
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<number | undefined>(
    undefined,
  );
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [showAspectRatioMenu, setShowAspectRatioMenu] = useState(false);
  const [showImageSizeMenu, setShowImageSizeMenu] = useState(false);
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

  const needsStylePreprocess = useCallback(() => {
    return similarity < 100 ||
           keepItems.trim() !== "" ||
           changeItems.trim() !== "";
  }, [similarity, keepItems, changeItems]);

  const doStylePreprocess = useCallback(async (sceneImageUrl: string): Promise<string | null> => {
    const keepItemsArray = keepItems.split(",").map(s => s.trim()).filter(Boolean);
    const changeItemsArray = changeItems.split(",").map(s => s.trim()).filter(Boolean);

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
          onStatus: (stage, message) => {
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
    if (productFiles.length === 0 || sceneFiles.length === 0) return;

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
  }, [
    productFiles,
    sceneFiles,
    currentPrompt,
    needsStylePreprocess,
    doStylePreprocess,
    selectedModel,
    aspectRatio,
    imageSize,
    startBatch,
    clearTasks,
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

    const failedTasks = tasks.filter(t => t.status === "failed");
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

  const hasSceneFile = sceneFiles.length > 0 && sceneFiles[0]?.file;
  const isGenerating = styleStepStatus === "processing" || isProcessing;

  const hasFailedTasks = tasks.some(t => t.status === "failed");

  return (
    <div className="space-y-4">
      <ProductReplacePrompt
        supabase={supabase || null}
        onPromptChange={setCurrentPrompt}
      />

      <ModelSelector
        supabase={supabase || null}
        value={selectedModel}
        onChange={setSelectedModel}
      />

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">图片配置</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAspectRatioMenu((v) => !v);
                setShowImageSizeMenu(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700">{aspectRatio}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showAspectRatioMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 max-h-48 overflow-y-auto">
                {Object.keys(ASPECT_RATIOS).map((ratio) => (
                  <div
                    key={ratio}
                    onClick={() => {
                      setAspectRatio(ratio);
                      setShowAspectRatioMenu(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      aspectRatio === ratio
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {ratio}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowImageSizeMenu((v) => !v);
                setShowAspectRatioMenu(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700">{imageSize}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showImageSizeMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                {IMAGE_SIZES.map((size) => (
                  <div
                    key={size}
                    onClick={() => {
                      setImageSize(size);
                      setShowImageSizeMenu(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      imageSize === size
                        ? "text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {size}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">图片风格</label>
        <div className="space-y-3 bg-gray-50 rounded-lg p-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              背景相似度: {similarity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={similarity}
              onChange={(e) => setSimilarity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>低</span>
              <span>高</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              保持不变（逗号分隔）
            </label>
            <input
              value={keepItems}
              onChange={(e) => setKeepItems(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              placeholder="例如：沙发颜色, 装修风格"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              可以变化（逗号分隔）
            </label>
            <input
              value={changeItems}
              onChange={(e) => setChangeItems(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              placeholder="例如：墙面装饰, 景深, 家居位置"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">场景图片</label>
        <UploadZone
          multiple={false}
          maxFiles={1}
          value={sceneFiles}
          onChange={handleSceneChange}
          placeholder="上传场景背景图（1张）"
        />
        {processedSceneUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">风格预处理后的场景图：</p>
            <img
              src={processedSceneUrl}
              alt="Processed scene"
              className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setPreviewImage(processedSceneUrl)}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品图片</label>
        <UploadZone
          multiple
          maxFiles={10}
          value={productFiles}
          onChange={handleProductChange}
          placeholder="上传地毯产品图（可批量，每个产品单独生成）"
        />
      </div>

      {(styleStepStatus !== "idle" || tasks.length > 0) && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              {styleStepStatus === "processing" && (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  <span className="text-gray-700">{styleStepMessage}</span>
                </>
              )}
              {styleStepStatus === "done" && !isProcessing && (
                <>
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-600">{styleStepMessage}</span>
                </>
              )}
              {styleStepStatus === "error" && (
                <>
                  <span className="text-red-600">✗</span>
                  <span className="text-red-600">{styleStepError || "风格预处理失败"}</span>
                </>
              )}
            </div>
            {styleStepStatus === "error" && (
              <button
                onClick={handleRetryStylePreprocess}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <RefreshCw size={12} />
                重试
              </button>
            )}
          </div>

          {tasks.length > 0 && (
            <BatchProgress
              tasks={tasks}
              overallProgress={overallProgress}
              isProcessing={isProcessing}
              onCancel={cancelBatch}
            />
          )}

          {hasFailedTasks && !isProcessing && (
            <div className="flex items-center justify-end">
              <button
                onClick={handleRetryProductReplace}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <RefreshCw size={12} />
                重试失败任务
              </button>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <ResultPreview
          results={results}
          onAddToCanvas={handleAddToCanvas}
          onAddAllToCanvas={handleAddAllToCanvas}
        />
      )}

      <button
        onClick={handleGenerate}
        disabled={productFiles.length === 0 || !hasSceneFile || isGenerating}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          productFiles.length > 0 && hasSceneFile && !isGenerating
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isGenerating ? "animate-pulse" : ""} />
        <span>
          {isGenerating ? "生成中..." : `批量替换 (${productFiles.length}张)`}
        </span>
      </button>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
