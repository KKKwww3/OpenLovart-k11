import React from "react";
import { ContextToolbar } from "../ContextToolbar";
import { useCanvasInteraction } from "./useCanvasInteraction";
import { CanvasElementItem, renderPath } from "./renderElement";
import type { CanvasAreaProps, CanvasElement } from "./types";

export function CanvasArea({
  scale,
  pan,
  onPanChange,
  elements,
  selectedIds,
  onSelect,
  onElementChange,
  onDelete,
  onAddElement,
  activeTool,
  onDragStart,
  onDragEnd,
  onConnectFlow,
}: CanvasAreaProps) {
  const {
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
  } = useCanvasInteraction({
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
  });

  const selectedElement = elements.find((el) => selectedIds.includes(el.id));

  return (
    <div
      className={`w-full h-full bg-[#F9FAFB] relative overflow-hidden ${activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : activeTool === "draw" ? "cursor-crosshair" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseDown={(e) => handleMouseDown(e, null)}
    >
      {selectedIds.length === 1 && selectedElement && !isDragging && !isResizing && !isPanning && !isDrawing && selectedElement.type !== "connector" && (
        <div
          style={{
            position: "absolute",
            left:
              (selectedElement.x + (selectedElement.width || 0) / 2) * scale +
              pan.x,
            top: (selectedElement.y - 60) * scale + pan.y,
            transform: "translateX(-50%)",
            zIndex: 100,
          }}
        >
          <ContextToolbar
            element={selectedElement}
            onUpdate={onElementChange}
            onDelete={onDelete}
            onConnectFlow={onConnectFlow}
          />
        </div>
      )}

      {selectedIds.length > 1 && !isDragging && (
        <div
          className="absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-3"
          style={{ left: "50%", top: 20, transform: "translateX(-50%)" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-sm font-medium text-gray-600 px-2">
            {selectedIds.length} items selected
          </span>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={() => selectedIds.forEach((id) => onDelete(id))}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded-md"
          >
            Delete All
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            width: "10000px",
            height: "10000px",
          }}
        />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          {elements
            .filter((el) => el.type === "connector")
            .map((connector) => {
              const fromEl = elements.find(
                (e) => e.id === connector.connectorFrom,
              );
              const toEl = elements.find((e) => e.id === connector.connectorTo);

              if (!fromEl || !toEl) return null;

              const fromX = fromEl.x + (fromEl.width || 0) / 2;
              const fromY = fromEl.y + (fromEl.height || 0) / 2;
              const toX = toEl.x + (toEl.width || 0) / 2;
              const toY = toEl.y + (toEl.height || 0) / 2;

              return (
                <g key={connector.id}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={connector.color || "#6B7280"}
                    strokeWidth={connector.strokeWidth || 2}
                    strokeDasharray={
                      connector.connectorStyle === "dashed" ? "8 4" : "0"
                    }
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
            </marker>
          </defs>
        </svg>

        <div className="absolute inset-0">
          {elements
            .filter((el) => el.type !== "connector")
            .map((el) => (
              <CanvasElementItem
                key={el.id}
                el={el}
                scale={scale}
                pan={pan}
                selectedIds={selectedIds}
                isDrawing={isDrawing}
                editingTextId={editingTextId}
                setEditingTextId={setEditingTextId}
                onElementChange={onElementChange}
                onDelete={onDelete}
                handleMouseDown={handleMouseDown}
                handleResizeStart={handleResizeStart}
                elements={elements}
                activeTool={activeTool}
                onConnectFlow={onConnectFlow}
              />
            ))}
        </div>

        {currentPath && (
          <div className="absolute inset-0 pointer-events-none z-50">
            <svg className="w-full h-full overflow-visible">
              <path
                d={renderPath(currentPath.points)}
                stroke="#000000"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {selectionBox && (
          <div
            className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
            }}
          />
        )}

        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" />
        )}
      </div>
    </div>
  );
}