"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ASPECT_RATIOS, IMAGE_SIZES } from "@/lib/api";

interface ImageConfigPanelProps {
  aspectRatio: string;
  imageSize: string;
  onAspectRatioChange: (ratio: string) => void;
  onImageSizeChange: (size: string) => void;
}

export function ImageConfigPanel({
  aspectRatio,
  imageSize,
  onAspectRatioChange,
  onImageSizeChange,
}: ImageConfigPanelProps) {
  const [showAspectRatioMenu, setShowAspectRatioMenu] = useState(false);
  const [showImageSizeMenu, setShowImageSizeMenu] = useState(false);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">图片配置</label>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowAspectRatioMenu((v) => !v);
              setShowImageSizeMenu(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{aspectRatio}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showAspectRatioMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 max-h-48 overflow-y-auto">
              {Object.keys(ASPECT_RATIOS).map((ratio) => (
                <div
                  key={ratio}
                  onClick={() => {
                    onAspectRatioChange(ratio);
                    setShowAspectRatioMenu(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    aspectRatio === ratio
                      ? "text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {ratio}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowImageSizeMenu((v) => !v);
              setShowAspectRatioMenu(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{imageSize}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showImageSizeMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {IMAGE_SIZES.map((size) => (
                <div
                  key={size}
                  onClick={() => {
                    onImageSizeChange(size);
                    setShowImageSizeMenu(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    imageSize === size
                      ? "text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}