import { memo } from "react";
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { FluxoNodeData, ShapeType } from "@/lib/flow/types";

function shapeStyles(shape: ShapeType, w: number, h: number): React.CSSProperties {
  switch (shape) {
    case "rectangle":
      return { borderRadius: 2 };
    case "rounded-rectangle":
      return { borderRadius: 12 };
    case "circle":
      return { borderRadius: 9999 };
    case "diamond":
      return { borderRadius: 4, transform: "rotate(45deg)" };
    case "hexagon":
      return {
        clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
        borderRadius: 0,
      };
    case "cylinder":
      return { borderRadius: `${w}px / 18px` };
    default:
      return { borderRadius: 8 };
  }
}

const HANDLE_POSITIONS = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

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

function FluxoNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as FluxoNodeData & { compactView?: boolean };
  const { setNodes } = useReactFlow();
  const w = d.width ?? 180;
  const h = d.height ?? 80;
  const isDiamond = d.shape === "diamond";
  const compactView = d.compactView ?? false;
  const typography = getNodeTypography(w, h, isDiamond, compactView);

  const baseStyle: React.CSSProperties = {
    width: w,
    height: h,
    backgroundColor: d.style.backgroundColor,
    border: `1.5px solid ${selected ? "var(--brand)" : d.style.borderColor}`,
    color: d.style.textColor,
    boxShadow: selected
      ? "0 0 0 4px color-mix(in oklab, var(--brand) 22%, transparent), 0 10px 24px -12px rgba(0,0,0,0.18)"
      : "0 1px 2px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.16s ease, border-color 0.16s ease",
    position: "relative",
    ...shapeStyles(d.shape, w, h),
  };

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
              return {
                ...node,
                data: {
                  ...nodeData,
                  width: Math.max(80, params.width),
                  height: Math.max(40, params.height),
                },
              };
            }),
          );
        }}
      />

      <div style={baseStyle} title={d.hiddenInfo || d.summary || d.title}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: typography.padding,
            textAlign: "center",
            transform: isDiamond ? "rotate(-45deg)" : undefined,
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
          className="!h-3 !w-3 !border !border-slate-400 !bg-white opacity-0 transition group-hover:opacity-90"
          style={{ zIndex: 2 }}
          title="Arraste daqui para criar uma seta saindo deste bloco"
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
          style={{ zIndex: 1 }}
          title="Solte aqui para conectar uma seta neste bloco"
        />
      ))}
    </div>
  );
}

export const FluxoNode = memo(FluxoNodeComponent);
