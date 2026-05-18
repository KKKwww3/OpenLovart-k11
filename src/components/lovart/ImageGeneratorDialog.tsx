"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  Zap,
} from "lucide-react";
import { generateImage } from "@/lib/api";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";

interface ImageGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageData: string) => void;
}

type Resolution = "1K" | "2K" | "4K";
type AspectRatio = "1:1" | "4:3" | "16:9";
type ModelAlias =
  | "google/gemini-3.1-flash-image-preview"
  | "openai/gpt-5.4-image-2";

export function ImageGeneratorDialog({
  isOpen,
  onClose,
  onImageGenerated,
}: ImageGeneratorDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>("");

  // New state for parameters
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [model, setModel] = useState<ModelAlias>(
    "google/gemini-3.1-flash-image-preview",
  );

  // Dropdown states
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showResolutionMenu, setShowResolutionMenu] = useState(false);
  const [showAspectRatioMenu, setShowAspectRatioMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolutions: Resolution[] = ["1K", "2K", "4K"];
  const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9"];

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("请输入提示词");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPreviewImage(null);
    setProgressText("");

    try {
      let referenceImageUrl: string | undefined = undefined;
      if (referenceImage) {
        const referenceDataBase64 = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(referenceImage);
          },
        );

        const result = await uploadImageToImgbbBrowser(referenceDataBase64);
        if (!result) {
          throw new Error("参考图片上传失败，请检查网络后重试");
        }
        referenceImageUrl = result.url;
      }

      const data = await generateImage(
        {
          prompt,
          referenceImage: referenceImageUrl,
          model,
        },
        undefined,
        {
          onProgress: (text) => {
            if (text) {
              setProgressText((prev) => prev + text);
            }
          },
        },
      );

      setPreviewImage(data.imageUrl);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "生成图像时出错");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCanvas = () => {
    if (previewImage) {
      onImageGenerated(previewImage);
      setPrompt("");
      setPreviewImage(null);
      setReferenceImage(null);
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceImage(e.target.files[0]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[600px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Input Area */}
        <div className="p-6 pb-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="今天我们要创作什么..."
            className="w-full h-32 text-lg text-gray-600 placeholder-gray-300 resize-none outline-none bg-transparent"
            disabled={isGenerating}
          />
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50">
          <div className="flex items-center gap-4">
            {/* Model Selector */}
            <div className="relative">
              <div
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
              >
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm">
                    {model === "google/gemini-3.1-flash-image-preview"
                      ? "Gemini 3.1 Flash"
                      : "GPT 5.4 Image 2"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {model === "google/gemini-3.1-flash-image-preview"
                      ? "Google"
                      : "OpenAI"}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-400 ml-1" />
              </div>
              {showModelMenu && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-[170px]">
                  <div
                    onClick={() => {
                      setModel("google/gemini-3.1-flash-image-preview");
                      setShowModelMenu(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${model === "google/gemini-3.1-flash-image-preview" ? "text-blue-500" : "text-gray-700"}`}
                  >
                    <span className="text-sm font-medium">
                      Gemini 3.1 Flash
                    </span>
                    <span className="text-xs text-gray-400 ml-2">Google</span>
                  </div>
                  <div
                    onClick={() => {
                      setModel("openai/gpt-5.4-image-2");
                      setShowModelMenu(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${model === "openai/gpt-5.4-image-2" ? "text-blue-500" : "text-gray-700"}`}
                  >
                    <span className="text-sm font-medium">GPT 5.4 Image 2</span>
                    <span className="text-xs text-gray-400 ml-2">OpenAI</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Image Upload */}
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${referenceImage ? "text-blue-500 bg-blue-50" : "text-gray-500"}`}
                title="Upload Reference Image"
              >
                <ImageIcon size={20} />
              </button>
            </div>

            {/* Resolution Selector */}
            <div className="relative">
              <div
                onClick={() => setShowResolutionMenu(!showResolutionMenu)}
                className="flex items-center gap-1 text-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
              >
                <span>{resolution}</span>
                <ChevronDown size={14} />
              </div>
              {showResolutionMenu && (
                <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-[80px]">
                  {resolutions.map((res) => (
                    <div
                      key={res}
                      onClick={() => {
                        setResolution(res);
                        setShowResolutionMenu(false);
                      }}
                      className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${
                        resolution === res
                          ? "text-blue-500 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {res}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aspect Ratio Selector */}
            <div className="relative">
              <div
                onClick={() => setShowAspectRatioMenu(!showAspectRatioMenu)}
                className="flex items-center gap-1 text-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
              >
                <span>{aspectRatio}</span>
                <ChevronDown size={14} />
              </div>
              {showAspectRatioMenu && (
                <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-[80px]">
                  {aspectRatios.map((ratio) => (
                    <div
                      key={ratio}
                      onClick={() => {
                        setAspectRatio(ratio);
                        setShowAspectRatioMenu(false);
                      }}
                      className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${
                        aspectRatio === ratio
                          ? "text-blue-500 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {ratio}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-center gap-3">
            {!previewImage ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Zap size={18} className="fill-gray-600" />
                    <span>40</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  重试
                </button>
                <button
                  onClick={handleAddToCanvas}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  添加到画布
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reference Image Preview */}
        {referenceImage && !previewImage && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <ImageIcon size={16} className="text-blue-500" />
              <span className="text-sm text-blue-700 flex-1">
                {referenceImage.name}
              </span>
              <button
                onClick={() => setReferenceImage(null)}
                className="text-blue-500 hover:text-blue-700 p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-700">正在生成...</p>
                {progressText && (
                  <p className="text-xs text-blue-500 truncate mt-0.5">
                    {progressText.slice(-100)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Area */}
        {previewImage && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={previewImage}
                alt="Generated"
                className="w-full h-auto max-h-[400px] object-contain bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
