import { useState } from "react";
import {
  MousePointer2,
  Square,
  Shapes,
  Minus,
  ArrowRight,
  Link2,
  Type,
  LayoutGrid,
  Undo2,
  Redo2,
  Download,
  Upload,
  Image as ImageIcon,
  Presentation,
  Maximize2,
  Grid3x3,
  Magnet,
  PanelLeft,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Tool = "select" | "block" | "shape" | "line" | "arrow" | "connect" | "text";

export interface ToolbarProps {
  mode: "side" | "floating";
  onModeChange: (m: "side" | "floating") => void;
  tool: Tool;
  onToolChange: (t: Tool) => void;
  gridOn: boolean;
  snapOn: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOrganize: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onImportJson: () => void;
  onFitView: () => void;
  onPresentation: () => void;
  onAddBlock: () => void;
}

const tools: { id: Tool; label: string; icon: React.ElementType; shortcut: string }[] = [
  { id: "select", label: "Selecionar", icon: MousePointer2, shortcut: "V" },
  { id: "block", label: "Bloco", icon: Square, shortcut: "B" },
  { id: "shape", label: "Forma", icon: Shapes, shortcut: "F" },
  { id: "line", label: "Linha", icon: Minus, shortcut: "L" },
  { id: "arrow", label: "Seta", icon: ArrowRight, shortcut: "A" },
  { id: "connect", label: "Conectar", icon: Link2, shortcut: "C" },
  { id: "text", label: "Texto", icon: Type, shortcut: "T" },
];

type DragState = {
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
};

export function Toolbar(props: ToolbarProps) {
  const { mode, onModeChange } = props;
  const isFloating = mode === "floating";
  const [floatingPosition, setFloatingPosition] = useState({ x: 16, y: 80 });
  const [dragState, setDragState] = useState<DragState | null>(null);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isFloating) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: floatingPosition.x,
      originY: floatingPosition.y,
    });
  };

  const updateDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    setFloatingPosition({
      x: Math.max(8, dragState.originX + event.clientX - dragState.pointerX),
      y: Math.max(8, dragState.originY + event.clientY - dragState.pointerY),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragState(null);
  };

  return (
    <div
      className={cn(
        "z-30 flex flex-col gap-1 border border-border bg-card/95 p-2 backdrop-blur-md",
        isFloating
          ? "absolute w-[220px] rounded-xl shadow-lg"
          : "absolute left-0 top-12 h-[calc(100%-3rem)] w-[220px] rounded-none border-l-0 border-b-0 border-t-0 shadow-sm",
      )}
      style={isFloating ? { left: floatingPosition.x, top: floatingPosition.y } : undefined}
    >
      <div
        className={cn(
          "flex items-center justify-between px-1 pb-1",
          isFloating ? "cursor-move select-none" : undefined,
        )}
        onPointerDown={startDrag}
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Ferramentas
        </span>
        <button
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onModeChange(isFloating ? "side" : "floating")}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          title={isFloating ? "Modo lateral" : "Modo flutuante"}
        >
          {isFloating ? <PanelLeft className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
        </button>
      </div>

      <Section title="Edição">
        {tools.map((t) => (
          <ToolRow
            key={t.id}
            active={props.tool === t.id}
            icon={t.icon}
            label={t.label}
            shortcut={t.shortcut}
            onClick={() => {
              props.onToolChange(t.id);
              if (t.id === "block") props.onAddBlock();
            }}
          />
        ))}
      </Section>

      <Section title="Organização">
        <ToolRow icon={LayoutGrid} label="Organizar" shortcut="Ctrl+L" onClick={props.onOrganize} />
        <ToolRow icon={Undo2} label="Desfazer" shortcut="Ctrl+Z" onClick={props.onUndo} />
        <ToolRow icon={Redo2} label="Refazer" shortcut="Ctrl+Y" onClick={props.onRedo} />
      </Section>

      <Section title="Visualização">
        <ToolRow
          icon={Grid3x3}
          label="Grid"
          shortcut="G"
          active={props.gridOn}
          onClick={props.onToggleGrid}
        />
        <ToolRow
          icon={Magnet}
          label="Snap"
          shortcut="S"
          active={props.snapOn}
          onClick={props.onToggleSnap}
        />
        <ToolRow
          icon={Maximize2}
          label="Ajustar à tela"
          shortcut="Ctrl+0"
          onClick={props.onFitView}
        />
        <ToolRow
          icon={Presentation}
          label="Apresentação"
          shortcut="F11"
          onClick={props.onPresentation}
        />
      </Section>

      <Section title="Arquivo">
        <ToolRow
          icon={Download}
          label="Exportar .flow"
          shortcut="Ctrl+E"
          onClick={props.onExportJson}
        />
        <ToolRow
          icon={ImageIcon}
          label="Exportar PNG"
          shortcut="Ctrl+P"
          onClick={props.onExportPng}
        />
        <ToolRow
          icon={Upload}
          label="Importar .flow"
          shortcut="Ctrl+O"
          onClick={props.onImportJson}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 first:mt-0">
      <div className="px-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function ToolRow({
  icon: Icon,
  label,
  shortcut,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  shortcut: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-foreground text-background" : "text-foreground hover:bg-accent",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <kbd
        className={cn(
          "rounded border px-1 text-[10px] font-medium",
          active
            ? "border-background/30 text-background/80"
            : "border-border text-muted-foreground",
        )}
      >
        {shortcut}
      </kbd>
    </button>
  );
}
