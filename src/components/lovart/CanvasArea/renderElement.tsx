import React from "react";
import type { CanvasElement } from "./types";

export function renderPath(points: { x: number; y: number }[]) {
  if (!points || points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

interface CanvasElementItemProps {
  el: CanvasElement;
  scale: number;
  pan: { x: number; y: number };
  selectedIds: string[];
  isDrawing: boolean;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  onElementChange: (id: string, newAttrs: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  handleMouseDown: (
    e: React.MouseEvent,
    elementId: string | null,
    elementX?: number,
    elementY?: number,
    width?: number,
    height?: number,
  ) => void;
  handleResizeStart: (
    e: React.MouseEvent,
    elementId: string,
    handle: string,
    element: CanvasElement,
  ) => void;
  elements: CanvasElement[];
  activeTool: string;
  onConnectFlow?: (element: CanvasElement) => void;
}

export function CanvasElementItem({
  el,
  scale,
  pan,
  selectedIds,
  isDrawing,
  editingTextId,
  setEditingTextId,
  onElementChange,
  onDelete,
  handleMouseDown,
  handleResizeStart,
  elements,
  activeTool,
  onConnectFlow,
}: CanvasElementItemProps) {
  return (
    <div
      className={`absolute group ${selectedIds.includes(el.id) ? "z-10" : ""}`}
      style={{
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        pointerEvents: activeTool === "draw" ? "none" : "auto",
      }}
      onMouseDown={(e) =>
        handleMouseDown(e, el.id, el.x, el.y, el.width, el.height)
      }
      onDoubleClick={() => el.type === "text" && setEditingTextId(el.id)}
    >
      {el.type === "image-generator" && (
        <div className="w-full h-full bg-blue-50 border-2 border-blue-400 rounded-xl flex flex-col items-center justify-center text-blue-500">
          <div className="w-20 h-20 mb-4 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
          <div className="text-sm font-medium">Image Generator</div>
          <div className="text-xs opacity-70">
            {Math.round(el.width || 0)} x {Math.round(el.height || 0)}
          </div>
        </div>
      )}

      {el.type === "video-generator" && (
        <div className="w-full h-full bg-blue-50 border-2 border-blue-400 rounded-xl flex flex-col items-center justify-center text-blue-500">
          <div className="w-20 h-20 mb-4 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </div>
          <div className="text-sm font-medium">Video Generator</div>
          <div className="text-xs opacity-70">
            {Math.round(el.width || 0)} x {Math.round(el.height || 0)}
          </div>
        </div>
      )}

      {!selectedIds.includes(el.id) &&
        !isDrawing &&
        (() => {
          const isLinked = selectedIds.some((selectedId) => {
            const selectedEl = elements.find((e) => e.id === selectedId);
            return (
              selectedEl?.linkedElements?.includes(el.id) ||
              el.linkedElements?.includes(selectedId)
            );
          });
          return isLinked ? (
            <div className="absolute inset-0 border-2 border-dashed border-purple-400 pointer-events-none opacity-60" />
          ) : null;
        })()}

      {selectedIds.includes(el.id) && !isDrawing && (
        <>
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
          {selectedIds.length === 1 && (
            <>
              <div
                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize"
                data-handle="nw"
                onMouseDown={(e) => handleResizeStart(e, el.id, "nw", el)}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize"
                data-handle="ne"
                onMouseDown={(e) => handleResizeStart(e, el.id, "ne", el)}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize"
                data-handle="sw"
                onMouseDown={(e) => handleResizeStart(e, el.id, "sw", el)}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize"
                data-handle="se"
                onMouseDown={(e) => handleResizeStart(e, el.id, "se", el)}
              />
              <div
                className="absolute top-1/2 -left-1.5 w-3 h-3 -mt-1.5 bg-white border border-blue-500 rounded-full cursor-w-resize"
                data-handle="w"
                onMouseDown={(e) => handleResizeStart(e, el.id, "w", el)}
              />
              <div
                className="absolute top-1/2 -right-1.5 w-3 h-3 -mt-1.5 bg-white border border-blue-500 rounded-full cursor-e-resize"
                data-handle="e"
                onMouseDown={(e) => handleResizeStart(e, el.id, "e", el)}
              />
              <div
                className="absolute -top-1.5 left-1/2 w-3 h-3 -ml-1.5 bg-white border border-blue-500 rounded-full cursor-n-resize"
                data-handle="n"
                onMouseDown={(e) => handleResizeStart(e, el.id, "n", el)}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 w-3 h-3 -ml-1.5 bg-white border border-blue-500 rounded-full cursor-s-resize"
                data-handle="s"
                onMouseDown={(e) => handleResizeStart(e, el.id, "s", el)}
              />
            </>
          )}
        </>
      )}

      {el.type === "image" && el.content && (
        <img
          src={el.content}
          alt="Upload"
          className="w-full h-full object-cover pointer-events-none select-none rounded-lg"
        />
      )}

      {el.type === "video" && el.content && (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          <video
            src={el.content}
            className="w-full h-full object-cover select-none"
            controls
            loop
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {el.type === "text" &&
        (editingTextId === el.id ? (
          <textarea
            autoFocus
            className="w-full h-full bg-transparent outline-none resize-none overflow-hidden"
            style={{
              fontSize: el.fontSize || 24,
              fontFamily: el.fontFamily || "Inter",
              color: el.color || "#000000",
            }}
            value={el.content}
            onChange={(e) =>
              onElementChange(el.id, { content: e.target.value })
            }
            onBlur={() => setEditingTextId(null)}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="w-full h-full whitespace-nowrap select-none flex items-center"
            style={{
              fontSize: el.fontSize || 24,
              fontFamily: el.fontFamily || "Inter",
              color: el.color || "#000000",
            }}
          >
            {el.content || "Double click to edit"}
          </div>
        ))}

      {el.type === "shape" && (
        <div className="w-full h-full flex items-center justify-center">
          {(!el.shapeType || el.shapeType === "square") && (
            <div
              className="w-full h-full"
              style={{ backgroundColor: el.color || "#9CA3AF" }}
            />
          )}
          {el.shapeType === "circle" && (
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: el.color || "#9CA3AF" }}
            />
          )}
          {el.shapeType === "triangle" && (
            <div
              className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[100px] border-l-transparent border-r-transparent"
              style={{
                borderBottomColor: el.color || "#9CA3AF",
                borderBottomWidth: el.height,
                borderLeftWidth: (el.width || 0) / 2,
                borderRightWidth: (el.width || 0) / 2,
              }}
            />
          )}
          {el.shapeType === "message" && (
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
              fill={el.color || "#9CA3AF"}
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          )}
          {el.shapeType === "arrow-left" && (
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
              fill={el.color || "#9CA3AF"}
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          )}
          {el.shapeType === "arrow-right" && (
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
              fill={el.color || "#9CA3AF"}
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          )}
        </div>
      )}

      {el.type === "path" && el.points && (
        <svg
          className="w-full h-full overflow-visible pointer-events-none"
          viewBox={`0 0 ${el.width} ${el.height}`}
          preserveAspectRatio="none"
        >
          <path
            d={renderPath(el.points)}
            stroke={el.color || "#000000"}
            strokeWidth={el.strokeWidth || 3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
