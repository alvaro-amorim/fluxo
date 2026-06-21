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

const LAYOUT_COLLISION_PADDING = 36;
const MAX_LAYOUT_SWEEPS = 4;

type NodeRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type NodeSize = {
  width: number;
  height: number;
};

type PositionedNode = Node & {
  position: { x: number; y: number };
};

type ComponentLayout = {
  nodes: PositionedNode[];
  width: number;
  height: number;
};

type LayoutGaps = {
  layerGap: number;
  nodeGap: number;
  componentGap: number;
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
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const validEdges = edges.filter(
    (edge) => edge.source !== edge.target && nodeById.has(edge.source) && nodeById.has(edge.target),
  );
  const components = getConnectedComponents(nodes, validEdges);
  const gaps = getLayoutGaps(resolved.direction, resolved);

  const layouts = components.map((component) =>
    resolved.direction === "radial"
      ? layoutRadialComponent(component, validEdges, resolved, gaps)
      : layoutLayeredComponent(component, validEdges, resolved.direction, gaps),
  );

  const positioned = placeComponents(layouts, resolved.direction, resolved.startX, resolved.startY, gaps);
  const positionedById = new Map(positioned.map((node) => [node.id, node]));
  const nextNodes = nodes.map((node) => positionedById.get(node.id) ?? node);

  return resolveNodeCollisions(
    nextNodes,
    nextNodes.map((node) => node.id),
    { padding: LAYOUT_COLLISION_PADDING, maxRings: 160 },
  );
}

function getConnectedComponents(nodes: Node[], edges: Edge[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) adjacency.set(node.id, new Set());

  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const components: Node[][] = [];

  for (const node of sortNodesByOriginalPosition(nodes)) {
    if (visited.has(node.id)) continue;

    const queue = [node.id];
    const component: Node[] = [];
    visited.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const currentNode = nodeById.get(current);
      if (currentNode) component.push(currentNode);

      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }

    components.push(sortNodesByOriginalPosition(component));
  }

  return components.sort((first, second) => {
    const firstBounds = getNodesBounds(first);
    const secondBounds = getNodesBounds(second);
    return firstBounds.top - secondBounds.top || firstBounds.left - secondBounds.left;
  });
}

function layoutLayeredComponent(
  componentNodes: Node[],
  allEdges: Edge[],
  direction: FlowLayoutDirection,
  gaps: LayoutGaps,
): ComponentLayout {
  const componentIds = new Set(componentNodes.map((node) => node.id));
  const componentEdges = allEdges.filter(
    (edge) => componentIds.has(edge.source) && componentIds.has(edge.target),
  );
  const levels = calculateNodeLevels(componentNodes, componentEdges);
  const layers = orderLayers(groupNodesByLevel(componentNodes, levels), componentEdges);
  const isHorizontal = direction === "horizontal";
  const layerLayouts = layers.map((layer) => getLayerMetrics(layer, isHorizontal, gaps.nodeGap));
  const mainPositions: number[] = [];
  let cursor = 0;

  for (const [index, layer] of layers.entries()) {
    if (index > 0) {
      const previous = layerLayouts[index - 1];
      const previousMainSize = isHorizontal ? previous.maxWidth : previous.maxHeight;
      cursor += previousMainSize + gaps.layerGap;
    }

    mainPositions[index] = cursor;
    const currentMainSize = isHorizontal ? layerLayouts[index].maxWidth : layerLayouts[index].maxHeight;
    cursor += index === layers.length - 1 ? currentMainSize : 0;
  }

  const totalMainSize = layers.length
    ? mainPositions[layers.length - 1] +
      (isHorizontal ? layerLayouts[layers.length - 1].maxWidth : layerLayouts[layers.length - 1].maxHeight)
    : 0;
  const totalCrossSize = Math.max(0, ...layerLayouts.map((layout) => layout.crossSpan));
  const positioned: PositionedNode[] = [];

  for (const [layerIndex, layer] of layers.entries()) {
    const metrics = layerLayouts[layerIndex];
    let crossCursor = (totalCrossSize - metrics.crossSpan) / 2;

    for (const node of layer) {
      const size = getNodeSize(node);
      const mainSize = isHorizontal ? size.width : size.height;
      const crossSize = isHorizontal ? size.height : size.width;
      const mainOffset = ((isHorizontal ? metrics.maxWidth : metrics.maxHeight) - mainSize) / 2;

      const x = isHorizontal ? mainPositions[layerIndex] + mainOffset : crossCursor;
      const y = isHorizontal ? crossCursor : mainPositions[layerIndex] + mainOffset;

      positioned.push({
        ...node,
        position: { x: Math.round(x), y: Math.round(y) },
      });
      crossCursor += crossSize + gaps.nodeGap;
    }
  }

  return normalizeComponentLayout({
    nodes: positioned,
    width: isHorizontal ? totalMainSize : totalCrossSize,
    height: isHorizontal ? totalCrossSize : totalMainSize,
  });
}

function layoutRadialComponent(
  componentNodes: Node[],
  allEdges: Edge[],
  options: Required<AutoLayoutOptions>,
  gaps: LayoutGaps,
): ComponentLayout {
  if (componentNodes.length === 1) {
    const [node] = componentNodes;
    const size = getNodeSize(node);
    return normalizeComponentLayout({
      nodes: [{ ...node, position: { x: 0, y: 0 } }],
      width: size.width,
      height: size.height,
    });
  }

  const componentIds = new Set(componentNodes.map((node) => node.id));
  const componentEdges = allEdges.filter(
    (edge) => componentIds.has(edge.source) && componentIds.has(edge.target),
  );
  const root = chooseComponentRoot(componentNodes, componentEdges);
  const levels = calculateUndirectedDistances(componentNodes, componentEdges, root.id);
  const grouped = groupNodesByLevel(componentNodes, levels);
  const layers = [...grouped.entries()].sort(([a], [b]) => a - b);
  const maxNodeSize = Math.max(...componentNodes.map((node) => Math.max(getNodeSize(node).width, getNodeSize(node).height)));
  const radiusStep = Math.max(gaps.layerGap, maxNodeSize + options.layerGap * 0.35);
  const positioned: PositionedNode[] = [];

  for (const [level, layer] of layers) {
    const ordered = sortNodesByOriginalPosition(layer);

    if (level === 0) {
      const size = getNodeSize(ordered[0]);
      positioned.push({
        ...ordered[0],
        position: { x: -size.width / 2, y: -size.height / 2 },
      });
      continue;
    }

    const radius = radiusStep * level;
    const angleOffset = level % 2 === 0 ? Math.PI / Math.max(ordered.length, 2) : 0;

    for (const [index, node] of ordered.entries()) {
      const size = getNodeSize(node);
      const angle = angleOffset + (index / ordered.length) * Math.PI * 2;
      positioned.push({
        ...node,
        position: {
          x: Math.round(Math.cos(angle) * radius - size.width / 2),
          y: Math.round(Math.sin(angle) * radius - size.height / 2),
        },
      });
    }
  }

  return normalizeComponentLayout({ nodes: positioned, width: 0, height: 0 });
}

function placeComponents(
  layouts: ComponentLayout[],
  direction: FlowLayoutDirection,
  startX: number,
  startY: number,
  gaps: LayoutGaps,
) {
  const positioned: PositionedNode[] = [];
  let cursorX = startX;
  let cursorY = startY;

  for (const [index, layout] of layouts.entries()) {
    if (index > 0) {
      if (direction === "horizontal") {
        cursorY += layouts[index - 1].height + gaps.componentGap;
      } else {
        cursorX += layouts[index - 1].width + gaps.componentGap;
      }
    }

    for (const node of layout.nodes) {
      positioned.push({
        ...node,
        position: {
          x: Math.round(cursorX + node.position.x),
          y: Math.round(cursorY + node.position.y),
        },
      });
    }
  }

  return positioned;
}

function normalizeComponentLayout(layout: ComponentLayout): ComponentLayout {
  if (layout.nodes.length === 0) return layout;
  const bounds = getNodesBounds(layout.nodes);
  const normalizedNodes = layout.nodes.map((node) => ({
    ...node,
    position: {
      x: Math.round(node.position.x - bounds.left),
      y: Math.round(node.position.y - bounds.top),
    },
  }));

  return {
    nodes: normalizedNodes,
    width: Math.max(layout.width, bounds.right - bounds.left),
    height: Math.max(layout.height, bounds.bottom - bounds.top),
  };
}

function getLayoutGaps(direction: FlowLayoutDirection, options: Required<AutoLayoutOptions>): LayoutGaps {
  if (direction === "compact") {
    return {
      layerGap: 118,
      nodeGap: 56,
      componentGap: 160,
    };
  }

  if (direction === "radial") {
    return {
      layerGap: Math.max(170, Math.min(options.layerGap, 240)),
      nodeGap: 84,
      componentGap: 220,
    };
  }

  return {
    layerGap: Math.max(150, Math.min(options.layerGap, 240)),
    nodeGap: Math.max(76, Math.min(options.nodeGap * 0.38, 120)),
    componentGap: 220,
  };
}

function getLayerMetrics(layer: Node[], isHorizontal: boolean, nodeGap: number) {
  const sizes = layer.map(getNodeSize);
  const crossSpan = sizes.reduce((total, size, index) => {
    const crossSize = isHorizontal ? size.height : size.width;
    return total + crossSize + (index > 0 ? nodeGap : 0);
  }, 0);

  return {
    crossSpan,
    maxWidth: Math.max(0, ...sizes.map((size) => size.width)),
    maxHeight: Math.max(0, ...sizes.map((size) => size.height)),
  };
}

function calculateNodeLevels(nodes: Node[], edges: Edge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const levels = new Map<string, number>();
  const processed = new Set<string>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  const roots = sortNodesByOriginalPosition(
    nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0),
  );
  const queue = roots.length ? roots.map((node) => node.id) : [chooseComponentRoot(nodes, edges).id];

  for (const root of queue) levels.set(root, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    processed.add(current);
    const currentLevel = levels.get(current) ?? 0;

    for (const target of adjacency.get(current) ?? []) {
      levels.set(target, Math.max(levels.get(target) ?? 0, currentLevel + 1));
      incoming.set(target, (incoming.get(target) ?? 1) - 1);

      if ((incoming.get(target) ?? 0) <= 0) {
        queue.push(target);
      }
    }
  }

  // Fallback para ciclos: propaga níveis por algumas iterações sem travar.
  for (let sweep = 0; sweep < nodes.length; sweep += 1) {
    let changed = false;

    for (const edge of edges) {
      const sourceLevel = levels.get(edge.source);
      if (sourceLevel === undefined) continue;
      const targetLevel = levels.get(edge.target) ?? 0;
      const nextLevel = Math.max(targetLevel, sourceLevel + 1);
      if (nextLevel !== targetLevel) {
        levels.set(edge.target, nextLevel);
        changed = true;
      }
    }

    if (!changed) break;
  }

  for (const node of sortNodesByOriginalPosition(nodes)) {
    if (levels.has(node.id)) continue;
    const neighbors = edges
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .map((edge) => (edge.source === node.id ? edge.target : edge.source))
      .map((id) => levels.get(id))
      .filter((level): level is number => typeof level === "number");
    levels.set(node.id, neighbors.length ? Math.max(0, Math.min(...neighbors) + 1) : 0);
  }

  // Compressão leve: evita buracos enormes criados pelo fallback em grafos cíclicos.
  const uniqueLevels = [...new Set([...levels.values()])].sort((a, b) => a - b);
  const compressed = new Map(uniqueLevels.map((level, index) => [level, index]));
  for (const node of nodes) {
    levels.set(node.id, compressed.get(levels.get(node.id) ?? 0) ?? 0);
  }

  return levels;
}

function calculateUndirectedDistances(nodes: Node[], edges: Edge[], rootId: string) {
  const adjacency = new Map<string, string[]>();
  const distances = new Map<string, number>();

  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  const queue = [rootId];
  distances.set(rootId, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const currentDistance = distances.get(current) ?? 0;

    for (const next of adjacency.get(current) ?? []) {
      if (distances.has(next)) continue;
      distances.set(next, currentDistance + 1);
      queue.push(next);
    }
  }

  for (const node of nodes) {
    if (!distances.has(node.id)) distances.set(node.id, 0);
  }

  return distances;
}

function groupNodesByLevel(nodes: Node[], levels: Map<string, number>) {
  const groups = nodes.reduce((accumulator, node) => {
    const level = levels.get(node.id) ?? 0;
    const existing = accumulator.get(level) ?? [];
    existing.push(node);
    accumulator.set(level, existing);
    return accumulator;
  }, new Map<number, Node[]>());

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, layer]) => sortNodesByOriginalPosition(layer));
}

function orderLayers(layers: Node[][], edges: Edge[]) {
  const ordered = layers.map((layer) => [...layer]);
  if (ordered.length <= 1) return ordered;

  for (let sweep = 0; sweep < MAX_LAYOUT_SWEEPS; sweep += 1) {
    for (let index = 1; index < ordered.length; index += 1) {
      sortLayerByBarycenter(ordered[index], ordered[index - 1], edges);
    }
    for (let index = ordered.length - 2; index >= 0; index -= 1) {
      sortLayerByBarycenter(ordered[index], ordered[index + 1], edges);
    }
  }

  return ordered;
}

function sortLayerByBarycenter(layer: Node[], referenceLayer: Node[], edges: Edge[]) {
  const referenceOrder = new Map(referenceLayer.map((node, index) => [node.id, index]));
  const originalOrder = new Map(layer.map((node, index) => [node.id, index]));

  layer.sort((first, second) => {
    const firstScore = getBarycenter(first.id, edges, referenceOrder);
    const secondScore = getBarycenter(second.id, edges, referenceOrder);
    return (
      firstScore - secondScore ||
      (originalOrder.get(first.id) ?? 0) - (originalOrder.get(second.id) ?? 0) ||
      first.id.localeCompare(second.id)
    );
  });
}

function getBarycenter(nodeId: string, edges: Edge[], referenceOrder: Map<string, number>) {
  const connectedOrders = edges
    .flatMap((edge) => {
      if (edge.source === nodeId) return [referenceOrder.get(edge.target)];
      if (edge.target === nodeId) return [referenceOrder.get(edge.source)];
      return [];
    })
    .filter((value): value is number => typeof value === "number");

  if (!connectedOrders.length) return Number.POSITIVE_INFINITY;
  return connectedOrders.reduce((total, value) => total + value, 0) / connectedOrders.length;
}

function chooseComponentRoot(nodes: Node[], edges: Edge[]) {
  const scores = new Map(nodes.map((node) => [node.id, { outgoing: 0, incoming: 0 }]));

  for (const edge of edges) {
    const source = scores.get(edge.source);
    const target = scores.get(edge.target);
    if (source) source.outgoing += 1;
    if (target) target.incoming += 1;
  }

  return [...nodes].sort((first, second) => {
    const firstScore = scores.get(first.id) ?? { outgoing: 0, incoming: 0 };
    const secondScore = scores.get(second.id) ?? { outgoing: 0, incoming: 0 };
    return (
      firstScore.incoming - secondScore.incoming ||
      secondScore.outgoing - firstScore.outgoing ||
      first.position.y - second.position.y ||
      first.position.x - second.position.x ||
      first.id.localeCompare(second.id)
    );
  })[0];
}

function getNodesBounds(nodes: Node[]) {
  if (nodes.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }

  return nodes.reduce(
    (bounds, node) => {
      const size = getNodeSize(node);
      return {
        left: Math.min(bounds.left, node.position.x),
        right: Math.max(bounds.right, node.position.x + size.width),
        top: Math.min(bounds.top, node.position.y),
        bottom: Math.max(bounds.bottom, node.position.y + size.height),
      };
    },
    {
      left: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
    },
  );
}

function sortNodesByOriginalPosition(nodes: Node[]) {
  return [...nodes].sort(
    (first, second) =>
      first.position.y - second.position.y ||
      first.position.x - second.position.x ||
      first.id.localeCompare(second.id),
  );
}

function getNodeSize(node: Node): NodeSize {
  const data = node.data as Partial<FluxoNodeData> | undefined;
  return {
    width: data?.width ?? node.measured?.width ?? node.width ?? DEFAULT_NODE_SIZE.width,
    height: data?.height ?? node.measured?.height ?? node.height ?? DEFAULT_NODE_SIZE.height,
  };
}
