import { Copy, Edit3, MoveHorizontal, MoveVertical, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SelectionKind = "node" | "edge" | null;

export function SelectionToolbar({
  kind,
  label,
  onEdit,
  onDuplicate,
  onRemove,
  onAutoRoute,
  onManualHorizontal,
  onManualVertical,
}: {
  kind: SelectionKind;
  label?: string;
  onEdit: () => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  onAutoRoute?: () => void;
  onManualHorizontal?: () => void;
  onManualVertical?: () => void;
}) {
  if (!kind) return null;

  return (
    <div className="absolute left-1/2 top-[64px] z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur-md">
      <span className="max-w-[220px] truncate px-2 text-[11px] font-medium text-muted-foreground">
        {kind === "node" ? "Bloco" : "Seta"}
        {label ? ` · ${label}` : " selecionado"}
      </span>

      <Button size="sm" variant="ghost" className="h-8 rounded-full gap-1.5" onClick={onEdit}>
        <Edit3 className="h-3.5 w-3.5" />
        Editar
      </Button>

      {kind === "node" && onDuplicate ? (
        <Button size="sm" variant="ghost" className="h-8 rounded-full gap-1.5" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
          Duplicar
        </Button>
      ) : null}

      {kind === "edge" ? (
        <>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" variant="ghost" className="h-8 rounded-full gap-1.5" onClick={onAutoRoute}>
            <Sparkles className="h-3.5 w-3.5" />
            Auto
          </Button>
          <Button size="sm" variant="ghost" className="h-8 rounded-full gap-1.5" onClick={onManualHorizontal}>
            <MoveHorizontal className="h-3.5 w-3.5" />
            Desvio X
          </Button>
          <Button size="sm" variant="ghost" className="h-8 rounded-full gap-1.5" onClick={onManualVertical}>
            <MoveVertical className="h-3.5 w-3.5" />
            Desvio Y
          </Button>
        </>
      ) : null}

      <span className="mx-1 h-5 w-px bg-border" />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 rounded-full gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remover
      </Button>
    </div>
  );
}
