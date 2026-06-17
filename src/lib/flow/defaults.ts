import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_EDGE_SEMANTIC,
  DEFAULT_NODE_STYLE,
  DEFAULT_SEMANTIC,
  type EdgeStrokeType,
  type FlowFile,
  type FlowProject,
  type FlowProjectSettings,
  type FlowViewport,
  type FluxoEdgeSerialized,
  type FluxoNodeSerialized,
  type NodeIcon,
  type ShapeType,
} from "./types";

export const DEFAULT_BACKGROUND = "#f8fafc";

export const DEFAULT_VIEWPORT: FlowViewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const DEFAULT_PROJECT_SETTINGS: FlowProjectSettings = {
  theme: "light",
  gridVisible: true,
  snapToGrid: true,
  gridSize: 20,
  layoutDirection: "vertical",
};

export const DEFAULT_NODE_SIZE = {
  width: 180,
  height: 80,
};

export const MIN_NODE_SIZE = {
  width: 80,
  height: 40,
};

export const DEFAULT_NODE_ICON: NodeIcon = {
  type: "none",
  name: "",
  customSrc: null,
};

export const DEFAULT_EDGE_STYLE = {
  stroke: "#374151",
  strokeWidth: 2,
  strokeDasharray: null,
  markerEnd: "arrow" as const,
};

export const DEFAULT_EDGE_ROUTING = {
  mode: "auto" as const,
  points: [],
  avoidCrossings: true,
};

export function createFlowId(prefix = "flow") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createDefaultNode(
  overrides: Partial<FluxoNodeSerialized> = {},
): FluxoNodeSerialized {
  return {
    id: overrides.id ?? createFlowId("node"),
    type: overrides.type ?? "flowNode",
    shape: overrides.shape ?? "rounded-rectangle",
    title: overrides.title ?? "Novo bloco",
    summary: overrides.summary ?? "",
    hiddenInfo: overrides.hiddenInfo ?? "",
    position: overrides.position ?? { x: 100, y: 100 },
    size: overrides.size ?? { ...DEFAULT_NODE_SIZE },
    style: { ...DEFAULT_NODE_STYLE, ...overrides.style },
    icon: overrides.icon ?? { ...DEFAULT_NODE_ICON },
    semantic: { ...DEFAULT_SEMANTIC, ...overrides.semantic },
    customFields: overrides.customFields ?? [],
  };
}

export function createDefaultEdge(
  overrides: Partial<FluxoEdgeSerialized> = {},
): FluxoEdgeSerialized {
  return {
    id: overrides.id ?? createFlowId("edge"),
    source: overrides.source ?? "",
    target: overrides.target ?? "",
    sourceHandle: overrides.sourceHandle ?? "auto",
    targetHandle: overrides.targetHandle ?? "auto",
    label: overrides.label,
    hiddenInfo: overrides.hiddenInfo ?? "",
    type: overrides.type ?? "orthogonal",
    stroke: (overrides.stroke ?? "solid") as EdgeStrokeType,
    hasArrow: overrides.hasArrow ?? true,
    style: { ...DEFAULT_EDGE_STYLE, ...overrides.style },
    routing: { ...DEFAULT_EDGE_ROUTING, ...overrides.routing },
    semantic: { ...DEFAULT_EDGE_SEMANTIC, ...overrides.semantic },
    customFields: overrides.customFields ?? [],
  };
}

export function createEmptyFlowProject(name = "Novo fluxo"): FlowProject {
  const createdAt = nowIso();
  return {
    id: createFlowId("flow"),
    name,
    description: "",
    background: DEFAULT_BACKGROUND,
    createdAt,
    updatedAt: createdAt,
    viewport: { ...DEFAULT_VIEWPORT },
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    metadata: { source: "manual", tags: [] },
    nodes: [],
    edges: [],
  };
}

export function createEmptyFlowFile(name = "Novo fluxo"): FlowFile {
  const project = createEmptyFlowProject(name);
  return {
    app: "Fluxo",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      background: project.background,
      viewport: project.viewport ?? { ...DEFAULT_VIEWPORT },
      settings: project.settings ?? { ...DEFAULT_PROJECT_SETTINGS },
      metadata: project.metadata,
    },
    nodes: [],
    edges: [],
  };
}

export const ALLOWED_SHAPES: ShapeType[] = [
  "rectangle",
  "rounded-rectangle",
  "circle",
  "diamond",
  "cylinder",
  "hexagon",
];
