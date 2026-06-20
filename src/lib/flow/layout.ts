import type { Edge, Node } from "@xyflow/react";
import { DEFAULT_NODE_SIZE } from "./defaults";
import type { FlowLayoutDirection, FluxoNodeData } from "./types";

export type AutoLayoutOptions = {
  direction?: FlowLayoutDirection;
  layerGap?: number;
  nodeGap?: number;
  startX?: number;
  startY?: number;
};

export type NodeCollisionOptions = {
  padding?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  maxRings?: number;
};

const DEFAULT_OPTIONS: Required<AutoLayoutOptions> = {
  direction: "vertical",
  layerGap: 180,
  nodeGap: 260,
  startX: 120,
  startY: 100,
};

const DEFAULT_COLLISION_OPTIONS: Required<NodeCollisionOptions> = {
  padding: 20,
  snapToGrid: false,
  gridSize: 16,
  maxRings: 96,
};

type NodeRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function resolveNodeCollisions(
  nodes: Node[],
  nodeIds: Iterable<string>,
  options: NodeCollisionOptions = {},
) {
  let resolvedNodes = nodes;

  for (const nodeId of nodeIds) {
    const node = resolvedNodes.find((candidate) => candidate.id === nodeId);
    if (!node) continue;

    const position = findNearestFreeNodePosition(node, resolvedNodes, options);
    if (position.x === node.position.x && position.y === node.position.y) continue;

    resolvedNodes = resolvedNodes.map((candidate) =>
      candidate.id === nodeId ? { ...candidate, position } : candidate,
    );
  }

  return resolvedNodes;
}

export function findNearestFreeNodePosition(
  node: Node,
  nodes: Node[],
  options: NodeCollisionOptions = {},
) {
  const resolved = { ...DEFAULT_COLLISION_OPTIONS, ...options };
  const obstacles = nodes.filter((candidate) => candidate.id !== node.id);
  const desired = snapPosition(node.position, resolved);

  if (isPositionFree(node, desired, obstacles, resolved.padding)) return desired;

  const tested = new Set<string>();
  const step = resolved.snapToGrid ? resolved.gridSize : 16;
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ];

  for (let ring = 1; ring <= resolved.maxRings; ring += 1) {
    const distance = ring * step;

    for (const direction of directions) {
      const candidate = snapPosition(
        {
          x: desired.x + direction.x * distance,
          y: desired.y + direction.y * distance,
        },
        resolved,
      );
      const key = `${candidate.x}:${candidate.y}`;
      if (tested.has(key)) continue;
      tested.add(key);

      if (isPositionFree(node, candidate, obstacles, resolved.padding)) return candidate;
    }
  }

  return desired;
}

function isPositionFree(
  node: Node,
  position: { x: number; y: number },
  nodes: Node[],
  padding: number,
) {
  const candidateRect = getNodeRect(node, position, padding);
  return nodes.every(
    (obstacle) => !rectsOverlap(candidateRect, getNodeRect(obstacle, obstacle.position, padding)),
  );
}

function getNodeRect(node: Node, position: { x: number; y: number }, padding: number): NodeRect {
  const size = getNodeSize(node);
  const inset = padding / 2;

  return {
    left: position.x - inset,
    right: position.x + size.width + inset,
    top: position.y - inset,
    bottom: position.y + size.height + inset,
  };
}

function rectsOverlap(first: NodeRect, second: NodeRect) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

function snapPosition(position: { x: number; y: number }, options: Required<NodeCollisionOptions>) {
  if (!options.snapToGrid) return position;

  return {
    x: Math.round(position.x / options.gridSize) * options.gridSize,
    y: Math.round(position.y / options.gridSize) * options.gridSize,
  };
}

export function calculateAutoLayout(
  nodes: Node[],
  edges: Edge[],
  options: AutoLayoutOptions = {},
): Node[] {
  if (nodes.length === 0) return nodes;

  const resolved = { ...DEFAULT_OPTIONS, ...options };
  const levels = calculateNodeLevels(nodes, edges);
  const groupedLevels = groupNodesByLevel(nodes, levels);

  return nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const siblings = groupedLevels.get(level) ?? [];
    const siblingIndex = siblings.findIndex((item) => item.id === node.id);
    const centeredIndex = siblingIndex - (siblings.length - 1) / 2;
    const size = getNodeSize(node);

    const position = getLayoutPosition({
      direction: resolved.direction,
      level,
      siblingIndex,
      siblingCount: siblings.length,
      centeredIndex,
      layerGap: resolved.layerGap,
      nodeGap: resolved.nodeGap,
      startX: resolved.startX,
      startY: resolved.startY,
    });

    return {
      ...node,
      position: {
        x: Math.round(position.x - size.width / 2),
        y: Math.round(position.y - size.height / 2),
      },
    };
  });
}

function calculateNodeLevels(nodes: Node[], edges: Edge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((node) => node.id);
  const levels = new Map<string, number>();

  for (const node of nodes) {
    levels.set(node.id, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const currentLevel = levels.get(current) ?? 0;
    for (const target of adjacency.get(current) ?? []) {
      levels.set(target, Math.max(levels.get(target) ?? 0, currentLevel + 1));
      incoming.set(target, (incoming.get(target) ?? 1) - 1);

      if ((incoming.get(target) ?? 0) <= 0) {
        queue.push(target);
      }
    }
  }

  return levels;
}

function groupNodesByLevel(nodes: Node[], levels: Map<string, number>) {
  return nodes.reduce((groups, node) => {
    const level = levels.get(node.id) ?? 0;
    const existing = groups.get(level) ?? [];
    existing.push(node);
    groups.set(level, existing);
    return groups;
  }, new Map<number, Node[]>());
}

function getLayoutPosition({
  direction,
  level,
  siblingIndex,
  siblingCount,
  centeredIndex,
  layerGap,
  nodeGap,
  startX,
  startY,
}: {
  direction: FlowLayoutDirection;
  level: number;
  siblingIndex: number;
  siblingCount: number;
  centeredIndex: number;
  layerGap: number;
  nodeGap: number;
  startX: number;
  startY: number;
}) {
  if (direction === "radial") {
    const count = Math.max(siblingCount, 1);
    const angle = (siblingIndex / count) * Math.PI * 2;
    const radius = 120 + level * layerGap;

    return {
      x: startX + 320 + Math.cos(angle) * radius,
      y: startY + 180 + Math.sin(angle) * radius,
    };
  }

  if (direction === "vertical") {
    return {
      x: startX + centeredIndex * nodeGap,
      y: startY + level * layerGap,
    };
  }

  return {
    x: startX + level * layerGap,
    y: startY + centeredIndex * nodeGap,
  };
}

function getNodeSize(node: Node) {
  const data = node.data as Partial<FluxoNodeData> | undefined;
  return {
    width: data?.width ?? DEFAULT_NODE_SIZE.width,
    height: data?.height ?? DEFAULT_NODE_SIZE.height,
  };
}
