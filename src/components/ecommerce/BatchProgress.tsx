"use client";

import React from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { BatchTask } from "@/hooks/useBatchGeneration";

export interface BatchProgressProps {
  tasks: BatchTask[];
  overallProgress: number;
  isProcessing: boolean;
  onCancel?: () => void;
}

export function BatchProgress({
  tasks,
  overallProgress,
  isProcessing,
  onCancel,
}: BatchProgressProps) {
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const processingCount = tasks.filter((t) => t.status === "processing").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">
            进度: {completedCount}/{tasks.length}
          </span>
          {processingCount > 0 && (
            <span className="text-blue-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              处理中 {processingCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-gray-400">等待 {pendingCount}</span>
          )}
          {failedCount > 0 && (
            <span className="text-red-500 flex items-center gap-1">
              <XCircle size={12} />
              失败 {failedCount}
            </span>
          )}
        </div>

        {isProcessing && onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-red-500 hover:text-red-600"
          >
            取消
          </button>
        )}
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`
              aspect-square rounded-lg overflow-hidden relative
              ${task.status === "processing" ? "ring-2 ring-blue-400" : ""}
            `}
          >
            {task.result ? (
              <img
                src={task.result}
                alt="结果"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                {task.status === "processing" && (
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                )}
                {task.status === "pending" && (
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                )}
                {task.status === "failed" && (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>
            )}

            {task.status === "completed" && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={10} className="text-white" />
              </div>
            )}

            {task.status === "failed" && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
