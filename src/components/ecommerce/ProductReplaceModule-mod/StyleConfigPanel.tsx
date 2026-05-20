"use client";

import React from "react";

interface StyleConfigPanelProps {
  similarity: number;
  keepItems: string;
  changeItems: string;
  onSimilarityChange: (value: number) => void;
  onKeepItemsChange: (value: string) => void;
  onChangeItemsChange: (value: string) => void;
}

export function StyleConfigPanel({
  similarity,
  keepItems,
  changeItems,
  onSimilarityChange,
  onKeepItemsChange,
  onChangeItemsChange,
}: StyleConfigPanelProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">图片风格</label>
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            背景相似度: {similarity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={similarity}
            onChange={(e) => onSimilarityChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>低</span>
            <span>高</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            保持不变（逗号分隔）
          </label>
          <input
            value={keepItems}
            onChange={(e) => onKeepItemsChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            placeholder="例如：沙发颜色, 装修风格"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            可以变化（逗号分隔）
          </label>
          <input
            value={changeItems}
            onChange={(e) => onChangeItemsChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            placeholder="例如：墙面装饰, 景深, 家居位置"
          />
        </div>
      </div>
    </div>
  );
}