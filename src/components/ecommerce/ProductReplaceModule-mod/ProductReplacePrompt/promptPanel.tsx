"use client";

import React from "react";
import { ChevronDown, ChevronUp, Edit3, Eye, Check, Loader2 } from "lucide-react";
import type { PromptTemplate } from "./ProductReplacePrompt";

export interface PromptPanelViewProps {
  prompts: PromptTemplate[];
  activeId: string | null;
  currentContent: string;
  isExpanded: boolean;
  isEditing: boolean;
  editableContent: string;
  loading: boolean;
  onToggleExpand: () => void;
  onSelectPrompt: (id: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditableContentChange: (content: string) => void;
  moduleKey: string;
}

function summarize(text: string, max = 60): string {
  const oneLine = text.replace(/\n/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max) + "..." : oneLine;
}

export function PromptPanelView({
  prompts,
  activeId,
  currentContent,
  isExpanded,
  isEditing,
  editableContent,
  loading,
  onToggleExpand,
  onSelectPrompt,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditableContentChange,
  moduleKey,
}: PromptPanelViewProps) {
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 size={14} className="animate-spin" />
        加载提示词...
      </div>
    );
  }

  const activePrompt = prompts.find((p) => p.id === activeId) || null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Edit3 size={14} className="text-gray-400 shrink-0" />
          <span className="text-xs font-medium text-gray-600 shrink-0">提示词配置</span>
          {activePrompt && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded text-gray-500 shrink-0">
              {activePrompt.name}
            </span>
          )}
          <span className="text-xs text-gray-400 truncate">（{moduleKey}）</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {prompts.length > 1 && (
            <span className="text-[10px] text-gray-400">{prompts.length}个版本</span>
          )}
          {isExpanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 bg-white space-y-3">
          {prompts.length > 1 && !isEditing && (
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium px-0.5">选择版本</div>
              <div className="grid gap-1.5">
                {prompts.map((p) => {
                  const isActive = p.id === activeId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPrompt(p.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all ${
                        isActive
                          ? "bg-gray-50 border-gray-900 shadow-sm"
                          : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                          {p.name}
                        </span>
                        {isActive && (
                          <Check size={12} className="text-gray-900 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {summarize(p.content)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editableContent}
                onChange={(e) => onEditableContentChange(e.target.value)}
                className="w-full h-40 px-3 py-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              {activePrompt && (
                <div className="text-[10px] text-gray-400">
                  修改将保存到数据库，版本：{activePrompt.name}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={onSaveEdit}
                  className="flex items-center gap-1 text-xs px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                >
                  <Check size={12} />
                  保存到数据库
                </button>
                <button
                  onClick={onCancelEdit}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Eye size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400">当前生效提示词</span>
                </div>
                {prompts.length > 0 && (
                  <button
                    onClick={onStartEdit}
                    className="text-[10px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    编辑
                  </button>
                )}
              </div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {currentContent}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}