"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

export type PromptUpdateFields = Partial<
  Pick<PromptTemplate, "name" | "content" | "is_active" | "sort_order">
>;

export type PromptCreateFields = Pick<PromptTemplate, "name" | "content"> & {
  sort_order?: number;
};

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
  const [showManagement, setShowManagement] = useState(false);

  const activePrompt = prompts.find((p) => p.id === activeId) || null;
  const currentContent = activePrompt?.content ?? "";

  const onPromptChangeRef = useRef(onPromptChange);
  onPromptChangeRef.current = onPromptChange;

  const prevActiveIdRef = useRef(activeId);
  useEffect(() => {
    if (activeId !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activeId;
      const prompt = prompts.find((p) => p.id === activeId);
      if (prompt) {
        onPromptChangeRef.current?.(prompt.content);
      }
    }
  }, [activeId, prompts]);

  const fetchPrompts = useCallback(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("prompt_templates")
      .select("id, module_key, name, content, is_active, sort_order")
      .eq("module_key", moduleKey)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error("Failed to fetch prompt templates:", error);
          return;
        }
        if (data && data.length > 0) {
          const typed = data as PromptTemplate[];
          setPrompts(typed);
          setActiveId((prev) => {
            if (prev && typed.some((p) => p.id === prev)) return prev;
            const firstActive = typed.find((p) => p.is_active) || typed[0];
            return firstActive.id;
          });
        } else {
          setPrompts([]);
          setActiveId(null);
        }
      });
  }, [supabase, moduleKey]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleSelectPrompt = useCallback((id: string) => {
    setActiveId(id);
    setIsEditing(false);
  }, []);

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
    onPromptChangeRef.current?.(editableContent);
    setIsEditing(false);
  }, [supabase, activeId, editableContent]);

  const handleStartEdit = useCallback(() => {
    setEditableContent(currentContent);
    setIsEditing(true);
  }, [currentContent]);

  const handleCancelEdit = useCallback(() => {
    setEditableContent(currentContent);
    setIsEditing(false);
  }, [currentContent]);

  const handleCreate = useCallback(
    async (fields: PromptCreateFields) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("prompt_templates")
        .insert({
          module_key: moduleKey,
          name: fields.name,
          content: fields.content,
          sort_order: fields.sort_order ?? prompts.length + 1,
          is_active: true,
        })
        .select()
        .single();
      if (error) {
        console.error("Failed to create prompt:", error);
        return;
      }
      if (data) {
        setPrompts((prev) => [...prev, data as PromptTemplate]);
      }
    },
    [supabase, moduleKey, prompts.length],
  );

  const handleUpdate = useCallback(
    async (id: string, fields: PromptUpdateFields) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("prompt_templates")
        .update(fields)
        .eq("id", id);
      if (error) {
        console.error("Failed to update prompt:", error);
        return;
      }
      if (id === activeId && fields.content) {
        onPromptChangeRef.current?.(fields.content);
      }
      setPrompts((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, ...fields } : p,
        );
        if (id === activeId && fields.is_active === false) {
          const another = updated.find((p) => p.is_active && p.id !== id);
          if (another) {
            setActiveId(another.id);
          }
        }
        return updated;
      });
    },
    [supabase, activeId],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("prompt_templates")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Failed to delete prompt:", error);
        return;
      }
      setPrompts((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        if (id === activeId) {
          const next = filtered.find((p) => p.is_active) || filtered[0] || null;
          if (next) {
            setActiveId(next.id);
          } else {
            setActiveId(null);
          }
        }
        return filtered;
      });
    },
    [supabase, activeId],
  );

  const handleToggleActive = useCallback(
    async (id: string, current: boolean) => {
      await handleUpdate(id, { is_active: !current });
    },
    [handleUpdate],
  );

  return (
    <PromptPanelView
      prompts={prompts}
      activeId={activeId}
      currentContent={currentContent}
      isExpanded={isExpanded}
      isEditing={isEditing}
      editableContent={editableContent}
      loading={loading}
      showManagement={showManagement}
      moduleKey={moduleKey}
      onToggleExpand={() => setIsExpanded((v) => !v)}
      onSelectPrompt={handleSelectPrompt}
      onStartEdit={handleStartEdit}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onEditableContentChange={setEditableContent}
      onToggleManagement={() => setShowManagement((v) => !v)}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
    />
  );
}
