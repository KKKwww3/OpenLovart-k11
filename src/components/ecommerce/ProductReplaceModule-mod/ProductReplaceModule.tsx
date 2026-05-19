"use client";

import React, { useState, useCallback, useRef } from "react";
import { Zap } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "../UploadZone";
import { BatchProgress } from "../BatchProgress";
import { ResultPreview, ResultItem } from "../ResultPreview";
import { ModelSelector } from "../ModelSelector";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { ProductReplacePrompt } from "./ProductReplacePrompt";
import { v4 as uuidv4 } from "uuid";

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
