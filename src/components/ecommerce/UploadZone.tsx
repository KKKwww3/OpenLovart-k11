"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, X, Plus, Trash2 } from "lucide-react";

export interface UploadedFile {
  id: string;
  file?: File;
  preview?: string;
  base64?: string;
}

export interface UploadZoneProps {
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onBase64Ready?: (files: { id: string; base64: string }[]) => void;
  placeholder?: string;
  className?: string;
}

export function UploadZone({
  multiple = false,
  maxFiles = 10,
  accept = "image/*",
  value = [],
  onChange,
  onBase64Ready,
  placeholder = "点击或拖拽上传图片",
  className = "",
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = useCallback(
    async (files: UploadedFile[]) => {
      const results: { id: string; base64: string }[] = [];

      for (const item of files) {
        if (item.file) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.includes(",")
                ? result.split(",")[1]
                : result;
              resolve(base64Data);
            };
            reader.onerror = reject;
            if (item.file) {
              reader.readAsDataURL(item.file);
            }
          });
          results.push({ id: item.id, base64 });
        } else if (item.base64) {
          results.push({ id: item.id, base64: item.base64 });
        }
      }

      if (onBase64Ready && results.length > 0) {
        onBase64Ready(results);
      }
    },
    [onBase64Ready],
  );

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList);
      const remainingSlots = maxFiles - value.length;
      const filesToAdd = files.slice(0, remainingSlots);

      const newFiles: UploadedFile[] = await Promise.all(
        filesToAdd.map(async (file) => {
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            preview,
          };
        }),
      );

      const updatedFiles = [...value, ...newFiles];
      onChange(updatedFiles);
      convertToBase64(newFiles);
    },
    [value, maxFiles, onChange, convertToBase64],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      onChange(value.filter((f) => f.id !== id));
    },
    [value, onChange],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-6 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">{placeholder}</p>
          {multiple && (
            <p className="text-xs text-gray-400">
              最多上传 {maxFiles} 张图片
            </p>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
            >
              {item.preview ? (
                <img
                  src={item.preview}
                  alt="预览"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSrc(item.preview ?? null);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={24} className="text-gray-300" />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.id);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                title="删除"
              >
                <Trash2 size={12} className="text-white" />
              </button>
            </div>
          ))}

          {multiple && value.length < maxFiles && (
            <button
              onClick={handleClick}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"
            >
              <Plus size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      )}
      {previewSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewSrc(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setPreviewSrc(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={previewSrc}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
