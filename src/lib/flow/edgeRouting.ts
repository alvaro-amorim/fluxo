import type { Node } from "@xyflow/react";
import type {
  FlowHandlePosition,
  FluxoEdgeData,
  FluxoEdgeSerialized,
  FluxoNodeData,
  FluxoNodeSerialized,
} from "./types";
import { DEFAULT_NODE_SIZE } from "./defaults";

type NodeLike = Pick<FluxoNodeSerialized, "id" | "position" | "size">;
type PhysicalHandle = Exclude<FlowHandlePosition, "auto">;
type HandleSide = "top" | "right" | "bottom" | "left";
export type ManualRouteAxis = "x" | "y";

export type ManualRoutePoint = { x: number; y: number };
type Point = ManualRoutePoint;

type Rect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type HandleDescriptor = {
  id: PhysicalHandle;
  normal: Point;
  side: HandleSide;
};

const HANDLES: HandleDescriptor[] = [
  { id: "top-left", normal: { x: 0, y: -1 }, side: "top" },
  { id: "top", normal: { x: 0, y: -1 }, side: "top" },
  { id: "top-right", normal: { x: 0, y: -1 }, side: "top" },
  { id: "right-top", normal: { x: 1, y: 0 }, side: "right" },
  { id: "right", normal: { x: 1, y: 0 }, side: "right" },
  { id: "right-bottom", normal: { x: 1, y: 0 }, side: "right" },
  { id: "bottom-right", normal: { x: 0, y: 1 }, side: "bottom" },
  { id: "bottom", normal: { x: 0, y: 1 }, side: "bottom" },
  { id: "bottom-left", normal: { x: 0, y: 1 }, side: "bottom" },
  { id: "left-bottom", normal: { x: -1, y: 0 }, side: "left" },
  { id: "left", normal: { x: -1, y: 0 }, side: "left" },
  { id: "left-top", normal: { x: -1, y: 0 }, side: "left" },
];

const PHYSICAL_HANDLE_IDS = new Set<string>(HANDLES.map((handle) => handle.id));

const OPPOSITE_SIDE: Record<HandleSide, HandleSide> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

export type SmartHandles = {
  sourceHandle: PhysicalHandle;
  targetHandle: PhysicalHandle;
};

export type ManualRoutePointsOptions = {
  axis: ManualRouteAxis;
  offset?: number;
  minimumGap?: number;
};

export function getSmartHandles(source: Rect, target: Rect): SmartHandles {
  let best: { handles: SmartHandles; score: number } | null = null;

  for (const sourceDescriptor of HANDLES) {
    for (const targetDescriptor of HANDLES) {
      const candidate: SmartHandles = {
        sourceHandle: sourceDescriptor.id,
        targetHandle: targetDescriptor.id,
      };
      const score = scoreHandlePair(source, target, sourceDescriptor, targetDescriptor);

      if (!best || score < best.score) {
        best = { handles: candidate, score };
      }
    }
  }

  return best?.handles ?? getFallbackHandles(source, target);
}

export function resolveSerializedEdgeHandles(
  edge: FluxoEdgeSerialized,
  nodes: FluxoNodeSerialized[],
): FluxoEdgeSerialized {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source || !target) return edge;

  const smart = getSmartHandles(serializedNodeToRect(source), serializedNodeToRect(target));

  return {
    ...edge,
    sourceHandle: shouldUseSmartHandle(edge.sourceHandle) ? smart.sourceHandle : edge.sourceHandle,
    targetHandle: shouldUseSmartHandle(edge.targetHandle) ? smart.targetHandle : edge.targetHandle,
  };
}

export function resolveReactFlowEdgeHandles(
  edge: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    data?: unknown;
  },
  nodes: Node[],
): {
  sourceHandle: PhysicalHandle;
  targetHandle: PhysicalHandle;
} {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  const edgeData = edge.data as Partial<FluxoEdgeData> | undefined;

  const currentSourceHandle = normalizeHandle(edge.sourceHandle ?? edgeData?.sourceHandle);
  const currentTargetHandle = normalizeHandle(edge.targetHandle ?? edgeData?.targetHandle);

  if (!source || !target) {
    return {
      sourceHandle: handleOrFallback(currentSourceHandle, "right"),
      targetHandle: handleOrFallback(currentTargetHandle, "left"),
    };
  }

  const smart = getSmartHandles(reactFlowNodeToRect(source), reactFlowNodeToRect(target));

  return {
    sourceHandle: shouldUseSmartHandle(currentSourceHandle)
      ? smart.sourceHandle
      : handleOrFallback(currentSourceHandle, smart.sourceHandle),
    targetHandle: shouldUseSmartHandle(currentTargetHandle)
      ? smart.targetHandle
      : handleOrFallback(currentTargetHandle, smart.targetHandle),
  };
}

export function applySmartHandlesToReactFlowEdges(
  nodes: Node[],
  edges: Parameters<typeof resolveReactFlowEdgeHandles>[0][],
) {
  return edges.map((edge) => {
    const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
    const handles = resolveReactFlowEdgeHandles(edge, nodes);

    return {
      ...edge,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      data: data
        ? {
            ...data,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
          }
        : edge.data,
    };
  });
}

export function getManualRouteControlPoint(
  sourceNode: Node,
  targetNode: Node,
  axis: ManualRouteAxis,
  offset = 96,
): Point {
  const points = getManualRouteControlPoints(sourceNode, targetNode, { axis, offset });
  return (
    points[0] ?? getRectMidpoint(reactFlowNodeToRect(sourceNode), reactFlowNodeToRect(targetNode))
  );
}

export function getManualRouteControlPoints(
  sourceNode: Node,
  targetNode: Node,
  options: ManualRoutePointsOptions,
): Point[] {
  const source = reactFlowNodeToRect(sourceNode);
  const target = reactFlowNodeToRect(targetNode);
  const offset = Math.max(options.offset ?? 96, 24);
  const minimumGap = Math.max(options.minimumGap ?? 56, 16);

  if (options.axis === "x") {
    const corridorX = getHorizontalManualCorridorX(source, target, offset, minimumGap);
    return normalizeManualRoutePoints([
      { x: corridorX, y: source.centerY },
      { x: corridorX, y: target.centerY },
    ]);
  }

  const corridorY = getVerticalManualCorridorY(source, target, offset, minimumGap);
  return normalizeManualRoutePoints([
    { x: source.centerX, y: corridorY },
    { x: target.centerX, y: corridorY },
  ]);
}

export function normalizeManualRoutePoints(points: unknown): ManualRoutePoint[] {
  if (!Array.isArray(points)) return [];

  return points
    .map((point) => {
      if (!point || typeof point !== "object") return null;
      const candidate = point as Partial<ManualRoutePoint>;
      const x = Number(candidate.x);
      const y = Number(candidate.y);

      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    })
    .filter((point): point is ManualRoutePoint => Boolean(point));
}

export function replaceManualRoutePoint(
  points: unknown,
  index: number,
  nextPoint: ManualRoutePoint,
): ManualRoutePoint[] {
  const normalized = normalizeManualRoutePoints(points);
  if (!Number.isInteger(index) || index < 0 || index >= normalized.length) return normalized;
  if (!Number.isFinite(nextPoint.x) || !Number.isFinite(nextPoint.y)) return normalized;

  return normalized.map((point, pointIndex) =>
    pointIndex === index ? { x: nextPoint.x, y: nextPoint.y } : point,
  );
}

export function insertManualRoutePoint(
  points: unknown,
  index: number,
  point: ManualRoutePoint,
): ManualRoutePoint[] {
  const normalized = normalizeManualRoutePoints(points);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return normalized;

  const safeIndex = Math.max(0, Math.min(index, normalized.length));
  return [
    ...normalized.slice(0, safeIndex),
    { x: point.x, y: point.y },
    ...normalized.slice(safeIndex),
  ];
}

export function removeManualRoutePoint(points: unknown, index: number): ManualRoutePoint[] {
  const normalized = normalizeManualRoutePoints(points);
  if (!Number.isInteger(index) || index < 0 || index >= normalized.length) return normalized;
  return normalized.filter((_, pointIndex) => pointIndex !== index);
}

export function nudgeManualRoutePoints(
  points: unknown,
  delta: ManualRoutePoint,
): ManualRoutePoint[] {
  const normalized = normalizeManualRoutePoints(points);
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) return normalized;

  return normalized.map((point) => ({
    x: point.x + delta.x,
    y: point.y + delta.y,
  }));
}

function scoreHandlePair(
  source: Rect,
  target: Rect,
  sourceDescriptor: HandleDescriptor,
  targetDescriptor: HandleDescriptor,
) {
  const sourcePoint = getHandlePoint(source, sourceDescriptor.id);
  const targetPoint = getHandlePoint(target, targetDescriptor.id);
  const vector = { x: targetPoint.x - sourcePoint.x, y: targetPoint.y - sourcePoint.y };
  const distance = Math.hypot(vector.x, vector.y);
  const safeDistance = distance || 1;
  const unit = { x: vector.x / safeDistance, y: vector.y / safeDistance };

  let score = distance;

  const sourceAlignment = dot(sourceDescriptor.normal, unit);
  const targetAlignment = dot(targetDescriptor.normal, { x: -unit.x, y: -unit.y });

  score += alignmentPenalty(sourceAlignment);
  score += alignmentPenalty(targetAlignment);

  if (targetDescriptor.side === OPPOSITE_SIDE[sourceDescriptor.side]) {
    score -= 120;
  }

  if (sourceDescriptor.side === targetDescriptor.side) {
    score += 140;
  }

  if (hasHorizontalCorridor(source, target)) {
    score += sourceDescriptor.side === "right" || sourceDescriptor.side === "left" ? -90 : 60;
    score += targetDescriptor.side === "right" || targetDescriptor.side === "left" ? -90 : 60;
  }

  if (hasVerticalCorridor(source, target)) {
    score += sourceDescriptor.side === "top" || sourceDescriptor.side === "bottom" ? -90 : 60;
    score += targetDescriptor.side === "top" || targetDescriptor.side === "bottom" ? -90 : 60;
  }

  if (isHandlePointInsideOppositeRect(sourcePoint, target)) score += 180;
  if (isHandlePointInsideOppositeRect(targetPoint, source)) score += 180;

  return score;
}

function getFallbackHandles(source: Rect, target: Rect): SmartHandles {
  const dx = target.centerX - source.centerX;
  const dy = target.centerY - source.centerY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }

  return dy >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
}

function serializedNodeToRect(node: NodeLike): Rect {
  const width = node.size?.width ?? DEFAULT_NODE_SIZE.width;
  const height = node.size?.height ?? DEFAULT_NODE_SIZE.height;

  return createRect(node.id, node.position.x, node.position.y, width, height);
}

function reactFlowNodeToRect(node: Node): Rect {
  const data = node.data as Partial<FluxoNodeData> | undefined;
  const width = data?.width ?? node.measured?.width ?? node.width ?? DEFAULT_NODE_SIZE.width;
  const height = data?.height ?? node.measured?.height ?? node.height ?? DEFAULT_NODE_SIZE.height;

  return createRect(node.id, node.position.x, node.position.y, width, height);
}

function createRect(id: string, x: number, y: number, width: number, height: number): Rect {
  return {
    id,
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
  };
}

function getHandlePoint(rect: Rect, handle: PhysicalHandle): Point {
  switch (handle) {
    case "top-left":
      return { x: rect.left + rect.width * 0.25, y: rect.top };
    case "top":
      return { x: rect.centerX, y: rect.top };
    case "top-right":
      return { x: rect.left + rect.width * 0.75, y: rect.top };
    case "right-top":
      return { x: rect.right, y: rect.top + rect.height * 0.25 };
    case "right":
      return { x: rect.right, y: rect.centerY };
    case "right-bottom":
      return { x: rect.right, y: rect.top + rect.height * 0.75 };
    case "bottom-right":
      return { x: rect.left + rect.width * 0.75, y: rect.bottom };
    case "bottom":
      return { x: rect.centerX, y: rect.bottom };
    case "bottom-left":
      return { x: rect.left + rect.width * 0.25, y: rect.bottom };
    case "left-bottom":
      return { x: rect.left, y: rect.top + rect.height * 0.75 };
    case "left":
      return { x: rect.left, y: rect.centerY };
    case "left-top":
      return { x: rect.left, y: rect.top + rect.height * 0.25 };
  }
}

function getRectMidpoint(source: Rect, target: Rect): Point {
  return {
    x: (source.centerX + target.centerX) / 2,
    y: (source.centerY + target.centerY) / 2,
  };
}

function getHorizontalManualCorridorX(
  source: Rect,
  target: Rect,
  offset: number,
  minimumGap: number,
) {
  if (source.right + minimumGap <= target.left) return (source.right + target.left) / 2;
  if (target.right + minimumGap <= source.left) return (target.right + source.left) / 2;

  const direction = target.centerX >= source.centerX ? 1 : -1;
  const outerEdge =
    direction > 0 ? Math.max(source.right, target.right) : Math.min(source.left, target.left);
  return outerEdge + offset * direction;
}

function getVerticalManualCorridorY(
  source: Rect,
  target: Rect,
  offset: number,
  minimumGap: number,
) {
  if (source.bottom + minimumGap <= target.top) return (source.bottom + target.top) / 2;
  if (target.bottom + minimumGap <= source.top) return (target.bottom + source.top) / 2;

  const direction = target.centerY >= source.centerY ? 1 : -1;
  const outerEdge =
    direction > 0 ? Math.max(source.bottom, target.bottom) : Math.min(source.top, target.top);
  return outerEdge + offset * direction;
}

function alignmentPenalty(alignment: number) {
  if (alignment >= 0.65) return -80;
  if (alignment >= 0.25) return -25;
  if (alignment >= -0.1) return 35;
  return 160;
}

function hasHorizontalCorridor(source: Rect, target: Rect) {
  return source.right <= target.left || target.right <= source.left;
}

function hasVerticalCorridor(source: Rect, target: Rect) {
  return source.bottom <= target.top || target.bottom <= source.top;
}

function isHandlePointInsideOppositeRect(point: Point, rect: Rect) {
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

function dot(a: Point, b: Point) {
  return a.x * b.x + b.y * a.y;
}

function shouldUseSmartHandle(handle: unknown) {
  return !handle || handle === "auto";
}

function normalizeHandle(value: unknown): FlowHandlePosition {
  if (value === "auto") return "auto";
  return typeof value === "string" && PHYSICAL_HANDLE_IDS.has(value) ? (value as PhysicalHandle) : "auto";
}

function handleOrFallback(handle: FlowHandlePosition, fallback: PhysicalHandle): PhysicalHandle {
  return handle === "auto" ? fallback : handle;
}
