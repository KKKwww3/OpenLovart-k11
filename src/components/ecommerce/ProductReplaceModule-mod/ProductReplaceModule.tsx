"use client";

import React, { useState, useCallback, useRef } from "react";
import { Zap, ChevronDown, Cpu } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "../UploadZone";
import { BatchProgress } from "../BatchProgress";
import { ResultPreview, ResultItem } from "../ResultPreview";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { ProductReplacePrompt, PRODUCT_REPLACE_PROMPT } from "./ProductReplacePrompt";
import { v4 as uuidv4 } from "uuid";

const MODEL_OPTIONS = [
  { value: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash", desc: "Google" },
  { value: "openai/gpt-5.4-image-2", label: "GPT 5.4 Image 2", desc: "OpenAI" },
] as const;

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
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [showModelMenu, setShowModelMenu] = useState(false);
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

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">AI 模型</label>
        <div className="relative">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-gray-400" />
              <span className="text-gray-700 font-medium">
                {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}
              </span>
              <span className="text-xs text-gray-400">
                {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.desc}
              </span>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showModelMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {MODEL_OPTIONS.map((model) => (
                <div
                  key={model.value}
                  onClick={() => {
                    setSelectedModel(model.value);
                    setShowModelMenu(false);
                  }}
                  className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedModel === model.value ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        selectedModel === model.value
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      {model.label}
                    </span>
                    <span className="text-xs text-gray-400">{model.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
