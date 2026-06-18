import { Copy, CornerDownRight, CornerRightDown, Edit3, Pencil, Route, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  visible: boolean;
  hasEdgeSelection: boolean;
  nodeTitle?: string;
  onNodeTitleChange?: (title: string) => void;
  onNodeTitleCommit?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onInvert?: () => void;
  onAuto: () => void;
  onDeviationX: () => void;
  onDeviationY: () => void;
  onRemove: () => void;
}

export function SelectionToolbar({
  visible,
  hasEdgeSelection,
  nodeTitle,
  onNodeTitleChange,
  onNodeTitleCommit,
  onEdit,
  onDuplicate,
  onInvert,
  onAuto,
  onDeviationX,
  onDeviationY,
  onRemove,
}: SelectionToolbarProps) {
  if (!visible) return null;

  const commitNodeTitle = (rawTitle: string) => {
    const finalTitle = rawTitle.trim() || "Sem t�tulo";
    if (finalTitle !== rawTitle) {
      onNodeTitleChange?.(finalTitle);
    }
    onNodeTitleCommit?.();
  };

  return (
    <div className="absolute left-1/2 top-16 z-40 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-md backdrop-blur">
      {!hasEdgeSelection && onNodeTitleChange ? (
        <div
          className="flex h-8 min-w-[240px] items-center gap-1.5 rounded-md border border-border bg-background/80 px-2"
          title="Editar nome do bloco. Salva automaticamente enquanto voc� digita."
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={nodeTitle ?? ""}
            onChange={(event) => onNodeTitleChange(event.target.value)}
            onBlur={(event) => commitNodeTitle(event.currentTarget.value)}
            onKeyDown={(event) => {
              event.stopPropagation();

              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            placeholder="Nome do bloco"
            className="h-7 min-w-0 border-0 bg-transparent px-0 text-xs font-medium shadow-none outline-none focus-visible:ring-0"
          />
        </div>
      ) : onEdit ? (
        <ToolbarButton onClick={onEdit} title="Editar propriedades da seta selecionada">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </ToolbarButton>
      ) : null}

      {!hasEdgeSelection && onDuplicate ? (
        <ToolbarButton onClick={onDuplicate} title="Duplicar bloco selecionado. Atalho: Ctrl+D">
          <Copy className="h-3.5 w-3.5" />
          Duplicar
        </ToolbarButton>
      ) : null}

      {hasEdgeSelection ? (
        <>
          {onInvert && (
            <ToolbarButton onClick={onInvert} title="Inverter dire��o da seta">
              <Route className="h-3.5 w-3.5" />
              Inverter
            </ToolbarButton>
          )}
          <ToolbarButton
            onClick={onAuto}
            title="Recalcular automaticamente a melhor sa�da e entrada da seta"
          >
            <Route className="h-3.5 w-3.5" />
            Auto
          </ToolbarButton>
          <ToolbarButton
            onClick={onDeviationX}
            title="Criar um desvio lateral manual na seta selecionada"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            Desvio X
          </ToolbarButton>
          <ToolbarButton
            onClick={onDeviationY}
            title="Criar um desvio vertical manual na seta selecionada"
          >
            <CornerRightDown className="h-3.5 w-3.5" />
            Desvio Y
          </ToolbarButton>
        </>
      ) : null}

      <ToolbarButton
        onClick={onRemove}
        title="Remover o bloco ou seta selecionado. Atalho: Delete"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remover
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({ className, children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("h-8 rounded-md px-2 text-xs", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
