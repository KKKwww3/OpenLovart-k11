import { useEffect, useRef } from "react";
import { CanvasElement } from "@/components/lovart/CanvasArea";

interface UseKeyboardEventsParams {
  selectedIds: string[];
  setElements: (elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  canvasContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useKeyboardEvents(params: UseKeyboardEventsParams) {
  const { selectedIds, setElements, setSelectedIds, setPan, canvasContainerRef } = params;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0
      ) {
        setElements((prev) =>
          prev.filter((el) => !selectedIds.includes(el.id)),
        );
        setSelectedIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, setElements, setSelectedIds]);

  const spaceRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        spaceRef.current = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceRef.current = false;
      }
    };

    const container = canvasContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!spaceRef.current) return;
      e.preventDefault();
      panStartRef.current = { x: e.clientX, y: e.clientY };

      const handleMouseMove = (moveE: MouseEvent) => {
        const dx = moveE.clientX - panStartRef.current.x;
        const dy = moveE.clientY - panStartRef.current.y;
        setPan((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        panStartRef.current = { x: moveE.clientX, y: moveE.clientY };
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvasContainerRef, setPan]);
}