"use client";

import React, { useState, useCallback } from "react";
import { ChevronDown, Video, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadZone, UploadedFile } from "./UploadZone";
import { ResultItem } from "./ResultPreview";
import { generateVideo, getVideoStatus } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

export interface MainVideoModuleProps {
  onAddToCanvas: (videoUrl: string, x?: number, y?: number) => void;
  supabase?: SupabaseClient;
}

export function MainVideoModule({
  onAddToCanvas,
  supabase,
}: MainVideoModuleProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesBase64, setFilesBase64] = useState<Map<string, string>>(
    new Map(),
  );
  const [duration, setDuration] = useState("15秒");
  const [style, setStyle] = useState("产品旋转展示");
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);

  const durationOptions = [
    { label: "15秒", value: "15秒" },
    { label: "30秒", value: "30秒" },
    { label: "60秒", value: "60秒" },
  ];

  const styleOptions = [
    { label: "产品旋转展示", value: "产品旋转展示" },
    { label: "细节特写切换", value: "细节特写切换" },
    { label: "使用场景展示", value: "使用场景展示" },
    { label: "功能演示", value: "功能演示" },
  ];

  const handleBase64Ready = useCallback(
    (newFiles: { id: string; base64: string }[]) => {
      setFilesBase64((prev) => {
        const next = new Map(prev);
        newFiles.forEach((f) => next.set(f.id, f.base64));
        return next;
      });
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (files.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = filesBase64.get(file.id);
        if (!base64) continue;

        const seconds = parseInt(duration.replace("秒", ""));
        const prompt = `电商主图视频，${duration}时长，${style}，产品主体清晰，专业商业摄影风格，流畅运镜，适合电商平台主图视频展示，高清画质，产品细节展示完整`;

        const { taskId } = await generateVideo(
          {
            prompt,
            seconds,
            referenceImage: base64,
          },
          supabase,
        );

        setProgress(((i + 0.1) / files.length) * 100);

        let completed = false;
        let videoUrl: string | undefined;

        while (!completed) {
          await new Promise((r) => setTimeout(r, 3000));
          const status = await getVideoStatus(taskId, supabase);

          if (status.status === "completed" && status.videoUrl) {
            completed = true;
            videoUrl = status.videoUrl;
          } else if (status.status === "failed") {
            throw new Error("视频生成失败");
          }

          setProgress(((i + status.progress / 100) / files.length) * 100);
        }

        if (videoUrl) {
          setResults((prev) => [
            ...prev,
            { id: uuidv4(), imageUrl: videoUrl! },
          ]);
        }
      }
    } catch (error) {
      console.error("Video generation failed:", error);
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }, [files, filesBase64, duration, style, isGenerating, supabase]);

  const handleAddToCanvas = useCallback(
    (result: ResultItem) => {
      onAddToCanvas(result.imageUrl);
    },
    [onAddToCanvas],
  );

  const handleAddAllToCanvas = useCallback(() => {
    results.forEach((result, index) => {
      const offsetX = (index % 2) * 420;
      const offsetY = Math.floor(index / 2) * 320;
      onAddToCanvas(result.imageUrl, offsetX, offsetY);
    });
  }, [results, onAddToCanvas]);

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 rounded-lg p-3 flex items-start gap-2">
        <Video size={16} className="text-indigo-500 mt-0.5" />
        <p className="text-xs text-indigo-700">
          生成产品展示短视频，适合电商主图视频展示
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">产品图片</label>
        <UploadZone
          multiple
          maxFiles={5}
          value={files}
          onChange={setFiles}
          onBase64Ready={handleBase64Ready}
          placeholder="上传产品图片（最多5张）"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">视频时长</label>
          <div className="relative">
            <button
              onClick={() => setShowDurationMenu(!showDurationMenu)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700">{duration}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showDurationMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                {durationOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setDuration(opt.value);
                      setShowDurationMenu(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      duration === opt.value
                        ? "text-blue-500 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">展示风格</label>
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700">{style}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showStyleMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                {styleOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setStyle(opt.value);
                      setShowStyleMenu(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      style === opt.value
                        ? "text-blue-500 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">生成视频中...</span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              生成结果 ({results.length})
            </h4>
            <button
              onClick={handleAddAllToCanvas}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
            >
              全部添加到画布
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="group relative rounded-xl overflow-hidden bg-gray-100 border border-gray-100"
              >
                <video
                  src={result.imageUrl}
                  className="w-full aspect-video object-cover"
                  controls
                  muted
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={() => handleAddToCanvas(result)}
                    className="px-2 py-1 bg-white/90 rounded text-xs hover:bg-white transition-colors"
                  >
                    添加到画布
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={files.length === 0 || isGenerating}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          files.length > 0 && !isGenerating
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isGenerating ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Video size={18} />
        )}
        <span>
          {isGenerating ? "生成中..." : `生成视频 (${files.length}个)`}
        </span>
      </button>
    </div>
  );
}
