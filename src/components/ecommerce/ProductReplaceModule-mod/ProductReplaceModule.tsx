"use client";

import React from "react";
import { Zap, X } from "lucide-react";
import { ProductReplacePrompt } from "./ProductReplacePrompt";
import { ModelSelector } from "../ModelSelector";
import { ImageConfigPanel } from "./ImageConfigPanel";
import { StyleConfigPanel } from "./StyleConfigPanel";
import { SceneUploadPanel } from "./SceneUploadPanel";
import { ProductUploadPanel } from "./ProductUploadPanel";
import { ProductReferencePanel } from "./ProductReferencePanel";
import { DesignUploadPanel } from "./DesignUploadPanel";
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

  const isApplyMode = ctx.workflowMode === "apply";

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

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-700">工作流模式</p>
          <p className="text-xs text-gray-400">
            {isApplyMode ? "场景图 + 设计图直接应用" : "产品替换（原流程）"}
          </p>
        </div>
        <button
          onClick={ctx.toggleWorkflowMode}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isApplyMode ? "bg-blue-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isApplyMode ? "left-6" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {!isApplyMode && (
        <StyleConfigPanel
          similarity={ctx.similarity}
          keepItems={ctx.keepItems}
          changeItems={ctx.changeItems}
          onSimilarityChange={ctx.setSimilarity}
          onKeepItemsChange={ctx.setKeepItems}
          onChangeItemsChange={ctx.setChangeItems}
        />
      )}

      {isApplyMode ? (
        <DesignUploadPanel
          sceneFiles={ctx.sceneFiles}
          designFiles={ctx.designFiles}
          processedSceneUrl={ctx.processedSceneUrl}
          onSceneChange={ctx.handleSceneChange}
          onDesignChange={ctx.handleDesignChange}
          onPreviewImage={ctx.setPreviewImage}
        />
      ) : (
        <>
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

          <ProductReferencePanel
            materialFiles={ctx.materialFiles}
            edgeFiles={ctx.edgeFiles}
            productFiles={ctx.productFiles}
            processedMaterialUrl={ctx.processedMaterialUrl}
            onMaterialChange={ctx.handleMaterialChange}
            onEdgeChange={ctx.handleEdgeChange}
            materialPreviewResult={ctx.materialPreviewResult}
            isMaterialPreviewing={ctx.isMaterialPreviewing}
            materialPreviewError={ctx.materialPreviewError}
            onMaterialPreview={ctx.handleMaterialPreview}
            onMaterialPreviewConfirm={ctx.handleMaterialPreviewConfirm}
            onMaterialPreviewRetry={ctx.handleMaterialPreviewRetry}
          />
        </>
      )}

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
        disabled={
          (isApplyMode
            ? ctx.sceneFiles.length === 0 || ctx.designFiles.length === 0
            : ctx.productFiles.length === 0 || !ctx.hasSceneFile) ||
          ctx.isGenerating
        }
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          (isApplyMode
            ? ctx.sceneFiles.length > 0 && ctx.designFiles.length > 0
            : ctx.productFiles.length > 0 && ctx.hasSceneFile) && !ctx.isGenerating
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={ctx.isGenerating ? "animate-pulse" : ""} />
        <span>
          {ctx.isGenerating
            ? "生成中..."
            : isApplyMode
            ? `批量应用 (${ctx.totalCount}张)`
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
