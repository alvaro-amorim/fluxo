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

type Point = { x: number; y: number };

type HandleDescriptor = {
  id: PhysicalHandle;
  normal: Point;
};

const HANDLES: HandleDescriptor[] = [
  { id: "top", normal: { x: 0, y: -1 } },
  { id: "right", normal: { x: 1, y: 0 } },
  { id: "bottom", normal: { x: 0, y: 1 } },
  { id: "left", normal: { x: -1, y: 0 } },
];

const OPPOSITE_HANDLE: Record<PhysicalHandle, PhysicalHandle> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

export type SmartHandles = {
  sourceHandle: PhysicalHandle;
  targetHandle: PhysicalHandle;
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
  axis: "x" | "y",
  offset = 96,
): Point {
  const source = reactFlowNodeToRect(sourceNode);
  const target = reactFlowNodeToRect(targetNode);
  const midX = (source.centerX + target.centerX) / 2;
  const midY = (source.centerY + target.centerY) / 2;

  if (axis === "x") {
    const direction = target.centerX >= source.centerX ? 1 : -1;
    return { x: midX + offset * direction, y: midY };
  }

  const direction = target.centerY >= source.centerY ? 1 : -1;
  return { x: midX, y: midY + offset * direction };
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

  if (targetDescriptor.id === OPPOSITE_HANDLE[sourceDescriptor.id]) {
    score -= 120;
  }

  if (sourceDescriptor.id === targetDescriptor.id) {
    score += 140;
  }

  if (hasHorizontalCorridor(source, target)) {
    score += sourceDescriptor.id === "right" || sourceDescriptor.id === "left" ? -90 : 60;
    score += targetDescriptor.id === "right" || targetDescriptor.id === "left" ? -90 : 60;
  }

  if (hasVerticalCorridor(source, target)) {
    score += sourceDescriptor.id === "top" || sourceDescriptor.id === "bottom" ? -90 : 60;
    score += targetDescriptor.id === "top" || targetDescriptor.id === "bottom" ? -90 : 60;
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
  if (handle === "top") return { x: rect.centerX, y: rect.top };
  if (handle === "right") return { x: rect.right, y: rect.centerY };
  if (handle === "bottom") return { x: rect.centerX, y: rect.bottom };
  return { x: rect.left, y: rect.centerY };
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
  return a.x * b.x + a.y * b.y;
}

function shouldUseSmartHandle(handle: unknown) {
  return !handle || handle === "auto";
}

function normalizeHandle(value: unknown): FlowHandlePosition {
  return value === "top" || value === "right" || value === "bottom" || value === "left"
    ? value
    : "auto";
}

function handleOrFallback(handle: FlowHandlePosition, fallback: PhysicalHandle): PhysicalHandle {
  return handle === "auto" ? fallback : handle;
}
