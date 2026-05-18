import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { CanvasElement } from "@/components/lovart/CanvasArea";
import { findNonOverlappingSpot } from "./utils";

interface UseKeyboardEventsParams {
  elements: CanvasElement[];
  selectedIds: string[];
  setElements: (elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  onZoomToFit?: () => void;
}

export function useKeyboardEvents(params: UseKeyboardEventsParams) {
  const { elements, selectedIds, setElements, setSelectedIds, setPan, onZoomToFit } = params;

  const clipboardRef = useRef<CanvasElement[]>([]);
  const spaceRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" && !e.repeat) {
        spaceRef.current = true;
        e.preventDefault();
        document.body.style.cursor = "grab";
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        setElements((prev) =>
          prev.filter((el) => !selectedIds.includes(el.id)),
        );
        setSelectedIds([]);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        const copied = elements.filter((el) => selectedIds.includes(el.id));
        clipboardRef.current = copied;
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        if (clipboardRef.current.length === 0) return;

        const currentElements = elements;
        const newElements: CanvasElement[] = [];
        for (const el of clipboardRef.current) {
          const itemW = el.width || 200;
          const itemH = el.height || 200;
          const baseX = el.x;
          const baseY = el.y;
          const { x, y } = findNonOverlappingSpot(
            [...currentElements, ...newElements],
            itemW,
            itemH,
            baseX + 30,
            baseY + 30,
          );
          newElements.push({
            ...el,
            id: uuidv4(),
            x,
            y,
          } as CanvasElement);
        }
        setElements((prev) => [...prev, ...newElements]);
        setSelectedIds(newElements.map((el) => el.id));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(elements.map((el) => el.id));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        onZoomToFit?.();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceRef.current = false;
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.body.style.cursor = "";
    };
  }, [selectedIds, setElements, setSelectedIds, elements, onZoomToFit]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!spaceRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = "grabbing";
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
        document.body.style.cursor = "grab";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousedown", handleMouseDown, { capture: true });

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
    };
  }, [setPan]);
}