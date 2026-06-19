// Tipos centrais do domínio do Fluxo.
//
// Estes tipos mantêm compatibilidade com o front gerado no Lovable e também
// preparam o projeto para o schema oficial descrito em docs/SCHEMA_FLOW_JSON.md.

export type FlowSchemaVersion = "0.1.0";

export type ShapeType =
  | "rectangle"
  | "rounded-rectangle"
  | "circle"
  | "diamond"
  | "cylinder"
  | "hexagon";

// `bezier` é mantido por compatibilidade com o front atual.
// `smooth`, `dashed` e `no-arrow` ficam preparados para o schema oficial.
export type EdgeLineType = "orthogonal" | "straight" | "bezier" | "smooth" | "dashed" | "no-arrow";
export type EdgeStrokeType = "solid" | "dashed";
export type FlowHandlePosition =
  | "top-left"
  | "top"
  | "top-right"
  | "right-top"
  | "right"
  | "right-bottom"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left-bottom"
  | "left"
  | "left-top"
  | "auto";
export type FlowLayoutDirection = "vertical" | "horizontal" | "radial" | "compact";

export interface FlowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FlowProjectSettings {
  theme: "light" | "dark";
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layoutDirection: FlowLayoutDirection;
}

export interface FlowMetadata {
  author?: string;
  tags?: string[];
  source?: "manual" | "external-ai" | "imported" | "duplicated";
  originalFileName?: string;
}

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: "none" | "sm" | "md" | "lg";
}

export interface NodeIcon {
  type: "none" | "default" | "custom";
  name?: string;
  customSrc?: string | null;
}

export interface NodeSemantic {
  objective: string;
  inputs: string[];
  outputs: string[];
  rules: string[];
  notes: string;
}

export interface FlowCustomField {
  key: string;
  label: string;
  value: string;
}

export interface FluxoNodeData {
  shape: ShapeType;
  title: string;
  summary: string;
  hiddenInfo: string;
  style: NodeStyle;
  icon?: NodeIcon;
  semantic: NodeSemantic;
  width: number;
  height: number;
  customFields?: FlowCustomField[];
  [key: string]: unknown;
}

export interface EdgeSemantic {
  condition: string;
  priority: "low" | "normal" | "high" | "critical";
  rules: string[];
  notes: string;
}

export interface FlowEdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string | null;
  markerEnd?: "arrow" | "none";
}

export interface FlowEdgeRouting {
  mode: "auto" | "manual";
  points?: Array<{ x: number; y: number }>;
  avoidCrossings?: boolean;
}

export interface FluxoEdgeData {
  label?: string;
  hiddenInfo: string;
  lineType: EdgeLineType;
  stroke: EdgeStrokeType;
  hasArrow: boolean;
  semantic: EdgeSemantic;
  sourceHandle?: FlowHandlePosition;
  targetHandle?: FlowHandlePosition;
  style?: FlowEdgeStyle;
  routing?: FlowEdgeRouting;
  customFields?: FlowCustomField[];
  [key: string]: unknown;
}

export interface FlowProject {
  id: string;
  name: string;
  description?: string;
  background: string;
  createdAt?: string;
  updatedAt: string;
  viewport?: FlowViewport;
  settings?: FlowProjectSettings;
  metadata?: FlowMetadata;
  nodes: FluxoNodeSerialized[];
  edges: FluxoEdgeSerialized[];
}

export interface FluxoNodeSerialized {
  id: string;
  type: "block" | "flowNode";
  shape: ShapeType;
  title: string;
  summary: string;
  hiddenInfo: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: NodeStyle;
  icon?: NodeIcon;
  semantic: NodeSemantic;
  customFields?: FlowCustomField[];
}

export interface FluxoEdgeSerialized {
  id: string;
  source: string;
  target: string;
  sourceHandle?: FlowHandlePosition;
  targetHandle?: FlowHandlePosition;
  label?: string;
  hiddenInfo: string;
  type: EdgeLineType;
  stroke?: EdgeStrokeType;
  hasArrow?: boolean;
  style?: FlowEdgeStyle;
  routing?: FlowEdgeRouting;
  semantic: EdgeSemantic;
  customFields?: FlowCustomField[];
}

export interface FlowFile {
  app: "Fluxo";
  // Campo oficial novo.
  schemaVersion?: FlowSchemaVersion | string;
  // Campo antigo mantido para compatibilidade com arquivos já gerados pelo Lovable.
  version?: string;
  project: {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt: string;
    background: string;
    viewport: FlowViewport;
    settings?: FlowProjectSettings;
    metadata?: FlowMetadata;
  };
  nodes: FluxoNodeSerialized[];
  edges: FluxoEdgeSerialized[];
}

export interface FlowValidationResult {
  ok: boolean;
  file?: FlowFile;
  error?: string;
  warnings?: string[];
}

export const CURRENT_SCHEMA_VERSION: FlowSchemaVersion = "0.1.0";

export const DEFAULT_NODE_STYLE: NodeStyle = {
  backgroundColor: "#ffffff",
  borderColor: "#d1d5db",
  textColor: "#111827",
  borderWidth: 1,
  borderRadius: 12,
  shadow: "sm",
};

export const DEFAULT_SEMANTIC: NodeSemantic = {
  objective: "",
  inputs: [],
  outputs: [],
  rules: [],
  notes: "",
};

export const DEFAULT_EDGE_SEMANTIC: EdgeSemantic = {
  condition: "",
  priority: "normal",
  rules: [],
  notes: "",
};
