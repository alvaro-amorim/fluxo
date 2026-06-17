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

function FluxoNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as FluxoNodeData;
  const { setNodes } = useReactFlow();
  const w = d.width ?? 180;
  const h = d.height ?? 80;
  const isDiamond = d.shape === "diamond";

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
            padding: 12,
            textAlign: "center",
            transform: isDiamond ? "rotate(-45deg)" : undefined,
          }}
        >
          <div className="text-[13px] font-medium leading-snug line-clamp-3">{d.title}</div>
          {d.summary ? (
            <div className="mt-0.5 text-[10px] opacity-60 line-clamp-1">{d.summary}</div>
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
          isConnectableStart={true}
          isConnectableEnd={false}
          className="!h-3.5 !w-3.5 !border-2 !border-brand/60 !bg-white !shadow-sm opacity-0 transition-all group-hover:opacity-100 hover:!border-brand"
          style={{ zIndex: 10, pointerEvents: "auto" }}
          title="Arraste para criar uma conexão saindo deste bloco"
        />
      ))}
      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`target-${handle.id}`}
          type="target"
          position={handle.position}
          id={handle.id}
          isConnectableStart={false}
          isConnectableEnd={true}
          className="!h-2.5 !w-2.5 !rounded-full !border-0 !bg-brand/80"
          style={{ zIndex: 5, pointerEvents: "auto" }}
          title="Solte para conectar uma seta entrando neste bloco"
        />
      ))}
    </div>
  );
}

export const FluxoNode = memo(FluxoNodeComponent);
