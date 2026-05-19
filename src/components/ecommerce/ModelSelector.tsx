"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ModelOption {
  id: number;
  label: string;
  description: string;
}

export interface ModelSelectorProps {
  supabase: SupabaseClient | null;
  category?: string;
  value: number | undefined;
  onChange: (id: number) => void;
  label?: string;
  disabled?: boolean;
}

export function ModelSelector({
  supabase,
  category = "image-generation",
  value,
  onChange,
  label = "AI 模型",
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const autoSelectedRef = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("ai_models")
      .select("id, label, description")
      .eq("category", category)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setModels(data);
          if (value === undefined && !autoSelectedRef.current) {
            autoSelectedRef.current = true;
            onChange(data[0].id);
          }
        }
        setLoading(false);
      });
  }, [supabase, category]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = () => setOpen(false);
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open]);

  const selected = models.find((m) => m.id === value);

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && !loading && setOpen(!open)}
          disabled={disabled || loading}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-colors ${
            disabled || loading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-gray-400" />
            {loading ? (
              <span className="text-gray-400">加载中...</span>
            ) : (
              <>
                <span className="text-gray-700 font-medium">
                  {selected?.label ?? "选择模型"}
                </span>
                <span className="text-xs text-gray-400">
                  {selected?.description ?? ""}
                </span>
              </>
            )}
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && models.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 max-h-60 overflow-y-auto">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  value === model.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      value === model.id ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {model.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {model.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
