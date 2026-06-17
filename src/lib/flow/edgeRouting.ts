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
type FixedHandle = Exclude<FlowHandlePosition, "auto">;

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
  sourceHandle: FixedHandle;
  targetHandle: FixedHandle;
};

export type ManualRouteVariant = "horizontal" | "vertical";

const FIXED_HANDLES: FixedHandle[] = ["top", "right", "bottom", "left"];

const HANDLE_VECTOR: Record<FixedHandle, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

/**
 * Escolhe o melhor par de handles entre dois blocos.
 *
 * A primeira versão usava apenas o maior eixo entre os centros. Isso funcionava
 * em casos simples, mas gerava conexões estranhas quando os blocos estavam na
 * diagonal, parcialmente alinhados ou com retorno. A estratégia atual avalia
 * todos os pares possíveis de lados e pontua cada opção com base em:
 *
 * - distância Manhattan entre pontos de ancoragem;
 * - se o lado de saída aponta para o alvo;
 * - se o lado de entrada aponta para a origem;
 * - se existe corredor livre horizontal/vertical entre os blocos;
 * - se a conexão evita sair pelo lado oposto ao destino.
 */
export function getSmartHandles(source: Rect, target: Rect): SmartHandles {
  let best: { handles: SmartHandles; score: number } | null = null;

  for (const sourceHandle of FIXED_HANDLES) {
    for (const targetHandle of FIXED_HANDLES) {
      const score = scoreHandlePair(source, target, sourceHandle, targetHandle);
      if (!best || score < best.score) {
        best = { handles: { sourceHandle, targetHandle }, score };
      }
    }
  }

  return best?.handles ?? fallbackHandles(source, target);
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
  sourceHandle: FixedHandle;
  targetHandle: FixedHandle;
} {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  const edgeData = edge.data as Partial<FluxoEdgeData> | undefined;

  const currentSourceHandle = normalizeHandle(edge.sourceHandle ?? edgeData?.sourceHandle);
  const currentTargetHandle = normalizeHandle(edge.targetHandle ?? edgeData?.targetHandle);

  if (!source || !target) {
    return {
      sourceHandle: currentSourceHandle === "auto" ? "right" : currentSourceHandle,
      targetHandle: currentTargetHandle === "auto" ? "left" : currentTargetHandle,
    };
  }

  const smart = getSmartHandles(reactFlowNodeToRect(source), reactFlowNodeToRect(target));
  const shouldAutoRoute = shouldAutoRouteEdge(edgeData, currentSourceHandle, currentTargetHandle);

  if (!shouldAutoRoute) {
    return {
      sourceHandle: currentSourceHandle === "auto" ? smart.sourceHandle : currentSourceHandle,
      targetHandle: currentTargetHandle === "auto" ? smart.targetHandle : currentTargetHandle,
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
    const shouldClearAutoPoints =
      Boolean(data) && nextRoutingMode === "auto" && Boolean(data?.routing?.points?.length);

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

function scoreHandlePair(
  source: Rect,
  target: Rect,
  sourceHandle: FixedHandle,
  targetHandle: FixedHandle,
) {
  const sourceAnchor = getAnchorPoint(source, sourceHandle);
  const targetAnchor = getAnchorPoint(target, targetHandle);
  const dx = target.centerX - source.centerX;
  const dy = target.centerY - source.centerY;
  const fromSource = normalizeVector({ x: dx, y: dy });
  const fromTarget = normalizeVector({ x: -dx, y: -dy });

  let score = manhattanDistance(sourceAnchor, targetAnchor);

  score += directionPenalty(sourceHandle, fromSource);
  score += directionPenalty(targetHandle, fromTarget);
  score += corridorPenalty(source, target, sourceHandle, targetHandle);
  score += sameSidePenalty(sourceHandle, targetHandle);
  score += crossingThroughNodePenalty(source, target, sourceHandle, targetHandle);

  return score;
}

function directionPenalty(handle: FixedHandle, direction: { x: number; y: number }) {
  const handleDirection = HANDLE_VECTOR[handle];
  const dot = handleDirection.x * direction.x + handleDirection.y * direction.y;

  if (dot > 0.65) return 0;
  if (dot > 0.2) return 80;
  if (dot > -0.2) return 180;
  return 600;
}

function corridorPenalty(
  source: Rect,
  target: Rect,
  sourceHandle: FixedHandle,
  targetHandle: FixedHandle,
) {
  const sourceRight = source.x + source.width;
  const targetRight = target.x + target.width;
  const sourceBottom = source.y + source.height;
  const targetBottom = target.y + target.height;

  const hasHorizontalGap = target.x >= sourceRight || source.x >= targetRight;
  const hasVerticalGap = target.y >= sourceBottom || source.y >= targetBottom;
  const verticalOverlap = rangesOverlap(source.y, sourceBottom, target.y, targetBottom);
  const horizontalOverlap = rangesOverlap(source.x, sourceRight, target.x, targetRight);

  const isHorizontalPair =
    (sourceHandle === "right" && targetHandle === "left") ||
    (sourceHandle === "left" && targetHandle === "right");
  const isVerticalPair =
    (sourceHandle === "bottom" && targetHandle === "top") ||
    (sourceHandle === "top" && targetHandle === "bottom");

  if (isHorizontalPair && hasHorizontalGap && verticalOverlap) return -140;
  if (isVerticalPair && hasVerticalGap && horizontalOverlap) return -140;
  if (isHorizontalPair && hasHorizontalGap) return -80;
  if (isVerticalPair && hasVerticalGap) return -80;

  if (isHorizontalPair && !hasHorizontalGap) return 120;
  if (isVerticalPair && !hasVerticalGap) return 120;

  return 0;
}

function sameSidePenalty(sourceHandle: FixedHandle, targetHandle: FixedHandle) {
  if (sourceHandle === targetHandle) return 260;
  return 0;
}

function crossingThroughNodePenalty(
  source: Rect,
  target: Rect,
  sourceHandle: FixedHandle,
  targetHandle: FixedHandle,
) {
  const sourceAnchor = getAnchorPoint(source, sourceHandle);
  const targetAnchor = getAnchorPoint(target, targetHandle);
  let penalty = 0;

  if (sourceAnchor.x > source.x && sourceAnchor.x < source.x + source.width) penalty += 40;
  if (targetAnchor.x > target.x && targetAnchor.x < target.x + target.width) penalty += 40;
  if (sourceAnchor.y > source.y && sourceAnchor.y < source.y + source.height) penalty += 40;
  if (targetAnchor.y > target.y && targetAnchor.y < target.y + target.height) penalty += 40;

  return penalty;
}

function fallbackHandles(source: Rect, target: Rect): SmartHandles {
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

function getAnchorPoint(rect: Rect, handle: FixedHandle) {
  if (handle === "top") return { x: rect.centerX, y: rect.y };
  if (handle === "right") return { x: rect.x + rect.width, y: rect.centerY };
  if (handle === "bottom") return { x: rect.centerX, y: rect.y + rect.height };
  return { x: rect.x, y: rect.centerY };
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

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
}

function manhattanDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function normalizeVector(vector: { x: number; y: number }) {
  const length = Math.hypot(vector.x, vector.y);
  if (!length) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}
