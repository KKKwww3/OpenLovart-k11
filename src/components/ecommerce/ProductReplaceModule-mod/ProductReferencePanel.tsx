"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface ProductReferencePanelProps {
  materialFiles: UploadedFile[];
  edgeFiles: UploadedFile[];
  productFiles: UploadedFile[];
  materialPreviewResult: string | null;
  isMaterialPreviewing: boolean;
  materialPreviewError: string | null;
  onMaterialChange: (files: UploadedFile[]) => void;
  onEdgeChange: (files: UploadedFile[]) => void;
  onMaterialPreview: () => void;
  onMaterialPreviewConfirm: () => void;
  onMaterialPreviewRetry: () => void;
}

function PreviewButton({
  label,
  loadingLabel,
  isPreviewing,
  disabled,
  onPreview,
}: {
  label: string;
  loadingLabel: string;
  isPreviewing: boolean;
  disabled: boolean;
  onPreview: () => void;
}) {
  return (
    <button
      onClick={onPreview}
      disabled={disabled || isPreviewing}
      className={`w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
        disabled || isPreviewing
          ? "border-gray-200 text-gray-400 cursor-not-allowed"
          : "border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
      }`}
    >
      {isPreviewing ? (
        <span className="flex items-center justify-center gap-1.5">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

function PreviewResult({
  imageUrl,
  error,
  isPreviewing,
  onConfirm,
  onRetry,
  onViewLarge,
}: {
  imageUrl: string | null;
  error: string | null;
  isPreviewing: boolean;
  onConfirm: () => void;
  onRetry: () => void;
  onViewLarge: () => void;
}) {
  if (isPreviewing) return null;

  if (error) {
    return (
      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="mt-1 text-xs text-red-700 underline hover:text-red-800"
        >
          重试
        </button>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="mt-2 space-y-2">
      <div
        className="relative group cursor-zoom-in rounded-lg overflow-hidden border border-gray-200"
        onClick={onViewLarge}
      >
        <img
          src={imageUrl}
          alt="预览结果"
          className="w-full"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded">
            点击查看大图
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          className="flex-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          效果满意
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          className="flex-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          重新预览
        </button>
      </div>
    </div>
  );
}

export function ProductReferencePanel({
  materialFiles,
  edgeFiles,
  productFiles,
  materialPreviewResult,
  isMaterialPreviewing,
  materialPreviewError,
  onMaterialChange,
  onEdgeChange,
  onMaterialPreview,
  onMaterialPreviewConfirm,
  onMaterialPreviewRetry,
}: ProductReferencePanelProps) {
  const [fullPreview, setFullPreview] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">产品参考图</label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 mb-1.5">产品材质参考（可选）</p>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={materialFiles}
            onChange={onMaterialChange}
            placeholder="上传材质参考图"
          />
          <PreviewButton
            label="预览材质 + 锁边效果"
            loadingLabel="生成预览..."
            isPreviewing={isMaterialPreviewing}
            disabled={materialFiles.length === 0 || productFiles.length === 0}
            onPreview={onMaterialPreview}
          />
          <PreviewResult
            imageUrl={materialPreviewResult}
            error={materialPreviewError}
            isPreviewing={isMaterialPreviewing}
            onConfirm={onMaterialPreviewConfirm}
            onRetry={onMaterialPreviewRetry}
            onViewLarge={() => {
              if (materialPreviewResult) setFullPreview(materialPreviewResult);
            }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 mb-1.5">产品锁边参考（可选）</p>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={edgeFiles}
            onChange={onEdgeChange}
            placeholder="上传锁边参考图"
          />
        </div>
      </div>

      {fullPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullPreview(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setFullPreview(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={fullPreview}
            alt="预览大图"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}