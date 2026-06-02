"use client";

import React from "react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface DesignUploadPanelProps {
  sceneFiles: UploadedFile[];
  designFiles: UploadedFile[];
  processedSceneUrl: string | null;
  onSceneChange: (files: UploadedFile[]) => void;
  onDesignChange: (files: UploadedFile[]) => void;
  onPreviewImage: (url: string) => void;
}

export function DesignUploadPanel({
  sceneFiles,
  designFiles,
  processedSceneUrl,
  onSceneChange,
  onDesignChange,
  onPreviewImage,
}: DesignUploadPanelProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">图片上传</label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1.5">场景图（含产品）</p>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={sceneFiles}
            onChange={onSceneChange}
            placeholder="上传带产品的场景图"
          />
          {processedSceneUrl && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">预处理后的场景图：</p>
              <img
                src={processedSceneUrl}
                alt="Processed scene"
                className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onPreviewImage(processedSceneUrl)}
              />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1.5">设计图（图案）</p>
          <UploadZone
            multiple
            maxFiles={10}
            value={designFiles}
            onChange={onDesignChange}
            placeholder="上传设计图案（可批量）"
          />
        </div>
      </div>

      {sceneFiles.length > 0 && designFiles.length > 0 && (
        <p className="text-xs text-gray-400">
          场景图 × 设计图 = {sceneFiles.length} × {designFiles.length} ={" "}
          {sceneFiles.length * designFiles.length} 张结果
        </p>
      )}
    </div>
  );
}
