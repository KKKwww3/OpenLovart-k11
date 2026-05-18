import { useState, useRef, useEffect } from "react";
import { CanvasElement } from "@/components/lovart/CanvasArea";

export interface CanvasState {
  scale: number;
  pan: { x: number; y: number };
  elements: CanvasElement[];
  selectedIds: string[];
  title: string;
  activeTool: string;
  isGenerating: boolean;
  isDraggingElement: boolean;
  currentProjectId: string | null;
  saveStatus: "saved" | "saving" | "offline";
  isLoading: boolean;
  showECommercePanel: boolean;
}

export interface CanvasSetters {
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setActiveTool: React.Dispatch<React.SetStateAction<string>>;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDraggingElement: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  setSaveStatus: React.Dispatch<React.SetStateAction<"saved" | "saving" | "offline">>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setShowECommercePanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CanvasRefs {
  saveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isInitializedRef: React.MutableRefObject<boolean>;
  elementsRef: React.MutableRefObject<CanvasElement[]>;
  canvasContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  isSavingRef: React.MutableRefObject<boolean>;
  needsSaveRef: React.MutableRefObject<boolean>;
  hasLoadedRef: React.MutableRefObject<boolean>;
}

export function useCanvasState(): CanvasState & CanvasSetters & CanvasRefs {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState("select");
  const [title, setTitle] = useState("Untitled");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [isLoading, setIsLoading] = useState(true);
  const [showECommercePanel, setShowECommercePanel] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const elementsRef = useRef<CanvasElement[]>([]);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const isSavingRef = useRef(false);
  const needsSaveRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  return {
    scale, setScale,
    pan, setPan,
    elements, setElements,
    selectedIds, setSelectedIds,
    activeTool, setActiveTool,
    title, setTitle,
    isGenerating, setIsGenerating,
    isDraggingElement, setIsDraggingElement,
    currentProjectId, setCurrentProjectId,
    saveStatus, setSaveStatus,
    isLoading, setIsLoading,
    showECommercePanel, setShowECommercePanel,
    saveTimeoutRef, isInitializedRef, elementsRef,
    canvasContainerRef, isSavingRef, needsSaveRef, hasLoadedRef,
  };
}