"use client";

import React, { useState, useCallback } from "react";
import { Zap, ChevronDown, RotateCcw } from "lucide-react";
import { UploadZone, UploadedFile } from "./UploadZone";
import { BatchProgress } from "./BatchProgress";
import { ResultPreview, ResultItem } from "./ResultPreview";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { MULTI_ANGLE_PROMPTS } from "@/lib/prompt-presets";
import { v4 as uuidv4 } from "uuid";

export interface MultiAngleModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
}

export function MultiAngleModule({ onAddToCanvas }: MultiAngleModuleProps) {
  const [file, setFile] = useState<UploadedFile[]>([]);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [productType, setProductType] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    clearTasks,
  } = useBatchGeneration();

  const handleBase64Ready = useCallback((files: { id: string; base64: string }[]) => {
    if (files.length > 0) {
      setFileBase64(files[0].base64);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!fileBase64 || !productType.trim()) return;

    const tasksToCreate = MULTI_ANGLE_PROMPTS.map((anglePrompt, index) => ({
      id: uuidv4(),
      prompt: `专业电商产品摄影，${productType}的${anglePrompt}，纯白背景，产品主体居中，专业商业摄影布光，8K高清，细节清晰可见，无阴影，适合电商主图展示`,
      referenceImage: fileBase64,
    }));

    setResults([]);
    clearTasks();

    await startBatch({
      tasks: tasksToCreate,
      model: "nano-banana",
      concurrency: 2,
      onTaskComplete: (taskId, result) => {
        setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
      },
    });
  }, [fileBase64, productType, startBatch, clearTasks]);

  const handleAddToCanvas = useCallback(
    (result: ResultItem) => {
      onAddToCanvas(result.imageUrl);
    },
    [onAddToCanvas]
  );

  const handleAddAllToCanvas = useCallback(() => {
    results.forEach((result, index) => {
      const offsetX = (index % 4) * 260;
      const offsetY = Math.floor(index / 4) * 260;
      onAddToCanvas(result.imageUrl, offsetX, offsetY);
    });
  }, [results, onAddToCanvas]);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
        <RotateCcw size={16} className="text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-700">
          上传一张产品主图，自动生成7个不同角度的产品展示图
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品主图</label>
        <UploadZone
          value={file}
          onChange={setFile}
          onBase64Ready={handleBase64Ready}
          placeholder="上传产品主图"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品类型</label>
        <input
          type="text"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          placeholder="如：沙发、台灯、包包等"
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
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
        disabled={!fileBase64 || !productType.trim() || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          fileBase64 && productType.trim() && !isProcessing
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isProcessing ? "animate-pulse" : ""} />
        <span>{isProcessing ? "生成中..." : "生成7个角度"}</span>
      </button>
    </div>
  );
}
