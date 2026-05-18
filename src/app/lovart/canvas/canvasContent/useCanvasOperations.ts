import { useCallback } from "react";

interface UseCanvasOperationsParams {
  elements: { x: number; y: number; width?: number; height?: number }[];
  setScale: (scale: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  canvasContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useCanvasOperations(params: UseCanvasOperationsParams) {
  const { setScale, setPan, canvasContainerRef, elements } = params;

  const zoomAtPoint = (scaleChange: number, minScale: number, maxScale: number, clientX?: number, clientY?: number) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return (prev: number) => Math.min(maxScale, Math.max(minScale, prev + scaleChange));

    const centerX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const centerY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    return (prevScale: number) => {
      const newScale = Math.min(maxScale, Math.max(minScale, prevScale + scaleChange));
      setPan((prevPan) => ({
        x: centerX - (centerX - prevPan.x) * (newScale / prevScale),
        y: centerY - (centerY - prevPan.y) * (newScale / prevScale),
      }));
      return newScale;
    };
  };

  const handleZoomIn = useCallback((clientX?: number, clientY?: number) => {
    setScale(zoomAtPoint(0.1, 0.1, 3, clientX, clientY));
  }, [setScale, setPan, canvasContainerRef]);

  const handleZoomOut = useCallback((clientX?: number, clientY?: number) => {
    setScale(zoomAtPoint(-0.1, 0.1, 3, clientX, clientY));
  }, [setScale, setPan, canvasContainerRef]);

  const handleZoomToFit = useCallback(() => {
    if (elements.length === 0) {
      setPan({ x: 0, y: 0 });
      setScale(1);
      return;
    }

    const container = canvasContainerRef.current;
    if (!container) return;

    const padding = 60;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach((el) => {
      const right = el.x + (el.width || 200);
      const bottom = el.y + (el.height || 200);
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });

    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const fitScale = Math.min(containerW / contentW, containerH / contentH, 1);

    setScale(fitScale);
    setPan({
      x: (containerW - contentW * fitScale) / 2 - minX * fitScale + padding * fitScale,
      y: (containerH - contentH * fitScale) / 2 - minY * fitScale + padding * fitScale,
    });
  }, [elements, setScale, setPan, canvasContainerRef]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
  };
}