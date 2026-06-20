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

export type VisualObstacleRect = {
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
type Rect = VisualObstacleRect;
export type VisualRouteSegment = {
  edgeId: string;
  a: Point;
  b: Point;
};
type RouteEvaluation = {
  points: Point[];
  score: number;
  intersects: number;
  overlaps: number;
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
const DEFAULT_OBSTACLE_PADDING = 20;
const OBSTACLE_ROUTE_GAP = 28;
const FALLBACK_ROUTE_PENALTY = 100_000;

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

  const currentSourceHandle = normalizeHandle(edgeData?.sourceHandle ?? edge.sourceHandle);
  const currentTargetHandle = normalizeHandle(edgeData?.targetHandle ?? edge.targetHandle);

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

    const currentSourceHandle = normalizeHandle(data?.sourceHandle ?? edge.sourceHandle);
    const currentTargetHandle = normalizeHandle(data?.targetHandle ?? edge.targetHandle);
    const sourceIsAuto = shouldUseSmartHandle(currentSourceHandle);
    const targetIsAuto = shouldUseSmartHandle(currentTargetHandle);
    const routeIsAuto = data?.routing?.mode !== "manual";

    const distributedHandles =
      routeIsAuto && sourceIsAuto && targetIsAuto
        ? getParallelDistributedHandles(edge, edges, source, target)
        : null;

    const handles =
      distributedHandles ??
      (routeIsAuto && (sourceIsAuto || targetIsAuto)
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
            sourceHandle: handleOrFallback(
              currentSourceHandle,
              getFallbackHandles(source, target).sourceHandle,
            ),
            targetHandle: handleOrFallback(
              currentTargetHandle,
              getFallbackHandles(source, target).targetHandle,
            ),
          });

    const polyline = getOrthogonalPolyline(
      source,
      target,
      handles.sourceHandle,
      handles.targetHandle,
    );
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
            sourceHandle: sourceIsAuto ? "auto" : handles.sourceHandle,
            targetHandle: targetIsAuto ? "auto" : handles.targetHandle,
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

export function getNodeObstacleRects(
  nodes: Node[],
  padding = DEFAULT_OBSTACLE_PADDING,
): VisualObstacleRect[] {
  return nodes.map((node) => inflateRect(reactFlowNodeToRect(node), padding));
}

export function routeAvoidingObstacles({
  edgeId,
  source,
  sourceClearance,
  laneCenter,
  targetClearance,
  target,
  useLaneCenter,
  obstacles,
  occupiedSegments = [],
  sourceObstacleId,
  targetObstacleId,
}: {
  edgeId?: string;
  source: Point;
  sourceClearance: Point;
  laneCenter: Point;
  targetClearance: Point;
  target: Point;
  useLaneCenter: boolean;
  obstacles: VisualObstacleRect[];
  occupiedSegments?: VisualRouteSegment[];
  sourceObstacleId?: string;
  targetObstacleId?: string;
}): Point[] {
  const safeObstacles = obstacles.filter((obstacle) => obstacle.width > 0 && obstacle.height > 0);
  const nearbyOccupiedSegments = getNearbyOccupiedSegments(
    occupiedSegments,
    sourceClearance,
    targetClearance,
  );
  const evaluationOptions = {
    edgeId,
    laneCenter,
    obstacles: safeObstacles,
    occupiedSegments: nearbyOccupiedSegments,
    sourceObstacleId,
    targetObstacleId,
  };
  const fastBest = getBestRouteCandidate(
    getFastRouteCandidates({
      source,
      sourceClearance,
      laneCenter,
      targetClearance,
      target,
      useLaneCenter,
    }),
    evaluationOptions,
  );

  if (isPerfectRoute(fastBest)) return fastBest.points;

  const candidates = getObstacleRouteCandidates({
    source,
    sourceClearance,
    laneCenter,
    targetClearance,
    target,
    useLaneCenter,
    obstacles: safeObstacles,
    occupiedSegments: nearbyOccupiedSegments,
  });
  const routedBest = getBestRouteCandidate(candidates, evaluationOptions);
  if (isPerfectRoute(routedBest)) return routedBest.points;

  const overlapCandidates = getObstacleRouteCandidates({
    source,
    sourceClearance,
    laneCenter,
    targetClearance,
    target,
    useLaneCenter,
    obstacles: safeObstacles,
    occupiedSegments: nearbyOccupiedSegments,
    includeOverlapVariants: true,
  });
  const overlapBest = getBestRouteCandidate(overlapCandidates, evaluationOptions);
  if (isPerfectRoute(overlapBest)) return overlapBest.points;

  const fallbackSeed = overlapBest?.points ?? routedBest?.points ?? fastBest?.points;
  const nudgedBest = fallbackSeed
    ? getBestRouteCandidate(
        [
          ...expandCandidatesWithNudges([fallbackSeed]),
          ...expandCandidatePointNudges(fallbackSeed),
        ],
        evaluationOptions,
      )
    : null;
  const best = [fastBest, routedBest, overlapBest, nudgedBest].reduce<RouteEvaluation | null>(
    (currentBest, candidate) => getBetterRoute(currentBest, candidate),
    null,
  );

  return best?.points ?? normalizePolyline([source, sourceClearance, targetClearance, target]);
}

export function pathIntersectsAnyObstacle(points: Point[], obstacles: VisualObstacleRect[]) {
  return countPathObstacleIntersections(points, obstacles) > 0;
}

export function toVisualRouteSegments(edgeId: string, points: Point[]): VisualRouteSegment[] {
  return getSegments(points).map((segment) => ({
    edgeId,
    a: segment.a,
    b: segment.b,
  }));
}

function getParallelDistributedHandles(
  edge: RoutableEdge,
  edges: RoutableEdge[],
  source: Rect,
  target: Rect,
): SmartHandles | null {
  if (!edge.id) return null;

  const group = edges
    .filter((candidate) => {
      if (!candidate.id) return false;
      if (!isAutoRoutableEdge(candidate)) return false;
      return (
        getParallelPairKey(candidate.source, candidate.target) ===
        getParallelPairKey(edge.source, edge.target)
      );
    })
    .sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));

  if (group.length <= 1) return null;

  const index = group.findIndex((candidate) => candidate.id === edge.id);
  if (index < 0) return null;

  const lane = getParallelLaneIndex(index, group.length);
  const sides = getPreferredOppositeSides(source, target);
  const sourceHandles = getHandlesForSide(sides.sourceSide);
  const targetHandles = getHandlesForSide(sides.targetSide);

  return {
    sourceHandle: sourceHandles[lane] ?? sourceHandles[1] ?? sourceHandles[0]!,
    targetHandle: targetHandles[lane] ?? targetHandles[1] ?? targetHandles[0]!,
  };
}

function isAutoRoutableEdge(edge: RoutableEdge) {
  const data = edge.data as Partial<FluxoEdgeData> | undefined;
  if (data?.routing?.mode === "manual") return false;

  const sourceHandle = normalizeHandle(data?.sourceHandle ?? edge.sourceHandle);
  const targetHandle = normalizeHandle(data?.targetHandle ?? edge.targetHandle);

  return shouldUseSmartHandle(sourceHandle) && shouldUseSmartHandle(targetHandle);
}

function getParallelPairKey(source: string, target: string) {
  return [source, target].sort().join("::");
}

function getParallelLaneIndex(index: number, total: number) {
  if (total <= 1) return 1;
  if (total === 2) return index === 0 ? 0 : 2;
  if (total === 3) return index;

  return index % 3;
}

function getPreferredOppositeSides(
  source: Rect,
  target: Rect,
): {
  sourceSide: HandleSide;
  targetSide: HandleSide;
} {
  const dx = target.centerX - source.centerX;
  const dy = target.centerY - source.centerY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceSide: "right", targetSide: "left" }
      : { sourceSide: "left", targetSide: "right" };
  }

  return dy >= 0
    ? { sourceSide: "bottom", targetSide: "top" }
    : { sourceSide: "top", targetSide: "bottom" };
}

function getHandlesForSide(side: HandleSide): PhysicalHandle[] {
  switch (side) {
    case "right":
      return ["right-top", "right", "right-bottom"];
    case "left":
      return ["left-top", "left", "left-bottom"];
    case "top":
      return ["top-left", "top", "top-right"];
    case "bottom":
      return ["bottom-left", "bottom", "bottom-right"];
  }
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
      const polyline = getOrthogonalPolyline(
        source,
        target,
        handles.sourceHandle,
        handles.targetHandle,
      );
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
      if (
        route.sourceHandle === handles.sourceHandle &&
        route.targetHandle === handles.targetHandle
      ) {
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

function scorePolylineAgainstNodes(
  polyline: Point[],
  rects: Rect[],
  sourceId: string,
  targetId: string,
) {
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
    return (
      !previous || Math.abs(previous.x - point.x) > 0.5 || Math.abs(previous.y - point.y) > 0.5
    );
  });
}

function getFastRouteCandidates({
  source,
  sourceClearance,
  laneCenter,
  targetClearance,
  target,
  useLaneCenter,
}: {
  source: Point;
  sourceClearance: Point;
  laneCenter: Point;
  targetClearance: Point;
  target: Point;
  useLaneCenter: boolean;
}) {
  const withEndpoints = (middle: Point[]) => [
    source,
    sourceClearance,
    ...middle,
    targetClearance,
    target,
  ];
  const candidates = [
    withEndpoints([{ x: targetClearance.x, y: sourceClearance.y }]),
    withEndpoints([{ x: sourceClearance.x, y: targetClearance.y }]),
  ];

  if (useLaneCenter) {
    candidates.unshift(
      withEndpoints([
        { x: laneCenter.x, y: sourceClearance.y },
        { x: laneCenter.x, y: targetClearance.y },
      ]),
      withEndpoints([
        { x: sourceClearance.x, y: laneCenter.y },
        { x: targetClearance.x, y: laneCenter.y },
      ]),
    );
  }

  return candidates;
}

function getBestRouteCandidate(
  candidates: Point[][],
  {
    edgeId,
    laneCenter,
    obstacles,
    occupiedSegments,
    sourceObstacleId,
    targetObstacleId,
  }: {
    edgeId?: string;
    laneCenter: Point;
    obstacles: VisualObstacleRect[];
    occupiedSegments: VisualRouteSegment[];
    sourceObstacleId?: string;
    targetObstacleId?: string;
  },
) {
  let best: RouteEvaluation | null = null;

  for (const candidate of candidates) {
    const points = normalizePolyline(candidate);
    const intersects = countPathObstacleIntersections(points, obstacles, {
      sourceObstacleId,
      targetObstacleId,
    });
    const overlaps = countRouteSegmentOverlaps(points, occupiedSegments, edgeId);
    const evaluated = {
      points,
      intersects,
      overlaps,
      score: scoreObstacleRoute(points, laneCenter, intersects, overlaps),
    };
    best = getBetterRoute(best, evaluated);
  }

  return best;
}

function getBetterRoute(current: RouteEvaluation | null, candidate: RouteEvaluation | null) {
  if (!candidate) return current;
  if (!current) return candidate;
  if (candidate.intersects !== current.intersects) {
    return candidate.intersects < current.intersects ? candidate : current;
  }
  if (candidate.overlaps !== current.overlaps) {
    return candidate.overlaps < current.overlaps ? candidate : current;
  }
  return candidate.score < current.score ? candidate : current;
}

function isPerfectRoute(route: RouteEvaluation | null): route is RouteEvaluation {
  return Boolean(route && route.intersects === 0 && route.overlaps === 0);
}

function getNearbyOccupiedSegments(
  occupiedSegments: VisualRouteSegment[],
  source: Point,
  target: Point,
) {
  const margin = 120;
  const left = Math.min(source.x, target.x) - margin;
  const right = Math.max(source.x, target.x) + margin;
  const top = Math.min(source.y, target.y) - margin;
  const bottom = Math.max(source.y, target.y) + margin;

  return occupiedSegments.filter((segment) => {
    const segmentLeft = Math.min(segment.a.x, segment.b.x);
    const segmentRight = Math.max(segment.a.x, segment.b.x);
    const segmentTop = Math.min(segment.a.y, segment.b.y);
    const segmentBottom = Math.max(segment.a.y, segment.b.y);
    return (
      segmentRight >= left && segmentLeft <= right && segmentBottom >= top && segmentTop <= bottom
    );
  });
}

function getObstacleRouteCandidates({
  source,
  sourceClearance,
  laneCenter,
  targetClearance,
  target,
  useLaneCenter,
  obstacles,
  occupiedSegments,
  includeOverlapVariants = false,
}: {
  source: Point;
  sourceClearance: Point;
  laneCenter: Point;
  targetClearance: Point;
  target: Point;
  useLaneCenter: boolean;
  obstacles: VisualObstacleRect[];
  occupiedSegments: VisualRouteSegment[];
  includeOverlapVariants?: boolean;
}): Point[][] {
  const start = sourceClearance;
  const end = targetClearance;
  const candidates: Point[][] = [];
  const withEndpoints = (middle: Point[]) => [source, start, ...middle, end, target];
  const horizontalLaneNudge = clampRouteNudge(laneCenter.y - (start.y + end.y) / 2);
  const verticalLaneNudge = clampRouteNudge(laneCenter.x - (start.x + end.x) / 2);

  if (useLaneCenter) {
    candidates.push(
      withEndpoints([
        { x: laneCenter.x, y: start.y },
        { x: laneCenter.x, y: end.y },
      ]),
    );
    candidates.push(
      withEndpoints([
        { x: start.x, y: laneCenter.y },
        { x: end.x, y: laneCenter.y },
      ]),
    );
  }
  candidates.push(withEndpoints([{ x: end.x, y: start.y }]));
  candidates.push(withEndpoints([{ x: start.x, y: end.y }]));

  const yCorridors = getCorridorValues(
    [
      start.y,
      end.y,
      laneCenter.y,
      start.y + verticalLaneNudge,
      end.y + verticalLaneNudge,
      ...getClosestCorridorValues(getOccupiedHorizontalCorridors(occupiedSegments), start.y, end.y),
      ...obstacles.flatMap((obstacle) => [
        obstacle.top - OBSTACLE_ROUTE_GAP,
        obstacle.bottom + OBSTACLE_ROUTE_GAP,
      ]),
      getOuterTop(obstacles, start, end) - OBSTACLE_ROUTE_GAP,
      getOuterBottom(obstacles, start, end) + OBSTACLE_ROUTE_GAP,
    ],
    start.y,
    end.y,
  );
  const xCorridors = getCorridorValues(
    [
      start.x,
      end.x,
      laneCenter.x,
      start.x + horizontalLaneNudge,
      end.x + horizontalLaneNudge,
      ...getClosestCorridorValues(getOccupiedVerticalCorridors(occupiedSegments), start.x, end.x),
      ...obstacles.flatMap((obstacle) => [
        obstacle.left - OBSTACLE_ROUTE_GAP,
        obstacle.right + OBSTACLE_ROUTE_GAP,
      ]),
      getOuterLeft(obstacles, start, end) - OBSTACLE_ROUTE_GAP,
      getOuterRight(obstacles, start, end) + OBSTACLE_ROUTE_GAP,
    ],
    start.x,
    end.x,
  );

  for (const y of yCorridors) {
    candidates.push(
      withEndpoints([
        { x: start.x, y },
        { x: end.x, y },
      ]),
    );
    if (includeOverlapVariants) {
      candidates.push(...getOffsetHorizontalCandidates(withEndpoints, start, end, y));
      candidates.push(...getSkewedHorizontalCandidates(withEndpoints, start, end, y));
    }
    if (Math.abs(horizontalLaneNudge) >= 4) {
      candidates.push(
        withEndpoints([
          { x: start.x + horizontalLaneNudge, y: start.y },
          { x: start.x + horizontalLaneNudge, y },
          { x: end.x + horizontalLaneNudge, y },
          { x: end.x + horizontalLaneNudge, y: end.y },
        ]),
      );
    }
  }

  for (const x of xCorridors) {
    candidates.push(
      withEndpoints([
        { x, y: start.y },
        { x, y: end.y },
      ]),
    );
    if (includeOverlapVariants) {
      candidates.push(...getOffsetVerticalCandidates(withEndpoints, start, end, x));
      candidates.push(...getSkewedVerticalCandidates(withEndpoints, start, end, x));
    }
    if (Math.abs(verticalLaneNudge) >= 4) {
      candidates.push(
        withEndpoints([
          { x: start.x, y: start.y + verticalLaneNudge },
          { x, y: start.y + verticalLaneNudge },
          { x, y: end.y + verticalLaneNudge },
          { x: end.x, y: end.y + verticalLaneNudge },
        ]),
      );
    }
  }

  for (const y of yCorridors.slice(0, 8)) {
    for (const x of xCorridors.slice(0, 8)) {
      candidates.push(
        withEndpoints([
          { x: start.x, y },
          { x, y },
          { x, y: end.y },
        ]),
      );
      candidates.push(
        withEndpoints([
          { x, y: start.y },
          { x, y },
          { x: end.x, y },
        ]),
      );
    }
  }

  return candidates;
}

function getOffsetHorizontalCandidates(
  withEndpoints: (middle: Point[]) => Point[],
  start: Point,
  end: Point,
  y: number,
) {
  return getRouteSkews().map((offset) =>
    withEndpoints([
      { x: start.x + offset, y: start.y },
      { x: start.x + offset, y },
      { x: end.x + offset, y },
      { x: end.x + offset, y: end.y },
    ]),
  );
}

function getOffsetVerticalCandidates(
  withEndpoints: (middle: Point[]) => Point[],
  start: Point,
  end: Point,
  x: number,
) {
  return getRouteSkews().map((offset) =>
    withEndpoints([
      { x: start.x, y: start.y + offset },
      { x, y: start.y + offset },
      { x, y: end.y + offset },
      { x: end.x, y: end.y + offset },
    ]),
  );
}

function getSkewedHorizontalCandidates(
  withEndpoints: (middle: Point[]) => Point[],
  start: Point,
  end: Point,
  y: number,
) {
  const midpointX = (start.x + end.x) / 2;
  return getRouteSkews().map((skew) =>
    withEndpoints([
      { x: start.x, y },
      { x: midpointX, y: y + skew },
      { x: end.x, y },
    ]),
  );
}

function getSkewedVerticalCandidates(
  withEndpoints: (middle: Point[]) => Point[],
  start: Point,
  end: Point,
  x: number,
) {
  const midpointY = (start.y + end.y) / 2;
  return getRouteSkews().map((skew) =>
    withEndpoints([
      { x, y: start.y },
      { x: x + skew, y: midpointY },
      { x, y: end.y },
    ]),
  );
}

function getRouteSkews() {
  return [6, -6, 10, -10, 14, -14];
}

function expandCandidatePointNudges(candidate: Point[]) {
  const expanded: Point[][] = [];

  for (let index = 1; index < candidate.length - 1; index += 1) {
    for (const nudge of getRouteSkews()) {
      expanded.push(
        candidate.map((point, pointIndex) =>
          pointIndex === index ? { x: point.x + nudge, y: point.y } : point,
        ),
      );
      expanded.push(
        candidate.map((point, pointIndex) =>
          pointIndex === index ? { x: point.x, y: point.y + nudge } : point,
        ),
      );
    }
  }

  return expanded;
}

function getOccupiedVerticalCorridors(occupiedSegments: VisualRouteSegment[]) {
  return occupiedSegments.flatMap((segment) => {
    if (!isVerticalSegment(segment)) return [];
    return getAdjacentCorridorValues(segment.a.x);
  });
}

function getOccupiedHorizontalCorridors(occupiedSegments: VisualRouteSegment[]) {
  return occupiedSegments.flatMap((segment) => {
    if (!isHorizontalSegment(segment)) return [];
    return getAdjacentCorridorValues(segment.a.y);
  });
}

function getAdjacentCorridorValues(value: number) {
  return [8, 12, 16, 20, 24].flatMap((gap) => [value - gap, value + gap]);
}

function expandCandidatesWithNudges(candidates: Point[][]) {
  const nudges = [
    { x: 12, y: 0 },
    { x: -12, y: 0 },
    { x: 18, y: 0 },
    { x: -18, y: 0 },
    { x: 0, y: 12 },
    { x: 0, y: -12 },
    { x: 0, y: 18 },
    { x: 0, y: -18 },
  ];
  const expanded = [...candidates];

  for (const candidate of candidates) {
    if (candidate.length < 4) continue;

    for (const nudge of nudges) {
      expanded.push(
        candidate.map((point, index) => {
          if (index === 0 || index === candidate.length - 1) return point;
          return {
            x: point.x + nudge.x,
            y: point.y + nudge.y,
          };
        }),
      );
    }
  }

  return expanded;
}

function clampRouteNudge(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-72, Math.min(72, value));
}

function getCorridorValues(values: number[], start: number, end: number) {
  const midpoint = (start + end) / 2;
  return [...new Set(values.filter(Number.isFinite).map((value) => Math.round(value)))].sort(
    (a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint),
  );
}

function getClosestCorridorValues(values: number[], start: number, end: number) {
  const midpoint = (start + end) / 2;
  return [...new Set(values.filter(Number.isFinite).map((value) => Math.round(value)))]
    .sort((a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint))
    .slice(0, 24);
}

function getOuterTop(obstacles: VisualObstacleRect[], start: Point, end: Point) {
  return Math.min(start.y, end.y, ...obstacles.map((obstacle) => obstacle.top));
}

function getOuterBottom(obstacles: VisualObstacleRect[], start: Point, end: Point) {
  return Math.max(start.y, end.y, ...obstacles.map((obstacle) => obstacle.bottom));
}

function getOuterLeft(obstacles: VisualObstacleRect[], start: Point, end: Point) {
  return Math.min(start.x, end.x, ...obstacles.map((obstacle) => obstacle.left));
}

function getOuterRight(obstacles: VisualObstacleRect[], start: Point, end: Point) {
  return Math.max(start.x, end.x, ...obstacles.map((obstacle) => obstacle.right));
}

function countPathObstacleIntersections(
  points: Point[],
  obstacles: VisualObstacleRect[],
  options: { sourceObstacleId?: string; targetObstacleId?: string } = {},
) {
  let count = 0;
  const segments = getSegments(points);

  for (const [segmentIndex, segment] of segments.entries()) {
    for (const obstacle of obstacles) {
      if (
        isControlledEndpointIntersection({
          obstacleId: obstacle.id,
          segmentIndex,
          segmentCount: segments.length,
          sourceObstacleId: options.sourceObstacleId,
          targetObstacleId: options.targetObstacleId,
        })
      ) {
        continue;
      }

      if (segmentIntersectsRect(segment, obstacle)) count += 1;
    }
  }

  return count;
}

function isControlledEndpointIntersection({
  obstacleId,
  segmentIndex,
  segmentCount,
  sourceObstacleId,
  targetObstacleId,
}: {
  obstacleId: string;
  segmentIndex: number;
  segmentCount: number;
  sourceObstacleId?: string;
  targetObstacleId?: string;
}) {
  if (sourceObstacleId && obstacleId === sourceObstacleId && segmentIndex === 0) {
    return true;
  }

  if (targetObstacleId && obstacleId === targetObstacleId && segmentIndex === segmentCount - 1) {
    return true;
  }

  return false;
}

function scoreObstacleRoute(
  points: Point[],
  laneCenter: Point,
  intersects: number,
  overlaps: number,
) {
  const length = getPathLength(points);
  const bends = Math.max(0, points.length - 2);
  const labelPoint = getPolylineMidpoint(points);
  const laneDistance = Math.hypot(labelPoint.x - laneCenter.x, labelPoint.y - laneCenter.y);

  return (
    intersects * FALLBACK_ROUTE_PENALTY +
    overlaps * 60_000 +
    length +
    bends * 28 +
    laneDistance * 0.18
  );
}

function countRouteSegmentOverlaps(
  points: Point[],
  occupiedSegments: VisualRouteSegment[],
  edgeId?: string,
) {
  let count = 0;

  for (const segment of getSegments(points)) {
    for (const occupied of occupiedSegments) {
      if (edgeId && occupied.edgeId === edgeId) continue;
      if (visualSegmentsOverlap(segment, occupied)) count += 1;
    }
  }

  return count;
}

function visualSegmentsOverlap(segment: Segment, occupied: VisualRouteSegment) {
  const other = { a: occupied.a, b: occupied.b };

  if (isHorizontalSegment(segment) && isHorizontalSegment(other)) {
    if (Math.abs(segment.a.y - other.a.y) >= 4) return false;
    return rangeOverlapLength(segment.a.x, segment.b.x, other.a.x, other.b.x) > 12;
  }

  if (isVerticalSegment(segment) && isVerticalSegment(other)) {
    if (Math.abs(segment.a.x - other.a.x) >= 4) return false;
    return rangeOverlapLength(segment.a.y, segment.b.y, other.a.y, other.b.y) > 12;
  }

  return false;
}

function rangeOverlapLength(a1: number, a2: number, b1: number, b2: number) {
  const minA = Math.min(a1, a2);
  const maxA = Math.max(a1, a2);
  const minB = Math.min(b1, b2);
  const maxB = Math.max(b1, b2);
  return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
}

function getPathLength(points: Point[]) {
  return getSegments(points).reduce(
    (total, segment) => total + Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y),
    0,
  );
}

function getPolylineMidpoint(points: Point[]): Point {
  if (points.length <= 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0]!;

  const totalLength = getPathLength(points);
  let remaining = totalLength / 2;

  for (const segment of getSegments(points)) {
    const length = Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y);
    if (remaining <= length) {
      const progress = length === 0 ? 0 : remaining / length;
      return {
        x: segment.a.x + (segment.b.x - segment.a.x) * progress,
        y: segment.a.y + (segment.b.y - segment.a.y) * progress,
      };
    }
    remaining -= length;
  }

  return points[points.length - 1]!;
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
  return typeof value === "string" && PHYSICAL_HANDLE_IDS.has(value)
    ? (value as PhysicalHandle)
    : "auto";
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
    return (
      Math.abs(first.a.x - second.a.x) < 2 &&
      rangesOverlap(first.a.y, first.b.y, second.a.y, second.b.y)
    );
  }

  if (isHorizontalSegment(first) && isHorizontalSegment(second)) {
    return (
      Math.abs(first.a.y - second.a.y) < 2 &&
      rangesOverlap(first.a.x, first.b.x, second.a.x, second.b.x)
    );
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
  const right: Segment = {
    a: { x: rect.right, y: rect.top },
    b: { x: rect.right, y: rect.bottom },
  };
  const bottom: Segment = {
    a: { x: rect.right, y: rect.bottom },
    b: { x: rect.left, y: rect.bottom },
  };
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

function inflateRect(rect: Rect, padding: number): Rect {
  return createRect(
    rect.id,
    rect.x - padding,
    rect.y - padding,
    rect.width + padding * 2,
    rect.height + padding * 2,
  );
}

function padRect(rect: Rect, padding: number): Rect {
  return inflateRect(rect, padding);
}
