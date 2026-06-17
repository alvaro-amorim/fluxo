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

type EdgePath = [path: string, labelX: number, labelY: number];
type Point = ManualRoutePoint;

export function FluxoEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    selected,
  } = props;
  const data = props.data as FluxoEdgeData | undefined;
  const lineType = data?.lineType ?? "orthogonal";
  const manualPoints = normalizeManualRoutePoints(
    data?.routing?.mode === "manual" ? data.routing.points : [],
  );
  const [path, labelX, labelY] = getFluxoEdgePath({
    lineType,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    manualPoints,
  });

  const label = data?.label;
  const hiddenInfo = data?.hiddenInfo;
  const stroke = style?.stroke ?? data?.style?.stroke ?? "#64748b";
  const strokeWidth = Number(style?.strokeWidth ?? data?.style?.strokeWidth ?? 2);

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
              title={`Ponto manual ${index + 1} - preparado para edicao visual futura`}
            >
              {index + 1}
            </div>
          ))}
        </EdgeLabelRenderer>
      ) : null}

      {label || hiddenInfo ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute max-w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-foreground shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            title={hiddenInfo || "Duplo clique para editar a conexao"}
          >
            {label ? <span>{label}</span> : <span className="text-muted-foreground">Info</span>}
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
}: {
  lineType: EdgeLineType;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps["sourcePosition"];
  targetPosition: EdgeProps["targetPosition"];
  manualPoints: Point[];
}): EdgePath {
  const normalizedManualPoints = normalizeManualRoutePoints(manualPoints);

  if (normalizedManualPoints.length > 0) {
    return getManualPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      manualPoints: normalizedManualPoints,
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
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });
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

  return [path, labelPoint.x, labelPoint.y];
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
