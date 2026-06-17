// Store local temporário para biblioteca e projeto atual.
//
// Esta camada ainda usa localStorage porque o projeto nasceu como front-end web no Lovable.
// Futuramente, no app desktop, esta implementação deve ser substituída por persistência local
// em arquivos `.flow.json`, mantendo a mesma interface pública sempre que possível.

import { MOCK_LIBRARY } from "./example";
import { createEmptyFlowProject, createFlowId, nowIso } from "./defaults";
import type { FlowProject } from "./types";

const LIBRARY_KEY = "fluxo.library.v1";
const CURRENT_KEY = "fluxo.current.v1";

function normalizeLibraryCandidate(candidate: unknown): FlowProject[] | null {
  if (!Array.isArray(candidate)) return null;
  return candidate.filter((item): item is FlowProject => {
    return (
      Boolean(item) && typeof item === "object" && typeof (item as FlowProject).id === "string"
    );
  });
}

export function loadLibrary(): FlowProject[] {
  if (typeof window === "undefined") return MOCK_LIBRARY;
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(MOCK_LIBRARY));
      return MOCK_LIBRARY;
    }
    const parsed = normalizeLibraryCandidate(JSON.parse(raw));
    if (!parsed || parsed.length === 0) {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(MOCK_LIBRARY));
      return MOCK_LIBRARY;
    }
    return parsed;
  } catch {
    return MOCK_LIBRARY;
  }
}

export function saveLibrary(lib: FlowProject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
}

export function upsertProject(p: FlowProject) {
  const lib = loadLibrary();
  const idx = lib.findIndex((x) => x.id === p.id);
  const now = nowIso();
  const next: FlowProject = {
    ...p,
    createdAt: p.createdAt ?? now,
    updatedAt: now,
  };
  if (idx >= 0) lib[idx] = next;
  else lib.unshift(next);
  saveLibrary(lib);
}

export function deleteProject(id: string) {
  saveLibrary(loadLibrary().filter((p) => p.id !== id));
}

export function setCurrentProject(p: FlowProject) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_KEY, JSON.stringify(p));
}

export function getCurrentProject(): FlowProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as FlowProject) : null;
  } catch {
    return null;
  }
}

export function newEmptyProject(name = "Novo fluxo"): FlowProject {
  return createEmptyFlowProject(name);
}

export function duplicateProject(p: FlowProject): FlowProject {
  const now = nowIso();
  return {
    ...p,
    id: createFlowId("flow"),
    name: `${p.name} (cópia)`,
    createdAt: now,
    updatedAt: now,
    metadata: {
      ...p.metadata,
      source: "duplicated",
    },
  };
}
