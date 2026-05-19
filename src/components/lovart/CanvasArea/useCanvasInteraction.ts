import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { CanvasElement } from "./types";

interface UseCanvasInteractionProps {
  scale: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onElementChange: (id: string, newAttrs: Partial<CanvasElement>) => void;
  onAddElement: (element: CanvasElement) => void;
  activeTool: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useCanvasInteraction({
  scale,
  pan,
  onPanChange,
  elements,
  selectedIds,
  onSelect,
  onElementChange,
  onAddElement,
  activeTool,
  onDragStart,
  onDragEnd,
}: UseCanvasInteractionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<{
    points: { x: number; y: number }[];
  } | null>(null);

  const dragStartRef = useRef<{
    x: number;
    y: number;
    elementX: number;
    elementY: number;
    width: number;
    height: number;
    panX: number;
    panY: number;
    aspectRatio?: number;
    initialPositions?: { id: string; x: number; y: number }[];
  } | null>(null);
  const draggedElementIdRef = useRef<string | null>(null);
  const resizeHandleRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    elementId: string | null,
    elementX: number = 0,
    elementY: number = 0,
    width: number = 0,
    height: number = 0,
  ) => {
    if (activeTool === "hand") {
      setIsPanning(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        elementX: 0,
        elementY: 0,
        width: 0,
        height: 0,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    if (activeTool === "draw") {
      setIsDrawing(true);
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;
      setCurrentPath({ points: [{ x: canvasX, y: canvasY }] });
      return;
    }

    if (!elementId) {
      if (!e.shiftKey) {
        onSelect([]);
      }
      setIsSelecting(true);
      setSelectionBox({
        startX: (e.clientX - pan.x) / scale,
        startY: (e.clientY - pan.y) / scale,
        currentX: (e.clientX - pan.x) / scale,
        currentY: (e.clientY - pan.y) / scale,
      });
      setEditingTextId(null);
      return;
    }

    e.stopPropagation();

    let dragSelectedIds = selectedIds;

    if (e.shiftKey) {
      if (selectedIds.includes(elementId)) {
        dragSelectedIds = selectedIds.filter((id) => id !== elementId);
        onSelect(dragSelectedIds);
      } else {
        dragSelectedIds = [...selectedIds, elementId];
        onSelect(dragSelectedIds);
      }
    } else {
      if (!selectedIds.includes(elementId)) {
        dragSelectedIds = [elementId];
        onSelect(dragSelectedIds);
      }
    }

    if ((e.target as HTMLElement).dataset.handle) return;

    setIsDragging(true);
    onDragStart?.();
    draggedElementIdRef.current = elementId;

    const initialPositions = elements
      .filter((el) => dragSelectedIds.includes(el.id))
      .map((el) => ({
        id: el.id,
        x: el.x,
        y: el.y,
      }));

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX,
      elementY,
      width: width || 0,
      height: height || 0,
      panX: 0,
      panY: 0,
      aspectRatio: width && height ? width / height : undefined,
      initialPositions,
    };
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    elementId: string,
    handle: string,
    element: CanvasElement,
  ) => {
    e.stopPropagation();
    setIsResizing(true);
    draggedElementIdRef.current = elementId;
    resizeHandleRef.current = handle;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
      width: element.width || 0,
      height: element.height || 0,
      panX: 0,
      panY: 0,
      aspectRatio: (element.width || 1) / (element.height || 1),
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasX = (e.clientX - pan.x) / scale;
    const canvasY = (e.clientY - pan.y) / scale;

    if (isDrawing && currentPath) {
      setCurrentPath((prev) =>
        prev
          ? {
              points: [...prev.points, { x: canvasX, y: canvasY }],
            }
          : null,
      );
      return;
    }

    if (isSelecting && selectionBox) {
      setSelectionBox((prev) =>
        prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null,
      );
      return;
    }

    if (!dragStartRef.current) return;

    if (isPanning) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      onPanChange({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
      return;
    }

    if (!draggedElementIdRef.current) return;

    const dx = (e.clientX - dragStartRef.current.x) / scale;
    const dy = (e.clientY - dragStartRef.current.y) / scale;

    if (isDragging && dragStartRef.current.initialPositions) {
      dragStartRef.current.initialPositions.forEach((pos) => {
        onElementChange(pos.id, {
          x: pos.x + dx,
          y: pos.y + dy,
        });
      });
    } else if (isResizing && resizeHandleRef.current) {
      const { elementX, elementY, width, height, aspectRatio } =
        dragStartRef.current;
      const element = elements.find(
        (el) => el.id === draggedElementIdRef.current,
      );
      const isImage = element?.type === "image";

      let newX = elementX;
      let newY = elementY;
      let newWidth = width;
      let newHeight = height;

      if (resizeHandleRef.current.includes("e")) newWidth = width + dx;
      if (resizeHandleRef.current.includes("s")) newHeight = height + dy;
      if (resizeHandleRef.current.includes("w")) {
        newWidth = width - dx;
        newX = elementX + dx;
      }
      if (resizeHandleRef.current.includes("n")) {
        newHeight = height - dy;
        newY = elementY + dy;
      }

      if (isImage && aspectRatio) {
        if (
          resizeHandleRef.current.includes("e") ||
          resizeHandleRef.current.includes("w")
        ) {
          newHeight = newWidth / aspectRatio;
          if (resizeHandleRef.current.includes("n")) {
            newY = elementY + (height - newHeight);
          }
        } else if (
          resizeHandleRef.current.includes("n") ||
          resizeHandleRef.current.includes("s")
        ) {
          newWidth = newHeight * aspectRatio;
          if (resizeHandleRef.current.includes("w")) {
            newX = elementX + (width - newWidth);
          }
          if (resizeHandleRef.current === "n") {
            newY = elementY + (height - newHeight);
          }
        }
      }

      onElementChange(draggedElementIdRef.current, {
        x: newX,
        y: newY,
        width: Math.max(10, newWidth),
        height: Math.max(10, newHeight),
      });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
      const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
      const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
      const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

      const newSelectedIds = elements
        .filter((el) => {
          const elRight = el.x + (el.width || 0);
          const elBottom = el.y + (el.height || 0);
          return el.x < x2 && elRight > x1 && el.y < y2 && elBottom > y1;
        })
        .map((el) => el.id);

      onSelect(newSelectedIds);
    }

    if (isDrawing && currentPath) {
      const points = currentPath.points;
      if (points.length > 1) {
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const width = maxX - minX;
        const height = maxY - minY;

        const newPoints = points.map((p) => ({
          x: p.x - minX,
          y: p.y - minY,
        }));

        const newElement: CanvasElement = {
          id: uuidv4(),
          type: "path",
          x: minX,
          y: minY,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          points: newPoints,
          color: "#000000",
          strokeWidth: 3,
        };
        onAddElement(newElement);
        onSelect([newElement.id]);
      }
      setCurrentPath(null);
    }

    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setIsDrawing(false);
    setIsSelecting(false);
    setSelectionBox(null);
    dragStartRef.current = null;
    draggedElementIdRef.current = null;
    resizeHandleRef.current = null;
    onDragEnd?.();
  };

  const handleMouseUpRef = useRef(handleMouseUp);

  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  });

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing || isPanning || isDrawing || isSelecting) {
        handleMouseUpRef.current();
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [
    isDragging,
    isResizing,
    isPanning,
    isDrawing,
    isSelecting,
    selectionBox,
    currentPath,
  ]);

  return {
    isDragging,
    isResizing,
    isPanning,
    isDrawing,
    isSelecting,
    selectionBox,
    editingTextId,
    setEditingTextId,
    currentPath,
    containerRef,
    handleMouseDown,
    handleResizeStart,
    handleMouseMove,
    handleMouseUp,
  };
}