"use client";

import React, { useEffect } from "react";
import {
  Plus,
  Minus,
  ChevronDown,
  Sparkles,
  Cloud,
  CloudOff,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FloatingToolbar } from "@/components/lovart/FloatingToolbar";
import { CanvasArea } from "@/components/lovart/CanvasArea";
import { ImageGeneratorPanel } from "@/components/lovart/ImageGeneratorPanel";
import { VideoGeneratorPanel } from "@/components/lovart/VideoGeneratorPanel";
import { AiDesignerPanel } from "@/components/lovart/AiDesignerPanel";
import { ECommercePanel } from "@/components/ecommerce/ECommercePanel";
import { useSupabase } from "@/hooks/useSupabase";

import { useCanvasState } from "./useCanvasState";
import { useProjectSave } from "./useProjectSave";
import { useElementHandlers } from "./useElementHandlers";
import { useGenerateHandlers } from "./useGenerateHandlers";
import { useCanvasOperations } from "./useCanvasOperations";
import { useKeyboardEvents } from "./useKeyboardEvents";

function CanvasContent() {
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  const state = useCanvasState();
  const {
    scale, setScale,
    pan, setPan,
    elements, setElements,
    selectedIds, setSelectedIds,
    activeTool, setActiveTool,
    title, setTitle,
    isGenerating, setIsGenerating,
    isDraggingElement, setIsDraggingElement,
    currentProjectId, setCurrentProjectId,
    saveStatus, setSaveStatus,
    isLoading, setIsLoading,
    showChat, setShowChat,
    showECommercePanel, setShowECommercePanel,
    initialPrompt, setInitialPrompt,
    saveTimeoutRef, isInitializedRef, elementsRef,
    canvasContainerRef, isSavingRef, needsSaveRef, hasLoadedRef,
  } = state;

  const { loadProject } = useProjectSave({
    supabase,
    elements,
    title,
    currentProjectId,
    isLoading,
    isInitializedRef,
    saveTimeoutRef,
    isSavingRef,
    needsSaveRef,
    setCurrentProjectId,
    setSaveStatus,
    setIsLoading,
    setTitle,
    setElements,
  });

  const elementOps = useElementHandlers({
    elementsRef, pan, setElements, setSelectedIds, setActiveTool,
  });

  const generateOps = useGenerateHandlers({
    elementsRef, selectedIds, pan, supabase,
    setElements, setSelectedIds, setActiveTool, setIsGenerating,
  });

  const canvasOps = useCanvasOperations({
    elements, setScale, setPan, canvasContainerRef,
  });

  useKeyboardEvents({
    selectedIds, setElements, setSelectedIds, setPan, canvasContainerRef,
  });

  useEffect(() => {
    if (projectId && supabase && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadProject(projectId);
    } else if (!projectId) {
      setIsLoading(false);
      isInitializedRef.current = true;
    }

    const prompt = searchParams.get("prompt");
    if (prompt) {
      setInitialPrompt(prompt);
      setShowChat(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, supabase, loadProject, searchParams]);

  useEffect(() => {
    if (!isLoading && !isInitializedRef.current && hasLoadedRef.current) {
      isInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">加载画布中...</p>
          <p className="text-gray-400 text-sm mt-2">正在从云端获取数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-white relative overflow-hidden">
      <header className="absolute top-0 left-0 w-full h-14 flex items-center justify-between px-4 z-50 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/lovart"
            className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
              L
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-gray-50 rounded px-2 py-1 transition-colors w-40"
            placeholder="Untitled"
            disabled={isLoading}
          />
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === "saving" && (
              <>
                <Cloud size={14} className="animate-pulse" />
                <span>保存中...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Cloud size={14} className="text-green-500" />
                <span className="text-green-600">已保存</span>
              </>
            )}
            {saveStatus === "offline" && (
              <>
                <CloudOff size={14} className="text-red-500" />
                <span className="text-red-600">离线</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowECommercePanel(!showECommercePanel)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showECommercePanel ? "bg-blue-100" : "hover:bg-gray-100"}`}
            title="电商图片工具"
          >
            <ImageIcon size={18} className={showECommercePanel ? "text-blue-600" : "text-black"} />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showChat ? "bg-gray-100" : "hover:bg-gray-100"}`}
            title="AI设计师"
          >
            <Sparkles size={18} className="text-black" />
          </button>
        </div>
      </header>

      {showChat && (
        <div className="absolute right-4 top-20 bottom-4 w-[400px] z-40 animate-in slide-in-from-right-4 duration-300">
          <AiDesignerPanel
            onGenerate={generateOps.handleAiChat}
            isGenerating={isGenerating}
            onClose={() => setShowChat(false)}
            initialPrompt={initialPrompt}
          />
        </div>
      )}

      {showECommercePanel && (
        <div className="absolute right-4 top-20 bottom-4 w-[420px] z-40 animate-in slide-in-from-right-4 duration-300">
          <ECommercePanel
            onAddToCanvas={elementOps.handleAddImageToCanvas}
            onAddVideoToCanvas={elementOps.handleAddVideoToCanvasFromPanel}
            onClose={() => setShowECommercePanel(false)}
            supabase={supabase || undefined}
          />
        </div>
      )}

      <div className="absolute inset-0" ref={canvasContainerRef}>
        <CanvasArea
          scale={scale}
          pan={pan}
          onPanChange={setPan}
          elements={elements}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onElementChange={elementOps.handleElementChange}
          onDelete={elementOps.handleDelete}
          onAddElement={(element) => setElements((prev) => [...prev, element])}
          activeTool={activeTool}
          onDragStart={() => setIsDraggingElement(true)}
          onDragEnd={() => setIsDraggingElement(false)}
          onConnectFlow={generateOps.handleConnectFlow}
        />
        <FloatingToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onAddImage={elementOps.handleAddImage}
          onAddVideo={elementOps.handleAddVideo}
          onAddText={elementOps.handleAddText}
          onAddShape={elementOps.handleAddShape}
          onOpenImageGenerator={elementOps.handleOpenImageGenerator}
          onOpenVideoGenerator={elementOps.handleOpenVideoGenerator}
        />

        {selectedIds.length === 1 && !isDraggingElement && (() => {
          const selectedEl = elements.find((el) => el.id === selectedIds[0]);
          if (selectedEl?.type === "image-generator") {
            const left = selectedEl.x * scale + pan.x;
            const top = (selectedEl.y + (selectedEl.height || 400)) * scale + pan.y + 20;
            return (
              <ImageGeneratorPanel
                elementId={selectedIds[0]}
                onGenerate={generateOps.handleGenerateImage}
                isGenerating={isGenerating}
                canvasElements={elements}
                style={{ left: `${left}px`, top: `${top}px` }}
              />
            );
          }
          return null;
        })()}

        {selectedIds.length === 1 && !isDraggingElement && (() => {
          const selectedEl = elements.find((el) => el.id === selectedIds[0]);
          if (selectedEl?.type === "video-generator") {
            const left = selectedEl.x * scale + pan.x;
            const top = (selectedEl.y + (selectedEl.height || 300)) * scale + pan.y + 20;
            return (
              <VideoGeneratorPanel
                elementId={selectedIds[0]}
                onGenerate={generateOps.handleGenerateVideo}
                isGenerating={isGenerating}
                canvasElements={elements}
                style={{ left: `${left}px`, top: `${top}px` }}
              />
            );
          }
          return null;
        })()}

        <div className="absolute bottom-4 left-4 flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-1 z-50 gap-0.5">
          <button
            onClick={canvasOps.handleZoomOut}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
            title="缩小"
          >
            <Minus size={16} />
          </button>
          <span className="px-2 text-xs font-medium text-gray-600 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={canvasOps.handleZoomIn}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
            title="放大"
          >
            <Plus size={16} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-0.5" />
          <button
            onClick={canvasOps.handleZoomToFit}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
            title="适应屏幕"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={canvasOps.handleResetView}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
            title="重置视图"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CanvasContent;