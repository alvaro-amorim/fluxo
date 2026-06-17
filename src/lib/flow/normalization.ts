import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_EDGE_SEMANTIC,
  DEFAULT_NODE_STYLE,
  DEFAULT_SEMANTIC,
  type EdgeLineType,
  type EdgeStrokeType,
  type FlowFile,
  type FlowHandlePosition,
  type FlowProjectSettings,
  type FlowValidationResult,
  type FlowViewport,
  type FluxoEdgeSerialized,
  type FluxoNodeSerialized,
  type NodeIcon,
  type NodeStyle,
  type ShapeType,
} from "./types";
import {
  ALLOWED_SHAPES,
  DEFAULT_BACKGROUND,
  DEFAULT_EDGE_ROUTING,
  DEFAULT_EDGE_STYLE,
  DEFAULT_NODE_ICON,
  DEFAULT_NODE_SIZE,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_VIEWPORT,
  MIN_NODE_SIZE,
  createFlowId,
  nowIso,
} from "./defaults";

type UnknownRecord = Record<string, unknown>;

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeViewport(input: unknown): FlowViewport {
  const viewport = isObject(input) ? input : {};
  return {
    x: asNumber(viewport.x, DEFAULT_VIEWPORT.x),
    y: asNumber(viewport.y, DEFAULT_VIEWPORT.y),
    zoom: asNumber(viewport.zoom, DEFAULT_VIEWPORT.zoom),
  };
}

function normalizeSettings(input: unknown): FlowProjectSettings {
  const settings = isObject(input) ? input : {};
  const layoutDirection = asString(
    settings.layoutDirection,
    DEFAULT_PROJECT_SETTINGS.layoutDirection,
  );
  return {
    theme: asString(settings.theme, DEFAULT_PROJECT_SETTINGS.theme) === "dark" ? "dark" : "light",
    gridVisible: asBoolean(settings.gridVisible, DEFAULT_PROJECT_SETTINGS.gridVisible),
    snapToGrid: asBoolean(settings.snapToGrid, DEFAULT_PROJECT_SETTINGS.snapToGrid),
    gridSize: Math.max(5, asNumber(settings.gridSize, DEFAULT_PROJECT_SETTINGS.gridSize)),
    layoutDirection:
      layoutDirection === "horizontal" ||
      layoutDirection === "radial" ||
      layoutDirection === "compact"
        ? layoutDirection
        : "vertical",
  };
}

function normalizeStyle(input: unknown): NodeStyle {
  const style = isObject(input) ? input : {};
  const shadow = asString(style.shadow, "sm");
  return {
    backgroundColor: asString(style.backgroundColor, DEFAULT_NODE_STYLE.backgroundColor),
    borderColor: asString(style.borderColor, DEFAULT_NODE_STYLE.borderColor),
    textColor: asString(style.textColor, DEFAULT_NODE_STYLE.textColor),
    borderWidth: asNumber(style.borderWidth, DEFAULT_NODE_STYLE.borderWidth ?? 1),
    borderRadius: asNumber(style.borderRadius, DEFAULT_NODE_STYLE.borderRadius ?? 12),
    shadow: shadow === "none" || shadow === "md" || shadow === "lg" ? shadow : "sm",
  };
}

function normalizeIcon(input: unknown): NodeIcon {
  const icon = isObject(input) ? input : {};
  const type = asString(icon.type, DEFAULT_NODE_ICON.type);
  return {
    type: type === "default" || type === "custom" ? type : "none",
    name: asString(icon.name, DEFAULT_NODE_ICON.name ?? ""),
    customSrc: typeof icon.customSrc === "string" ? icon.customSrc : null,
  };
}

function normalizeNodeSemantic(input: unknown) {
  const semantic = isObject(input) ? input : {};
  return {
    objective: asString(semantic.objective, DEFAULT_SEMANTIC.objective),
    inputs: asStringArray(semantic.inputs),
    outputs: asStringArray(semantic.outputs),
    rules: asStringArray(semantic.rules),
    notes: asString(semantic.notes, DEFAULT_SEMANTIC.notes),
  };
}

function normalizeEdgeSemantic(input: unknown) {
  const semantic = isObject(input) ? input : {};
  const priority = asString(semantic.priority, DEFAULT_EDGE_SEMANTIC.priority);
  return {
    condition: asString(semantic.condition, DEFAULT_EDGE_SEMANTIC.condition),
    priority:
      priority === "low" || priority === "high" || priority === "critical" ? priority : "normal",
    rules: asStringArray(semantic.rules),
    notes: asString(semantic.notes, DEFAULT_EDGE_SEMANTIC.notes),
  };
}

function normalizeCustomFields(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isObject)
    .map((field) => ({
      key: asString(field.key, ""),
      label: asString(field.label, ""),
      value: asString(field.value, ""),
    }))
    .filter((field) => field.key || field.label || field.value);
}

function normalizeShape(input: unknown): ShapeType {
  return ALLOWED_SHAPES.includes(input as ShapeType) ? (input as ShapeType) : "rounded-rectangle";
}

function normalizeEdgeType(input: unknown): EdgeLineType {
  const type = asString(input, "orthogonal");
  if (["orthogonal", "straight", "bezier", "smooth", "dashed", "no-arrow"].includes(type)) {
    return type as EdgeLineType;
  }
  return "orthogonal";
}

function normalizeStroke(input: unknown): EdgeStrokeType {
  return asString(input, "solid") === "dashed" ? "dashed" : "solid";
}

function normalizeNode(
  input: unknown,
  index: number,
  warnings: string[],
): FluxoNodeSerialized | null {
  if (!isObject(input)) {
    warnings.push(`Node na posição ${index} foi ignorado porque não é um objeto.`);
    return null;
  }

  const position = isObject(input.position) ? input.position : {};
  const size = isObject(input.size) ? input.size : {};
  const width = Math.max(MIN_NODE_SIZE.width, asNumber(size.width, DEFAULT_NODE_SIZE.width));
  const height = Math.max(MIN_NODE_SIZE.height, asNumber(size.height, DEFAULT_NODE_SIZE.height));

  return {
    id: asString(input.id, createFlowId("node")),
    type: input.type === "flowNode" ? "flowNode" : "block",
    shape: normalizeShape(input.shape),
    title: asString(input.title, "Bloco sem título"),
    summary: asString(input.summary, ""),
    hiddenInfo: asString(input.hiddenInfo, ""),
    position: {
      x: asNumber(position.x, 100 + index * 40),
      y: asNumber(position.y, 100 + index * 40),
    },
    size: { width, height },
    style: normalizeStyle(input.style),
    icon: normalizeIcon(input.icon),
    semantic: normalizeNodeSemantic(input.semantic),
    customFields: normalizeCustomFields(input.customFields),
  };
}

function normalizeEdge(
  input: unknown,
  index: number,
  nodeIds: Set<string>,
  warnings: string[],
): FluxoEdgeSerialized | null {
  if (!isObject(input)) {
    warnings.push(`Conexão na posição ${index} foi ignorada porque não é um objeto.`);
    return null;
  }

  const source = asString(input.source, "");
  const target = asString(input.target, "");
  if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
    warnings.push(
      `Conexão ${asString(input.id, String(index))} foi ignorada porque aponta para bloco inexistente.`,
    );
    return null;
  }

  const style = isObject(input.style) ? input.style : {};
  const routing = isObject(input.routing) ? input.routing : {};

  return {
    id: asString(input.id, createFlowId("edge")),
    source,
    target,
    sourceHandle: normalizeHandle(input.sourceHandle),
    targetHandle: normalizeHandle(input.targetHandle),
    label: typeof input.label === "string" ? input.label : undefined,
    hiddenInfo: asString(input.hiddenInfo, ""),
    type: normalizeEdgeType(input.type),
    stroke: normalizeStroke(input.stroke),
    hasArrow: asBoolean(input.hasArrow, input.type !== "no-arrow"),
    style: {
      stroke: asString(style.stroke, DEFAULT_EDGE_STYLE.stroke),
      strokeWidth: asNumber(style.strokeWidth, DEFAULT_EDGE_STYLE.strokeWidth),
      strokeDasharray: typeof style.strokeDasharray === "string" ? style.strokeDasharray : null,
      markerEnd: style.markerEnd === "none" ? "none" : "arrow",
    },
    routing: {
      mode: routing.mode === "manual" ? "manual" : "auto",
      points: Array.isArray(routing.points)
        ? routing.points
            .filter(isObject)
            .map((point) => ({ x: asNumber(point.x, 0), y: asNumber(point.y, 0) }))
        : [],
      avoidCrossings: asBoolean(routing.avoidCrossings, DEFAULT_EDGE_ROUTING.avoidCrossings),
    },
    semantic: normalizeEdgeSemantic(input.semantic),
    customFields: normalizeCustomFields(input.customFields),
  };
}

function normalizeHandle(input: unknown): FlowHandlePosition {
  const handle = asString(input, "auto");
  return handle === "top" || handle === "right" || handle === "bottom" || handle === "left"
    ? handle
    : "auto";
}

function dedupeNodes(nodes: FluxoNodeSerialized[], warnings: string[]) {
  const seen = new Set<string>();
  return nodes.map((node) => {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      return node;
    }
    const newId = createFlowId("node");
    warnings.push(`Node duplicado ${node.id} renomeado para ${newId}.`);
    seen.add(newId);
    return { ...node, id: newId };
  });
}

export function normalizeFlowFile(input: unknown): FlowValidationResult {
  const warnings: string[] = [];

  if (!isObject(input)) {
    return { ok: false, error: "O arquivo não é um objeto JSON válido." };
  }

  if (input.app !== "Fluxo") {
    return { ok: false, error: "O campo 'app' deve ser 'Fluxo'." };
  }

  const rawProject = isObject(input.project) ? input.project : null;
  if (!rawProject) {
    return { ok: false, error: "O campo 'project' é obrigatório." };
  }

  const createdAt = asString(rawProject.createdAt, nowIso());
  const updatedAt = asString(rawProject.updatedAt, createdAt);
  const rawNodes = Array.isArray(input.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input.edges) ? input.edges : [];

  if (!Array.isArray(input.nodes))
    warnings.push("Campo 'nodes' ausente ou inválido. Usando lista vazia.");
  if (!Array.isArray(input.edges))
    warnings.push("Campo 'edges' ausente ou inválido. Usando lista vazia.");

  const nodes = dedupeNodes(
    rawNodes
      .map((node, index) => normalizeNode(node, index, warnings))
      .filter(Boolean) as FluxoNodeSerialized[],
    warnings,
  );
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = rawEdges
    .map((edge, index) => normalizeEdge(edge, index, nodeIds, warnings))
    .filter(Boolean) as FluxoEdgeSerialized[];

  const file: FlowFile = {
    app: "Fluxo",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    project: {
      id: asString(rawProject.id, createFlowId("flow")),
      name: asString(rawProject.name, "Fluxo sem título"),
      description: asString(rawProject.description, ""),
      createdAt,
      updatedAt,
      background: asString(rawProject.background, DEFAULT_BACKGROUND),
      viewport: normalizeViewport(rawProject.viewport),
      settings: normalizeSettings(rawProject.settings),
      metadata: isObject(rawProject.metadata)
        ? {
            author:
              typeof rawProject.metadata.author === "string"
                ? rawProject.metadata.author
                : undefined,
            tags: asStringArray(rawProject.metadata.tags),
            source:
              rawProject.metadata.source === "manual" ||
              rawProject.metadata.source === "external-ai" ||
              rawProject.metadata.source === "duplicated"
                ? rawProject.metadata.source
                : "imported",
            originalFileName:
              typeof rawProject.metadata.originalFileName === "string"
                ? rawProject.metadata.originalFileName
                : undefined,
          }
        : { source: "imported", tags: [] },
    },
    nodes,
    edges,
  };

  return { ok: true, file, warnings };
}
