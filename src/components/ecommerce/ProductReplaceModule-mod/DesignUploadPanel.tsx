"use client";

import { Image as ImageIcon, Sparkles } from "lucide-react";
import { UploadZone, type UploadedFile } from "../UploadZone";

interface DesignUploadPanelProps {
  sceneFiles: UploadedFile[];
  productFiles: UploadedFile[];
  designFiles: UploadedFile[];
  processedSceneUrl: string | null;
  onSceneChange: (files: UploadedFile[]) => void;
  onProductChange: (files: UploadedFile[]) => void;
  onDesignChange: (files: UploadedFile[]) => void;
  onPreviewImage: (url: string) => void;
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
  onPreviewImage,
}: DesignUploadPanelProps) {
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
      </div>

      {/* Status indicator */}
      {sceneFiles.length > 0 && productFiles.length > 0 && designFiles.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <ImageIcon size={14} className="text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-600">
            将生成{" "}
            <span className="font-semibold">{sceneFiles.length * designFiles.length}</span>{" "}
            张结果（先将设计图贴到产品白底图，再替换场景中的产品）
          </p>
        </div>
      )}

      {sceneFiles.length === 0 && productFiles.length === 0 && designFiles.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <ImageIcon size={14} className="text-gray-300 shrink-0" />
          <p className="text-xs text-gray-400">
            依次上传场景图、产品白底图、设计图，系统会先将设计图贴到产品白底图生成成品，再替换场景中的产品
          </p>
        </div>
      )}
    </div>
  );
}
