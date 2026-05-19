"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  Check,
  Loader2,
  Plus,
  Trash2,
  Power,
  PowerOff,
  X,
} from "lucide-react";
import type {
  PromptTemplate,
  PromptUpdateFields,
  PromptCreateFields,
} from "./ProductReplacePrompt";

function summarize(text: string, max = 60): string {
  const oneLine = text.replace(/\n/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max) + "..." : oneLine;
}

interface PromptEditCardProps {
  prompt: PromptTemplate;
  onUpdate: (id: string, fields: PromptUpdateFields) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, current: boolean) => Promise<void>;
  onClose?: () => void;
}

function PromptEditCard({
  prompt,
  onUpdate,
  onDelete,
  onToggleActive,
}: PromptEditCardProps) {
  const [name, setName] = useState(prompt.name);
  const [content, setContent] = useState(prompt.content);
  const [sortOrder, setSortOrder] = useState(prompt.sort_order);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(prompt.name);
    setContent(prompt.content);
    setSortOrder(prompt.sort_order);
  }, [prompt.id, prompt.name, prompt.content, prompt.sort_order]);

  const isDirty =
    name !== prompt.name ||
    content !== prompt.content ||
    sortOrder !== prompt.sort_order;

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setSaving(true);
    await onUpdate(prompt.id, { name, content, sort_order: sortOrder });
    setSaving(false);
  }, [isDirty, onUpdate, prompt.id, name, content, sortOrder]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await onDelete(prompt.id);
    setDeleting(false);
  }, [confirmDelete, onDelete, prompt.id]);

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        prompt.is_active
          ? "border-gray-200 bg-white"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 text-xs font-medium px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          placeholder="提示词名称"
        />
        <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
          <span>排序</span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-12 px-1 py-0.5 border border-gray-200 rounded bg-white text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>
        <button
          onClick={() => onToggleActive(prompt.id, prompt.is_active)}
          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors shrink-0 ${
            prompt.is_active
              ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
              : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
          }`}
          title={prompt.is_active ? "点击停用" : "点击启用"}
        >
          {prompt.is_active ? (
            <>
              <Power size={10} />
              启用
            </>
          ) : (
            <>
              <PowerOff size={10} />
              停用
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <span>ID: {prompt.id.slice(0, 8)}...</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-24 px-2 py-1.5 text-[11px] text-gray-700 bg-white border border-gray-200 rounded font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors ${
              isDirty && !saving
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Check size={10} />
            )}
            保存
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-[10px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                {deleting ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Trash2 size={10} />
                )}
                确认删除
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white border border-gray-200 text-gray-400 rounded hover:text-red-500 hover:border-red-200 transition-colors"
            >
              <Trash2 size={10} />
              删除
            </button>
          )}
        </div>
        <div className="text-[10px] text-gray-400">
          {prompt.is_active ? (
            <span className="text-green-500">● 活跃</span>
          ) : (
            <span className="text-gray-300">○ 停用</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface PromptNewCardProps {
  onSave: (fields: PromptCreateFields) => Promise<void>;
  onCancel: () => void;
}

function PromptNewCard({ onSave, onCancel }: PromptNewCardProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), content: content.trim(), sort_order: sortOrder });
    setSaving(false);
    setName("");
    setContent("");
    setSortOrder(0);
  }, [name, content, sortOrder, onSave]);

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 text-xs font-medium px-2 py-1 border border-blue-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300"
          placeholder="输入提示词名称"
        />
        <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
          <span>排序</span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-12 px-1 py-0.5 border border-blue-200 rounded bg-white text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-24 px-2 py-1.5 text-[11px] text-gray-700 bg-white border border-blue-200 rounded font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300"
        placeholder="输入提示词内容..."
      />
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !content.trim() || saving}
          className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded transition-colors ${
            name.trim() && content.trim() && !saving
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-100 text-blue-300 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Plus size={10} />
          )}
          创建
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors"
        >
          <X size={10} />
          取消
        </button>
      </div>
    </div>
  );
}

export interface PromptPanelViewProps {
  prompts: PromptTemplate[];
  activeId: string | null;
  currentContent: string;
  isExpanded: boolean;
  isEditing: boolean;
  editableContent: string;
  loading: boolean;
  showManagement: boolean;
  moduleKey: string;
  onToggleExpand: () => void;
  onSelectPrompt: (id: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditableContentChange: (content: string) => void;
  onToggleManagement: () => void;
  onCreate: (fields: PromptCreateFields) => Promise<void>;
  onUpdate: (id: string, fields: PromptUpdateFields) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, current: boolean) => Promise<void>;
}

export function PromptPanelView({
  prompts,
  activeId,
  currentContent,
  isExpanded,
  isEditing,
  editableContent,
  loading,
  showManagement,
  moduleKey,
  onToggleExpand,
  onSelectPrompt,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditableContentChange,
  onToggleManagement,
  onCreate,
  onUpdate,
  onDelete,
  onToggleActive,
}: PromptPanelViewProps) {
  const [showNewForm, setShowNewForm] = useState(false);

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
          <span className="text-xs font-medium text-gray-600 shrink-0">
            提示词配置
          </span>
          {activePrompt && !showManagement && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded text-gray-500 shrink-0">
              {activePrompt.name}
            </span>
          )}
          {showManagement && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded shrink-0">
              管理中
            </span>
          )}
          <span className="text-xs text-gray-400 truncate">
            （{moduleKey}）
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {prompts.length > 0 && (
            <span className="text-[10px] text-gray-400">
              {prompts.length}个版本
            </span>
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
          {!showManagement ? (
            <>
              {prompts.length > 1 && !isEditing && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium px-0.5">
                      选择版本
                    </span>
                    <button
                      onClick={onToggleManagement}
                      className="text-[10px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
                    >
                      管理
                    </button>
                  </div>
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
                              : p.is_active
                                ? "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                                : "bg-gray-50/50 border-gray-100 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-medium ${
                                  isActive
                                    ? "text-gray-900"
                                    : "text-gray-600"
                                }`}
                              >
                                {p.name}
                              </span>
                              {!p.is_active && (
                                <span className="text-[9px] px-1 py-0.5 bg-gray-200 rounded text-gray-400">
                                  停用
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <Check
                                size={12}
                                className="text-gray-900 shrink-0"
                              />
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

              {prompts.length <= 1 && !isEditing && (
                <div className="flex justify-end">
                  <button
                    onClick={onToggleManagement}
                    className="text-[10px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
                  >
                    管理
                  </button>
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
                      <span className="text-xs text-gray-400">
                        当前生效提示词
                      </span>
                    </div>
                    {activePrompt && (
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
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400 font-medium">
                  管理提示词（共{prompts.length}条）
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={10} />
                    新建
                  </button>
                  <button
                    onClick={onToggleManagement}
                    className="text-[10px] px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors"
                  >
                    返回选择
                  </button>
                </div>
              </div>

              {showNewForm && (
                <PromptNewCard
                  onSave={onCreate}
                  onCancel={() => setShowNewForm(false)}
                />
              )}

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {prompts.map((p) => (
                  <PromptEditCard
                    key={p.id}
                    prompt={p}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                  />
                ))}
                {prompts.length === 0 && !showNewForm && (
                  <div className="text-center py-6 text-xs text-gray-400">
                    暂无提示词，点击"新建"创建
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}