import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "V", label: "Selecionar/mover" },
  { keys: "B", label: "Criar bloco" },
  { keys: "F", label: "Criar forma" },
  { keys: "L", label: "Criar linha" },
  { keys: "A", label: "Criar seta" },
  { keys: "C", label: "Conectar" },
  { keys: "T", label: "Editar texto" },
  { keys: "I", label: "Trocar ícone" },
  { keys: "R", label: "Redimensionar" },
  { keys: "G", label: "Ligar/desligar grid" },
  { keys: "S", label: "Ligar/desligar snap" },
  { keys: "Ctrl + S", label: "Salvar/exportar projeto" },
  { keys: "Ctrl + O", label: "Importar/abrir projeto" },
  { keys: "Ctrl + E", label: "Exportar .flow.json" },
  { keys: "Ctrl + P", label: "Exportar PNG" },
  { keys: "Ctrl + L", label: "Organizar fluxo" },
  { keys: "Ctrl + Z", label: "Desfazer" },
  { keys: "Ctrl + Y", label: "Refazer" },
  { keys: "Ctrl + D", label: "Duplicar seleção" },
  { keys: "Ctrl + A", label: "Selecionar tudo" },
  { keys: "Delete", label: "Excluir seleção" },
  { keys: "Esc", label: "Cancelar / fechar modal" },
  { keys: "Espaço + arrastar", label: "Mover canvas" },
  { keys: "+", label: "Zoom in" },
  { keys: "-", label: "Zoom out" },
  { keys: "Ctrl + 0", label: "Ajustar à tela" },
  { keys: "F11", label: "Modo apresentação" },
  { keys: "Shift + arrastar", label: "Mover em linha reta" },
  { keys: "Alt + arrastar", label: "Duplicar bloco" },
];

export function ShortcutHelpModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atalhos</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-1 overflow-auto pr-2 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span className="text-foreground/80">{s.label}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
