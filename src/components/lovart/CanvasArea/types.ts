export type CanvasElementType =
  | "image"
  | "text"
  | "shape"
  | "path"
  | "image-generator"
  | "video-generator"
  | "video"
  | "connector";

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
  color?: string;
  shapeType?:
    | "square"
    | "circle"
    | "triangle"
    | "star"
    | "message"
    | "arrow-left"
    | "arrow-right";
  fontSize?: number;
  fontFamily?: string;
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  referenceImageId?: string;
  groupId?: string;
  linkedElements?: string[];
  connectorFrom?: string;
  connectorTo?: string;
  connectorStyle?: "solid" | "dashed";
}

export interface CanvasAreaProps {
  scale: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onElementChange: (id: string, newAttrs: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onAddElement: (element: CanvasElement) => void;
  activeTool: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onConnectFlow?: (element: CanvasElement) => void;
}
