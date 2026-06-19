import { memo, useEffect } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { getShapeConnectionPoint, getShapeContentFrame } from "@/lib/flow/shapeGeometry";
import type { FlowHandlePosition, FluxoNodeData } from "@/lib/flow/types";
import { ShapeRenderer } from "./ShapeRenderer";

type PhysicalHandlePosition = Exclude<FlowHandlePosition, "auto">;

type RenderHandle = {
  id: PhysicalHandlePosition;
  label: string;
  position: Position;
};

const HANDLE_POSITIONS: RenderHandle[] = [
  { id: "top-left", label: "Topo esquerdo", position: Position.Top },
  { id: "top", label: "Topo central", position: Position.Top },
  { id: "top-right", label: "Topo direito", position: Position.Top },
  { id: "right-top", label: "Direita superior", position: Position.Right },
  { id: "right", label: "Direita central", position: Position.Right },
  { id: "right-bottom", label: "Direita inferior", position: Position.Right },
  { id: "bottom-right", label: "Baixo direito", position: Position.Bottom },
  { id: "bottom", label: "Baixo central", position: Position.Bottom },
  { id: "bottom-left", label: "Baixo esquerdo", position: Position.Bottom },
  { id: "left-bottom", label: "Esquerda inferior", position: Position.Left },
  { id: "left", label: "Esquerda central", position: Position.Left },
  { id: "left-top", label: "Esquerda superior", position: Position.Left },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getNodeTypography(w: number, h: number, isDiamond: boolean, compactView: boolean) {
  const areaScale = Math.sqrt((w * h) / (180 * 80));
  const heightScale = h / 80;
  const shapeScale = isDiamond ? 0.92 : 1;

  const titleFontSize = clamp(13 * areaScale * shapeScale, 10, 20);
  const summaryFontSize = compactView
    ? clamp(8 * areaScale * shapeScale, 6, 10)
    : clamp(10 * areaScale * shapeScale, 8, 14);
  const padding = compactView
    ? clamp(Math.min(w, h) * 0.06, 4, 12)
    : clamp(Math.min(w, h) * 0.11, 8, 20);
  const titleLineClamp = h < 62 ? 2 : h > 138 ? 4 : 3;
  const summaryLineClamp = compactView ? 1 : h > 136 ? 2 : 1;
  const showSummary = compactView ? h >= 80 && w >= 130 : h >= 64 && w >= 130;

  return {
    titleFontSize,
    summaryFontSize,
    padding,
    titleLineClamp,
    summaryLineClamp,
    showSummary,
    titleLineHeight: clamp(1.08 + heightScale * 0.04, 1.1, 1.22),
    summaryLineHeight: 1.2,
  };
}

function getHandleStyle(point: { x: number; y: number }, zIndex: number): React.CSSProperties {
  return {
    left: point.x,
    top: point.y,
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    zIndex,
  };
}

function FluxoNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as FluxoNodeData & { compactView?: boolean };
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const w = d.width ?? 180;
  const h = d.height ?? 80;
  const isDiamond = d.shape === "diamond";
  const compactView = d.compactView ?? false;
  const typography = getNodeTypography(w, h, isDiamond, compactView);
  const borderWidth = d.style.borderWidth ?? 1.5;
  const contentFrame = getShapeContentFrame(d.shape, w, h, typography.padding);
  const shapeInset = Math.max(4, borderWidth + 3);

  useEffect(() => {
    updateNodeInternals(id);
  }, [d.shape, h, id, updateNodeInternals, w]);

  return (
    <div className="fluxo-node group" style={{ width: w, height: h, position: "relative" }}>
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={80}
        minHeight={40}
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border !border-brand !bg-background"
        lineClassName="!border-brand/70"
        onResize={(_, params) => {
          setNodes((nodes) =>
            nodes.map((node) => {
              if (node.id !== id) return node;
              const nodeData = node.data as FluxoNodeData;
              const width = Math.max(80, params.width);
              const height = Math.max(40, params.height);
              return {
                ...node,
                position: {
                  x: Number.isFinite(params.x) ? params.x : node.position.x,
                  y: Number.isFinite(params.y) ? params.y : node.position.y,
                },
                data: {
                  ...nodeData,
                  width,
                  height,
                },
              };
            }),
          );
        }}
      />

      <div
        className="relative"
        style={{
          width: w,
          height: h,
          color: d.style.textColor,
          filter: selected ? "drop-shadow(0 10px 18px rgba(0,0,0,0.16))" : undefined,
        }}
        title={d.hiddenInfo || d.summary || d.title}
      >
        <ShapeRenderer
          shape={d.shape}
          width={w}
          height={h}
          fill={d.style.backgroundColor}
          stroke={d.style.borderColor}
          strokeWidth={borderWidth}
          borderRadius={d.style.borderRadius}
          selected={Boolean(selected)}
        />
        <div
          style={{
            position: "absolute",
            left: contentFrame.x,
            top: contentFrame.y,
            width: contentFrame.width,
            height: contentFrame.height,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <div
            className="font-medium"
            style={{
              fontSize: typography.titleFontSize,
              lineHeight: typography.titleLineHeight,
              display: "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: typography.titleLineClamp,
            }}
          >
            {d.title}
          </div>
          {typography.showSummary && d.summary ? (
            <div
              className="mt-1 opacity-60"
              style={{
                fontSize: typography.summaryFontSize,
                lineHeight: typography.summaryLineHeight,
                display: "-webkit-box",
                overflow: "hidden",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: typography.summaryLineClamp,
              }}
            >
              {d.summary}
            </div>
          ) : null}
        </div>

        {d.hiddenInfo ? (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-40"
            aria-label="Tem informação oculta"
          />
        ) : null}
      </div>

      {selected ? (
        <div className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-background opacity-80">
          duplo-clique para editar
        </div>
      ) : null}

      {d.hiddenInfo ? (
        <div
          className="pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-md group-hover:block"
          style={{ top: -32, maxWidth: 240 }}
        >
          {d.hiddenInfo}
        </div>
      ) : null}

      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`source-${handle.id}`}
          type="source"
          position={handle.position}
          id={handle.id}
          isConnectableStart
          isConnectableEnd
          className="!h-2.5 !w-2.5 !border !border-slate-400 !bg-white opacity-0 shadow-sm transition group-hover:opacity-90"
          style={getHandleStyle(getShapeConnectionPoint(d.shape, w, h, handle.id, shapeInset), 2)}
          title={`Arraste daqui para criar uma seta saindo deste bloco: ${handle.label}`}
        />
      ))}
      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`target-${handle.id}`}
          type="target"
          position={handle.position}
          id={handle.id}
          isConnectableStart={false}
          isConnectableEnd
          className="!h-2 !w-2 !border-0 !bg-transparent"
          style={getHandleStyle(getShapeConnectionPoint(d.shape, w, h, handle.id, shapeInset), 1)}
          title={`Solte aqui para conectar uma seta neste bloco: ${handle.label}`}
        />
      ))}
    </div>
  );
}

export const FluxoNode = memo(FluxoNodeComponent);
