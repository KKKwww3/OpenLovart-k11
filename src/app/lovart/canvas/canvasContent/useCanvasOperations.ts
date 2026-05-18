import { useEffect } from "react";

interface UseCanvasOperationsParams {
  elements: { x: number; y: number; width?: number; height?: number }[];
  setScale: (scale: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  canvasContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useCanvasOperations(params: UseCanvasOperationsParams) {
  const { setScale, setPan, canvasContainerRef, elements } = params;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.1));
  };

  const handleZoomToFit = () => {
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
  };

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setScale((prevScale) => {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newScale = Math.min(Math.max(prevScale * zoomFactor, 0.1), 3);

        setPan((prevPan) => {
          const worldX = (mouseX - prevPan.x) / prevScale;
          const worldY = (mouseY - prevPan.y) / prevScale;
          return {
            x: mouseX - worldX * newScale,
            y: mouseY - worldY * newScale,
          };
        });

        return newScale;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  return {
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
  };
}