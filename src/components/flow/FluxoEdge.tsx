import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import type { FluxoEdgeData } from "@/lib/flow/types";

export function FluxoEdge({
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
  data,
}: EdgeProps) {
  const edgeData = data as FluxoEdgeData | undefined;
  const lineType = edgeData?.lineType ?? "orthogonal";
  const routingPoints =
    edgeData?.routing?.mode === "manual" ? (edgeData.routing.points ?? []) : [];

  const [defaultPath, defaultLabelX, defaultLabelY] = getDefaultPath({
    lineType,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const manualPath = routingPoints.length
    ? buildPolylinePath(sourceX, sourceY, targetX, targetY, routingPoints)
    : null;
  const labelPoint = routingPoints.length
    ? getPolylineLabelPoint(sourceX, sourceY, targetX, targetY, routingPoints)
    : { x: defaultLabelX, y: defaultLabelY };

  const path = manualPath ?? defaultPath;
  const label = edgeData?.label;
  const hiddenInfo = edgeData?.hiddenInfo;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : (style?.strokeWidth ?? 2),
          filter: selected ? "drop-shadow(0 0 2px rgba(234, 88, 12, 0.45))" : undefined,
        }}
      />

      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        className="react-flow__edge-interaction"
      />

      {routingPoints.length ? (
        <EdgeLabelRenderer>
          {routingPoints.map((point, index) => (
            <div
              key={`${id}-point-${index}`}
              className="nodrag nopan pointer-events-none absolute h-2.5 w-2.5 rounded-full border border-brand bg-background shadow-sm"
              style={{
                transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              }}
              title="Ponto manual da rota"
            />
          ))}
        </EdgeLabelRenderer>
      ) : null}

      {label || hiddenInfo ? (
        <EdgeLabelRenderer>
          <div
            className={`nodrag nopan pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] shadow-sm backdrop-blur transition ${
              selected
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-background/90 text-foreground"
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPoint.x}px, ${labelPoint.y}px)`,
            }}
            title={hiddenInfo || label || "Conexão"}
          >
            {label || "..."}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function getDefaultPath({
  lineType,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: {
  lineType: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps["sourcePosition"];
  targetPosition: EdgeProps["targetPosition"];
}) {
  if (lineType === "straight") {
    return getStraightPath({ sourceX, sourceY, targetX, targetY });
  }

  if (lineType === "bezier" || lineType === "smooth") {
    return getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  }

  return getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
}

function buildPolylinePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  points: Array<{ x: number; y: number }>,
) {
  const segments = [`M ${sourceX} ${sourceY}`];
  for (const point of points) {
    segments.push(`L ${point.x} ${point.y}`);
  }
  segments.push(`L ${targetX} ${targetY}`);
  return segments.join(" ");
}

function getPolylineLabelPoint(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  points: Array<{ x: number; y: number }>,
) {
  const full = [{ x: sourceX, y: sourceY }, ...points, { x: targetX, y: targetY }];
  const middleIndex = Math.max(0, Math.floor((full.length - 1) / 2));
  const a = full[middleIndex];
  const b = full[middleIndex + 1] ?? a;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}
