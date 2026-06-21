import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/editor")({
  head: () =>
    createPageHead({
      title: "Editor",
      description: "Editor visual de fluxogramas do Fluxo.",
      path: "/editor",
      noIndex: true,
    }),
  component: EditorLayout,
});

function EditorLayout() {
  return <Outlet />;
}
