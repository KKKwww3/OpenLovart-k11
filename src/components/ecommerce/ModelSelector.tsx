"use client";

import React, { useState } from "react";
import { ChevronDown, Cpu } from "lucide-react";

export interface ModelOption {
  value: string;
  label: string;
  desc: string;
}

export const DEFAULT_MODEL_OPTIONS: ModelOption[] = [
  { value: "google/gemini-3.1-flash-image-preview", label: "Base", desc: "base model" },
  { value: "openai/gpt-5.4-image-2", label: "Pro", desc: "pro model" },
];

export interface ModelSelectorProps {
  options?: ModelOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export function ModelSelector({
  options = DEFAULT_MODEL_OPTIONS,
  value,
  onChange,
  label = "AI 模型",
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((m) => m.value === value);

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-gray-400" />
            <span className="text-gray-700 font-medium">
              {selected?.label ?? "选择模型"}
            </span>
            <span className="text-xs text-gray-400">
              {selected?.desc ?? ""}
            </span>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
            {options.map((model) => (
              <div
                key={model.value}
                onClick={() => {
                  onChange(model.value);
                  setOpen(false);
                }}
                className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  value === model.value ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      value === model.value
                        ? "text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {model.label}
                  </span>
                  <span className="text-xs text-gray-400">{model.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
