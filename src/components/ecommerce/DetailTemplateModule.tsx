"use client";

import React, { useState, useCallback } from "react";
import { Zap, ChevronDown, Layout } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "./UploadZone";
import { BatchProgress } from "./BatchProgress";
import { ResultPreview, ResultItem } from "./ResultPreview";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { getPromptPreset, generateModulePrompt } from "@/lib/prompt-presets";
import { v4 as uuidv4 } from "uuid";

export interface DetailTemplateModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

export function DetailTemplateModule({ onAddToCanvas, supabase }: DetailTemplateModuleProps) {
  const preset = getPromptPreset("detail-template")!;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesBase64, setFilesBase64] = useState<Map<string, string>>(new Map());
  const [params, setParams] = useState<Record<string, unknown>>(
    preset.defaultParams
  );
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    clearTasks,
  } = useBatchGeneration(supabase);

  const templateOptions = preset.paramSchema[0].options || [];

  const handleBase64Ready = useCallback(
    (newFiles: { id: string; base64: string }[]) => {
      setFilesBase64((prev) => {
        const next = new Map(prev);
        newFiles.forEach((f) => next.set(f.id, f.base64));
        return next;
      });
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return;
    if (!(params.productName as string)?.trim()) return;
    if (!(params.features as string)?.trim()) return;

    const tasksToCreate = files.map((file) => {
      const base64 = filesBase64.get(file.id);
      const prompt = generateModulePrompt("detail-template", params);
      return {
        id: uuidv4(),
        prompt,
        referenceImage: base64,
      };
    });

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
  }, [files, filesBase64, params, startBatch, clearTasks]);

  const handleAddToCanvas = useCallback(
    (result: ResultItem) => {
      onAddToCanvas(result.imageUrl);
    },
    [onAddToCanvas]
  );

  const handleAddAllToCanvas = useCallback(() => {
    results.forEach((result, index) => {
      const offsetX = (index % 2) * 400;
      const offsetY = Math.floor(index / 2) * 600;
      onAddToCanvas(result.imageUrl, offsetX, offsetY);
    });
  }, [results, onAddToCanvas]);

  return (
    <div className="space-y-4">
      <div className="bg-green-50 rounded-lg p-3 flex items-start gap-2">
        <Layout size={16} className="text-green-500 mt-0.5" />
        <p className="text-xs text-green-700">
          选择模板风格，输入产品信息，批量生成详情页图片
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品图片</label>
        <UploadZone
          multiple
          maxFiles={10}
          value={files}
          onChange={setFiles}
          onBase64Ready={handleBase64Ready}
          placeholder="上传产品图片（可批量）"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">详情页模板</label>
        <div className="relative">
          <button
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{params.template as string}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {showTemplateMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {templateOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setParams((p) => ({ ...p, template: opt.value }));
                    setShowTemplateMenu(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    params.template === opt.value
                      ? "text-blue-500 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品名称</label>
        <input
          type="text"
          value={(params.productName as string) || ""}
          onChange={(e) => setParams((p) => ({ ...p, productName: e.target.value }))}
          placeholder="输入产品名称"
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">核心卖点</label>
        <textarea
          value={(params.features as string) || ""}
          onChange={(e) => setParams((p) => ({ ...p, features: e.target.value }))}
          placeholder="如：高品质、精工艺、环保材质"
          rows={2}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
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
        disabled={files.length === 0 || !(params.productName as string)?.trim() || !(params.features as string)?.trim() || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          files.length > 0 && (params.productName as string)?.trim() && (params.features as string)?.trim() && !isProcessing
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isProcessing ? "animate-pulse" : ""} />
        <span>{isProcessing ? "生成中..." : `批量生成 (${files.length}张)`}</span>
      </button>
    </div>
  );
}
