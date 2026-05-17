"use client";

import React from "react";
import { Download, Plus, RotateCcw, Check } from "lucide-react";

export interface ResultItem {
  id: string;
  imageUrl: string;
  prompt?: string;
}

export interface ResultPreviewProps {
  results: ResultItem[];
  onAddToCanvas: (result: ResultItem) => void;
  onAddAllToCanvas: () => void;
  onDownload?: (result: ResultItem) => void;
  onRetry?: (id: string) => void;
}

export function ResultPreview({
  results,
  onAddToCanvas,
  onAddAllToCanvas,
  onDownload,
  onRetry,
}: ResultPreviewProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          生成结果 ({results.length})
        </h4>
        <button
          onClick={onAddAllToCanvas}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} />
          全部添加到画布
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="group relative rounded-xl overflow-hidden bg-gray-100 border border-gray-100"
          >
            <img
              src={result.imageUrl}
              alt="生成结果"
              className="w-full aspect-square object-cover"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onAddToCanvas(result)}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="添加到画布"
              >
                <Plus size={16} className="text-gray-700" />
              </button>

              {onDownload && (
                <button
                  onClick={() => onDownload(result)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title="下载"
                >
                  <Download size={16} className="text-gray-700" />
                </button>
              )}

              {onRetry && (
                <button
                  onClick={() => onRetry(result.id)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title="重新生成"
                >
                  <RotateCcw size={16} className="text-gray-700" />
                </button>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white line-clamp-1">
                {result.prompt || "生成结果"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface SingleResultPreviewProps {
  imageUrl: string;
  onAddToCanvas: () => void;
  onDownload?: () => void;
  isAdded?: boolean;
}

export function SingleResultPreview({
  imageUrl,
  onAddToCanvas,
  onDownload,
  isAdded = false,
}: SingleResultPreviewProps) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-100 group">
      <img
        src={imageUrl}
        alt="生成结果"
        className="w-full aspect-square object-cover"
      />

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={onAddToCanvas}
          disabled={isAdded}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors
            ${isAdded
              ? "bg-green-500 text-white"
              : "bg-white hover:bg-gray-100"
            }
          `}
          title={isAdded ? "已添加" : "添加到画布"}
        >
          {isAdded ? (
            <Check size={18} />
          ) : (
            <Plus size={18} className="text-gray-700" />
          )}
        </button>

        {onDownload && (
          <button
            onClick={onDownload}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="下载"
          >
            <Download size={18} className="text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}
