import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { CanvasElement } from "@/components/lovart/CanvasArea";
import { generateDesign, generateImage } from "@/lib/api";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";
import { useSupabase } from "@/hooks/useSupabase";

interface UseGenerateHandlersParams {
  elementsRef: React.MutableRefObject<CanvasElement[]>;
  selectedIds: string[];
  pan: { x: number; y: number };
  supabase: ReturnType<typeof useSupabase>;
  setElements: (elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setActiveTool: (tool: string) => void;
  setIsGenerating: (generating: boolean) => void;
  onProgress?: (text: string) => void;
}

export function useGenerateHandlers(params: UseGenerateHandlersParams) {
  const {
    elementsRef,
    selectedIds,
    pan,
    supabase,
    setElements,
    setSelectedIds,
    setActiveTool,
    setIsGenerating,
    onProgress,
  } = params;

  const handleGenerateVideo = useCallback(async (videoUrl: string) => {
    const currentElements = elementsRef.current;
    const generatorElementId = selectedIds.find(
      (id) => currentElements.find((el) => el.id === id)?.type === "video-generator",
    );

    if (generatorElementId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === generatorElementId) {
            return { ...el, type: "video", content: videoUrl };
          }
          return el;
        }),
      );
    } else {
      const newElement: CanvasElement = {
        id: uuidv4(),
        type: "video",
        x: 300 - pan.x,
        y: 300 - pan.y,
        width: 400,
        height: 300,
        content: videoUrl,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedIds([newElement.id]);
    }
  }, [elementsRef, selectedIds, pan, setElements, setSelectedIds]);

  const handleConnectFlow = useCallback((sourceElement: CanvasElement) => {
    if (!sourceElement.content) return;

    const spacing = 120;
    const groupId = uuidv4();
    const connectorId = uuidv4();
    const generatorId = uuidv4();

    const generatorElement: CanvasElement = {
      id: generatorId,
      type: "image-generator",
      x: sourceElement.x + (sourceElement.width || 400) + spacing,
      y: sourceElement.y,
      width: sourceElement.width || 400,
      height: sourceElement.height || 400,
      referenceImageId: sourceElement.id,
      groupId: groupId,
      linkedElements: [sourceElement.id, connectorId],
    };

    const connectorElement: CanvasElement = {
      id: connectorId,
      type: "connector",
      x: 0,
      y: 0,
      connectorFrom: sourceElement.id,
      connectorTo: generatorId,
      connectorStyle: "dashed",
      color: "#6B7280",
      strokeWidth: 2,
      groupId: groupId,
    };

    setElements((prev) => {
      const updatedPrev = prev.map((el) => {
        if (el.id === sourceElement.id) {
          return {
            ...el,
            groupId: groupId,
            linkedElements: [connectorId, generatorId],
          };
        }
        return el;
      });
      return [...updatedPrev, connectorElement, generatorElement];
    });

    setSelectedIds([generatorId]);
    setActiveTool("select");
  }, [setElements, setSelectedIds, setActiveTool]);

  const handleGenerateFromImage = useCallback((sourceImage: CanvasElement) => {
    handleConnectFlow(sourceImage);
  }, [handleConnectFlow]);

  const handleGenerateImage = useCallback(async (
    prompt: string,
    resolution: "1K" | "2K" | "4K",
    aspectRatio: "1:1" | "4:3" | "16:9",
    referenceImage?: string,
    model?: string,
  ) => {
    setIsGenerating(true);
    try {
      let referenceImageUrl = referenceImage;
      if (referenceImage && referenceImage.startsWith("data:")) {
        const result = await uploadImageToImgbbBrowser(referenceImage);
        if (!result) {
          throw new Error("参考图片上传失败，请检查网络后重试");
        }
        referenceImageUrl = result.url;
      }

      const data = await generateImage({
        prompt,
        referenceImage: referenceImageUrl,
        model,
      }, supabase || undefined, {
        onProgress: (text) => {
          if (text && onProgress) {
            onProgress(text);
          }
        },
      });

      const currentElements = elementsRef.current;
      const generatorElementId = selectedIds.find(
        (id) => currentElements.find((el) => el.id === id)?.type === "image-generator",
      );

      if (data.imageUrl) {
        if (generatorElementId) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.id === generatorElementId) {
                return {
                  ...el,
                  type: "image",
                  content: data.imageUrl,
                };
              }
              return el;
            }),
          );
        } else {
          const newElement: CanvasElement = {
            id: uuidv4(),
            type: "image",
            x: 300 - pan.x,
            y: 300 - pan.y,
            width: 400,
            height: 400,
            content: data.imageUrl,
          };
          setElements((prev) => [...prev, newElement]);
          setSelectedIds([newElement.id]);
        }
      } else if (data.textResponse) {
        const newElement: CanvasElement = {
          id: uuidv4(),
          type: "text",
          x: 300 - pan.x,
          y: 300 - pan.y,
          content: data.textResponse,
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedIds([newElement.id]);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("生成失败: " + (error instanceof Error ? error.message : "未知错误"));
    } finally {
      setIsGenerating(false);
    }
  }, [elementsRef, selectedIds, pan, supabase, setElements, setSelectedIds, setIsGenerating, onProgress]);

  const handleAiChat = useCallback(async (prompt: string): Promise<string> => {
    setIsGenerating(true);
    try {
      const suggestion = await generateDesign(prompt, supabase || undefined);
      return suggestion || "未收到回复";
    } catch (error) {
      console.error("Chat generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [setIsGenerating, supabase]);

  return {
    handleGenerateVideo,
    handleConnectFlow,
    handleGenerateFromImage,
    handleGenerateImage,
    handleAiChat,
  };
}