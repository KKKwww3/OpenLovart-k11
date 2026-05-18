"use client";

import React, { useState, useCallback } from "react";
import { Zap, ChevronDown, User } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "./UploadZone";
import { BatchProgress } from "./BatchProgress";
import { ResultPreview, ResultItem } from "./ResultPreview";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { getPromptPreset, generateModulePrompt } from "@/lib/prompt-presets";
import { v4 as uuidv4 } from "uuid";

export interface ModelGenerationModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

export function ModelGenerationModule({
  onAddToCanvas,
  supabase,
}: ModelGenerationModuleProps) {
  const preset = getPromptPreset("model-generation")!;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesBase64, setFilesBase64] = useState<Map<string, string>>(
    new Map(),
  );
  const [params, setParams] = useState<Record<string, unknown>>(
    preset.defaultParams,
  );
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [showPoseMenu, setShowPoseMenu] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    clearTasks,
  } = useBatchGeneration(supabase);

  const genderOptions = preset.paramSchema[0].options || [];
  const poseOptions = preset.paramSchema[2].options || [];
  const sceneOptions = preset.paramSchema[3].options || [];

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
      const prompt = generateModulePrompt("model-generation", params);
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
      model: "google/gemini-3.1-flash-image-preview",
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
      <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
        <User size={16} className="text-purple-500 mt-0.5" />
        <p className="text-xs text-purple-700">
          在产品图中添加模特，支持选择性别、数量和姿势
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">模特性别</label>
          <div className="relative">
            <button
              onClick={() => setShowGenderMenu(!showGenderMenu)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700">{params.gender as string}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showGenderMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                {genderOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setParams((p) => ({ ...p, gender: opt.value }));
                      setShowGenderMenu(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      params.gender === opt.value
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">模特数量</label>
          <input
            type="number"
            min={1}
            max={3}
            value={params.count as number}
            onChange={(e) =>
              setParams((p) => ({
                ...p,
                count: Math.min(3, Math.max(1, parseInt(e.target.value) || 1)),
              }))
            }
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">姿势风格</label>
        <div className="relative">
          <button
            onClick={() => setShowPoseMenu(!showPoseMenu)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{params.pose as string}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {showPoseMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {poseOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setParams((p) => ({ ...p, pose: opt.value }));
                    setShowPoseMenu(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    params.pose === opt.value
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
        <label className="text-sm font-medium text-gray-700">场景风格</label>
        <div className="relative">
          <button
            onClick={() => setShowSceneMenu(!showSceneMenu)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{params.scene as string}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {showSceneMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {sceneOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setParams((p) => ({ ...p, scene: opt.value }));
                    setShowSceneMenu(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    params.scene === opt.value
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
