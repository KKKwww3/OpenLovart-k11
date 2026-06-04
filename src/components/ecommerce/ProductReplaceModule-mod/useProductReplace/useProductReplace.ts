"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import type { UploadedFile } from "../../UploadZone";
import type { ResultItem } from "../../ResultPreview";
import type { StepStatus, ModeType, WorkflowMode } from "../types";
import { useFileHandlers } from "./useFileHandlers";
import { usePreview } from "./usePreview";
import { useCanvasActions } from "./useCanvasActions";
import { useGenerateHandler } from "./useGenerateHandler";

export interface UseProductReplaceOptions {
  supabase?: SupabaseClient;
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
}

export function useProductReplace({ supabase, onAddToCanvas }: UseProductReplaceOptions) {
  const [sceneFiles, setSceneFiles] = useState<UploadedFile[]>([]);
  const [productFiles, setProductFiles] = useState<UploadedFile[]>([]);
  const productFileMapRef = useRef<Map<string, File>>(new Map());
  const [materialFiles, setMaterialFiles] = useState<UploadedFile[]>([]);
  const materialFileMapRef = useRef<Map<string, File>>(new Map());
  const [edgeFiles, setEdgeFiles] = useState<UploadedFile[]>([]);
  const edgeFileMapRef = useRef<Map<string, File>>(new Map());
  const [designFiles, setDesignFiles] = useState<UploadedFile[]>([]);
  const designFileMapRef = useRef<Map<string, File>>(new Map());
  const materialRefFileMapRef = useRef<Map<string, File>>(new Map());
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<number | undefined>(undefined);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [similarity, setSimilarity] = useState(50);
  const [keepItems, setKeepItems] = useState("");
  const [changeItems, setChangeItems] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);

  const [styleStepStatus, setStyleStepStatus] = useState<StepStatus>("idle");
  const [styleStepMessage, setStyleStepMessage] = useState("");
  const [processedSceneUrl, setProcessedSceneUrl] = useState<string | null>(null);
  const [processedMaterialUrl, setProcessedMaterialUrl] = useState<string | null>(null);
  const [styleStepError, setStyleStepError] = useState<string | null>(null);
  const [originalSceneUrl, setOriginalSceneUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [mode, setMode] = useState<ModeType>("single");
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("replace");
  const [sceneItems, setSceneItems] = useState<Array<{
    file: UploadedFile;
    processedUrl: string | null;
    originalUrl: string | null;
    styleStatus: StepStatus;
    styleMessage: string;
    styleError: string | null;
  }>>([]);

  const {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    clearTasks,
    retryTask,
  } = useBatchGeneration(supabase);

  const fileHandlers = useFileHandlers({
    setSceneFiles,
    setProcessedSceneUrl,
    setOriginalSceneUrl,
    setStyleStepStatus,
    setStyleStepError,
    productFileMapRef,
    setProductFiles,
    materialFileMapRef,
    setMaterialFiles,
    edgeFileMapRef,
    setEdgeFiles,
    setMode,
    setSceneItems,
    setResults,
    clearTasks,
    designFileMapRef,
    setDesignFiles,
    setWorkflowMode,
    materialRefFileMapRef,
  });

  const preview = usePreview({
    productFileMapRef,
    materialFileMapRef,
    edgeFileMapRef,
    selectedModel,
    aspectRatio,
    imageSize,
    supabase,
  });

  const canvasActions = useCanvasActions({ onAddToCanvas, results });

  const generateHandler = useGenerateHandler({
    workflowMode,
    mode,
    productFiles,
    designFiles,
    sceneFiles,
    sceneItems,
    materialFiles,
    currentPrompt,
    selectedModel,
    aspectRatio,
    imageSize,
    similarity,
    keepItems,
    changeItems,
    supabase,
    productFileMapRef,
    designFileMapRef,
    materialRefFileMapRef,
    processedSceneUrl,
    originalSceneUrl,
    tasks,
    setResults,
    setProcessedSceneUrl,
    setProcessedMaterialUrl,
    setOriginalSceneUrl,
    setStyleStepStatus,
    setStyleStepMessage,
    setStyleStepError,
    startBatch,
    clearTasks,
    retryTask,
    preview,
  });

  const syncedTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const completedTasks = tasks.filter(t => t.status === "completed" && t.result);
    if (completedTasks.length === 0) return;

    const newCompletions = completedTasks.filter(t => !syncedTaskIdsRef.current.has(t.id));
    if (newCompletions.length === 0) return;

    newCompletions.forEach(t => syncedTaskIdsRef.current.add(t.id));

    const rafId = requestAnimationFrame(() => {
      setResults(prev => {
        const updated = [...prev];
        let changed = false;
        for (const task of newCompletions) {
          const idx = updated.findIndex(r => r.id === task.id);
          if (idx >= 0) {
            if (updated[idx].imageUrl !== task.result) {
              updated[idx] = { id: task.id, imageUrl: task.result! };
              changed = true;
            }
          } else {
            updated.push({ id: task.id, imageUrl: task.result! });
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [tasks]);

  const hasSceneFile = workflowMode === "apply" || workflowMode === "material"
    ? sceneFiles.length > 0 && sceneFiles[0]?.file != null
    : mode === "single"
      ? sceneFiles.length > 0 && sceneFiles[0]?.file != null
      : sceneItems.length > 0;

  const hasProductFile = workflowMode === "apply" || workflowMode === "material"
    ? productFiles.length > 0 && productFiles[0]?.file != null
    : productFiles.length > 0;

  const hasDesignFile = designFiles.length > 0;

  const generatingRef = useRef(false);
  const isGenerating = generatingRef.current || styleStepStatus === "processing" || isProcessing;
  const hasFailedTasks = tasks.some((t) => t.status === "failed");

  const totalCount = workflowMode === "apply" || workflowMode === "material"
    ? sceneFiles.length * designFiles.length
    : mode === "single"
      ? productFiles.length
      : sceneItems.length * productFiles.length;

  return {
    sceneFiles,
    productFiles,
    materialFiles,
    edgeFiles,
    designFiles,
    currentPrompt,
    selectedModel,
    aspectRatio,
    imageSize,
    similarity,
    keepItems,
    changeItems,
    results,
    styleStepStatus,
    styleStepMessage,
    styleStepError,
    processedSceneUrl,
    processedMaterialUrl,
    previewImage,
    mode,
    workflowMode,
    sceneItems,
    tasks,
    isProcessing,
    overallProgress,
    hasSceneFile,
    hasProductFile,
    hasDesignFile,
    isGenerating,
    hasFailedTasks,
    totalCount,

    setCurrentPrompt,
    setSelectedModel,
    setAspectRatio,
    setImageSize,
    setSimilarity,
    setKeepItems,
    setChangeItems,
    setPreviewImage,
    setProcessedSceneUrl,
    setStyleStepStatus,
    setStyleStepMessage,
    setStyleStepError,

    ...fileHandlers,
    ...preview,
    ...canvasActions,

    handleGenerate: useCallback(async () => {
      if (generatingRef.current) return;
      generatingRef.current = true;
      try {
        await generateHandler.handleGenerate();
      } finally {
        generatingRef.current = false;
      }
    }, [generateHandler]),
    handleRetryStylePreprocess: generateHandler.handleRetryStylePreprocess,
    handleRetryProductReplace: generateHandler.handleRetryProductReplace,
    clearTasks,

    toggleWorkflowMode: useCallback(() => {
      const modeOrder: WorkflowMode[] = ["replace", "apply", "material"];
      const currentIndex = modeOrder.indexOf(workflowMode);
      const nextIndex = (currentIndex + 1) % modeOrder.length;
      const newMode = modeOrder[nextIndex];
      setWorkflowMode(newMode);
      setSceneFiles([]);
      setProductFiles([]);
      setDesignFiles([]);
      setSceneItems([]);
      setProcessedSceneUrl(null);
      setOriginalSceneUrl(null);
      setStyleStepStatus("idle");
      setStyleStepError(null);
      setResults([]);
      clearTasks();
    }, [workflowMode, clearTasks]),

    switchWorkflowMode: useCallback((newMode: WorkflowMode) => {
      if (newMode === workflowMode) return;
      setWorkflowMode(newMode);
      setSceneFiles([]);
      setProductFiles([]);
      setDesignFiles([]);
      setSceneItems([]);
      setProcessedSceneUrl(null);
      setOriginalSceneUrl(null);
      setStyleStepStatus("idle");
      setStyleStepError(null);
      setResults([]);
      clearTasks();
    }, [workflowMode, clearTasks]),
  };
}
