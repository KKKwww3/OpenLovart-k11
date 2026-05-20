"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Map } from "lucide-react";
import {
  Card,
  CardContent,
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
  image: "#9CA3AF",
  video: "#9CA3AF",
  text: "#D1D5DB",
  shape: "#9CA3AF",
  path: "#9CA3AF",
  "image-generator": "#9CA3AF",
  "video-generator": "#9CA3AF",
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const clickScreenPosRef = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef(pan);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const getBounds = useCallback(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
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
      return {
        x: minimapX / mapScale + bounds.minX,
        y: minimapY / mapScale + bounds.minY,
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

    const toMapX = (cx: number) => (cx - bounds.minX) * mapScale;
    const toMapY = (cy: number) => (cy - bounds.minY) * mapScale;
    const toMapW = (w: number) => Math.max(w * mapScale, 1);

    const nonConnectors = elements.filter((el) => el.type !== "connector");

    elements
      .filter((el) => el.type === "connector")
      .forEach((connector) => {
        const fromEl = nonConnectors.find(
          (e) => e.id === connector.connectorFrom,
        );
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
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      lastPosRef.current = {
        x: Math.max(0, Math.min(MINIMAP_WIDTH, rawX)),
        y: Math.max(0, Math.min(MINIMAP_HEIGHT, rawY)),
      };
      clickScreenPosRef.current = { x: e.clientX, y: e.clientY };
      hasMovedRef.current = false;
      setIsDragging(true);
    },
    [],
  );

  useEffect(() => {
    if (!isDragging || !lastPosRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const clampedX = Math.max(0, Math.min(MINIMAP_WIDTH, rawX));
      const clampedY = Math.max(0, Math.min(MINIMAP_HEIGHT, rawY));

      let dx = clampedX - lastPosRef.current!.x;
      let dy = clampedY - lastPosRef.current!.y;

      const OUTSIDE_MARGIN = 10;
      if (rawX < -OUTSIDE_MARGIN) {
        dx -= (Math.abs(rawX) - OUTSIDE_MARGIN) * 0.1;
      } else if (rawX > MINIMAP_WIDTH + OUTSIDE_MARGIN) {
        dx += (rawX - MINIMAP_WIDTH - OUTSIDE_MARGIN) * 0.1;
      }
      if (rawY < -OUTSIDE_MARGIN) {
        dy -= (Math.abs(rawY) - OUTSIDE_MARGIN) * 0.1;
      } else if (rawY > MINIMAP_HEIGHT + OUTSIDE_MARGIN) {
        dy += (rawY - MINIMAP_HEIGHT - OUTSIDE_MARGIN) * 0.1;
      }

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        hasMovedRef.current = true;
      }

      const bounds = getBounds();
      const bboxW = bounds.maxX - bounds.minX;
      const bboxH = bounds.maxY - bounds.minY;
      const mapScale = Math.min(MINIMAP_WIDTH / bboxW, MINIMAP_HEIGHT / bboxH);

      const canvasDx = (dx / mapScale) * scale;
      const canvasDy = (dy / mapScale) * scale;

      const currentPan = panRef.current;
      onPanChange({
        x: currentPan.x - canvasDx,
        y: currentPan.y - canvasDy,
      });

      lastPosRef.current = { x: clampedX, y: clampedY };
    };

    const handleMouseUp = () => {
      if (!hasMovedRef.current && clickScreenPosRef.current) {
        handleNavigate(
          clickScreenPosRef.current.x,
          clickScreenPosRef.current.y,
        );
      }
      setIsDragging(false);
      lastPosRef.current = null;
      clickScreenPosRef.current = null;
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
      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen((v) => !v)}
              className={`flex items-center justify-center size-9 rounded-lg shadow-sm border transition-colors ${
                isOpen
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Map size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isOpen ? "关闭小地图" : "打开小地图"}</p>
          </TooltipContent>
        </Tooltip>
        {isOpen && (
          <Card ref={cardRef} size="sm" className="w-[220px] shadow-sm select-none">
            <CardContent className="p-1">
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
        )}
      </div>
    </>
  );
}
