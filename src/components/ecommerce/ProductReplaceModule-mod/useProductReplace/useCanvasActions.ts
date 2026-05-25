import { useCallback } from "react";
import type { ResultItem } from "../../ResultPreview";

export interface UseCanvasActionsParams {
  onAddToCanvas: (imageUrl: string, x?: number, y?: number) => void;
  results: ResultItem[];
}

export interface UseCanvasActionsReturn {
  handleAddToCanvas: (result: ResultItem) => void;
  handleAddAllToCanvas: () => void;
}

export function useCanvasActions({
  onAddToCanvas,
  results,
}: UseCanvasActionsParams): UseCanvasActionsReturn {
  const handleAddToCanvas = useCallback(
    (result: ResultItem) => {
      onAddToCanvas(result.imageUrl);
    },
    [onAddToCanvas],
  );

  const handleAddAllToCanvas = useCallback(() => {
    results.forEach((result, index) => {
      const offsetX = (index % 3) * 320;
      const offsetY = Math.floor(index / 3) * 320;
      onAddToCanvas(result.imageUrl, offsetX, offsetY);
    });
  }, [results, onAddToCanvas]);

  return { handleAddToCanvas, handleAddAllToCanvas };
}
