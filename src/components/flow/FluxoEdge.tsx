import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

import type { EdgeLineType, FluxoEdgeData } from "@/lib/flow/types";

type EdgePath = [path: string, labelX: number, labelY: number];

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
  const [path, labelX, labelY] = getFluxoEdgePath({
    lineType,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    controlPoint: data?.routing?.mode === "manual" ? data.routing.points?.[0] : undefined,
  });

  const label = data?.label;
  const hiddenInfo = data?.hiddenInfo;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          stroke: selected ? "var(--brand)" : (style?.stroke ?? "#64748b"),
          strokeWidth: selected ? 2.5 : (style?.strokeWidth ?? 2),
          strokeDasharray: style?.strokeDasharray,
        }}
      />

      {label || hiddenInfo ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute max-w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-foreground shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            title={hiddenInfo || undefined}
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
  controlPoint,
}: {
  lineType: EdgeLineType;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps["sourcePosition"];
  targetPosition: EdgeProps["targetPosition"];
  controlPoint?: { x: number; y: number };
}): EdgePath {
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

  if (controlPoint) {
    return getManualPath({ sourceX, sourceY, targetX, targetY, controlPoint });
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
  controlPoint,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  controlPoint: { x: number; y: number };
}): EdgePath {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const useXDeviation = Math.abs(controlPoint.x - midX) >= Math.abs(controlPoint.y - midY);
  const path = useXDeviation
    ? `M ${sourceX},${sourceY} L ${controlPoint.x},${sourceY} L ${controlPoint.x},${targetY} L ${targetX},${targetY}`
    : `M ${sourceX},${sourceY} L ${sourceX},${controlPoint.y} L ${targetX},${controlPoint.y} L ${targetX},${targetY}`;

  return [path, midX, midY];
}
