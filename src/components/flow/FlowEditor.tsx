import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { FluxoNode } from "./FluxoNode";
import { FluxoEdge } from "./FluxoEdge";
import { Toolbar, type Tool } from "./Toolbar";
import { NodePropertiesModal } from "./NodePropertiesModal";
import { EdgePropertiesModal } from "./EdgePropertiesModal";
import { ShortcutHelpModal } from "./ShortcutHelpModal";
import { SelectionToolbar } from "./SelectionToolbar";
import {
  DEFAULT_EDGE_SEMANTIC,
  DEFAULT_NODE_STYLE,
  DEFAULT_SEMANTIC,
  type FlowLayoutDirection,
  type FlowProject,
  type FluxoEdgeData,
  type FluxoEdgeSerialized,
  type FluxoNodeData,
  type ShapeType,
} from "@/lib/flow/types";
import {
  flowProjectToReactFlow,
  fluxoEdgeToReactFlowEdge,
  reactFlowToFlowProject,
} from "@/lib/flow/adapters";
import {
  flowFileToProject,
  getFlowFileName,
  parseFlowFileJson,
  projectToFlowFile,
  stringifyFlowFile,
} from "@/lib/flow/serialization";
import { exportFlowPng } from "@/lib/export/exportPng";
import { setCurrentProject, upsertProject } from "@/lib/flow/store";
import { calculateAutoLayout } from "@/lib/flow/layout";
import {
  applySmartHandlesToReactFlowEdges,
  getNodeObstacleRects,
  routeAvoidingObstacles,
  toVisualRouteSegments,
  type VisualObstacleRect,
  type VisualRouteSegment,
} from "@/lib/flow/edgeRouting";
import {
  getDistributedConnectionPoint,
  getRecommendedNodeSizeForConnections,
  getShapeSideFromHandle,
  type ShapeConnectionSide,
  type ShapePoint,
} from "@/lib/flow/shapeGeometry";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, Palette, Presentation, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const nodeTypes: NodeTypes = { fluxo: FluxoNode };
const edgeTypes: EdgeTypes = { fluxo: FluxoEdge };

const DEFAULT_EDGE_STROKE = "#374151";
const DUPLICATE_EDGE_STROKES = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#db2777", "#0891b2"];
const DEFAULT_NEW_NODE_WIDTH = 180;
const DEFAULT_NEW_NODE_HEIGHT = 80;
const EDGE_LANE_STEP = 22;
const MAX_EDGE_LANE_OFFSET = 72;
const EDGE_CLEARANCE = 36;
const ROUTING_OBSTACLE_MARGIN = 160;

function getNextEdgeStroke(existingEdges: Edge[], source: string, target: string) {
  const duplicateCount = existingEdges.filter(
    (edge) => edge.source === source && edge.target === target,
  ).length;

  if (duplicateCount === 0) return DEFAULT_EDGE_STROKE;

  return DUPLICATE_EDGE_STROKES[(duplicateCount - 1) % DUPLICATE_EDGE_STROKES.length];
}

type FlowSnapshot = { nodes: Node[]; edges: Edge[] };
type NodeConnectionLoad = {
  incoming: number;
  outgoing: number;
  total: number;
  sides: Record<ShapeConnectionSide, number>;
};

const EMPTY_SIDE_LOAD: Record<ShapeConnectionSide, number> = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function getUndirectedEdgeKey(edge: Pick<Edge, "source" | "target">) {
  return [edge.source, edge.target].sort().join("::");
}

function getHandleSide(handle: unknown): ShapeConnectionSide | null {
  return getShapeSideFromHandle(typeof handle === "string" ? handle : null);
}

function getNodeConnectionLoads(edges: Edge[]): Map<string, NodeConnectionLoad> {
  const loads = new Map<string, NodeConnectionLoad>();

  const ensureLoad = (nodeId: string) => {
    const existing = loads.get(nodeId);
    if (existing) return existing;

    const created = {
      incoming: 0,
      outgoing: 0,
      total: 0,
      sides: { ...EMPTY_SIDE_LOAD },
    };
    loads.set(nodeId, created);
    return created;
  };

  for (const edge of edges) {
    const data = edge.data as FluxoEdgeData | undefined;
    const sourceLoad = ensureLoad(edge.source);
    const targetLoad = ensureLoad(edge.target);
    const sourceSide = getHandleSide(data?.sourceHandle ?? edge.sourceHandle);
    const targetSide = getHandleSide(data?.targetHandle ?? edge.targetHandle);

    sourceLoad.outgoing += 1;
    sourceLoad.total += 1;
    targetLoad.incoming += 1;
    targetLoad.total += 1;

    if (sourceSide) sourceLoad.sides[sourceSide] += 1;
    if (targetSide) targetLoad.sides[targetSide] += 1;
  }

  return loads;
}

function expandNodesForConnectionLoad(nodes: Node[], edges: Edge[]) {
  const loads = getNodeConnectionLoads(edges);
  let changed = false;

  const nextNodes = nodes.map((node) => {
    const load = loads.get(node.id);
    if (!load) return node;

    const data = node.data as FluxoNodeData;
    const currentWidth = data.width ?? DEFAULT_NEW_NODE_WIDTH;
    const currentHeight = data.height ?? DEFAULT_NEW_NODE_HEIGHT;
    const recommended = getRecommendedNodeSizeForConnections(
      data.shape,
      currentWidth,
      currentHeight,
      {
        total: load.total,
        sides: load.sides,
      },
    );
    const nextWidth = Math.max(currentWidth, recommended.width);
    const nextHeight = Math.max(currentHeight, recommended.height);

    if (nextWidth === currentWidth && nextHeight === currentHeight) return node;
    changed = true;

    return {
      ...node,
      position: {
        x: node.position.x - (nextWidth - currentWidth) / 2,
        y: node.position.y - (nextHeight - currentHeight) / 2,
      },
      data: {
        ...data,
        width: nextWidth,
        height: nextHeight,
      },
    };
  });

  return changed ? nextNodes : nodes;
}

function applyVisualLaneOffsets(edges: Edge[]): Edge[] {
  const groups = new Map<string, Edge[]>();

  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const key = getUndirectedEdgeKey(edge);
    groups.set(key, [...(groups.get(key) ?? []), edge]);
  }

  const laneByEdgeId = new Map<string, { index: number; count: number; offset: number }>();

  for (const [key, group] of groups) {
    if (group.length < 2) continue;

    const [firstNodeId] = key.split("::");
    const sortedGroup = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const laneCount = sortedGroup.length;
    const step =
      laneCount <= 1 ? 0 : Math.min(EDGE_LANE_STEP, (MAX_EDGE_LANE_OFFSET * 2) / (laneCount - 1));

    for (const [index, edge] of sortedGroup.entries()) {
      const centeredIndex = index - (laneCount - 1) / 2;
      const directionSign = edge.source === firstNodeId ? 1 : -1;
      laneByEdgeId.set(edge.id, {
        index,
        count: laneCount,
        offset: centeredIndex * step * directionSign,
      });
    }
  }

  return edges.map((edge) => {
    const lane = laneByEdgeId.get(edge.id);
    if (!lane) return edge;

    return {
      ...edge,
      data: {
        ...((edge.data as Record<string, unknown> | undefined) ?? {}),
        __visualLaneIndex: lane.index,
        __visualLaneCount: lane.count,
        __visualLaneOffset: lane.offset,
      },
    };
  });
}

type VisualEndpointRole = "source" | "target";

type VisualEndpoint = {
  edge: Edge;
  role: VisualEndpointRole;
  node: Node;
  side: ShapeConnectionSide;
};

function applyVisualEdgeMetadata(nodes: Node[], edges: Edge[]): Edge[] {
  const obstacles = getNodeObstacleRects(nodes);
  const edgesWithLanes = applyVisualLaneOffsets(edges);
  const edgesWithAnchors = applyVisualAnchorSlots(nodes, edgesWithLanes);
  return applyVisualRoutePoints(edgesWithAnchors, obstacles);
}

function applyFastVisualEdgeMetadata(nodes: Node[], edges: Edge[]): Edge[] {
  const edgesWithLanes = applyVisualLaneOffsets(edges);
  const edgesWithAnchors = applyVisualAnchorSlots(nodes, edgesWithLanes);

  return edgesWithAnchors.map((edge) => {
    const data = edge.data as Record<string, unknown> | undefined;
    const source = getVisualPoint(data?.__visualSourcePoint);
    const target = getVisualPoint(data?.__visualTargetPoint);
    if (!source || !target) return edge;

    const laneOffset =
      typeof data?.__visualLaneOffset === "number"
        ? Math.max(-MAX_EDGE_LANE_OFFSET, Math.min(MAX_EDGE_LANE_OFFSET, data.__visualLaneOffset))
        : 0;

    return {
      ...edge,
      data: {
        ...data,
        __visualRoutePoints: getFastVisualRoutePoints(source, target, laneOffset),
      },
    };
  });
}

function applyVisualAnchorSlots(nodes: Node[], edges: Edge[]): Edge[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const endpointGroups = new Map<string, VisualEndpoint[]>();

  const addEndpoint = (endpoint: VisualEndpoint) => {
    const key = `${endpoint.node.id}::${endpoint.side}`;
    endpointGroups.set(key, [...(endpointGroups.get(key) ?? []), endpoint]);
  };

  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    const data = edge.data as FluxoEdgeData | undefined;
    const sourceSide =
      getHandleSide(data?.sourceHandle ?? edge.sourceHandle) ??
      inferConnectionSide(sourceNode, targetNode);
    const targetSide =
      getHandleSide(data?.targetHandle ?? edge.targetHandle) ??
      inferConnectionSide(targetNode, sourceNode);

    addEndpoint({ edge, role: "source", node: sourceNode, side: sourceSide });
    addEndpoint({ edge, role: "target", node: targetNode, side: targetSide });
  }

  const pointByEndpoint = new Map<string, ShapePoint>();
  const sideByEndpoint = new Map<string, ShapeConnectionSide>();

  for (const group of endpointGroups.values()) {
    const sortedGroup = [...group].sort((a, b) => {
      const edgeOrder = a.edge.id.localeCompare(b.edge.id);
      if (edgeOrder !== 0) return edgeOrder;
      return a.role.localeCompare(b.role);
    });

    for (const [slotIndex, endpoint] of sortedGroup.entries()) {
      const data = endpoint.node.data as FluxoNodeData;
      const width = data.width ?? DEFAULT_NEW_NODE_WIDTH;
      const height = data.height ?? DEFAULT_NEW_NODE_HEIGHT;
      const localPoint = getDistributedConnectionPoint(
        data.shape,
        width,
        height,
        endpoint.side,
        slotIndex,
        sortedGroup.length,
      );
      pointByEndpoint.set(getEndpointKey(endpoint.edge.id, endpoint.role), {
        x: endpoint.node.position.x + localPoint.x,
        y: endpoint.node.position.y + localPoint.y,
      });
      sideByEndpoint.set(getEndpointKey(endpoint.edge.id, endpoint.role), endpoint.side);
    }
  }

  return edges.map((edge) => {
    const sourcePoint = pointByEndpoint.get(getEndpointKey(edge.id, "source"));
    const targetPoint = pointByEndpoint.get(getEndpointKey(edge.id, "target"));
    if (!sourcePoint && !targetPoint) return edge;

    return {
      ...edge,
      data: {
        ...((edge.data as Record<string, unknown> | undefined) ?? {}),
        ...(sourcePoint ? { __visualSourcePoint: sourcePoint } : {}),
        ...(targetPoint ? { __visualTargetPoint: targetPoint } : {}),
        ...(sourcePoint
          ? { __visualSourceSide: sideByEndpoint.get(getEndpointKey(edge.id, "source")) }
          : {}),
        ...(targetPoint
          ? { __visualTargetSide: sideByEndpoint.get(getEndpointKey(edge.id, "target")) }
          : {}),
      },
    };
  });
}

function applyVisualRoutePoints(edges: Edge[], allObstacles: VisualObstacleRect[]): Edge[] {
  const occupiedSegments: VisualRouteSegment[] = [];
  const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id));
  const routeByEdgeId = new Map<
    string,
    { points: ShapePoint[]; obstacles: VisualObstacleRect[] }
  >();

  for (const edge of sortedEdges) {
    const data = edge.data as Record<string, unknown> | undefined;
    const source = getVisualPoint(data?.__visualSourcePoint);
    const target = getVisualPoint(data?.__visualTargetPoint);
    const sourceObstacleId = edge.source;
    const targetObstacleId = edge.target;
    const sourceSide = getVisualSide(data?.__visualSourceSide) ?? inferEndpointSide(source, target);
    const targetSide = getVisualSide(data?.__visualTargetSide) ?? inferEndpointSide(target, source);

    if (!source || !target || allObstacles.length === 0) continue;

    const obstacles = getRelevantVisualObstacles(
      allObstacles,
      source,
      target,
      sourceObstacleId,
      targetObstacleId,
    );

    const laneOffset =
      typeof data?.__visualLaneOffset === "number"
        ? Math.max(-MAX_EDGE_LANE_OFFSET, Math.min(MAX_EDGE_LANE_OFFSET, data.__visualLaneOffset))
        : 0;
    const sourceClearance = getSafeVisualClearancePoint(
      source,
      sourceSide,
      obstacles,
      sourceObstacleId,
    );
    const targetClearance = getSafeVisualClearancePoint(
      target,
      targetSide,
      obstacles,
      targetObstacleId,
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
    const route = routeAvoidingObstacles({
      edgeId: edge.id,
      source,
      sourceClearance,
      laneCenter,
      targetClearance,
      target,
      useLaneCenter: Math.abs(laneOffset) > 0.5,
      obstacles,
      occupiedSegments,
      sourceObstacleId,
      targetObstacleId,
    });

    routeByEdgeId.set(edge.id, { points: route, obstacles });
    occupiedSegments.push(...toVisualRouteSegments(edge.id, route));
  }

  return edges.map((edge) => {
    const routed = routeByEdgeId.get(edge.id);
    if (!routed) return edge;

    return {
      ...edge,
      data: {
        ...((edge.data as Record<string, unknown> | undefined) ?? {}),
        __visualObstacleRects: routed.obstacles,
        __visualSourceObstacleId: edge.source,
        __visualTargetObstacleId: edge.target,
        __visualRoutePoints: routed.points,
      },
    };
  });
}

function getFastVisualRoutePoints(source: ShapePoint, target: ShapePoint, laneOffset: number) {
  const offset = getPerpendicularOffset(source.x, source.y, target.x, target.y, laneOffset);
  const midpoint = {
    x: (source.x + target.x) / 2 + offset.x,
    y: (source.y + target.y) / 2 + offset.y,
  };

  if (Math.abs(target.x - source.x) >= Math.abs(target.y - source.y)) {
    return [source, { x: midpoint.x, y: source.y }, { x: midpoint.x, y: target.y }, target];
  }

  return [source, { x: source.x, y: midpoint.y }, { x: target.x, y: midpoint.y }, target];
}

function getRelevantVisualObstacles(
  obstacles: VisualObstacleRect[],
  source: ShapePoint,
  target: ShapePoint,
  sourceId: string,
  targetId: string,
) {
  const left = Math.min(source.x, target.x) - ROUTING_OBSTACLE_MARGIN;
  const right = Math.max(source.x, target.x) + ROUTING_OBSTACLE_MARGIN;
  const top = Math.min(source.y, target.y) - ROUTING_OBSTACLE_MARGIN;
  const bottom = Math.max(source.y, target.y) + ROUTING_OBSTACLE_MARGIN;

  return obstacles.filter(
    (obstacle) =>
      obstacle.id === sourceId ||
      obstacle.id === targetId ||
      (obstacle.right >= left &&
        obstacle.left <= right &&
        obstacle.bottom >= top &&
        obstacle.top <= bottom),
  );
}

function getNodeRoutingKey(nodes: Node[]) {
  return nodes
    .map((node) => {
      const data = node.data as FluxoNodeData;
      return [
        node.id,
        node.position.x,
        node.position.y,
        data.width ?? node.measured?.width ?? node.width ?? DEFAULT_NEW_NODE_WIDTH,
        data.height ?? node.measured?.height ?? node.height ?? DEFAULT_NEW_NODE_HEIGHT,
        data.shape,
      ].join(":");
    })
    .join("|");
}

function getEdgeRoutingKey(edges: Edge[]) {
  return edges
    .map((edge) => {
      const data = edge.data as FluxoEdgeData | undefined;
      const manualPoints = data?.routing?.points?.map((point) => `${point.x},${point.y}`).join(";");
      return [
        edge.id,
        edge.source,
        edge.target,
        data?.sourceHandle ?? edge.sourceHandle ?? "auto",
        data?.targetHandle ?? edge.targetHandle ?? "auto",
        data?.direction ?? "forward",
        data?.lineType ?? "orthogonal",
        data?.routing?.mode ?? "auto",
        manualPoints ?? "",
      ].join(":");
    })
    .join("|");
}

function useStableRoutingInputs(nodes: Node[], edges: Edge[]) {
  const nodeKey = useMemo(() => getNodeRoutingKey(nodes), [nodes]);
  const edgeKey = useMemo(() => getEdgeRoutingKey(edges), [edges]);
  const cacheRef = useRef<{
    nodeKey: string;
    edgeKey: string;
    nodes: Node[];
    edges: Edge[];
  } | null>(null);

  if (
    !cacheRef.current ||
    cacheRef.current.nodeKey !== nodeKey ||
    cacheRef.current.edgeKey !== edgeKey
  ) {
    cacheRef.current = { nodeKey, edgeKey, nodes, edges };
  }

  return cacheRef.current;
}

function mergeVisualEdgeMetadata(edges: Edge[], routedEdges: Edge[]) {
  const routedById = new Map(routedEdges.map((edge) => [edge.id, edge]));

  return edges.map((edge) => {
    const routedData = routedById.get(edge.id)?.data as Record<string, unknown> | undefined;
    if (!routedData) return edge;

    const visualData = Object.fromEntries(
      Object.entries(routedData).filter(([key]) => key.startsWith("__visual")),
    );

    return {
      ...edge,
      data: {
        ...((edge.data as Record<string, unknown> | undefined) ?? {}),
        ...visualData,
      },
    };
  });
}

function isResizeChange(change: NodeChange, resizing: boolean) {
  return change.type === "dimensions" && change.resizing === resizing;
}

function getVisualPoint(value: unknown): ShapePoint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const point = value as Partial<ShapePoint>;
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

function getVisualSide(value: unknown): ShapeConnectionSide | null {
  return value === "top" || value === "right" || value === "bottom" || value === "left"
    ? value
    : null;
}

function inferEndpointSide(from: ShapePoint | undefined, to: ShapePoint | undefined) {
  if (!from || !to) return "right";

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "bottom" : "top";
}

function getSafeVisualClearancePoint(
  point: ShapePoint,
  side: ShapeConnectionSide,
  obstacles: VisualObstacleRect[],
  ownObstacleId: string,
) {
  const vector = getSideVector(side);
  const ownObstacle = obstacles.find((obstacle) => obstacle.id === ownObstacleId);
  const clearance = {
    x: point.x + vector.x * EDGE_CLEARANCE,
    y: point.y + vector.y * EDGE_CLEARANCE,
  };

  const outsidePoint = pushPointOutsideObstacle(clearance, side, ownObstacle);
  if (isClearanceCandidateValid(point, outsidePoint, obstacles, ownObstacleId)) {
    return outsidePoint;
  }

  const alternatives = getObstacleClearanceCandidates(ownObstacle).sort(
    (a, b) => getPointDistance(a, outsidePoint) - getPointDistance(b, outsidePoint),
  );
  return (
    alternatives.find((candidate) =>
      isClearanceCandidateValid(point, candidate, obstacles, ownObstacleId),
    ) ?? outsidePoint
  );
}

function pushPointOutsideObstacle(
  point: ShapePoint,
  side: ShapeConnectionSide,
  obstacle: VisualObstacleRect | undefined,
) {
  if (!obstacle) return point;
  const gap = 2;

  switch (side) {
    case "top":
      return { ...point, y: Math.min(point.y, obstacle.top - gap) };
    case "right":
      return { ...point, x: Math.max(point.x, obstacle.right + gap) };
    case "bottom":
      return { ...point, y: Math.max(point.y, obstacle.bottom + gap) };
    case "left":
      return { ...point, x: Math.min(point.x, obstacle.left - gap) };
  }
}

function getSideVector(side: ShapeConnectionSide): ShapePoint {
  switch (side) {
    case "top":
      return { x: 0, y: -1 };
    case "right":
      return { x: 1, y: 0 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
  }
}

function getObstacleClearanceCandidates(obstacle: VisualObstacleRect | undefined) {
  if (!obstacle) return [];
  const gap = 2;
  const centerX = (obstacle.left + obstacle.right) / 2;
  const centerY = (obstacle.top + obstacle.bottom) / 2;
  const left = obstacle.left - gap;
  const right = obstacle.right + gap;
  const top = obstacle.top - gap;
  const bottom = obstacle.bottom + gap;

  return [
    { x: left, y: centerY },
    { x: right, y: centerY },
    { x: centerX, y: top },
    { x: centerX, y: bottom },
    { x: left, y: top },
    { x: left, y: bottom },
    { x: right, y: top },
    { x: right, y: bottom },
  ];
}

function isClearanceCandidateValid(
  anchor: ShapePoint,
  candidate: ShapePoint,
  obstacles: VisualObstacleRect[],
  ownObstacleId: string,
) {
  const segment = { a: anchor, b: candidate };

  return obstacles.every((obstacle) => {
    if (obstacle.id === ownObstacleId) return true;
    return (
      !pointInsideVisualRect(candidate, obstacle) && !segmentIntersectsVisualRect(segment, obstacle)
    );
  });
}

function pointInsideVisualRect(point: ShapePoint, rect: VisualObstacleRect) {
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

function segmentIntersectsVisualRect(
  segment: { a: ShapePoint; b: ShapePoint },
  rect: VisualObstacleRect,
) {
  if (pointInsideVisualRect(segment.a, rect) || pointInsideVisualRect(segment.b, rect)) {
    return true;
  }

  const sides = [
    { a: { x: rect.left, y: rect.top }, b: { x: rect.right, y: rect.top } },
    { a: { x: rect.right, y: rect.top }, b: { x: rect.right, y: rect.bottom } },
    { a: { x: rect.right, y: rect.bottom }, b: { x: rect.left, y: rect.bottom } },
    { a: { x: rect.left, y: rect.bottom }, b: { x: rect.left, y: rect.top } },
  ];

  return sides.some((side) => segmentsIntersect(segment, side));
}

function segmentsIntersect(
  first: { a: ShapePoint; b: ShapePoint },
  second: { a: ShapePoint; b: ShapePoint },
) {
  const o1 = orientation(first.a, first.b, second.a);
  const o2 = orientation(first.a, first.b, second.b);
  const o3 = orientation(second.a, second.b, first.a);
  const o4 = orientation(second.a, second.b, first.b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && pointOnSegment(first.a, second.a, first.b)) return true;
  if (o2 === 0 && pointOnSegment(first.a, second.b, first.b)) return true;
  if (o3 === 0 && pointOnSegment(second.a, first.a, second.b)) return true;
  if (o4 === 0 && pointOnSegment(second.a, first.b, second.b)) return true;
  return false;
}

function orientation(a: ShapePoint, b: ShapePoint, c: ShapePoint) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 0.001) return 0;
  return value > 0 ? 1 : 2;
}

function pointOnSegment(a: ShapePoint, b: ShapePoint, c: ShapePoint) {
  return (
    b.x <= Math.max(a.x, c.x) + 0.001 &&
    b.x + 0.001 >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) + 0.001 &&
    b.y + 0.001 >= Math.min(a.y, c.y)
  );
}

function getPointDistance(a: ShapePoint, b: ShapePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPerpendicularOffset(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  laneOffset: number,
): ShapePoint {
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

function getEndpointKey(edgeId: string, role: VisualEndpointRole) {
  return `${edgeId}::${role}`;
}

function inferConnectionSide(fromNode: Node, toNode: Node): ShapeConnectionSide {
  const fromCenter = getNodeCenter(fromNode);
  const toCenter = getNodeCenter(toNode);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "bottom" : "top";
}

function getNodeCenter(node: Node): ShapePoint {
  const data = node.data as FluxoNodeData;
  return {
    x: node.position.x + (data.width ?? DEFAULT_NEW_NODE_WIDTH) / 2,
    y: node.position.y + (data.height ?? DEFAULT_NEW_NODE_HEIGHT) / 2,
  };
}

interface FlowEditorProps {
  project: FlowProject;
}

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}

function FlowEditorInner({ project: initialProject }: FlowEditorProps) {
  const [project, setProject] = useState<FlowProject>(initialProject);
  const projectRef = useRef<FlowProject>(initialProject);

  const initial = useMemo(() => {
    const rf = flowProjectToReactFlow(initialProject);
    const expandedNodes = expandNodesForConnectionLoad(rf.nodes, rf.edges);
    return {
      ...rf,
      nodes: expandedNodes,
      edges: applySmartHandlesToReactFlowEdges(expandedNodes, rf.edges) as Edge[],
    };
  }, [initialProject]);
  const [nodes, setNodes] = useState<Node[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [compactView, setCompactView] = useState(false);
  const [isGeometryInteracting, setIsGeometryInteracting] = useState(false);
  const routingInputs = useStableRoutingInputs(nodes, edges);

  const renderedNodes = useMemo<Node[]>(
    () =>
      nodes.map((node) => ({
        ...node,
        data: { ...(node.data as Record<string, unknown>), compactView },
      })),
    [nodes, compactView],
  );
  const routedEdgeGeometry = useMemo<Edge[]>(
    () =>
      isGeometryInteracting
        ? applyFastVisualEdgeMetadata(routingInputs.nodes, routingInputs.edges)
        : applyVisualEdgeMetadata(routingInputs.nodes, routingInputs.edges),
    [isGeometryInteracting, routingInputs],
  );
  const renderedEdges = useMemo<Edge[]>(
    () => mergeVisualEdgeMetadata(edges, routedEdgeGeometry),
    [edges, routedEdgeGeometry],
  );

  const [tool, setTool] = useState<Tool>("select");
  const [pendingConnectionSource, setPendingConnectionSource] = useState<string | null>(null);
  const [toolbarMode, setToolbarMode] = useState<"side" | "floating">("side");
  const [gridOn, setGridOn] = useState(initialProject.settings?.gridVisible ?? true);
  const [snapOn, setSnapOn] = useState(initialProject.settings?.snapToGrid ?? true);
  const [presentation, setPresentation] = useState(false);
  const [background, setBackground] = useState(initialProject.background);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [edgeModalOpen, setEdgeModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<{
    nodeId: string;
    handleId: string;
    handleType: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const historyRef = useRef<FlowSnapshot[]>([]);
  const futureRef = useRef<FlowSnapshot[]>([]);
  const isRestoringRef = useRef(false);
  const inlineRenameNodeIdRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const isGeometryInteractingRef = useRef(false);
  const deferredRoutingFrameRef = useRef<number | null>(null);
  const deferredRoutingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(
    () => () => {
      if (deferredRoutingFrameRef.current !== null) {
        window.cancelAnimationFrame(deferredRoutingFrameRef.current);
      }
      if (deferredRoutingTimerRef.current !== null) {
        window.clearTimeout(deferredRoutingTimerRef.current);
      }
    },
    [],
  );

  const snapshot = useCallback(() => {
    if (isRestoringRef.current) return;
    historyRef.current.push({ nodes, edges });
    if (historyRef.current.length > 80) historyRef.current.shift();
    futureRef.current = [];
  }, [nodes, edges]);

  const persistProject = useCallback((next: FlowProject) => {
    projectRef.current = next;
    setProject(next);
    setCurrentProject(next);
    upsertProject(next);
  }, []);

  useEffect(() => {
    if (isGeometryInteracting) return;

    const updated = reactFlowToFlowProject(
      {
        ...projectRef.current,
        background,
        settings: {
          ...(projectRef.current.settings ?? {
            theme: "light",
            gridVisible: true,
            snapToGrid: true,
            gridSize: 20,
            layoutDirection: "vertical",
          }),
          gridVisible: gridOn,
          snapToGrid: snapOn,
        },
      },
      nodes,
      edges,
    );
    persistProject(updated);
  }, [nodes, edges, background, gridOn, snapOn, isGeometryInteracting, persistProject]);

  const cancelDeferredRouting = useCallback(() => {
    if (deferredRoutingFrameRef.current !== null) {
      window.cancelAnimationFrame(deferredRoutingFrameRef.current);
      deferredRoutingFrameRef.current = null;
    }
    if (deferredRoutingTimerRef.current !== null) {
      window.clearTimeout(deferredRoutingTimerRef.current);
      deferredRoutingTimerRef.current = null;
    }
  }, []);

  const startGeometryInteraction = useCallback(() => {
    cancelDeferredRouting();
    if (isGeometryInteractingRef.current) return;
    isGeometryInteractingRef.current = true;
    setIsGeometryInteracting(true);
  }, [cancelDeferredRouting]);

  const resolveAutoEdges = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    return applySmartHandlesToReactFlowEdges(
      nextNodes,
      nextEdges.map((edge) => {
        const data = edge.data as FluxoEdgeData | undefined;
        if (data?.routing?.mode !== "auto") return edge;

        const sourceHandle = data.sourceHandle ?? edge.sourceHandle ?? "auto";
        const targetHandle = data.targetHandle ?? edge.targetHandle ?? "auto";

        return {
          ...edge,
          sourceHandle,
          targetHandle,
          data: {
            ...data,
            sourceHandle,
            targetHandle,
          },
        };
      }),
    ) as Edge[];
  }, []);

  const finishGeometryInteraction = useCallback(
    (nextNodes = nodesRef.current) => {
      if (!isGeometryInteractingRef.current) return;
      isGeometryInteractingRef.current = false;
      cancelDeferredRouting();
      deferredRoutingFrameRef.current = window.requestAnimationFrame(() => {
        deferredRoutingFrameRef.current = null;
        deferredRoutingTimerRef.current = window.setTimeout(() => {
          deferredRoutingTimerRef.current = null;
          setEdges((currentEdges) => resolveAutoEdges(nextNodes, currentEdges));
          setIsGeometryInteracting(false);
        }, 0);
      });
    },
    [cancelDeferredRouting, resolveAutoEdges],
  );

  const onNodeDragStart = useCallback(() => {
    snapshot();
    startGeometryInteraction();
  }, [snapshot, startGeometryInteraction]);

  const onNodeDragStop = useCallback(() => {
    finishGeometryInteraction(nodesRef.current);
  }, [finishGeometryInteraction]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const resizeStarted = changes.some((change) => isResizeChange(change, true));
      const resizeFinished = changes.some((change) => isResizeChange(change, false));

      if (resizeStarted) startGeometryInteraction();

      const nextNodes = applyNodeChanges(changes, nodesRef.current);
      nodesRef.current = nextNodes;
      setNodes(nextNodes);

      if (resizeFinished) finishGeometryInteraction(nextNodes);
    },
    [finishGeometryInteraction, startGeometryInteraction],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const createEdge = useCallback((edge: FluxoEdgeSerialized) => fluxoEdgeToReactFlowEdge(edge), []);

  const onConnectStart = useCallback(
    (
      event: MouseEvent | TouchEvent | null,
      params: { nodeId: string | null; handleId: string | null; handleType: string | null },
    ) => {
      if (!params.nodeId) return;
      const { nodeId, handleId, handleType } = params;
      setConnectionState({
        nodeId,
        handleId: handleId ?? "auto",
        handleType: handleType ?? "source",
      });
    },
    [],
  );

  const onConnectEnd = useCallback(() => {
    setConnectionState(null);
  }, []);

  const onConnect = useCallback(
    (conn: Connection) => {
      try {
        if (!conn.source || !conn.target) return;

        // Determinar direcao real baseada no connectionState
        let source = conn.source;
        let target = conn.target;
        let sourceHandle = (conn.sourceHandle as FluxoEdgeSerialized["sourceHandle"]) ?? "auto";
        let targetHandle = (conn.targetHandle as FluxoEdgeSerialized["targetHandle"]) ?? "auto";

        if (connectionState) {
          if (connectionState.nodeId === conn.source) {
            // Manter source/target como estao
          } else if (connectionState.nodeId === conn.target) {
            // Inverter source/target e tambem os handles correspondentes
            [source, target] = [target, source];
            [sourceHandle, targetHandle] = [targetHandle, sourceHandle];
          }
        }

        // Rejeitar self-loop apos calcular a direcao real
        if (source === target) {
          toast.warning("Conexoes para o mesmo bloco nao sao permitidas");
          return;
        }

        snapshot();
        const id = `edge-${Date.now()}`;
        const serialized: FluxoEdgeSerialized = {
          id,
          source,
          target,
          sourceHandle,
          targetHandle,
          label: undefined,
          hiddenInfo: "",
          type: "orthogonal",
          stroke: "solid",
          hasArrow: true,
          direction: "forward",
          style: {
            stroke: getNextEdgeStroke(edges, source, target),
            strokeWidth: 2,
            strokeDasharray: null,
            markerEnd: "arrow",
          },
          routing: { mode: "auto", points: [], avoidCrossings: true },
          semantic: { ...DEFAULT_EDGE_SEMANTIC },
          customFields: [],
        };

        setEdges((eds) => {
          const nextEdges = addEdge(createEdge(serialized), eds);
          const nextNodes = expandNodesForConnectionLoad(nodes, nextEdges);
          if (nextNodes !== nodes) setNodes(nextNodes);
          return resolveAutoEdges(nextNodes, nextEdges);
        });
        setSelectedEdge(null);
      } finally {
        setConnectionState(null);
      }
    },
    [createEdge, edges, nodes, resolveAutoEdges, snapshot, connectionState],
  );

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (tool === "connect") {
        if (!pendingConnectionSource) {
          setPendingConnectionSource(node.id);
          toast.info("Agora escolha o bloco de destino");
          return;
        }

        if (pendingConnectionSource === node.id) {
          toast.warning("Conexoes para o mesmo bloco nao sao permitidas");
          return;
        }

        const id = `edge-${Date.now()}`;
        const serialized: FluxoEdgeSerialized = {
          id,
          source: pendingConnectionSource,
          target: node.id,
          sourceHandle: "auto",
          targetHandle: "auto",
          label: undefined,
          hiddenInfo: "",
          type: "orthogonal",
          stroke: "solid",
          hasArrow: true,
          direction: "forward",
          style: {
            stroke: getNextEdgeStroke(edges, pendingConnectionSource, node.id),
            strokeWidth: 2,
            strokeDasharray: null,
            markerEnd: "arrow",
          },
          routing: { mode: "auto", points: [], avoidCrossings: true },
          semantic: { ...DEFAULT_EDGE_SEMANTIC },
          customFields: [],
        };

        snapshot();
        setEdges((eds) => {
          const nextEdges = addEdge(createEdge(serialized), eds);
          const nextNodes = expandNodesForConnectionLoad(nodes, nextEdges);
          if (nextNodes !== nodes) setNodes(nextNodes);
          return resolveAutoEdges(nextNodes, nextEdges);
        });
        setPendingConnectionSource(null);
      } else {
        setSelectedNode(node);
        setSelectedEdge(null);
      }
    },
    [tool, pendingConnectionSource, createEdge, edges, nodes, resolveAutoEdges, snapshot],
  );

  const addBlock = useCallback(
    (atFlow?: { x: number; y: number }) => {
      snapshot();
      const id = `node-${Date.now()}`;
      const flowPane = wrapperRef.current?.querySelector(".react-flow");
      const bounds =
        flowPane?.getBoundingClientRect() ?? wrapperRef.current?.getBoundingClientRect();
      const visibleCenter = bounds
        ? screenToFlowPosition({
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          })
        : { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 };
      const pos = atFlow ?? {
        x: visibleCenter.x - DEFAULT_NEW_NODE_WIDTH / 2,
        y: visibleCenter.y - DEFAULT_NEW_NODE_HEIGHT / 2,
      };
      const data: FluxoNodeData = {
        shape: "rounded-rectangle",
        title: "Novo bloco",
        summary: "",
        hiddenInfo: "",
        style: { ...DEFAULT_NODE_STYLE },
        icon: { type: "none", name: "", customSrc: null },
        semantic: { ...DEFAULT_SEMANTIC },
        width: DEFAULT_NEW_NODE_WIDTH,
        height: DEFAULT_NEW_NODE_HEIGHT,
        customFields: [],
      };
      setNodes((nds) => [...nds, { id, type: "fluxo", position: pos, data }]);
    },
    [screenToFlowPosition, snapshot],
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push({ nodes, edges });
    isRestoringRef.current = true;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectionState(null);
    setPendingConnectionSource(null);
    queueMicrotask(() => {
      isRestoringRef.current = false;
    });
  }, [nodes, edges]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push({ nodes, edges });
    isRestoringRef.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectionState(null);
    setPendingConnectionSource(null);
    queueMicrotask(() => {
      isRestoringRef.current = false;
    });
  }, [nodes, edges]);

  const deleteSelection = useCallback(() => {
    const selectedNodeIds = new Set(
      nodes.filter((n) => n.selected || n.id === selectedNode?.id).map((n) => n.id),
    );
    const selectedEdgeIds = new Set(
      edges.filter((e) => e.selected || e.id === selectedEdge?.id).map((e) => e.id),
    );

    if (!selectedNodeIds.size && !selectedEdgeIds.size) return;

    snapshot();
    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !selectedEdgeIds.has(e.id) &&
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target),
      ),
    );
    setSelectedNode(null);
    setSelectedEdge(null);
    setNodeModalOpen(false);
    setEdgeModalOpen(false);
    setConnectionState(null);
    setPendingConnectionSource(null);
  }, [edges, nodes, selectedEdge?.id, selectedNode?.id, snapshot]);

  const duplicateSelection = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected || n.id === selectedNode?.id);
    if (!selectedNodes.length) return;

    snapshot();
    const idMap = new Map<string, string>();
    const timestamp = Date.now();
    const duplicatedNodes = selectedNodes.map((node, index) => {
      const newId = `node-${timestamp}-${index}`;
      idMap.set(node.id, newId);
      const data = node.data as FluxoNodeData;
      return {
        ...node,
        id: newId,
        selected: true,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        data: { ...data, title: `${data.title} copia` },
      } satisfies Node;
    });

    const duplicatedEdges = edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map(
        (edge, index) =>
          ({
            ...edge,
            id: `edge-${timestamp}-${index}`,
            source: idMap.get(edge.source)!,
            target: idMap.get(edge.target)!,
            selected: true,
          }) satisfies Edge,
      );

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...duplicatedNodes]);
    setEdges((eds) => [...eds.map((e) => ({ ...e, selected: false })), ...duplicatedEdges]);
    setSelectedNode(duplicatedNodes[0] ?? null);
    setSelectedEdge(null);
    setPendingConnectionSource(null);
  }, [edges, nodes, selectedNode?.id, snapshot]);

  const selectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
    setSelectedNode(null);
    setSelectedEdge(null);
    setPendingConnectionSource(null);
  }, []);

  const organize = useCallback(
    (dir: FlowLayoutDirection = "horizontal") => {
      snapshot();
      const nextNodes = calculateAutoLayout(nodes, edges, {
        direction: dir,
        layerGap: dir === "compact" ? 200 : dir === "radial" ? 160 : 220,
        nodeGap: dir === "compact" ? 120 : 260,
        startX: 180,
        startY: 140,
      });
      setNodes(nextNodes);
      setEdges((eds) => resolveAutoEdges(nextNodes, eds));
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    },
    [edges, nodes, fitView, resolveAutoEdges, snapshot],
  );

  const updateSelectedEdge = useCallback(
    (updater: (edge: Edge) => Edge) => {
      if (!selectedEdge) return;
      snapshot();
      setEdges((eds) => {
        const nextEdges = eds.map((edge) => (edge.id === selectedEdge.id ? updater(edge) : edge));
        const updatedEdge = nextEdges.find((edge) => edge.id === selectedEdge.id) ?? null;
        setSelectedEdge(updatedEdge);
        return resolveAutoEdges(nodes, nextEdges);
      });
    },
    [nodes, resolveAutoEdges, selectedEdge, snapshot],
  );

  const setSelectedEdgeAutoRouting = useCallback(() => {
    updateSelectedEdge((edge) => {
      const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
      if (!data) return edge;

      return {
        ...edge,
        sourceHandle: "auto",
        targetHandle: "auto",
        data: {
          ...data,
          sourceHandle: "auto",
          targetHandle: "auto",
          routing: { ...(data.routing ?? {}), mode: "auto", points: [] },
        },
      };
    });
  }, [updateSelectedEdge]);

  const setSelectedEdgeDeviation = useCallback(
    (axis: "x" | "y") => {
      updateSelectedEdge((edge) => {
        const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
        if (!data) return edge;

        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        const midX = ((source?.position.x ?? 0) + (target?.position.x ?? 0)) / 2;
        const midY = ((source?.position.y ?? 0) + (target?.position.y ?? 0)) / 2;
        const currentPoint = data.routing?.points?.[0] ?? { x: midX, y: midY };
        const controlPoint =
          axis === "x" ? { x: currentPoint.x + 80, y: midY } : { x: midX, y: currentPoint.y + 80 };

        return {
          ...edge,
          data: {
            ...data,
            routing: {
              ...(data.routing ?? {}),
              mode: "manual",
              points: [controlPoint],
            },
          },
        };
      });
    },
    [nodes, updateSelectedEdge],
  );

  const invertSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;

    snapshot();
    setEdges((eds) => {
      const nextEdges = eds.map((edge) => {
        if (edge.id !== selectedEdge.id) return edge;

        const data = edge.data as FluxoEdgeData | undefined;

        return {
          ...edge,
          source: edge.target,
          target: edge.source,
          sourceHandle: "auto",
          targetHandle: "auto",
          data: data
            ? {
                ...data,
                sourceHandle: "auto",
                targetHandle: "auto",
                routing: {
                  ...(data.routing ?? {}),
                  mode: "auto",
                  points: [],
                },
              }
            : edge.data,
        } satisfies Edge;
      });

      const resolvedEdges = resolveAutoEdges(nodes, nextEdges);
      setSelectedEdge(resolvedEdges.find((edge) => edge.id === selectedEdge.id) ?? null);
      return resolvedEdges;
    });
  }, [nodes, resolveAutoEdges, selectedEdge, snapshot]);
  const exportJson = useCallback(() => {
    try {
      const current = reactFlowToFlowProject({ ...projectRef.current, background }, nodes, edges);
      const file = projectToFlowFile(current);
      const blob = new Blob([stringifyFlowFile(file)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFlowFileName(file.project.name);
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fluxo exportado.");
    } catch (error) {
      toast.error((error as Error).message || "Nao foi possivel exportar o fluxo.");
    }
  }, [nodes, edges, background]);

  const exportPng = useCallback(async () => {
    try {
      await exportFlowPng({
        root: wrapperRef.current,
        fileName: getFlowFileName(projectRef.current.name).replace(/\.flow\.json$/i, ".png"),
        backgroundColor: background,
      });
      toast.success("PNG exportado.");
    } catch (error) {
      toast.error((error as Error).message || "Nao foi possivel exportar PNG.");
    }
  }, [background]);

  const triggerImport = useCallback(() => fileInputRef.current?.click(), []);

  const onImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseFlowFileJson(String(reader.result));
        if (!parsed.ok || !parsed.file) {
          toast.error(parsed.error ?? "Arquivo invalido.");
          return;
        }

        try {
          snapshot();
          const importedProject = flowFileToProject(parsed.file);
          const rf = flowProjectToReactFlow(importedProject);
          const expandedNodes = expandNodesForConnectionLoad(rf.nodes, rf.edges);
          persistProject(importedProject);
          setBackground(importedProject.background);
          setGridOn(importedProject.settings?.gridVisible ?? true);
          setSnapOn(importedProject.settings?.snapToGrid ?? true);
          setNodes(expandedNodes);
          setEdges(resolveAutoEdges(expandedNodes, rf.edges));
          setSelectedNode(null);
          setSelectedEdge(null);
          setConnectionState(null);
          setPendingConnectionSource(null);
          toast.success("Fluxo importado.");
        } catch (error) {
          toast.error((error as Error).message || "Nao foi possivel importar o fluxo.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [persistProject, resolveAutoEdges, snapshot],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      )
        return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrl && key === "s") {
        e.preventDefault();
        exportJson();
        return;
      }
      if (ctrl && key === "e") {
        e.preventDefault();
        exportJson();
        return;
      }
      if (ctrl && key === "o") {
        e.preventDefault();
        triggerImport();
        return;
      }
      if (ctrl && key === "p") {
        e.preventDefault();
        void exportPng();
        return;
      }
      if (ctrl && key === "l") {
        e.preventDefault();
        organize("horizontal");
        return;
      }
      if (ctrl && key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (ctrl && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && key === "d") {
        e.preventDefault();
        duplicateSelection();
        return;
      }
      if (ctrl && key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }
      if (ctrl && e.key === "0") {
        e.preventDefault();
        fitView({ padding: 0.2 });
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
        return;
      }
      if (e.key === "Escape") {
        setSelectedNode(null);
        setSelectedEdge(null);
        setNodeModalOpen(false);
        setEdgeModalOpen(false);
        setConnectionState(null);
        setPendingConnectionSource(null);
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        setPresentation((v) => !v);
        return;
      }

      if (key === "v") setTool("select");
      else if (key === "b") addBlock();
      else if (key === "f") setTool("shape");
      else if (key === "l") setTool("line");
      else if (key === "a") setTool("arrow");
      else if (key === "c") setTool("connect");
      else if (key === "t") setTool("text");
      else if (key === "g") setGridOn((v) => !v);
      else if (key === "s") setSnapOn((v) => !v);
      else if (key === "?") setHelpOpen(true);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    addBlock,
    deleteSelection,
    duplicateSelection,
    exportJson,
    exportPng,
    fitView,
    organize,
    redo,
    selectAll,
    triggerImport,
    undo,
  ]);

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === "block") {
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        addBlock(pos);
        setTool("select");
      }
      setSelectedNode(null);
      setSelectedEdge(null);
      setConnectionState(null);
      setPendingConnectionSource(null);
    },
    [tool, addBlock, screenToFlowPosition],
  );

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setConnectionState(null);
    setPendingConnectionSource(null);
  }, []);

  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    setSelectedNode(node);
    setNodeModalOpen(true);
    setPendingConnectionSource(null);
  }, []);

  const onEdgeDoubleClick = useCallback((_: unknown, edge: Edge) => {
    setSelectedEdge(edge);
    setEdgeModalOpen(true);
  }, []);

  const onSaveNode = useCallback(
    (data: FluxoNodeData) => {
      if (!selectedNode) return;
      snapshot();
      setNodes((nds) => {
        const nextNodes = nds.map((n) => (n.id === selectedNode.id ? { ...n, data } : n));
        return expandNodesForConnectionLoad(nextNodes, edges);
      });
      setSelectedNode((n) => (n ? { ...n, data } : n));
    },
    [edges, selectedNode, snapshot],
  );

  const activeSelectedNode = useMemo(
    () =>
      selectedNode ? (nodes.find((node) => node.id === selectedNode.id) ?? selectedNode) : null,
    [nodes, selectedNode],
  );

  const updateSelectedNodeTitle = useCallback(
    (title: string) => {
      const nodeId = selectedNode?.id;
      if (!nodeId) return;

      if (inlineRenameNodeIdRef.current !== nodeId) {
        snapshot();
        inlineRenameNodeIdRef.current = nodeId;
      }

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;

          const data = node.data as FluxoNodeData;
          return {
            ...node,
            data: {
              ...data,
              title,
            },
          };
        }),
      );

      setSelectedNode((node) => {
        if (!node || node.id !== nodeId) return node;

        const data = node.data as FluxoNodeData;
        return {
          ...node,
          data: {
            ...data,
            title,
          },
        };
      });
    },
    [selectedNode?.id, snapshot],
  );

  const finishInlineRename = useCallback(() => {
    inlineRenameNodeIdRef.current = null;
  }, []);
  const updateSelectedNodeShape = useCallback(
    (shape: ShapeType) => {
      const nodeId = selectedNode?.id;
      if (!nodeId) return;

      snapshot();

      setNodes((nds) => {
        const nextNodes = nds.map((node) => {
          if (node.id !== nodeId) return node;

          const data = node.data as FluxoNodeData;
          return {
            ...node,
            data: {
              ...data,
              shape,
            },
          };
        });

        return expandNodesForConnectionLoad(nextNodes, edges);
      });

      setSelectedNode((node) => {
        if (!node || node.id !== nodeId) return node;

        const data = node.data as FluxoNodeData;
        return {
          ...node,
          data: {
            ...data,
            shape,
          },
        };
      });
    },
    [edges, selectedNode?.id, snapshot],
  );

  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    deleteSelection();
  }, [deleteSelection, selectedNode]);

  const onSaveEdge = useCallback(
    (data: FluxoEdgeData) => {
      if (!selectedEdge) return;
      snapshot();
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== selectedEdge.id) return edge;
          return createEdge({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle:
              data.sourceHandle ??
              (edge.sourceHandle as FluxoEdgeSerialized["sourceHandle"]) ??
              "auto",
            targetHandle:
              data.targetHandle ??
              (edge.targetHandle as FluxoEdgeSerialized["targetHandle"]) ??
              "auto",
            label: data.label,
            hiddenInfo: data.hiddenInfo,
            type: data.lineType,
            stroke: data.stroke,
            hasArrow: data.hasArrow,
            direction: data.direction,
            style: data.style ?? {
              stroke: "#374151",
              strokeWidth: 2,
              strokeDasharray: data.stroke === "dashed" ? "5 4" : null,
              markerEnd: data.hasArrow ? "arrow" : "none",
            },
            routing: data.routing ?? { mode: "auto", points: [], avoidCrossings: true },
            semantic: data.semantic,
            customFields: data.customFields ?? [],
          });
        }),
      );
      setSelectedEdge((edge) => (edge ? { ...edge, data, label: data.label } : edge));
    },
    [createEdge, selectedEdge, snapshot],
  );

  const onDeleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    deleteSelection();
  }, [deleteSelection, selectedEdge]);

  const updateProjectName = useCallback(
    (name: string) => {
      const next = { ...projectRef.current, name, updatedAt: new Date().toISOString() };
      persistProject(next);
    },
    [persistProject],
  );

  return (
    <div ref={wrapperRef} className="relative h-screen w-screen overflow-hidden bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.flow,.flow.json,application/json"
        className="hidden"
        onChange={onImportFile}
      />

      {!presentation && (
        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-border bg-card/85 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Fluxo
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <input
                value={project.name}
                onChange={(e) => updateProjectName(e.target.value)}
                className="bg-transparent font-display text-base italic tracking-tight outline-none focus:underline"
                style={{ width: `${Math.max(project.name.length, 8)}ch` }}
              />
            </div>
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
              - {nodes.length} blocos - {edges.length} setas
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full gap-1.5">
                  <Palette className="h-4 w-4" />
                  Aparencia
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div>
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Cor do canvas
                  </Label>
                  <div className="mt-2 flex items-center overflow-hidden rounded-md border border-border bg-background">
                    <label className="relative h-9 w-10 cursor-pointer border-r border-border">
                      <span className="absolute inset-1 rounded" style={{ background }} />
                      <input
                        type="color"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                    <Input
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="h-9 border-0 font-mono text-xs focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Predefinidos
                  </Label>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {["#ffffff", "#fafaf7", "#f7f1e6", "#e0eefb", "#ece6f5", "#0f172a"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setBackground(color)}
                          className={`h-8 rounded-md border transition ${
                            background === color
                              ? "border-foreground ring-2 ring-foreground/20"
                              : "border-border hover:border-foreground/40"
                          }`}
                          style={{ background: color }}
                        />
                      ),
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  Organizar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => organize("horizontal")}>
                  Horizontal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => organize("vertical")}>Vertical</DropdownMenuItem>
                <DropdownMenuItem onClick={() => organize("radial")}>Radial</DropdownMenuItem>
                <DropdownMenuItem onClick={() => organize("compact")}>Compacto</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpOpen(true)}
              className="rounded-full"
              title="Atalhos"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setPresentation(true)}
              className="rounded-full gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              <Presentation className="h-3.5 w-3.5" />
              Apresentar
            </Button>
          </div>
        </div>
      )}

      {presentation && (
        <button
          onClick={() => setPresentation(false)}
          className="absolute right-4 top-4 z-40 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Sair do modo apresentacao
        </button>
      )}

      <div
        className="absolute inset-0"
        style={{
          paddingTop: presentation ? 0 : 48,
          paddingLeft: !presentation && toolbarMode === "side" ? 220 : 0,
        }}
      >
        <ReactFlow
          nodes={renderedNodes}
          edges={renderedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
          onNodeClick={handleNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
            setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0]! : null);
            setSelectedEdge(selectedEdges.length === 1 ? selectedEdges[0]! : null);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid={snapOn}
          snapGrid={[16, 16]}
          fitView
          style={{ backgroundColor: background }}
          proOptions={{ hideAttribution: true }}
        >
          {gridOn ? (
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
          ) : null}
          <Controls position="bottom-right" showInteractive={false} className="!shadow-sm" />
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            maskColor="rgba(15,23,42,0.04)"
            nodeColor={(node) => (node.data as FluxoNodeData)?.style?.backgroundColor ?? "#ffffff"}
            nodeStrokeColor={(node) =>
              (node.data as FluxoNodeData)?.style?.borderColor ?? "#d1d5db"
            }
            style={{ width: 160, height: 110 }}
          />
        </ReactFlow>
      </div>

      {!presentation ? (
        <SelectionToolbar
          visible={Boolean(selectedNode || selectedEdge)}
          hasEdgeSelection={Boolean(selectedEdge)}
          nodeTitle={
            activeSelectedNode && !selectedEdge
              ? ((activeSelectedNode.data as FluxoNodeData).title ?? "")
              : undefined
          }
          onNodeTitleChange={
            activeSelectedNode && !selectedEdge ? updateSelectedNodeTitle : undefined
          }
          onNodeTitleCommit={finishInlineRename}
          nodeShape={
            activeSelectedNode && !selectedEdge
              ? ((activeSelectedNode.data as FluxoNodeData).shape ?? "rounded-rectangle")
              : undefined
          }
          onNodeShapeChange={
            activeSelectedNode && !selectedEdge ? updateSelectedNodeShape : undefined
          }
          onEdit={selectedEdge ? () => setEdgeModalOpen(true) : undefined}
          onDuplicate={activeSelectedNode && !selectedEdge ? duplicateSelection : undefined}
          onInvert={selectedEdge ? invertSelectedEdge : undefined}
          onAuto={setSelectedEdgeAutoRouting}
          onDeviationX={() => setSelectedEdgeDeviation("x")}
          onDeviationY={() => setSelectedEdgeDeviation("y")}
          onRemove={deleteSelection}
        />
      ) : null}

      <Toolbar
        mode={toolbarMode}
        onModeChange={setToolbarMode}
        tool={tool}
        onToolChange={setTool}
        gridOn={gridOn}
        snapOn={snapOn}
        compactView={compactView}
        onToggleGrid={() => setGridOn((v) => !v)}
        onToggleSnap={() => setSnapOn((v) => !v)}
        onToggleCompactView={() => setCompactView((v) => !v)}
        onUndo={undo}
        onRedo={redo}
        onOrganize={() => organize("horizontal")}
        onExportJson={exportJson}
        onExportPng={() => void exportPng()}
        onImportJson={triggerImport}
        onFitView={() => fitView({ padding: 0.2 })}
        onPresentation={() => setPresentation(true)}
        onAddBlock={() => addBlock()}
      />

      <NodePropertiesModal
        open={nodeModalOpen}
        data={(selectedNode?.data as FluxoNodeData) ?? null}
        onOpenChange={setNodeModalOpen}
        onSave={onSaveNode}
        onDelete={onDeleteNode}
      />
      <EdgePropertiesModal
        open={edgeModalOpen}
        data={(selectedEdge?.data as FluxoEdgeData) ?? null}
        onOpenChange={setEdgeModalOpen}
        onSave={onSaveEdge}
        onDelete={onDeleteEdge}
      />
      <ShortcutHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
