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
  const isMaterialMode = ctx.workflowMode === "material";

  const workflowTabs = [
    { key: "replace", label: "产品替换", desc: "原流程" },
    { key: "apply", label: "设计应用", desc: "设计图→产品白底→场景替换" },
    { key: "material", label: "材质参考", desc: "设计图→产品白底→场景替换" },
  ] as const;

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

      {/* 工作流模式 Tab 切换 */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex bg-gray-50">
          {workflowTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => ctx.switchWorkflowMode(tab.key)}
              className={`flex-1 py-2.5 px-3 text-center transition-colors ${
                ctx.workflowMode === tab.key
                  ? "bg-white border-t-2 border-gray-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <p className="text-sm font-medium">{tab.label}</p>
              <p className="text-[10px] text-gray-400">{tab.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {ctx.workflowMode === "replace" && (
        <StyleConfigPanel
          similarity={ctx.similarity}
          keepItems={ctx.keepItems}
          changeItems={ctx.changeItems}
          onSimilarityChange={ctx.setSimilarity}
          onKeepItemsChange={ctx.setKeepItems}
          onChangeItemsChange={ctx.setChangeItems}
        />
      )}

      {isApplyMode || isMaterialMode ? (
        <DesignUploadPanel
          sceneFiles={ctx.sceneFiles}
          productFiles={ctx.productFiles}
          designFiles={ctx.designFiles}
          processedSceneUrl={ctx.processedSceneUrl}
          onSceneChange={ctx.handleSceneChange}
          onProductChange={ctx.handleProductChange}
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
        onPreviewImage={ctx.setPreviewImage}
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
          (ctx.workflowMode === "replace"
            ? ctx.productFiles.length === 0 || !ctx.hasSceneFile
            : !ctx.hasSceneFile || !ctx.hasProductFile || !ctx.hasDesignFile) ||
          ctx.isGenerating
        }
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          (ctx.workflowMode === "replace"
            ? ctx.productFiles.length > 0 && ctx.hasSceneFile
            : ctx.hasSceneFile && ctx.hasProductFile && ctx.hasDesignFile) && !ctx.isGenerating
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <Zap size={18} className={ctx.isGenerating ? "animate-pulse" : ""} />
        <span>
          {ctx.isGenerating
            ? "生成中..."
            : ctx.workflowMode === "replace"
            ? `批量替换 (${ctx.totalCount}张)`
            : `两阶段生成 (${ctx.totalCount}张)`}
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
