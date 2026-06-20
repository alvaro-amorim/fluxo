import { useEffect, useRef } from "react";

export type EditorShortcutId =
  | "tool.select"
  | "tool.block"
  | "tool.shape"
  | "tool.line"
  | "tool.arrow"
  | "tool.connect"
  | "tool.text"
  | "layout.organize"
  | "history.undo"
  | "history.redo"
  | "selection.duplicate"
  | "selection.all"
  | "selection.delete"
  | "view.grid"
  | "view.snap"
  | "view.fit"
  | "view.presentation"
  | "file.exportFlow"
  | "file.exportPng"
  | "file.importFlow"
  | "editor.escape"
  | "editor.help";

export type EditorShortcutGroup = "Ferramentas" | "Organização" | "Visualização" | "Arquivo";

export type EditorShortcutDefinition = {
  id: EditorShortcutId;
  group: EditorShortcutGroup;
  label: string;
  display: string;
  key: string;
  primary?: boolean;
  alt?: boolean;
  shift?: boolean;
  preventDefault?: boolean;
  allowInEditable?: boolean;
  allowWhenModalOpen?: boolean;
};

export const EDITOR_SHORTCUTS: readonly EditorShortcutDefinition[] = [
  { id: "tool.select", group: "Ferramentas", label: "Selecionar/mover", display: "V", key: "v" },
  { id: "tool.block", group: "Ferramentas", label: "Criar bloco", display: "B", key: "b" },
  { id: "tool.shape", group: "Ferramentas", label: "Criar forma", display: "F", key: "f" },
  { id: "tool.line", group: "Ferramentas", label: "Criar linha", display: "L", key: "l" },
  { id: "tool.arrow", group: "Ferramentas", label: "Criar seta", display: "A", key: "a" },
  { id: "tool.connect", group: "Ferramentas", label: "Conectar", display: "C", key: "c" },
  { id: "tool.text", group: "Ferramentas", label: "Editar texto", display: "T", key: "t" },
  {
    id: "layout.organize",
    group: "Organização",
    label: "Organizar fluxo",
    display: "Alt + L",
    key: "l",
    alt: true,
  },
  {
    id: "history.undo",
    group: "Organização",
    label: "Desfazer",
    display: "Ctrl + Z",
    key: "z",
    primary: true,
  },
  {
    id: "history.redo",
    group: "Organização",
    label: "Refazer",
    display: "Ctrl + Y / Ctrl + Shift + Z",
    key: "y",
    primary: true,
  },
  {
    id: "selection.duplicate",
    group: "Organização",
    label: "Duplicar seleção",
    display: "Ctrl + D",
    key: "d",
    primary: true,
  },
  {
    id: "selection.all",
    group: "Organização",
    label: "Selecionar tudo",
    display: "Ctrl + A",
    key: "a",
    primary: true,
  },
  {
    id: "selection.delete",
    group: "Organização",
    label: "Excluir seleção",
    display: "Delete",
    key: "delete",
  },
  { id: "view.grid", group: "Visualização", label: "Ligar/desligar grid", display: "G", key: "g" },
  { id: "view.snap", group: "Visualização", label: "Ligar/desligar snap", display: "S", key: "s" },
  {
    id: "view.fit",
    group: "Visualização",
    label: "Ajustar à tela",
    display: "Ctrl + 0",
    key: "0",
    primary: true,
  },
  {
    id: "view.presentation",
    group: "Visualização",
    label: "Modo apresentação",
    display: "Shift + P",
    key: "p",
    shift: true,
  },
  {
    id: "file.exportFlow",
    group: "Arquivo",
    label: "Exportar .flow",
    display: "Alt + E",
    key: "e",
    alt: true,
  },
  {
    id: "file.exportPng",
    group: "Arquivo",
    label: "Exportar PNG",
    display: "Alt + P",
    key: "p",
    alt: true,
  },
  {
    id: "file.importFlow",
    group: "Arquivo",
    label: "Importar .flow",
    display: "Alt + O",
    key: "o",
    alt: true,
  },
  {
    id: "editor.escape",
    group: "Organização",
    label: "Cancelar / fechar",
    display: "Esc",
    key: "escape",
    allowInEditable: true,
    allowWhenModalOpen: true,
  },
  {
    id: "editor.help",
    group: "Visualização",
    label: "Mostrar atalhos",
    display: "?",
    key: "?",
    shift: true,
  },
] as const;

const REDO_ALTERNATIVE: EditorShortcutDefinition = {
  id: "history.redo",
  group: "Organização",
  label: "Refazer",
  display: "Ctrl + Shift + Z",
  key: "z",
  primary: true,
  shift: true,
};

export const EDITOR_SHORTCUT_BY_ID = new Map(
  EDITOR_SHORTCUTS.map((shortcut) => [shortcut.id, shortcut]),
);

export type EditorShortcutActions = Partial<Record<EditorShortcutId, () => void>>;

export function useEditorShortcuts({
  actions,
  modalOpen,
}: {
  actions: EditorShortcutActions;
  modalOpen: boolean;
}) {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const editable = isEditableTarget(event.target);
      const shortcut = [...EDITOR_SHORTCUTS, REDO_ALTERNATIVE].find((candidate) =>
        matchesShortcut(event, candidate),
      );
      if (!shortcut) return;
      if (editable && !shortcut.allowInEditable) return;
      if (modalOpen && !shortcut.allowWhenModalOpen) return;

      const action = actionsRef.current[shortcut.id];
      if (!action) return;

      if (shortcut.preventDefault !== false) event.preventDefault();
      event.stopPropagation();
      action();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [modalOpen]);
}

function matchesShortcut(event: KeyboardEvent, shortcut: EditorShortcutDefinition) {
  const primaryPressed = event.ctrlKey || event.metaKey;
  return (
    event.key.toLowerCase() === shortcut.key &&
    primaryPressed === Boolean(shortcut.primary) &&
    event.altKey === Boolean(shortcut.alt) &&
    event.shiftKey === Boolean(shortcut.shift)
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
    ),
  );
}
