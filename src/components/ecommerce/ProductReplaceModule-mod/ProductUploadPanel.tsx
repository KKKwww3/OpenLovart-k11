"use client";

import React from "react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface ProductUploadPanelProps {
  productFiles: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

export function ProductUploadPanel({
  productFiles,
  onChange,
}: ProductUploadPanelProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">产品图片</label>
      <UploadZone
        multiple
        maxFiles={10}
        value={productFiles}
        onChange={onChange}
        placeholder="上传地毯产品图（可批量，每个产品单独生成）"
      />
    </div>
  );
}