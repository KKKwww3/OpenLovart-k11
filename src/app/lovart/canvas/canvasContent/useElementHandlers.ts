import { v4 as uuidv4 } from "uuid";
import { CanvasElement } from "@/components/lovart/CanvasArea";
import { findNonOverlappingSpot } from "./utils";

interface UseElementHandlersParams {
  elementsRef: React.MutableRefObject<CanvasElement[]>;
  pan: { x: number; y: number };
  setElements: (elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setActiveTool: (tool: string) => void;
}

export function useElementHandlers(params: UseElementHandlersParams) {
  const { elementsRef, pan, setElements, setSelectedIds, setActiveTool } = params;

  const handleAddImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const currentElements = elementsRef.current;
      const newElement: CanvasElement = {
        id: uuidv4(),
        type: "image",
        x: 100 - pan.x + currentElements.length * 20,
        y: 100 - pan.y + currentElements.length * 20,
        width: 300,
        height: 200,
        content: e.target?.result as string,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedIds([newElement.id]);
      setActiveTool("select");
    };
    reader.readAsDataURL(file);
  };

  const handleAddVideo = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const currentElements = elementsRef.current;
      const newElement: CanvasElement = {
        id: uuidv4(),
        type: "video",
        x: 100 - pan.x + currentElements.length * 20,
        y: 100 - pan.y + currentElements.length * 20,
        width: 400,
        height: 300,
        content: e.target?.result as string,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedIds([newElement.id]);
      setActiveTool("select");
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    const currentElements = elementsRef.current;
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "text",
      x: 200 - pan.x + currentElements.length * 20,
      y: 200 - pan.y + currentElements.length * 20,
      content: "Double click to edit",
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool("select");
  };

  const handleAddShape = (
    type: "square" | "circle" | "triangle" | "star" | "message" | "arrow-left" | "arrow-right",
  ) => {
    const currentElements = elementsRef.current;
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "shape",
      shapeType: type,
      x: 300 - pan.x + currentElements.length * 20,
      y: 300 - pan.y + currentElements.length * 20,
      width: 150,
      height: 150,
      color: "#9CA3AF",
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool("select");
  };

  const handleElementChange = (id: string, newAttrs: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...newAttrs } : el)),
    );
  };

  const handleDelete = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const handleOpenImageGenerator = () => {
    const currentElements = elementsRef.current;
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "image-generator",
      x: 300 - pan.x + currentElements.length * 20,
      y: 300 - pan.y + currentElements.length * 20,
      width: 400,
      height: 400,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool("select");
  };

  const handleOpenVideoGenerator = () => {
    const currentElements = elementsRef.current;
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "video-generator",
      x: 300 - pan.x + currentElements.length * 20,
      y: 300 - pan.y + currentElements.length * 20,
      width: 400,
      height: 300,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool("select");
  };

  const handleAddImageToCanvas = (
    imageUrl: string,
    offsetX: number = 0,
    offsetY: number = 0,
  ) => {
    const currentElements = elementsRef.current;
    const itemW = 400;
    const itemH = 400;
    const baseX = 300 - pan.x;
    const baseY = 300 - pan.y;
    const { x, y } = findNonOverlappingSpot(
      currentElements,
      itemW,
      itemH,
      baseX,
      baseY,
    );
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "image",
      x: x + offsetX,
      y: y + offsetY,
      width: itemW,
      height: itemH,
      content: imageUrl,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([newElement.id]);
  };

  const handleAddVideoToCanvasFromPanel = (
    videoUrl: string,
    offsetX: number = 0,
    offsetY: number = 0,
  ) => {
    const currentElements = elementsRef.current;
    const itemW = 420;
    const itemH = 300;
    const baseX = 300 - pan.x;
    const baseY = 300 - pan.y;
    const { x, y } = findNonOverlappingSpot(
      currentElements,
      itemW,
      itemH,
      baseX,
      baseY,
    );
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "video",
      x: x + offsetX,
      y: y + offsetY,
      width: itemW,
      height: itemH,
      content: videoUrl,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([newElement.id]);
  };

  return {
    handleAddImage,
    handleAddVideo,
    handleAddText,
    handleAddShape,
    handleElementChange,
    handleDelete,
    handleOpenImageGenerator,
    handleOpenVideoGenerator,
    handleAddImageToCanvas,
    handleAddVideoToCanvasFromPanel,
  };
}