"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadZone, type UploadedFile } from "../UploadZone";
import type { StepStatus } from "./types";

interface SceneUploadPanelProps {
  mode: "single" | "multiple";
  sceneFiles: UploadedFile[];
  sceneItems: Array<{
    file: UploadedFile;
    processedUrl: string | null;
    styleStatus: StepStatus;
  }>;
  processedSceneUrl: string | null;
  onModeChange: (mode: "single" | "multiple") => void;
  onSceneFilesChange: (files: UploadedFile[]) => void;
  onSceneItemsChange: (items: Array<{ file: UploadedFile; processedUrl: string | null; styleStatus: StepStatus }>) => void;
  onPreviewImage: (url: string) => void;
}

export function SceneUploadPanel({
  mode,
  sceneFiles,
  sceneItems,
  processedSceneUrl,
  onModeChange,
  onSceneFilesChange,
  onSceneItemsChange,
  onPreviewImage,
}: SceneUploadPanelProps) {
  const handleSingleSceneChange = (files: UploadedFile[]) => {
    onSceneFilesChange(files);
    onSceneItemsChange(files.map((f) => ({
      file: f,
      processedUrl: null,
      styleStatus: "idle" as StepStatus,
    })));
  };

  const handleMultiSceneChange = (files: UploadedFile[]) => {
    const newItems = files.map((f) => {
      const existing = sceneItems.find((s) => s.file.id === f.id);
      return {
        file: f,
        processedUrl: existing?.processedUrl ?? null,
        styleStatus: (existing?.styleStatus ?? "idle") as StepStatus,
      };
    });
    onSceneItemsChange(newItems);
  };

  const activeSceneCount = mode === "single" ? sceneFiles.length : sceneItems.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">场景图片</label>
        <Tabs
          value={mode}
          onValueChange={(v) => onModeChange(v as "single" | "multiple")}
          className="w-auto"
        >
          <TabsList className="h-8">
            <TabsTrigger value="single" className="text-xs px-3 py-1">
              单场景
            </TabsTrigger>
            <TabsTrigger value="multiple" className="text-xs px-3 py-1">
              多场景
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === "single" ? (
        <div>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={sceneFiles}
            onChange={handleSingleSceneChange}
            placeholder="上传场景背景图（1张）"
          />
          {processedSceneUrl && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">风格预处理后的场景图：</p>
              <img
                src={processedSceneUrl}
                alt="Processed scene"
                className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onPreviewImage(processedSceneUrl)}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <UploadZone
            multiple
            maxFiles={10}
            value={sceneItems.map((s) => s.file)}
            onChange={handleMultiSceneChange}
            placeholder="上传多张场景背景图"
          />
          {sceneItems.length > 0 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {sceneItems.map((item) => (
                <div key={item.file.id} className="relative">
                  <img
                    src={item.file.preview}
                    alt="场景"
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                  {item.processedUrl && (
                    <button
                      onClick={() => onPreviewImage(item.processedUrl!)}
                      className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs text-white">预览</span>
                    </button>
                  )}
                  {item.styleStatus === "done" && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSceneCount > 0 && mode === "multiple" && (
        <p className="text-xs text-gray-400">
          已上传 {sceneItems.length} 张场景图
          {sceneItems.filter((s) => s.processedUrl).length > 0 &&
            `，${sceneItems.filter((s) => s.processedUrl).length} 张已预处理`}
        </p>
      )}
    </div>
  );
}