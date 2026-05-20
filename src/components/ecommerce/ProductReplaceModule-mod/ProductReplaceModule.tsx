"use client";

import React, { useState, useCallback, useRef } from "react";
import { Zap, ChevronDown } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "../UploadZone";
import { BatchProgress } from "../BatchProgress";
import { ResultPreview, ResultItem } from "../ResultPreview";
import { ModelSelector } from "../ModelSelector";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { ProductReplacePrompt } from "./ProductReplacePrompt";
import { v4 as uuidv4 } from "uuid";
import { ASPECT_RATIOS, IMAGE_SIZES } from "@/lib/api";

export interface ProductReplaceModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

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
  const [results, setResults] = useState<ResultItem[]>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    clearTasks,
  } = useBatchGeneration(supabase);

  const handleSceneChange = useCallback((files: UploadedFile[]) => {
    setSceneFiles(files);
  }, []);

  const handleProductChange = useCallback((files: UploadedFile[]) => {
    files.forEach((f) => {
      if (f.file) {
        productFileMapRef.current.set(f.id, f.file);
      }
    });
    setProductFiles(files);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (productFiles.length === 0 || sceneFiles.length === 0) return;

    const sceneFile = sceneFiles[0]?.file;
    if (!sceneFile) return;

    const tasksToCreate = productFiles.map((pf) => ({
      id: uuidv4(),
      prompt: currentPrompt,
      referenceImage: sceneFile,
      productImage: productFileMapRef.current.get(pf.id),
    }));

    setResults([]);
    clearTasks();

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
    selectedModel,
    aspectRatio,
    imageSize,
    startBatch,
    clearTasks,
  ]);

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
        <label className="text-sm font-medium text-gray-700">场景图片</label>
        <UploadZone
          multiple={false}
          maxFiles={1}
          value={sceneFiles}
          onChange={handleSceneChange}
          placeholder="上传场景背景图（1张）"
        />
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

      {tasks.length > 0 && (
        <BatchProgress
          tasks={tasks}
          overallProgress={overallProgress}
          isProcessing={isProcessing}
          onCancel={cancelBatch}
        />
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
        disabled={productFiles.length === 0 || !hasSceneFile || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          productFiles.length > 0 && hasSceneFile && !isProcessing
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isProcessing ? "animate-pulse" : ""} />
        <span>
          {isProcessing ? "生成中..." : `批量替换 (${productFiles.length}张)`}
        </span>
      </button>
    </div>
  );
}
