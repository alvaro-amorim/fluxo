import type { Edge, Node } from "@xyflow/react";
import type {
  FlowHandlePosition,
  FluxoEdgeData,
  FluxoEdgeSerialized,
  FluxoNodeData,
  FluxoNodeSerialized,
} from "./types";
import { DEFAULT_NODE_SIZE } from "./defaults";

type NodeLike = Pick<FluxoNodeSerialized, "id" | "position" | "size">;

type Rect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type SmartHandles = {
  sourceHandle: FlowHandlePosition;
  targetHandle: FlowHandlePosition;
};

export type ManualRouteVariant = "horizontal" | "vertical";

export function getSmartHandles(source: Rect, target: Rect): SmartHandles {
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

export function resolveSerializedEdgeHandles(
  edge: FluxoEdgeSerialized,
  nodes: FluxoNodeSerialized[],
): FluxoEdgeSerialized {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source || !target) return edge;

  const smart = getSmartHandles(serializedNodeToRect(source), serializedNodeToRect(target));
  const shouldAutoRoute =
    edge.routing?.mode !== "manual" ||
    shouldUseSmartHandle(edge.sourceHandle) ||
    shouldUseSmartHandle(edge.targetHandle);

  if (!shouldAutoRoute) return edge;

  return {
    ...edge,
    sourceHandle: smart.sourceHandle,
    targetHandle: smart.targetHandle,
    routing: {
      ...(edge.routing ?? { points: [], avoidCrossings: true }),
      points: [],
      mode: "auto",
    },
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
  sourceHandle: FlowHandlePosition;
  targetHandle: FlowHandlePosition;
} {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  const edgeData = edge.data as Partial<FluxoEdgeData> | undefined;

  const currentSourceHandle = normalizeHandle(edge.sourceHandle ?? edgeData?.sourceHandle);
  const currentTargetHandle = normalizeHandle(edge.targetHandle ?? edgeData?.targetHandle);

  if (!source || !target) {
    return {
      sourceHandle: currentSourceHandle,
      targetHandle: currentTargetHandle,
    };
  }

  const smart = getSmartHandles(reactFlowNodeToRect(source), reactFlowNodeToRect(target));
  const shouldAutoRoute = shouldAutoRouteEdge(edgeData, currentSourceHandle, currentTargetHandle);

  if (!shouldAutoRoute) {
    return {
      sourceHandle: currentSourceHandle,
      targetHandle: currentTargetHandle,
    };
  }

  return smart;
}

export function applySmartHandlesToReactFlowEdges(nodes: Node[], edges: Edge[]): Edge[] {
  return edges.map((edge) => {
    const handles = resolveReactFlowEdgeHandles(edge, nodes);
    const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
    const nextRoutingMode = data?.routing?.mode === "manual" ? "manual" : "auto";
    const edgeHandleChanged =
      edge.sourceHandle !== handles.sourceHandle || edge.targetHandle !== handles.targetHandle;
    const dataHandleChanged =
      data?.sourceHandle !== handles.sourceHandle || data?.targetHandle !== handles.targetHandle;
    const routingModeChanged = Boolean(data) && data?.routing?.mode !== nextRoutingMode;
    const shouldClearAutoPoints = Boolean(data) && nextRoutingMode === "auto" && Boolean(data?.routing?.points?.length);

    if (!edgeHandleChanged && !dataHandleChanged && !routingModeChanged && !shouldClearAutoPoints) {
      return edge;
    }

    return {
      ...edge,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      data: data
        ? {
            ...data,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            routing: {
              ...(data.routing ?? { points: [], avoidCrossings: true }),
              points: nextRoutingMode === "auto" ? [] : (data.routing?.points ?? []),
              mode: nextRoutingMode,
            },
          }
        : edge.data,
    };
  });
}

export function buildManualRoutePoints(
  edge: Edge,
  nodes: Node[],
  variant: ManualRouteVariant,
): Array<{ x: number; y: number }> {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return [];

  const sourceRect = reactFlowNodeToRect(source);
  const targetRect = reactFlowNodeToRect(target);
  const data = edge.data as Partial<FluxoEdgeData> | undefined;
  const smart = getSmartHandles(sourceRect, targetRect);

  const sourceHandle = normalizeHandle(edge.sourceHandle ?? data?.sourceHandle);
  const targetHandle = normalizeHandle(edge.targetHandle ?? data?.targetHandle);

  const sourceAnchor = getAnchorPoint(
    sourceRect,
    sourceHandle === "auto" ? smart.sourceHandle : sourceHandle,
  );
  const targetAnchor = getAnchorPoint(
    targetRect,
    targetHandle === "auto" ? smart.targetHandle : targetHandle,
  );

  if (variant === "horizontal") {
    const midX = Math.round((sourceAnchor.x + targetAnchor.x) / 2);
    return [
      { x: midX, y: sourceAnchor.y },
      { x: midX, y: targetAnchor.y },
    ];
  }

  const midY = Math.round((sourceAnchor.y + targetAnchor.y) / 2);
  return [
    { x: sourceAnchor.x, y: midY },
    { x: targetAnchor.x, y: midY },
  ];
}

function serializedNodeToRect(node: NodeLike): Rect {
  const width = node.size?.width ?? DEFAULT_NODE_SIZE.width;
  const height = node.size?.height ?? DEFAULT_NODE_SIZE.height;

  return {
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width,
    height,
    centerX: node.position.x + width / 2,
    centerY: node.position.y + height / 2,
  };
}

function reactFlowNodeToRect(node: Node): Rect {
  const data = node.data as Partial<FluxoNodeData> | undefined;
  const width = data?.width ?? node.measured?.width ?? node.width ?? DEFAULT_NODE_SIZE.width;
  const height = data?.height ?? node.measured?.height ?? node.height ?? DEFAULT_NODE_SIZE.height;

  return {
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width,
    height,
    centerX: node.position.x + width / 2,
    centerY: node.position.y + height / 2,
  };
}

function getAnchorPoint(rect: Rect, handle: FlowHandlePosition) {
  if (handle === "top") return { x: rect.centerX, y: rect.y };
  if (handle === "right") return { x: rect.x + rect.width, y: rect.centerY };
  if (handle === "bottom") return { x: rect.centerX, y: rect.y + rect.height };
  if (handle === "left") return { x: rect.x, y: rect.centerY };
  return { x: rect.centerX, y: rect.centerY };
}

function shouldAutoRouteEdge(
  data: Partial<FluxoEdgeData> | undefined,
  sourceHandle: FlowHandlePosition,
  targetHandle: FlowHandlePosition,
) {
  return data?.routing?.mode !== "manual" || shouldUseSmartHandle(sourceHandle) || shouldUseSmartHandle(targetHandle);
}

function shouldUseSmartHandle(handle: unknown) {
  return !handle || handle === "auto";
}

function normalizeHandle(value: unknown): FlowHandlePosition {
  return value === "top" || value === "right" || value === "bottom" || value === "left"
    ? value
    : "auto";
}
