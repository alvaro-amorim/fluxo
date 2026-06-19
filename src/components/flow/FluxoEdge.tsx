import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

import { normalizeManualRoutePoints, type ManualRoutePoint } from "@/lib/flow/edgeRouting";
import type { EdgeLineType, FluxoEdgeData } from "@/lib/flow/types";

type EdgePath = [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number];
type Point = ManualRoutePoint;

const MAX_LANE_OFFSET = 72;
const ENDPOINT_LANE_OFFSET_FACTOR = 0.34;
const MIN_ENDPOINT_LANE_OFFSET = 4;
const MAX_ENDPOINT_LANE_OFFSET = 18;
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
  hasMarkerStart?: boolean;
  hasMarkerEnd?: boolean;
  strokeWidth?: number;
}): EdgePath {
  const normalizedManualPoints = normalizeManualRoutePoints(manualPoints);
  const laneOffset =
    visualLaneCount && visualLaneCount > 1 && visualLaneOffset
      ? clampLaneOffset(visualLaneOffset)
      : 0;
  const offset = getPerpendicularOffset(sourceX, sourceY, targetX, targetY, laneOffset);
  const { source: visualSource, target: visualTarget } = getVisualEdgeEndpoints({
    sourceX,
    sourceY,
    targetX,
    targetY,
    laneOffset,
    hasMarkerStart: Boolean(hasMarkerStart),
    hasMarkerEnd: Boolean(hasMarkerEnd),
    strokeWidth: strokeWidth ?? 2,
  });
  const laneCenter = {
    x: (sourceX + targetX) / 2 + offset.x,
    y: (sourceY + targetY) / 2 + offset.y,
  };

  if (normalizedManualPoints.length > 0) {
    return getManualPath({
      sourceX: visualSource.x,
      sourceY: visualSource.y,
      targetX: visualTarget.x,
      targetY: visualTarget.y,
      manualPoints:
        laneOffset && Math.abs(laneOffset) > 0.5
          ? normalizedManualPoints.map((point) => ({
              x: point.x + offset.x,
              y: point.y + offset.y,
            }))
          : normalizedManualPoints,
    });
  }

  if (lineType === "straight") {
    if (laneOffset && Math.abs(laneOffset) > 0.5) {
      return getStraightPath({
        sourceX: visualSource.x,
        sourceY: visualSource.y,
        targetX: visualTarget.x,
        targetY: visualTarget.y,
      });
    }

    return getStraightPath({ sourceX, sourceY, targetX, targetY });
  }

  if (lineType === "bezier") {
    if (laneOffset && Math.abs(laneOffset) > 0.5) {
      return getQuadraticPath({
        sourceX: visualSource.x,
        sourceY: visualSource.y,
        targetX: visualTarget.x,
        targetY: visualTarget.y,
        controlX: laneCenter.x,
        controlY: laneCenter.y,
      });
    }

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
    centerX: laneOffset && Math.abs(laneOffset) > 0.5 ? laneCenter.x : undefined,
    centerY: laneOffset && Math.abs(laneOffset) > 0.5 ? laneCenter.y : undefined,
  });
}

function clampLaneOffset(offset: number) {
  return Math.max(-MAX_LANE_OFFSET, Math.min(MAX_LANE_OFFSET, offset));
}

function getEndpointLaneOffset(offset: number) {
  if (!offset) return 0;

  const direction = Math.sign(offset);
  const magnitude = Math.min(
    MAX_ENDPOINT_LANE_OFFSET,
    Math.max(MIN_ENDPOINT_LANE_OFFSET, Math.abs(offset) * ENDPOINT_LANE_OFFSET_FACTOR),
  );

  return direction * magnitude;
}

function getVisualEdgeEndpoints({
  sourceX,
  sourceY,
  targetX,
  targetY,
  laneOffset,
  hasMarkerStart,
  hasMarkerEnd,
  strokeWidth,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  laneOffset: number;
  hasMarkerStart: boolean;
  hasMarkerEnd: boolean;
  strokeWidth: number;
}): { source: Point; target: Point } {
  const endpointOffset = getPerpendicularOffset(
    sourceX,
    sourceY,
    targetX,
    targetY,
    getEndpointLaneOffset(laneOffset),
  );
  const source = {
    x: sourceX + endpointOffset.x,
    y: sourceY + endpointOffset.y,
  };
  const target = {
    x: targetX + endpointOffset.x,
    y: targetY + endpointOffset.y,
  };

  const sourceNudge = hasMarkerStart ? 0 : Math.min(SOURCE_STROKE_NUDGE, strokeWidth * 0.35);
  const targetNudge = hasMarkerEnd ? 0 : 0;

  return {
    source: movePointAlongVector(source, target, sourceNudge),
    target: movePointAlongVector(target, source, targetNudge),
  };
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

function getQuadraticPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  controlX,
  controlY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  controlX: number;
  controlY: number;
}): EdgePath {
  const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;
  return [path, controlX, controlY, Math.abs(controlX - sourceX), Math.abs(controlY - sourceY)];
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
