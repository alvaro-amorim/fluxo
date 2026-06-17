import {
  ArrowLeftRight,
  Copy,
  CornerDownRight,
  CornerRightDown,
  Pencil,
  Route,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  visible: boolean;
  kind: "node" | "edge" | null;
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
  kind,
  onEdit,
  onDuplicate,
  onInvert,
  onAuto,
  onDeviationX,
  onDeviationY,
  onRemove,
}: SelectionToolbarProps) {
  if (!visible) return null;

  return (
    <div className="absolute left-1/2 top-16 z-40 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-md backdrop-blur">
      {onEdit ? (
        <ToolbarButton
          onClick={onEdit}
          title="Editar propriedades do item selecionado. Atalho: duplo clique"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </ToolbarButton>
      ) : null}

      {kind === "node" && onDuplicate ? (
        <ToolbarButton onClick={onDuplicate} title="Duplicar bloco selecionado. Atalho: Ctrl+D">
          <Copy className="h-3.5 w-3.5" />
          Duplicar
        </ToolbarButton>
      ) : null}

      {kind === "edge" ? (
        <>
          {onInvert ? (
            <ToolbarButton
              onClick={onInvert}
              title="Inverter origem e destino da seta. O roteamento volta para automatico."
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Inverter
            </ToolbarButton>
          ) : null}
          <ToolbarButton
            onClick={onAuto}
            title="Recalcular automaticamente a melhor saida e entrada da seta"
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
