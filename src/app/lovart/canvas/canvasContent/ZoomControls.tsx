import { useEffect } from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface ZoomControlsProps {
  scale: number;
  onZoomIn: (clientX?: number, clientY?: number) => void;
  onZoomOut: (clientX?: number, clientY?: number) => void;
  onZoomToFit: () => void;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
}: ZoomControlsProps) {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        onZoomIn(e.clientX, e.clientY);
      } else {
        onZoomOut(e.clientX, e.clientY);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", handleWheel, { capture: true });
  }, [onZoomIn, onZoomOut]);

  return (
    <div className="absolute bottom-4 left-4 flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-1 z-50 gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onZoomOut()}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
          >
            <Minus size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>缩小</p>
          <p className="text-gray-400">Ctrl + 滚轮</p>
        </TooltipContent>
      </Tooltip>

      <span className="px-2 text-xs font-medium text-gray-600 min-w-[3rem] text-center select-none">
        {Math.round(scale * 100)}%
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onZoomIn()}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
          >
            <Plus size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>放大</p>
          <p className="text-gray-400">Ctrl + 滚轮</p>
        </TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-gray-200 mx-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onZoomToFit}
            className="p-1.5 hover:bg-gray-50 rounded text-gray-500"
          >
            <Maximize2 size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>适应屏幕</p>
          <p className="text-gray-400">Ctrl + 0</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}