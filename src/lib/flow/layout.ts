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

const DEFAULT_OPTIONS: Required<AutoLayoutOptions> = {
  direction: "vertical",
  layerGap: 180,
  nodeGap: 260,
  startX: 120,
  startY: 100,
};

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

    const position =
      resolved.direction === "horizontal"
        ? {
            x: resolved.startX + level * resolved.layerGap,
            y: resolved.startY + centeredIndex * resolved.nodeGap,
          }
        : {
            x: resolved.startX + centeredIndex * resolved.nodeGap,
            y: resolved.startY + level * resolved.layerGap,
          };

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

function getNodeSize(node: Node) {
  const data = node.data as Partial<FluxoNodeData> | undefined;
  return {
    width: data?.width ?? DEFAULT_NODE_SIZE.width,
    height: data?.height ?? DEFAULT_NODE_SIZE.height,
  };
}
