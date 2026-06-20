import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

import {
  normalizeManualRoutePoints,
  routeAvoidingObstacles,
  type ManualRoutePoint,
  type VisualObstacleRect,
} from "@/lib/flow/edgeRouting";
import type { EdgeLineType, FluxoEdgeData } from "@/lib/flow/types";

type EdgePath = [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number];
type Point = ManualRoutePoint;

const MAX_LANE_OFFSET = 72;
const EDGE_CLEARANCE = 36;
const SOURCE_STROKE_NUDGE = 0.75;

export function FluxoEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    markerEnd,
    style,
    selected,
  } = props;
  const data = props.data as FluxoEdgeData | undefined;
  const lineType = data?.lineType ?? "orthogonal";
  const stroke = style?.stroke ?? data?.style?.stroke ?? "#64748b";
  const strokeWidth = Number(style?.strokeWidth ?? data?.style?.strokeWidth ?? 2);
  const manualPoints = normalizeManualRoutePoints(
    data?.routing?.mode === "manual" ? data.routing.points : [],
  );
  const visualLaneOffset =
    typeof data?.__visualLaneOffset === "number" ? data.__visualLaneOffset : 0;
  const visualLaneCount = typeof data?.__visualLaneCount === "number" ? data.__visualLaneCount : 1;
  const visualSourcePoint = getVisualPoint(data?.__visualSourcePoint);
  const visualTargetPoint = getVisualPoint(data?.__visualTargetPoint);
  const visualObstacleRects = getVisualObstacleRects(data?.__visualObstacleRects);
  const visualRoutePoints = getVisualRoutePoints(data?.__visualRoutePoints);
  const visualSourceObstacleId =
    typeof data?.__visualSourceObstacleId === "string" ? data.__visualSourceObstacleId : undefined;
  const visualTargetObstacleId =
    typeof data?.__visualTargetObstacleId === "string" ? data.__visualTargetObstacleId : undefined;
  const [path, labelX, labelY] = getFluxoEdgePath({
    lineType,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    manualPoints,
    visualLaneOffset,
    visualLaneCount,
    visualSourcePoint,
    visualTargetPoint,
    visualObstacleRects,
    visualRoutePoints,
    visualSourceObstacleId,
    visualTargetObstacleId,
    hasMarkerStart: Boolean(markerStart),
    hasMarkerEnd: Boolean(markerEnd),
    strokeWidth,
  });

  const label = data?.label;
  const hiddenInfo = data?.hiddenInfo;
  const hasLabel = Boolean(label?.trim());
  const hasHiddenInfo = Boolean(hiddenInfo?.trim());

  return (
    <>
      <BaseEdge
        id={`${id}-interaction`}
        path={path}
        interactionWidth={30}
        style={{
          stroke: "transparent",
          strokeWidth: 22,
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          stroke: selected ? "var(--brand)" : stroke,
          strokeWidth: selected ? Math.max(strokeWidth + 0.75, 2.75) : strokeWidth,
          strokeDasharray: style?.strokeDasharray,
          filter: selected ? "drop-shadow(0 1px 3px rgba(0,0,0,0.25))" : undefined,
        }}
      />

      {manualPoints.length > 0 && selected ? (
        <EdgeLabelRenderer>
          {manualPoints.map((point, index) => (
            <div
              key={`${id}-manual-point-${index}`}
              data-route-point-index={index}
              className="nodrag nopan pointer-events-auto absolute flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-background bg-brand text-[7px] font-semibold leading-none text-background shadow-sm transition hover:scale-125 active:cursor-grabbing"
              style={{
                transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              }}
              title={`Ponto manual ${index + 1} — preparado para edição visual futura`}
            >
              {index + 1}
            </div>
          ))}
        </EdgeLabelRenderer>
      ) : null}

      {hasLabel || hasHiddenInfo ? (
        <EdgeLabelRenderer>
          <div
            className={`nodrag nopan absolute max-w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-[11px] leading-none shadow-sm backdrop-blur-sm transition ${
              selected
                ? "border-brand/60 bg-card text-foreground ring-2 ring-brand/10"
                : "border-border/80 bg-card/95 text-foreground/90"
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: selected ? "auto" : "none",
            }}
            title={hiddenInfo || label || "Duplo clique para editar a conexão"}
          >
            <span className="flex max-w-[240px] items-center gap-1.5 truncate">
              {hasHiddenInfo ? (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70"
                  aria-hidden="true"
                />
              ) : null}
              <span className={`truncate ${hasLabel ? "font-medium" : "text-muted-foreground"}`}>
                {hasLabel ? label : "Info"}
              </span>
            </span>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function getFluxoEdgePath({
  lineType,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  manualPoints,
  visualLaneOffset,
  visualLaneCount,
  visualSourcePoint,
  visualTargetPoint,
  visualObstacleRects,
  visualRoutePoints,
  visualSourceObstacleId,
  visualTargetObstacleId,
  hasMarkerStart,
  hasMarkerEnd,
  strokeWidth,
}: {
  lineType: EdgeLineType;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps["sourcePosition"];
  targetPosition: EdgeProps["targetPosition"];
  manualPoints: Point[];
  visualLaneOffset?: number;
  visualLaneCount?: number;
  visualSourcePoint?: Point;
  visualTargetPoint?: Point;
  visualObstacleRects?: VisualObstacleRect[];
  visualRoutePoints?: Point[];
  visualSourceObstacleId?: string;
  visualTargetObstacleId?: string;
  hasMarkerStart?: boolean;
  hasMarkerEnd?: boolean;
  strokeWidth?: number;
}): EdgePath {
  const normalizedManualPoints = normalizeManualRoutePoints(manualPoints);
  const laneOffset =
    visualLaneCount && visualLaneCount > 1 && visualLaneOffset
      ? clampLaneOffset(visualLaneOffset)
      : 0;
  const visualSource = visualSourcePoint ?? { x: sourceX, y: sourceY };
  const visualTarget = visualTargetPoint ?? { x: targetX, y: targetY };
  const hasVisualAnchors = Boolean(visualSourcePoint || visualTargetPoint);
  const sourceNudge = hasMarkerStart ? 0 : Math.min(SOURCE_STROKE_NUDGE, (strokeWidth ?? 2) * 0.35);
  const targetNudge = hasMarkerEnd ? 0 : 0;
  const sourceEndpoint = movePointAlongVector(visualSource, visualTarget, sourceNudge);
  const targetEndpoint = movePointAlongVector(visualTarget, visualSource, targetNudge);
  const obstacles = visualObstacleRects ?? [];
  const sourceClearance = getSafeClearancePoint(
    sourceEndpoint,
    sourcePosition,
    EDGE_CLEARANCE,
    obstacles,
    visualSourceObstacleId,
  );
  const targetClearance = getSafeClearancePoint(
    targetEndpoint,
    targetPosition,
    EDGE_CLEARANCE,
    obstacles,
    visualTargetObstacleId,
  );
  const offset = getPerpendicularOffset(
    sourceClearance.x,
    sourceClearance.y,
    targetClearance.x,
    targetClearance.y,
    laneOffset,
  );
  const laneCenter = {
    x: (sourceClearance.x + targetClearance.x) / 2 + offset.x,
    y: (sourceClearance.y + targetClearance.y) / 2 + offset.y,
  };

  if (normalizedManualPoints.length > 0) {
    return getManualPath({
      sourceX: sourceEndpoint.x,
      sourceY: sourceEndpoint.y,
      targetX: targetEndpoint.x,
      targetY: targetEndpoint.y,
      manualPoints:
        laneOffset && Math.abs(laneOffset) > 0.5
          ? normalizedManualPoints.map((point) => ({
              x: point.x + offset.x,
              y: point.y + offset.y,
            }))
          : normalizedManualPoints,
    });
  }

  if (visualRoutePoints && visualRoutePoints.length >= 2) {
    return getRoutedPath({
      points: visualRoutePoints,
    });
  }

  if (hasVisualAnchors || (laneOffset && Math.abs(laneOffset) > 0.5)) {
    const routePoints = routeAvoidingObstacles({
      source: sourceEndpoint,
      sourceClearance,
      laneCenter,
      targetClearance,
      target: targetEndpoint,
      useLaneCenter: Boolean(laneOffset && Math.abs(laneOffset) > 0.5),
      obstacles,
      sourceObstacleId: visualSourceObstacleId,
      targetObstacleId: visualTargetObstacleId,
    });

    return getRoutedPath({
      points: routePoints,
    });
  }

  if (lineType === "straight") {
    return getStraightPath({ sourceX, sourceY, targetX, targetY });
  }

  if (lineType === "bezier") {
    return getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
  }

  return getSmoothStepPath({
    sourceX: visualSource.x,
    sourceY: visualSource.y,
    targetX: visualTarget.x,
    targetY: visualTarget.y,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });
}

function clampLaneOffset(offset: number) {
  return Math.max(-MAX_LANE_OFFSET, Math.min(MAX_LANE_OFFSET, offset));
}

function movePointAlongVector(point: Point, toward: Point, distance: number): Point {
  if (!distance) return point;

  const dx = toward.x - point.x;
  const dy = toward.y - point.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return point;

  return {
    x: point.x + (dx / length) * distance,
    y: point.y + (dy / length) * distance,
  };
}

function getVisualPoint(value: unknown): Point | undefined {
  if (!value || typeof value !== "object") return undefined;
  const point = value as Partial<Point>;
  if (typeof point.x !== "number" || typeof point.y !== "number") return undefined;
  return { x: point.x, y: point.y };
}

function getVisualObstacleRects(value: unknown): VisualObstacleRect[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rect = item as Partial<VisualObstacleRect>;
      if (
        typeof rect.id !== "string" ||
        typeof rect.x !== "number" ||
        typeof rect.y !== "number" ||
        typeof rect.width !== "number" ||
        typeof rect.height !== "number" ||
        typeof rect.left !== "number" ||
        typeof rect.right !== "number" ||
        typeof rect.top !== "number" ||
        typeof rect.bottom !== "number"
      ) {
        return null;
      }

      return {
        id: rect.id,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        centerX: typeof rect.centerX === "number" ? rect.centerX : rect.x + rect.width / 2,
        centerY: typeof rect.centerY === "number" ? rect.centerY : rect.y + rect.height / 2,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    })
    .filter((rect): rect is VisualObstacleRect => Boolean(rect));
}

function getVisualRoutePoints(value: unknown): Point[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const points = value.map(getVisualPoint).filter((point): point is Point => Boolean(point));

  return points.length >= 2 ? points : undefined;
}

function getClearancePoint(point: Point, position: EdgeProps["sourcePosition"], distance: number) {
  const vector = getPositionVector(position);
  return {
    x: point.x + vector.x * distance,
    y: point.y + vector.y * distance,
  };
}

function getSafeClearancePoint(
  point: Point,
  position: EdgeProps["sourcePosition"],
  distance: number,
  obstacles: VisualObstacleRect[],
  ignoredObstacleId?: string,
) {
  const ownObstacle = ignoredObstacleId
    ? obstacles.find((obstacle) => obstacle.id === ignoredObstacleId)
    : undefined;
  const clearance = pushClearanceOutsideOwnObstacle(
    getClearancePoint(point, position, distance),
    position,
    ownObstacle,
  );
  const segment = { a: point, b: clearance };

  if (
    obstacles.some((obstacle) => {
      if (ignoredObstacleId && obstacle.id === ignoredObstacleId) return false;
      return (
        pointInsideObstacle(clearance, obstacle) ||
        axisAlignedSegmentIntersectsObstacle(segment, obstacle)
      );
    })
  ) {
    return point;
  }

  return clearance;
}

function pushClearanceOutsideOwnObstacle(
  point: Point,
  position: EdgeProps["sourcePosition"],
  obstacle: VisualObstacleRect | undefined,
) {
  if (!obstacle) return point;
  const gap = 2;

  switch (String(position)) {
    case "top":
      return { ...point, y: Math.min(point.y, obstacle.top - gap) };
    case "bottom":
      return { ...point, y: Math.max(point.y, obstacle.bottom + gap) };
    case "left":
      return { ...point, x: Math.min(point.x, obstacle.left - gap) };
    case "right":
    default:
      return { ...point, x: Math.max(point.x, obstacle.right + gap) };
  }
}

function getPositionVector(position: EdgeProps["sourcePosition"]): Point {
  switch (String(position)) {
    case "top":
      return { x: 0, y: -1 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
    default:
      return { x: 1, y: 0 };
  }
}

function pointInsideObstacle(point: Point, obstacle: VisualObstacleRect) {
  return (
    point.x > obstacle.left &&
    point.x < obstacle.right &&
    point.y > obstacle.top &&
    point.y < obstacle.bottom
  );
}

function axisAlignedSegmentIntersectsObstacle(
  segment: { a: Point; b: Point },
  obstacle: VisualObstacleRect,
) {
  if (pointInsideObstacle(segment.a, obstacle) || pointInsideObstacle(segment.b, obstacle)) {
    return true;
  }

  const minX = Math.min(segment.a.x, segment.b.x);
  const maxX = Math.max(segment.a.x, segment.b.x);
  const minY = Math.min(segment.a.y, segment.b.y);
  const maxY = Math.max(segment.a.y, segment.b.y);

  if (Math.abs(segment.a.y - segment.b.y) < 1) {
    return (
      segment.a.y > obstacle.top &&
      segment.a.y < obstacle.bottom &&
      Math.max(minX, obstacle.left) < Math.min(maxX, obstacle.right)
    );
  }

  if (Math.abs(segment.a.x - segment.b.x) < 1) {
    return (
      segment.a.x > obstacle.left &&
      segment.a.x < obstacle.right &&
      Math.max(minY, obstacle.top) < Math.min(maxY, obstacle.bottom)
    );
  }

  return false;
}

function getPerpendicularOffset(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  laneOffset: number,
): Point {
  if (!laneOffset) return { x: 0, y: 0 };

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy);
  if (length < 1) return { x: 0, y: 0 };

  return {
    x: (-dy / length) * laneOffset,
    y: (dx / length) * laneOffset,
  };
}

function getRoutedPath({ points }: { points: Point[] }): EdgePath {
  const pathPoints = compactPathPoints(points);
  const path = pathPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
    .join(" ");
  const labelPoint = getPathLabelPoint(pathPoints);

  return [path, labelPoint.x, labelPoint.y, 0, 0];
}

function getManualPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  manualPoints,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  manualPoints: Point[];
}): EdgePath {
  const pathPoints = [{ x: sourceX, y: sourceY }, ...manualPoints, { x: targetX, y: targetY }];
  const path = pathPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
    .join(" ");
  const labelPoint = getPathLabelPoint(pathPoints);

  return [path, labelPoint.x, labelPoint.y, 0, 0];
}

function compactPathPoints(points: Point[]) {
  return points.filter((point, index) => {
    if (index === 0) return true;
    const previous = points[index - 1]!;
    return Math.hypot(point.x - previous.x, point.y - previous.y) >= 1;
  });
}

function getPathLabelPoint(points: Point[]): Point {
  if (points.length <= 0) return { x: 0, y: 0 };

  if (points.length === 1) {
    return points[0] ?? { x: 0, y: 0 };
  }

  if (points.length === 2) {
    const [start, end] = points;
    return {
      x: ((start?.x ?? 0) + (end?.x ?? 0)) / 2,
      y: ((start?.y ?? 0) + (end?.y ?? 0)) / 2,
    };
  }

  let totalLength = 0;
  const segments = points.slice(1).map((point, index) => {
    const start = points[index]!;
    const length = Math.hypot(point.x - start.x, point.y - start.y);
    totalLength += length;
    return { start, end: point, length };
  });

  let remaining = totalLength / 2;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      };
    }
    remaining -= segment.length;
  }

  return points[Math.floor(points.length / 2)] ?? { x: 0, y: 0 };
}
