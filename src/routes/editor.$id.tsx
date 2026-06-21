import { useEffect, useState } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { FlowEditor } from "@/components/flow/FlowEditor";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentProject, loadLibrary, newEmptyProject, upsertProject } from "@/lib/flow/store";
import type { FlowProject } from "@/lib/flow/types";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/editor/$id")({
  head: () =>
    createPageHead({
      title: "Editor",
      description: "Editor visual de fluxogramas do Fluxo.",
      path: "/editor",
      noIndex: true,
    }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = useParams({ from: "/editor/$id" });
  const navigate = useNavigate();
  const [project, setProject] = useState<FlowProject | null>(null);

  useEffect(() => {
    const lib = loadLibrary();
    let found = lib.find((p) => p.id === id);
    if (!found) {
      const current = getCurrentProject();
      if (current && current.id === id) found = current;
    }
    if (!found) {
      const created = { ...newEmptyProject("Novo fluxo"), id };
      upsertProject(created);
      found = created;
    }
    setProject(found);
  }, [id, navigate]);

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <>
      <Toaster richColors closeButton />
      <FlowEditor key={project.id} project={project} />
    </>
  );
}
