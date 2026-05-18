"use client";

import React, { useState, useCallback, useRef } from "react";
import { Zap } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "../UploadZone";
import { BatchProgress } from "../BatchProgress";
import { ResultPreview, ResultItem } from "../ResultPreview";
import { ModelSelector, DEFAULT_MODEL_OPTIONS } from "../ModelSelector";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { ProductReplacePrompt, PRODUCT_REPLACE_PROMPT } from "./ProductReplacePrompt";
import { v4 as uuidv4 } from "uuid";

export interface ProductReplaceModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

export function ProductReplaceModule({ onAddToCanvas, supabase }: ProductReplaceModuleProps) {
  const [sceneFiles, setSceneFiles] = useState<UploadedFile[]>([]);
  const [sceneBase64, setSceneBase64] = useState<string | null>(null);
  const [productFiles, setProductFiles] = useState<UploadedFile[]>([]);
  const productBase64MapRef = useRef<Map<string, string>>(new Map());
  const [currentPrompt, setCurrentPrompt] = useState(PRODUCT_REPLACE_PROMPT);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_OPTIONS[0].value);
  const [results, setResults] = useState<ResultItem[]>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    clearTasks,
  } = useBatchGeneration(supabase);

  const handleSceneBase64Ready = useCallback(
    (newFiles: { id: string; base64: string }[]) => {
      if (newFiles.length > 0) {
        setSceneBase64(newFiles[0].base64);
      }
    },
    [],
  );

  const handleProductBase64Ready = useCallback(
    (newFiles: { id: string; base64: string }[]) => {
      newFiles.forEach((f) => {
        productBase64MapRef.current.set(f.id, f.base64);
      });
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (productFiles.length === 0 || !sceneBase64) return;

    const tasksToCreate = productFiles.map((pf) => ({
      id: uuidv4(),
      prompt: currentPrompt,
      referenceImage: sceneBase64,
      productImage: productBase64MapRef.current.get(pf.id) || "",
    }));

    setResults([]);
    clearTasks();

    await startBatch({
      tasks: tasksToCreate,
      model: selectedModel,
      concurrency: 2,
      onTaskComplete: (taskId, result) => {
        setResults((prev) => [
          ...prev,
          { id: taskId, imageUrl: result },
        ]);
      },
    });
  }, [productFiles, sceneBase64, currentPrompt, selectedModel, startBatch, clearTasks]);

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

  return (
    <div className="space-y-4">
      <ProductReplacePrompt onPromptChange={setCurrentPrompt} />

      <ModelSelector
        value={selectedModel}
        onChange={setSelectedModel}
      />

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">场景图片</label>
        <UploadZone
          multiple={false}
          maxFiles={1}
          value={sceneFiles}
          onChange={setSceneFiles}
          onBase64Ready={handleSceneBase64Ready}
          placeholder="上传场景背景图（1张）"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品图片</label>
        <UploadZone
          multiple
          maxFiles={10}
          value={productFiles}
          onChange={setProductFiles}
          onBase64Ready={handleProductBase64Ready}
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
        disabled={productFiles.length === 0 || !sceneBase64 || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          productFiles.length > 0 && sceneBase64 && !isProcessing
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isProcessing ? "animate-pulse" : ""} />
        <span>
          {isProcessing
            ? "生成中..."
            : `批量替换 (${productFiles.length}张)`}
        </span>
      </button>
    </div>
  );
}
