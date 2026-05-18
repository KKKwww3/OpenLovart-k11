"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit3, Eye } from "lucide-react";

export const PRODUCT_REPLACE_PROMPT = `请帮我替换产品到场景中，保持场景中其他元素不变不变，只替换产品位置。严格要求：

1. 替换后的产品图案、颜色、材质、纹理必须与参考产品完全一致，不得修改、美化或风格化
2. 场景中除产品外的所有元素保持完全不变：家具、墙壁、窗户、光线、阴影、透视关系
3. 新产品自然贴合原产品位置和透视，边缘与地面无缝融合，保留家具脚压在产品上的真实阴影
4. 照片级真实感，无AI痕迹或合成伪影`;

export interface ProductReplacePromptProps {
  onPromptChange?: (prompt: string) => void;
}

export function ProductReplacePrompt({ onPromptChange }: ProductReplacePromptProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState(PRODUCT_REPLACE_PROMPT);

  const handleSave = () => {
    setIsEditing(false);
    onPromptChange?.(editablePrompt);
  };

  const handleCancel = () => {
    setEditablePrompt(PRODUCT_REPLACE_PROMPT);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Edit3 size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-600">提示词配置</span>
          <span className="text-xs text-gray-400">（地毯替换）</span>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                  setEditablePrompt(PRODUCT_REPLACE_PROMPT);
                }
              }}
              className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-500 hover:text-gray-700"
            >
              {isEditing ? "保存" : "编辑"}
            </button>
          )}
          {isExpanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 bg-white">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editablePrompt}
                onChange={(e) => setEditablePrompt(e.target.value)}
                className="w-full h-40 px-3 py-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="text-xs px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                >
                  应用
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Eye size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">当前生效提示词</span>
              </div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {PRODUCT_REPLACE_PROMPT}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
