import { useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { newEmptyProject, setCurrentProject, upsertProject } from "@/lib/flow/store";

export const Route = createFileRoute("/editor/")({
  component: EditorEntryPage,
});

function EditorEntryPage() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const project = newEmptyProject();
    upsertProject(project);
    setCurrentProject(project);
    void navigate({ to: "/editor/$id", params: { id: project.id }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Preparando o editor…
    </div>
  );
}
