"use client";

import React from "react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface ProductReferencePanelProps {
  materialFiles: UploadedFile[];
  edgeFiles: UploadedFile[];
  onMaterialChange: (files: UploadedFile[]) => void;
  onEdgeChange: (files: UploadedFile[]) => void;
}

export function ProductReferencePanel({
  materialFiles,
  edgeFiles,
  onMaterialChange,
  onEdgeChange,
}: ProductReferencePanelProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">产品参考图</label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1.5">产品材质参考（可选）</p>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={materialFiles}
            onChange={onMaterialChange}
            placeholder="上传材质参考图"
          />
        </div>
        <div>
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
    </div>
  );
}