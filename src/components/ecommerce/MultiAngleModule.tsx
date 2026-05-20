"use client";

import React, { useState, useCallback } from "react";
import { Zap, RotateCcw } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "./UploadZone";
import { BatchProgress } from "./BatchProgress";
import { BatchTask } from "@/hooks/useBatchGeneration";
import { ResultPreview, ResultItem } from "./ResultPreview";
import { AngleVectorControl, AngleConfig } from "./AngleVectorControl";
import { ANGLE_PRESETS } from "@/config/multi-angle";
import { nb2Render } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

export interface MultiAngleModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

function getSelectedPresets(selectedIds: string[]) {
  return ANGLE_PRESETS.filter((p) => selectedIds.includes(p.id));
}

export function MultiAngleModule({
  onAddToCanvas,
  supabase,
}: MultiAngleModuleProps) {
  const [file, setFile] = useState<UploadedFile[]>([]);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [angleConfig, setAngleConfig] = useState<AngleConfig>({
    selectedIds: [],
  });
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPresets = getSelectedPresets(angleConfig.selectedIds);
  const overallProgress = tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
    : 0;

  const handleBase64Ready = useCallback(
    (files: { id: string; base64: string }[]) => {
      if (files.length > 0) {
        setFileBase64(files[0].base64);
      }
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (!fileBase64 || isProcessing || selectedPresets.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    const initialTasks: BatchTask[] = selectedPresets.map((preset) => ({
      id: uuidv4(),
      status: "pending" as const,
      prompt: `${preset.name} — ${preset.description}`,
      progress: 0,
    }));

    setTasks(initialTasks);

    for (let i = 0; i < selectedPresets.length; i++) {
      const task = initialTasks[i];
      const preset = selectedPresets[i];

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "processing" as const, progress: 5 }
            : t,
        ),
      );

      try {
        const result = await nb2Render(
          {
            sourceImage: fileBase64,
            prompt: preset.prompt,
          },
          supabase,
        );

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "completed" as const, result: result.imageUrl, progress: 100 }
              : t,
          ),
        );
        setResults((prev) => [
          ...prev,
          {
            id: task.id,
            imageUrl: result.imageUrl,
            prompt: `${preset.name} — ${preset.description}`,
          },
        ]);
      } catch (err) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "failed" as const, error: String(err), progress: 0 }
              : t,
          ),
        );
      }
    }

    setIsProcessing(false);
  }, [fileBase64, angleConfig, selectedPresets, supabase]);

  const handleCancel = useCallback(() => {
    setIsProcessing(false);
    setTasks((prev) =>
      prev.map((t) =>
        t.status === "processing"
          ? { ...t, status: "failed" as const, error: "已取消" }
          : t,
      ),
    );
  }, []);

  const handleAddToCanvas = useCallback(
    (result: ResultItem) => {
      onAddToCanvas(result.imageUrl);
    },
    [onAddToCanvas],
  );

  const handleAddAllToCanvas = useCallback(() => {
    results.forEach((result, index) => {
      const offsetX = (index % 4) * 260;
      const offsetY = Math.floor(index / 4) * 260;
      onAddToCanvas(result.imageUrl, offsetX, offsetY);
    });
  }, [results, onAddToCanvas]);

  const canGenerate = !!fileBase64 && !isProcessing && selectedPresets.length > 0;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
        <RotateCcw size={16} className="text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-700">
          上传产品主图，选择需要生成的视角，一键渲染多角度展示图
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

      <AngleVectorControl
        value={angleConfig}
        onChange={setAngleConfig}
        disabled={isProcessing}
      />

      {tasks.length > 0 && (
        <BatchProgress
          tasks={tasks}
          overallProgress={overallProgress}
          isProcessing={isProcessing}
          onCancel={handleCancel}
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
        disabled={!canGenerate}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          canGenerate
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={isProcessing ? "animate-pulse" : ""} />
        <span>
          {isProcessing
            ? "生成中..."
            : selectedPresets.length > 0
              ? `生成 ${selectedPresets.length} 个角度`
              : "请选择至少一个角度"}
        </span>
      </button>
    </div>
  );
}