"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { BatchProgress } from "../BatchProgress";
import type { StepStatus } from "./types";
import type { BatchTask } from "@/hooks/useBatchGeneration";

interface GenerationProgressProps {
  styleStepStatus: StepStatus;
  styleStepMessage: string;
  styleStepError: string | null;
  isProcessing: boolean;
  tasks: BatchTask[];
  overallProgress: number;
  hasFailedTasks: boolean;
  onRetryStylePreprocess: () => void;
  onRetryProductReplace: () => void;
  onCancelBatch: () => void;
}

export function GenerationProgress({
  styleStepStatus,
  styleStepMessage,
  styleStepError,
  isProcessing,
  tasks,
  overallProgress,
  hasFailedTasks,
  onRetryStylePreprocess,
  onRetryProductReplace,
  onCancelBatch,
}: GenerationProgressProps) {
  if (styleStepStatus === "idle" && tasks.length === 0) return null;

  return (
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
            onClick={onRetryStylePreprocess}
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
          onCancel={onCancelBatch}
        />
      )}

      {hasFailedTasks && !isProcessing && (
        <div className="flex items-center justify-end">
          <button
            onClick={onRetryProductReplace}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            <RefreshCw size={12} />
            重试失败任务
          </button>
        </div>
      )}
    </div>
  );
}