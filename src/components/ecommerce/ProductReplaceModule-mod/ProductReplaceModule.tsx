"use client";

import React from "react";
import { Zap, X } from "lucide-react";
import { ProductReplacePrompt } from "./ProductReplacePrompt";
import { ModelSelector } from "../ModelSelector";
import { ImageConfigPanel } from "./ImageConfigPanel";
import { StyleConfigPanel } from "./StyleConfigPanel";
import { SceneUploadPanel } from "./SceneUploadPanel";
import { ProductUploadPanel } from "./ProductUploadPanel";
import { GenerationProgress } from "./GenerationProgress";
import { ResultPreview } from "../ResultPreview";
import { useProductReplace } from "./useProductReplace";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProductReplaceModuleProps {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

export function ProductReplaceModule({
  onAddToCanvas,
  supabase,
}: ProductReplaceModuleProps) {
  const ctx = useProductReplace({ supabase, onAddToCanvas });

  return (
    <div className="space-y-4">
      <ProductReplacePrompt
        supabase={supabase || null}
        onPromptChange={ctx.setCurrentPrompt}
      />

      <ModelSelector
        supabase={supabase || null}
        value={ctx.selectedModel}
        onChange={ctx.setSelectedModel}
      />

      <ImageConfigPanel
        aspectRatio={ctx.aspectRatio}
        imageSize={ctx.imageSize}
        onAspectRatioChange={ctx.setAspectRatio}
        onImageSizeChange={ctx.setImageSize}
      />

      <StyleConfigPanel
        similarity={ctx.similarity}
        keepItems={ctx.keepItems}
        changeItems={ctx.changeItems}
        onSimilarityChange={ctx.setSimilarity}
        onKeepItemsChange={ctx.setKeepItems}
        onChangeItemsChange={ctx.setChangeItems}
      />

      <SceneUploadPanel
        mode={ctx.mode}
        sceneFiles={ctx.sceneFiles}
        sceneItems={ctx.sceneItems}
        processedSceneUrl={ctx.processedSceneUrl}
        onModeChange={ctx.handleModeChange}
        onSceneFilesChange={ctx.handleSceneChange}
        onSceneItemsChange={ctx.handleSceneItemsChange}
        onPreviewImage={ctx.setPreviewImage}
      />

      <ProductUploadPanel
        productFiles={ctx.productFiles}
        onChange={ctx.handleProductChange}
      />

      <GenerationProgress
        styleStepStatus={ctx.styleStepStatus}
        styleStepMessage={ctx.styleStepMessage}
        styleStepError={ctx.styleStepError}
        isProcessing={ctx.isProcessing}
        tasks={ctx.tasks}
        overallProgress={ctx.overallProgress}
        hasFailedTasks={ctx.hasFailedTasks}
        onRetryStylePreprocess={ctx.handleRetryStylePreprocess}
        onRetryProductReplace={ctx.handleRetryProductReplace}
        onCancelBatch={ctx.clearTasks}
      />

      {ctx.results.length > 0 && (
        <ResultPreview
          results={ctx.results}
          onAddToCanvas={ctx.handleAddToCanvas}
          onAddAllToCanvas={ctx.handleAddAllToCanvas}
        />
      )}

      <button
        onClick={ctx.handleGenerate}
        disabled={ctx.productFiles.length === 0 || !ctx.hasSceneFile || ctx.isGenerating}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          ctx.productFiles.length > 0 && ctx.hasSceneFile && !ctx.isGenerating
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={ctx.isGenerating ? "animate-pulse" : ""} />
        <span>
          {ctx.isGenerating
            ? "生成中..."
            : `批量替换 (${ctx.totalCount}张)`}
        </span>
      </button>

      {ctx.previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => ctx.setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => ctx.setPreviewImage(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={ctx.previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}