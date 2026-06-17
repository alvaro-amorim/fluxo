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

  return {
    ...edge,
    sourceHandle: shouldUseSmartHandle(edge.sourceHandle) ? smart.sourceHandle : edge.sourceHandle,
    targetHandle: shouldUseSmartHandle(edge.targetHandle) ? smart.targetHandle : edge.targetHandle,
  };
}

export function resolveReactFlowEdgeHandles(edge: {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: unknown;
}, nodes: Node[]): {
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

  return {
    sourceHandle: shouldUseSmartHandle(currentSourceHandle) ? smart.sourceHandle : currentSourceHandle,
    targetHandle: shouldUseSmartHandle(currentTargetHandle) ? smart.targetHandle : currentTargetHandle,
  };
}

export function applySmartHandlesToReactFlowEdges(nodes: Node[], edges: Parameters<typeof resolveReactFlowEdgeHandles>[0][]) {
  return edges.map((edge) => {
    const handles = resolveReactFlowEdgeHandles(edge, nodes);
    const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;

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

function shouldUseSmartHandle(handle: unknown) {
  return !handle || handle === "auto";
}

function normalizeHandle(value: unknown): FlowHandlePosition {
  return value === "top" || value === "right" || value === "bottom" || value === "left"
    ? value
    : "auto";
}
