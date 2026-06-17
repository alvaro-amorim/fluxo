import { MarkerType, type Edge, type Node } from "@xyflow/react";
import {
  DEFAULT_EDGE_SEMANTIC,
  type EdgeLineType,
  type FlowHandlePosition,
  type FlowProject,
  type FluxoEdgeData,
  type FluxoEdgeSerialized,
  type FluxoNodeData,
  type FluxoNodeSerialized,
} from "./types";
import { nowIso } from "./defaults";

export function fluxoNodeToReactFlowNode(node: FluxoNodeSerialized): Node {
  const data: FluxoNodeData = {
    shape: node.shape,
    title: node.title,
    summary: node.summary,
    hiddenInfo: node.hiddenInfo,
    style: node.style,
    icon: node.icon,
    semantic: node.semantic,
    width: node.size.width,
    height: node.size.height,
    customFields: node.customFields ?? [],
  };

  return {
    id: node.id,
    type: "fluxo",
    position: node.position,
    data,
  };
}

export function fluxoEdgeToReactFlowEdge(edge: FluxoEdgeSerialized): Edge {
  const normalizedLineType = edge.type === "smooth" ? "orthogonal" : edge.type;
  const hasArrow = edge.hasArrow ?? edge.type !== "no-arrow";
  const stroke = edge.stroke ?? (edge.type === "dashed" ? "dashed" : "solid");

  const data: FluxoEdgeData = {
    label: edge.label,
    hiddenInfo: edge.hiddenInfo,
    lineType: normalizedLineType as EdgeLineType,
    stroke,
    hasArrow,
    semantic: edge.semantic ?? DEFAULT_EDGE_SEMANTIC,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    style: edge.style,
    routing: edge.routing,
    customFields: edge.customFields ?? [],
  };

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    type: reactFlowEdgeType(edge.type),
    markerEnd: hasArrow
      ? {
          type: MarkerType.ArrowClosed,
          color: edge.style?.stroke ?? "#64748b",
          width: 18,
          height: 18,
        }
      : undefined,
    style: {
      stroke: edge.style?.stroke,
      strokeWidth: edge.style?.strokeWidth,
      strokeDasharray: stroke === "dashed" ? "5 4" : (edge.style?.strokeDasharray ?? undefined),
    },
    data,
  };
}

export function flowProjectToReactFlow(project: FlowProject): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: project.nodes.map(fluxoNodeToReactFlowNode),
    edges: project.edges.map(fluxoEdgeToReactFlowEdge),
  };
}

export function reactFlowNodeToFluxoNode(node: Node): FluxoNodeSerialized {
  const data = node.data as FluxoNodeData;
  return {
    id: node.id,
    type: "flowNode",
    shape: data.shape,
    title: data.title,
    summary: data.summary,
    hiddenInfo: data.hiddenInfo,
    position: node.position,
    size: {
      width: data.width,
      height: data.height,
    },
    style: data.style,
    icon: data.icon,
    semantic: data.semantic,
    customFields: data.customFields ?? [],
  };
}

export function reactFlowEdgeToFluxoEdge(edge: Edge): FluxoEdgeSerialized {
  const data = (edge.data as FluxoEdgeData | undefined) ?? {
    hiddenInfo: "",
    lineType: "orthogonal",
    stroke: "solid",
    hasArrow: true,
    semantic: DEFAULT_EDGE_SEMANTIC,
  };

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: normalizeHandle(edge.sourceHandle ?? data.sourceHandle),
    targetHandle: normalizeHandle(edge.targetHandle ?? data.targetHandle),
    label: data.label ?? (typeof edge.label === "string" ? edge.label : undefined),
    hiddenInfo: data.hiddenInfo,
    type: data.lineType,
    stroke: data.stroke,
    hasArrow: data.hasArrow,
    style: data.style,
    routing: data.routing,
    semantic: data.semantic,
    customFields: data.customFields ?? [],
  };
}

export function reactFlowToFlowProject(
  base: FlowProject,
  nodes: Node[],
  edges: Edge[],
): FlowProject {
  return {
    ...base,
    nodes: nodes.map(reactFlowNodeToFluxoNode),
    edges: edges.map(reactFlowEdgeToFluxoEdge),
    updatedAt: nowIso(),
  };
}

function reactFlowEdgeType(type: EdgeLineType) {
  if (type === "straight") return "straight";
  if (type === "bezier") return "default";
  return "smoothstep";
}

function normalizeHandle(value: unknown): FlowHandlePosition {
  return value === "top" || value === "right" || value === "bottom" || value === "left"
    ? value
    : "auto";
}
