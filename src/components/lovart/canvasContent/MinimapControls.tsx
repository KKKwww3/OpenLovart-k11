"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Map, X } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CanvasElement } from "@/components/lovart/CanvasArea/types";

interface MinimapControlsProps {
  elements: CanvasElement[];
  scale: number;
  pan: { x: number; y: number };
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  onZoomIn: (clientX?: number, clientY?: number) => void;
  onZoomOut: (clientX?: number, clientY?: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 132;

const ELEMENT_COLORS: Record<string, string> = {
  image: "#3B82F6",
  video: "#3B82F6",
  text: "#F59E0B",
  shape: "#6B7280",
  path: "#8B5CF6",
  "image-generator": "#93C5FD",
  "video-generator": "#93C5FD",
};

export function MinimapControls({
  elements,
  scale,
  pan,
  canvasContainerRef,
  onZoomIn,
  onZoomOut,
  onPanChange,
}: MinimapControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasMovedRef = useRef(false);

  const getBounds = useCallback(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach((el) => {
      if (el.type === "connector") return;
      const w = el.width || 200;
      const h = el.height || 200;
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + w > maxX) maxX = el.x + w;
      if (el.y + h > maxY) maxY = el.y + h;
    });
    if (minX === Infinity) {
      return { minX: -400, minY: -400, maxX: 400, maxY: 400 };
    }
    const padding = 40;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [elements]);

  const minimapToCanvas = useCallback(
    (minimapX: number, minimapY: number) => {
      const bounds = getBounds();
      const bboxW = bounds.maxX - bounds.minX;
      const bboxH = bounds.maxY - bounds.minY;
      const mapScale = Math.min(MINIMAP_WIDTH / bboxW, MINIMAP_HEIGHT / bboxH);
      const offsetX = (MINIMAP_WIDTH - bboxW * mapScale) / 2;
      const offsetY = (MINIMAP_HEIGHT - bboxH * mapScale) / 2;
      return {
        x: (minimapX - offsetX) / mapScale + bounds.minX,
        y: (minimapY - offsetY) / mapScale + bounds.minY,
        scale: mapScale,
      };
    },
    [getBounds],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_WIDTH * dpr;
    canvas.height = MINIMAP_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#F9FAFB";
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    ctx.fillStyle = "rgba(0,0,0,0.02)";
    for (let x = 0; x < MINIMAP_WIDTH; x += 10) {
      for (let y = 0; y < MINIMAP_HEIGHT; y += 10) {
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const bounds = getBounds();
    const bboxW = bounds.maxX - bounds.minX;
    const bboxH = bounds.maxY - bounds.minY;
    const mapScale = Math.min(MINIMAP_WIDTH / bboxW, MINIMAP_HEIGHT / bboxH);
    const offsetX = (MINIMAP_WIDTH - bboxW * mapScale) / 2;
    const offsetY = (MINIMAP_HEIGHT - bboxH * mapScale) / 2;

    const toMapX = (cx: number) => offsetX + (cx - bounds.minX) * mapScale;
    const toMapY = (cy: number) => offsetY + (cy - bounds.minY) * mapScale;
    const toMapW = (w: number) => Math.max(w * mapScale, 1);

    const nonConnectors = elements.filter((el) => el.type !== "connector");

    elements
      .filter((el) => el.type === "connector")
      .forEach((connector) => {
        const fromEl = nonConnectors.find((e) => e.id === connector.connectorFrom);
        const toEl = nonConnectors.find((e) => e.id === connector.connectorTo);
        if (!fromEl || !toEl) return;

        const fromX = toMapX(fromEl.x + (fromEl.width || 200) / 2);
        const fromY = toMapY(fromEl.y + (fromEl.height || 200) / 2);
        const toX = toMapX(toEl.x + (toEl.width || 200) / 2);
        const toY = toMapY(toEl.y + (toEl.height || 200) / 2);

        ctx.strokeStyle = "#D1D5DB";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      });

    nonConnectors.forEach((el) => {
      const w = el.width || 200;
      const h = el.height || 200;
      const x = toMapX(el.x);
      const y = toMapY(el.y);
      const mw = toMapW(w);
      const mh = toMapW(h);

      ctx.fillStyle = ELEMENT_COLORS[el.type] || "#D1D5DB";
      ctx.fillRect(x, y, mw, mh);

      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, mw, mh);
    });

    const container = canvasContainerRef.current;
    if (container) {
      const viewCanvasX = -pan.x / scale;
      const viewCanvasY = -pan.y / scale;
      const viewCanvasW = container.clientWidth / scale;
      const viewCanvasH = container.clientHeight / scale;

      const vx = toMapX(viewCanvasX);
      const vy = toMapY(viewCanvasY);
      const vw = Math.max(toMapW(viewCanvasW), 4);
      const vh = Math.max(toMapW(viewCanvasH), 4);

      ctx.fillStyle = "rgba(59, 130, 246, 0.12)";
      ctx.fillRect(vx, vy, vw, vh);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy, vw, vh);
    }
  }, [elements, scale, pan, canvasContainerRef, getBounds]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleNavigate = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const canvasCoord = minimapToCanvas(x, y);
      const container = canvasContainerRef.current;
      if (!container) return;

      onPanChange({
        x: container.clientWidth / 2 - canvasCoord.x * scale,
        y: container.clientHeight / 2 - canvasCoord.y * scale,
      });
    },
    [minimapToCanvas, canvasContainerRef, scale, onPanChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        panX: pan.x,
        panY: pan.y,
      };
      hasMovedRef.current = false;
      setIsDragging(true);
    },
    [pan],
  );

  useEffect(() => {
    if (!isDragging || !dragStartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const dx = currentX - dragStartRef.current!.x;
      const dy = currentY - dragStartRef.current!.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMovedRef.current = true;
      }

      const bounds = getBounds();
      const bboxW = bounds.maxX - bounds.minX;
      const bboxH = bounds.maxY - bounds.minY;
      const mapScale = Math.min(MINIMAP_WIDTH / bboxW, MINIMAP_HEIGHT / bboxH);

      const canvasDx = (dx / mapScale) * scale;
      const canvasDy = (dy / mapScale) * scale;

      onPanChange({
        x: dragStartRef.current!.panX - canvasDx,
        y: dragStartRef.current!.panY - canvasDy,
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!hasMovedRef.current) {
        handleNavigate(e.clientX, e.clientY);
      }
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, getBounds, scale, onPanChange, handleNavigate]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) {
        onZoomIn();
      } else {
        onZoomOut();
      }
    },
    [onZoomIn, onZoomOut],
  );

  return (
    <>
      {isOpen ? (
        <Card size="sm" className="w-[220px] shadow-sm select-none">
          <CardHeader className="py-1 px-3">
            <CardTitle className="text-xs font-medium">小地图</CardTitle>
            <CardAction>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <canvas
              ref={canvasRef}
              className="rounded-md border border-border bg-card w-full cursor-default"
              style={{ aspectRatio: `${MINIMAP_WIDTH} / ${MINIMAP_HEIGHT}` }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              role="img"
              aria-label="画布小地图：点击跳转视口，拖拽平移，滚轮缩放"
            />
          </CardContent>
        </Card>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center size-9 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Map size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>打开小地图</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}