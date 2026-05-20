"use client";

import React from "react";
import { RotateCcw, Check } from "lucide-react";
import { ANGLE_PRESETS } from "@/config/multi-angle";

export interface AngleConfig {
  selectedIds: string[];
}

export interface AngleVectorControlProps {
  value: AngleConfig;
  onChange: (value: AngleConfig) => void;
  disabled?: boolean;
}

export function AngleVectorControl({
  value,
  onChange,
  disabled = false,
}: AngleVectorControlProps) {
  const togglePreset = (presetId: string) => {
    const isSelected = value.selectedIds.includes(presetId);
    const newSelected = isSelected
      ? value.selectedIds.filter((id) => id !== presetId)
      : [...value.selectedIds, presetId];
    onChange({ ...value, selectedIds: newSelected });
  };

  const selectAll = () => {
    onChange({
      ...value,
      selectedIds: ANGLE_PRESETS.map((p) => p.id),
    });
  };

  const clearAll = () => {
    onChange({ ...value, selectedIds: [] });
  };

  return (
    <div className="space-y-4 bg-white border border-gray-100 rounded-xl p-4">
      {/* 标题 + 统计 */}
      <div className="flex items-center gap-2">
        <RotateCcw size={16} className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700">选择渲染角度</span>
        <span className="text-xs text-gray-400 ml-auto">
          已选 {value.selectedIds.length}/{ANGLE_PRESETS.length} 个角度
        </span>
      </div>

      {/* 全选 / 清空 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="px-3 py-1 text-xs rounded-lg bg-gray-50 text-gray-600 border border-gray-200
                     hover:bg-gray-100 disabled:opacity-50"
        >
          全选
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="px-3 py-1 text-xs rounded-lg bg-gray-50 text-gray-600 border border-gray-200
                     hover:bg-gray-100 disabled:opacity-50"
        >
          清空
        </button>
      </div>

      {/* 预设角度多选卡片 */}
      <div className="grid grid-cols-2 gap-2">
        {ANGLE_PRESETS.map((preset) => {
          const isSelected = value.selectedIds.includes(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => togglePreset(preset.id)}
              disabled={disabled}
              className={`flex items-start gap-2 p-3 rounded-lg text-left transition-all border ${
                isSelected
                  ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              } disabled:opacity-50`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-gray-300"
                }`}
              >
                {isSelected && <Check size={10} className="text-white" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800">
                  {preset.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {preset.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      </div>
  );
}