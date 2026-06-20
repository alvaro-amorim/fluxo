import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EDITOR_SHORTCUTS } from "@/hooks/useEditorShortcuts";

export function ShortcutHelpModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atalhos</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-1 overflow-auto pr-2 sm:grid-cols-2">
          {EDITOR_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span className="text-foreground/80">{shortcut.label}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {shortcut.display}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
