import { CornerDownRight, CornerRightDown, Route, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  visible: boolean;
  hasEdgeSelection: boolean;
  onAuto: () => void;
  onDeviationX: () => void;
  onDeviationY: () => void;
  onRemove: () => void;
}

export function SelectionToolbar({
  visible,
  hasEdgeSelection,
  onAuto,
  onDeviationX,
  onDeviationY,
  onRemove,
}: SelectionToolbarProps) {
  if (!visible) return null;

  return (
    <div className="absolute left-1/2 top-16 z-40 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-md backdrop-blur">
      {hasEdgeSelection ? (
        <>
          <ToolbarButton onClick={onAuto} title="Roteamento automático">
            <Route className="h-3.5 w-3.5" />
            Auto
          </ToolbarButton>
          <ToolbarButton onClick={onDeviationX} title="Adicionar desvio horizontal">
            <CornerDownRight className="h-3.5 w-3.5" />
            Desvio X
          </ToolbarButton>
          <ToolbarButton onClick={onDeviationY} title="Adicionar desvio vertical">
            <CornerRightDown className="h-3.5 w-3.5" />
            Desvio Y
          </ToolbarButton>
        </>
      ) : null}
      <ToolbarButton
        onClick={onRemove}
        title="Remover seleção"
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
