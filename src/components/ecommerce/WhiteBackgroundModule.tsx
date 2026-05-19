"use client";

import React, { useState, useCallback } from "react";
import { Zap, ChevronDown, Square } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "./UploadZone";
import { BatchProgress } from "./BatchProgress";
import { ResultPreview, ResultItem } from "./ResultPreview";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { getPromptPreset, generateModulePrompt } from "@/lib/prompt-presets";
import { v4 as uuidv4 } from "uuid";

export interface WhiteBackgroundModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

export function WhiteBackgroundModule({
  onAddToCanvas,
  supabase,
}: WhiteBackgroundModuleProps) {
  const preset = getPromptPreset("white-background")!;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesBase64, setFilesBase64] = useState<Map<string, string>>(
    new Map(),
  );
  const [params, setParams] = useState<Record<string, unknown>>(
    preset.defaultParams,
  );
  const [showAngleMenu, setShowAngleMenu] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    clearTasks,
  } = useBatchGeneration(supabase);

  const angleOptions = preset.paramSchema[0].options || [];

  const handleBase64Ready = useCallback(
    (newFiles: { id: string; base64: string }[]) => {
      setFilesBase64((prev) => {
        const next = new Map(prev);
        newFiles.forEach((f) => next.set(f.id, f.base64));
        return next;
      });
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return;

    const tasksToCreate = files.map((file) => {
      const base64 = filesBase64.get(file.id);
      const prompt = generateModulePrompt("white-background", params);
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
      <div className="bg-gray-100 rounded-lg p-3 flex items-start gap-2">
        <Square size={16} className="text-gray-500 mt-0.5" />
        <p className="text-xs text-gray-700">
          一键生成白底产品图，保持产品原有花色材质，适合电商主图
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
        <label className="text-sm font-medium text-gray-700">展示角度</label>
        <div className="relative">
          <button
            onClick={() => setShowAngleMenu(!showAngleMenu)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{params.angle as string}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {showAngleMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {angleOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setParams((p) => ({ ...p, angle: opt.value }));
                    setShowAngleMenu(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    params.angle === opt.value
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
        disabled={files.length === 0 || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          files.length > 0 && !isProcessing
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isProcessing ? "animate-pulse" : ""} />
        <span>
          {isProcessing ? "生成中..." : `批量生成 (${files.length}张)`}
        </span>
      </button>
    </div>
  );
}
