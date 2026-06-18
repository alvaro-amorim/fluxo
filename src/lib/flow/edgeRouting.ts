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

type RoutableEdge = Parameters<typeof resolveReactFlowEdgeHandles>[0];
type ResolvedRoute = {
  id?: string;
  source: string;
  target: string;
  sourceHandle: PhysicalHandle;
  targetHandle: PhysicalHandle;
  polyline: Point[];
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

const HANDLE_BY_ID = new Map<PhysicalHandle, HandleDescriptor>(
  HANDLES.map((handle) => [handle.id, handle]),
);
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
    id?: string;
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

export function applySmartHandlesToReactFlowEdges(nodes: Node[], edges: RoutableEdge[]) {
  const rectByNodeId = new Map(nodes.map((node) => [node.id, reactFlowNodeToRect(node)]));
  const resolvedRoutes: ResolvedRoute[] = [];
  const portUsage = new Map<string, number>();
  const sideUsage = new Map<string, number>();

  return edges.map((edge) => {
    const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
    const source = rectByNodeId.get(edge.source);
    const target = rectByNodeId.get(edge.target);

    if (!source || !target) return edge;

    const currentSourceHandle = normalizeHandle(edge.sourceHandle ?? data?.sourceHandle);
    const currentTargetHandle = normalizeHandle(edge.targetHandle ?? data?.targetHandle);
    const sourceIsAuto = shouldUseSmartHandle(currentSourceHandle);
    const targetIsAuto = shouldUseSmartHandle(currentTargetHandle);
    const routeIsAuto = data?.routing?.mode !== "manual";

    const handles =
      routeIsAuto && (sourceIsAuto || targetIsAuto)
        ? getSmartHandlesForEdge({
            edge,
            source,
            target,
            currentSourceHandle,
            currentTargetHandle,
            resolvedRoutes,
            rects: [...rectByNodeId.values()],
            portUsage,
            sideUsage,
          })
        : {
            sourceHandle: handleOrFallback(currentSourceHandle, getFallbackHandles(source, target).sourceHandle),
            targetHandle: handleOrFallback(currentTargetHandle, getFallbackHandles(source, target).targetHandle),
          };

    const polyline = getOrthogonalPolyline(source, target, handles.sourceHandle, handles.targetHandle);
    const route: ResolvedRoute = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      polyline,
    };

    resolvedRoutes.push(route);
    registerRouteUsage(route, portUsage, sideUsage);

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

function getSmartHandlesForEdge({
  edge,
  source,
  target,
  currentSourceHandle,
  currentTargetHandle,
  resolvedRoutes,
  rects,
  portUsage,
  sideUsage,
}: {
  edge: RoutableEdge;
  source: Rect;
  target: Rect;
  currentSourceHandle: FlowHandlePosition;
  currentTargetHandle: FlowHandlePosition;
  resolvedRoutes: ResolvedRoute[];
  rects: Rect[];
  portUsage: Map<string, number>;
  sideUsage: Map<string, number>;
}): SmartHandles {
  let best: { handles: SmartHandles; score: number } | null = null;
  const sourceOptions = shouldUseSmartHandle(currentSourceHandle)
    ? HANDLES
    : [HANDLE_BY_ID.get(currentSourceHandle as PhysicalHandle)].filter(
        (handle): handle is HandleDescriptor => Boolean(handle),
      );
  const targetOptions = shouldUseSmartHandle(currentTargetHandle)
    ? HANDLES
    : [HANDLE_BY_ID.get(currentTargetHandle as PhysicalHandle)].filter(
        (handle): handle is HandleDescriptor => Boolean(handle),
      );

  for (const sourceDescriptor of sourceOptions) {
    for (const targetDescriptor of targetOptions) {
      const handles: SmartHandles = {
        sourceHandle: sourceDescriptor.id,
        targetHandle: targetDescriptor.id,
      };
      const polyline = getOrthogonalPolyline(source, target, handles.sourceHandle, handles.targetHandle);
      const score =
        scoreHandlePair(source, target, sourceDescriptor, targetDescriptor) +
        scoreUsage(edge, sourceDescriptor, targetDescriptor, portUsage, sideUsage) +
        scoreParallelRoutes(edge, handles, resolvedRoutes) +
        scorePolylineAgainstRoutes(polyline, resolvedRoutes) +
        scorePolylineAgainstNodes(polyline, rects, source.id, target.id);

      if (!best || score < best.score) {
        best = { handles, score };
      }
    }
  }

  return best?.handles ?? getFallbackHandles(source, target);
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

function scoreUsage(
  edge: RoutableEdge,
  sourceDescriptor: HandleDescriptor,
  targetDescriptor: HandleDescriptor,
  portUsage: Map<string, number>,
  sideUsage: Map<string, number>,
) {
  const sourcePortKey = getPortKey(edge.source, "source", sourceDescriptor.id);
  const targetPortKey = getPortKey(edge.target, "target", targetDescriptor.id);
  const sourceSideKey = getSideKey(edge.source, "source", sourceDescriptor.side);
  const targetSideKey = getSideKey(edge.target, "target", targetDescriptor.side);

  return (
    (portUsage.get(sourcePortKey) ?? 0) * 260 +
    (portUsage.get(targetPortKey) ?? 0) * 260 +
    (sideUsage.get(sourceSideKey) ?? 0) * 42 +
    (sideUsage.get(targetSideKey) ?? 0) * 42
  );
}

function scoreParallelRoutes(
  edge: RoutableEdge,
  handles: SmartHandles,
  resolvedRoutes: ResolvedRoute[],
) {
  let score = 0;

  for (const route of resolvedRoutes) {
    const sameDirection = route.source === edge.source && route.target === edge.target;
    const oppositeDirection = route.source === edge.target && route.target === edge.source;
    const samePair = sameDirection || oppositeDirection;

    if (!samePair) continue;

    if (sameDirection) {
      if (route.sourceHandle === handles.sourceHandle) score += 180;
      if (route.targetHandle === handles.targetHandle) score += 180;
      if (route.sourceHandle === handles.sourceHandle && route.targetHandle === handles.targetHandle) {
        score += 320;
      }
    }

    if (oppositeDirection) {
      if (route.sourceHandle === handles.targetHandle) score += 140;
      if (route.targetHandle === handles.sourceHandle) score += 140;
    }
  }

  return score;
}

function scorePolylineAgainstRoutes(polyline: Point[], resolvedRoutes: ResolvedRoute[]) {
  let score = 0;

  for (const route of resolvedRoutes) {
    const overlaps = countOverlappingSegments(polyline, route.polyline);
    const intersections = countPolylineIntersections(polyline, route.polyline);
    score += overlaps * 420;
    score += intersections * 160;
  }

  return score;
}

function scorePolylineAgainstNodes(polyline: Point[], rects: Rect[], sourceId: string, targetId: string) {
  let score = 0;

  for (const rect of rects) {
    if (rect.id === sourceId || rect.id === targetId) continue;
    if (polylineIntersectsRect(polyline, rect)) score += 220;
  }

  return score;
}

function registerRouteUsage(
  route: ResolvedRoute,
  portUsage: Map<string, number>,
  sideUsage: Map<string, number>,
) {
  const sourceSide = HANDLE_BY_ID.get(route.sourceHandle)?.side;
  const targetSide = HANDLE_BY_ID.get(route.targetHandle)?.side;

  increment(portUsage, getPortKey(route.source, "source", route.sourceHandle));
  increment(portUsage, getPortKey(route.target, "target", route.targetHandle));

  if (sourceSide) increment(sideUsage, getSideKey(route.source, "source", sourceSide));
  if (targetSide) increment(sideUsage, getSideKey(route.target, "target", targetSide));
}

function getOrthogonalPolyline(
  source: Rect,
  target: Rect,
  sourceHandle: PhysicalHandle,
  targetHandle: PhysicalHandle,
): Point[] {
  const start = getHandlePoint(source, sourceHandle);
  const end = getHandlePoint(target, targetHandle);
  const sourceSide = HANDLE_BY_ID.get(sourceHandle)?.side ?? "right";
  const targetSide = HANDLE_BY_ID.get(targetHandle)?.side ?? "left";

  if (Math.abs(start.x - end.x) < 1 || Math.abs(start.y - end.y) < 1) return [start, end];

  if (isHorizontalSide(sourceSide) && isHorizontalSide(targetSide)) {
    const corridorX = getHorizontalManualCorridorX(source, target, 96, 56);
    return normalizePolyline([
      start,
      { x: corridorX, y: start.y },
      { x: corridorX, y: end.y },
      end,
    ]);
  }

  if (isVerticalSide(sourceSide) && isVerticalSide(targetSide)) {
    const corridorY = getVerticalManualCorridorY(source, target, 96, 56);
    return normalizePolyline([
      start,
      { x: start.x, y: corridorY },
      { x: end.x, y: corridorY },
      end,
    ]);
  }

  const horizontalFirst = isHorizontalSide(sourceSide) || isVerticalSide(targetSide);
  return normalizePolyline(
    horizontalFirst
      ? [start, { x: end.x, y: start.y }, end]
      : [start, { x: start.x, y: end.y }, end],
  );
}

function normalizePolyline(points: Point[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || Math.abs(previous.x - point.x) > 0.5 || Math.abs(previous.y - point.y) > 0.5;
  });
}

function countPolylineIntersections(a: Point[], b: Point[]) {
  let count = 0;

  for (const segmentA of getSegments(a)) {
    for (const segmentB of getSegments(b)) {
      if (segmentsShareEndpoint(segmentA, segmentB)) continue;
      if (segmentsIntersect(segmentA, segmentB)) count += 1;
    }
  }

  return count;
}

function countOverlappingSegments(a: Point[], b: Point[]) {
  let count = 0;

  for (const segmentA of getSegments(a)) {
    for (const segmentB of getSegments(b)) {
      if (segmentsOverlap(segmentA, segmentB)) count += 1;
    }
  }

  return count;
}

function polylineIntersectsRect(polyline: Point[], rect: Rect) {
  const padded = padRect(rect, 16);
  return getSegments(polyline).some((segment) => segmentIntersectsRect(segment, padded));
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

function isHorizontalSide(side: HandleSide) {
  return side === "left" || side === "right";
}

function isVerticalSide(side: HandleSide) {
  return side === "top" || side === "bottom";
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

function getPortKey(nodeId: string, direction: "source" | "target", handle: PhysicalHandle) {
  return `${direction}:${nodeId}:${handle}`;
}

function getSideKey(nodeId: string, direction: "source" | "target", side: HandleSide) {
  return `${direction}:${nodeId}:${side}`;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

type Segment = { a: Point; b: Point };

function getSegments(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let index = 1; index < points.length; index += 1) {
    segments.push({ a: points[index - 1]!, b: points[index]! });
  }
  return segments;
}

function segmentsIntersect(first: Segment, second: Segment) {
  const o1 = orientation(first.a, first.b, second.a);
  const o2 = orientation(first.a, first.b, second.b);
  const o3 = orientation(second.a, second.b, first.a);
  const o4 = orientation(second.a, second.b, first.b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(first.a, second.a, first.b)) return true;
  if (o2 === 0 && onSegment(first.a, second.b, first.b)) return true;
  if (o3 === 0 && onSegment(second.a, first.a, second.b)) return true;
  if (o4 === 0 && onSegment(second.a, first.b, second.b)) return true;
  return false;
}

function segmentsOverlap(first: Segment, second: Segment) {
  if (isVerticalSegment(first) && isVerticalSegment(second)) {
    return Math.abs(first.a.x - second.a.x) < 2 && rangesOverlap(first.a.y, first.b.y, second.a.y, second.b.y);
  }

  if (isHorizontalSegment(first) && isHorizontalSegment(second)) {
    return Math.abs(first.a.y - second.a.y) < 2 && rangesOverlap(first.a.x, first.b.x, second.a.x, second.b.x);
  }

  return false;
}

function segmentsShareEndpoint(first: Segment, second: Segment) {
  return (
    pointsAreClose(first.a, second.a) ||
    pointsAreClose(first.a, second.b) ||
    pointsAreClose(first.b, second.a) ||
    pointsAreClose(first.b, second.b)
  );
}

function segmentIntersectsRect(segment: Segment, rect: Rect) {
  if (pointInsideRect(segment.a, rect) || pointInsideRect(segment.b, rect)) return true;

  const top: Segment = { a: { x: rect.left, y: rect.top }, b: { x: rect.right, y: rect.top } };
  const right: Segment = { a: { x: rect.right, y: rect.top }, b: { x: rect.right, y: rect.bottom } };
  const bottom: Segment = { a: { x: rect.right, y: rect.bottom }, b: { x: rect.left, y: rect.bottom } };
  const left: Segment = { a: { x: rect.left, y: rect.bottom }, b: { x: rect.left, y: rect.top } };

  return [top, right, bottom, left].some((side) => segmentsIntersect(segment, side));
}

function orientation(a: Point, b: Point, c: Point) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 0.001) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a: Point, b: Point, c: Point) {
  return (
    b.x <= Math.max(a.x, c.x) + 0.001 &&
    b.x + 0.001 >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) + 0.001 &&
    b.y + 0.001 >= Math.min(a.y, c.y)
  );
}

function rangesOverlap(a1: number, a2: number, b1: number, b2: number) {
  const minA = Math.min(a1, a2);
  const maxA = Math.max(a1, a2);
  const minB = Math.min(b1, b2);
  const maxB = Math.max(b1, b2);
  return Math.max(minA, minB) <= Math.min(maxA, maxB);
}

function isVerticalSegment(segment: Segment) {
  return Math.abs(segment.a.x - segment.b.x) < 1;
}

function isHorizontalSegment(segment: Segment) {
  return Math.abs(segment.a.y - segment.b.y) < 1;
}

function pointsAreClose(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 2;
}

function pointInsideRect(point: Point, rect: Rect) {
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

function padRect(rect: Rect, padding: number): Rect {
  return createRect(
    rect.id,
    rect.x - padding,
    rect.y - padding,
    rect.width + padding * 2,
    rect.height + padding * 2,
  );
}
