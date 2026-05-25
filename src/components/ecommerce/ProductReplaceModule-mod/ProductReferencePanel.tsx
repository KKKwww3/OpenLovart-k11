"use client";

import React from "react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface ProductReferencePanelProps {
  materialFiles: UploadedFile[];
  edgeFiles: UploadedFile[];
  productFiles: UploadedFile[];
  materialPreviewResult: string | null;
  isMaterialPreviewing: boolean;
  materialPreviewError: string | null;
  edgePreviewResult: string | null;
  isEdgePreviewing: boolean;
  edgePreviewError: string | null;
  onMaterialChange: (files: UploadedFile[]) => void;
  onEdgeChange: (files: UploadedFile[]) => void;
  onMaterialPreview: () => void;
  onMaterialPreviewConfirm: () => void;
  onMaterialPreviewRetry: () => void;
  onEdgePreview: () => void;
  onEdgePreviewConfirm: () => void;
  onEdgePreviewRetry: () => void;
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
}: {
  imageUrl: string | null;
  error: string | null;
  isPreviewing: boolean;
  onConfirm: () => void;
  onRetry: () => void;
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
      <img
        src={imageUrl}
        alt="预览结果"
        className="w-full rounded-lg border border-gray-200"
      />
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          效果满意
        </button>
        <button
          onClick={onRetry}
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
  edgePreviewResult,
  isEdgePreviewing,
  edgePreviewError,
  onMaterialChange,
  onEdgeChange,
  onMaterialPreview,
  onMaterialPreviewConfirm,
  onMaterialPreviewRetry,
  onEdgePreview,
  onEdgePreviewConfirm,
  onEdgePreviewRetry,
}: ProductReferencePanelProps) {
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
            label="预览材质效果"
            loadingLabel="生成材质预览..."
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
          <PreviewButton
            label="预览锁边效果"
            loadingLabel="生成锁边预览..."
            isPreviewing={isEdgePreviewing}
            disabled={edgeFiles.length === 0 || productFiles.length === 0}
            onPreview={onEdgePreview}
          />
          <PreviewResult
            imageUrl={edgePreviewResult}
            error={edgePreviewError}
            isPreviewing={isEdgePreviewing}
            onConfirm={onEdgePreviewConfirm}
            onRetry={onEdgePreviewRetry}
          />
        </div>
      </div>
    </div>
  );
}