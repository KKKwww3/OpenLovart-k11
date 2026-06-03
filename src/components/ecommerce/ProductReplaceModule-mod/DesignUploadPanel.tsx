"use client";

import React from "react";
import { Image as ImageIcon, Sparkles, Palette } from "lucide-react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface DesignUploadPanelProps {
  sceneFiles: UploadedFile[];
  productFiles: UploadedFile[];
  designFiles: UploadedFile[];
  processedSceneUrl: string | null;
  onSceneChange: (files: UploadedFile[]) => void;
  onProductChange: (files: UploadedFile[]) => void;
  onDesignChange: (files: UploadedFile[]) => void;
  onMaterialRefChange?: (designId: string, file: File | null) => void;
  onPreviewImage: (url: string) => void;
  mode?: "apply" | "material";
}

function StepBadge({ number }: { number: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-semibold shrink-0">
      {number}
    </span>
  );
}

export function DesignUploadPanel({
  sceneFiles,
  productFiles,
  designFiles,
  processedSceneUrl,
  onSceneChange,
  onProductChange,
  onDesignChange,
  onMaterialRefChange,
  onPreviewImage,
  mode = "apply",
}: DesignUploadPanelProps) {
  const isMaterialMode = mode === "material";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-gray-400" />
        <label className="text-sm font-medium text-gray-700">图片上传</label>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100 overflow-hidden">
        {/* Step 1: Scene */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <StepBadge number={1} />
            <p className="text-sm font-medium text-gray-700">
              场景图
              <span className="text-xs font-normal text-gray-400 ml-1.5">（含产品的场景）</span>
            </p>
          </div>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={sceneFiles}
            onChange={onSceneChange}
            placeholder="上传带产品的场景图"
          />
          {processedSceneUrl && (
            <div className="mt-2.5">
              <p className="text-xs text-gray-400 mb-1">预处理后的场景图：</p>
              <div
                className="w-full h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onPreviewImage(processedSceneUrl)}
              >
                <img
                  src={processedSceneUrl}
                  alt="预处理场景图"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Product White Background */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <StepBadge number={2} />
            <p className="text-sm font-medium text-gray-700">
              产品白底图
              <span className="text-xs font-normal text-gray-400 ml-1.5">（含材质和锁边）</span>
            </p>
          </div>
          <UploadZone
            multiple={false}
            maxFiles={1}
            value={productFiles}
            onChange={onProductChange}
            placeholder="上传产品白底图（提供准确材质和锁边信息）"
          />
        </div>

        {/* Step 3: Design */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <StepBadge number={3} />
            <p className="text-sm font-medium text-gray-700">
              设计图
              <span className="text-xs font-normal text-gray-400 ml-1.5">（要贴到产品上的图案）</span>
            </p>
          </div>
          <UploadZone
            multiple
            maxFiles={10}
            value={designFiles}
            onChange={onDesignChange}
            placeholder="上传设计图案（可批量，每个设计单独生成）"
          />
        </div>

        {/* Step 4: Material Reference (only in material mode) */}
        {isMaterialMode && designFiles.length > 0 && (
          <div className="p-3 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={14} className="text-amber-500" />
              <p className="text-sm font-medium text-gray-700">材质参考图</p>
              <span className="text-xs text-gray-400">（每张设计图对应一张材质）</span>
            </div>
            <div className="space-y-2">
              {designFiles.map((df) => (
                <DesignMaterialCard
                  key={df.id}
                  designFile={df}
                  onMaterialRefChange={onMaterialRefChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {sceneFiles.length > 0 && productFiles.length > 0 && designFiles.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <ImageIcon size={14} className="text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-600">
            将生成{" "}
            <span className="font-semibold">{sceneFiles.length * designFiles.length}</span>{" "}
            张结果（{sceneFiles.length} 场景 × {designFiles.length} 设计）
          </p>
        </div>
      )}

      {sceneFiles.length === 0 && productFiles.length === 0 && designFiles.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <ImageIcon size={14} className="text-gray-300 shrink-0" />
          <p className="text-xs text-gray-400">
            依次上传场景图、产品白底图、设计图，系统将设计图案应用到产品上并放入场景中
          </p>
        </div>
      )}

      {isMaterialMode && sceneFiles.length > 0 && designFiles.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
          <Palette size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-600">
            请为每张设计图上传对应的材质参考图，以确保材质效果准确还原
          </p>
        </div>
      )}
    </div>
  );
}

function DesignMaterialCard({
  designFile,
  onMaterialRefChange,
}: {
  designFile: UploadedFile;
  onMaterialRefChange?: (designId: string, file: File | null) => void;
}) {
  const [materialFile, setMaterialFile] = React.useState<File | null>(null);

  const handleMaterialChange = (files: UploadedFile[]) => {
    const file = files[0]?.file || null;
    setMaterialFile(file);
    onMaterialRefChange?.(designFile.id, file);
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-2.5">
      <p className="text-xs font-medium text-gray-600 mb-1.5 truncate">
        {designFile.file?.name || "设计图"}
      </p>
      <UploadZone
        multiple={false}
        maxFiles={1}
        value={materialFile ? [{ id: designFile.id, file: materialFile }] : []}
        onChange={handleMaterialChange}
        placeholder="上传该设计对应的材质参考图"
      />
    </div>
  );
}
