"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PromptPanelView } from "./promptPanel";

export interface PromptTemplate {
  id: string;
  module_key: string;
  name: string;
  content: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProductReplacePromptProps {
  supabase: SupabaseClient | null;
  moduleKey?: string;
  onPromptChange?: (prompt: string) => void;
}

export function ProductReplacePrompt({
  supabase,
  moduleKey = "product-replace",
  onPromptChange,
}: ProductReplacePromptProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState("");

  const activePrompt = prompts.find((p) => p.id === activeId) || null;
  const currentContent = activePrompt?.content ?? "";

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("prompt_templates")
      .select("id, module_key, name, content, is_active, sort_order")
      .eq("module_key", moduleKey)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error("Failed to fetch prompt templates:", error);
          return;
        }
        if (data && data.length > 0) {
          setPrompts(data as PromptTemplate[]);
          const firstId = data[0].id;
          setActiveId(firstId);
          onPromptChange?.(data[0].content);
        }
      });
  }, [supabase, moduleKey, onPromptChange]);

  const handleSelectPrompt = useCallback(
    (id: string) => {
      setActiveId(id);
      const prompt = prompts.find((p) => p.id === id);
      if (prompt) {
        onPromptChange?.(prompt.content);
      }
      setIsEditing(false);
    },
    [prompts, onPromptChange],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!supabase || !activeId) return;

    const { error } = await supabase
      .from("prompt_templates")
      .update({ content: editableContent })
      .eq("id", activeId);

    if (error) {
      console.error("Failed to save prompt template:", error);
      return;
    }

    setPrompts((prev) =>
      prev.map((p) =>
        p.id === activeId ? { ...p, content: editableContent } : p,
      ),
    );
    onPromptChange?.(editableContent);
    setIsEditing(false);
  }, [supabase, activeId, editableContent, onPromptChange]);

  const handleStartEdit = useCallback(() => {
    setEditableContent(currentContent);
    setIsEditing(true);
  }, [currentContent]);

  const handleCancelEdit = useCallback(() => {
    setEditableContent(currentContent);
    setIsEditing(false);
  }, [currentContent]);

  return (
    <PromptPanelView
      prompts={prompts}
      activeId={activeId}
      currentContent={currentContent}
      isExpanded={isExpanded}
      isEditing={isEditing}
      editableContent={editableContent}
      loading={loading}
      moduleKey={moduleKey}
      onToggleExpand={() => setIsExpanded((v) => !v)}
      onSelectPrompt={handleSelectPrompt}
      onStartEdit={handleStartEdit}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onEditableContentChange={setEditableContent}
    />
  );
}