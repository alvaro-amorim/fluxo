import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Upload,
  Sparkles,
  Search,
  Copy,
  ArrowUpRight,
  Trash2,
  Gauge,
  UserRoundX,
  FileDown,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  deleteProject,
  duplicateProject,
  loadLibrary,
  newEmptyProject,
  setCurrentProject,
  upsertProject,
} from "@/lib/flow/store";
import { flowFileToProject, validateFlowFile } from "@/lib/flow/example";
import { ExternalAiFlowModal } from "@/components/flow/ExternalAiFlowModal";
import type { FlowProject } from "@/lib/flow/types";
import { PublicFooter, PublicHeader } from "@/components/site/PublicSite";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/")({
  head: () =>
    createPageHead({
      title: "Fluxo",
      description:
        "Editor gratuito de fluxogramas para criar, organizar, importar e exportar processos diretamente no navegador.",
      path: "/",
    }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState<FlowProject[]>([]);
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  const filtered = useMemo(
    () => library.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [library, query],
  );

  const openProject = (p: FlowProject) => {
    setCurrentProject(p);
    navigate({ to: "/editor/$id", params: { id: p.id } });
  };

  const createNew = () => {
    const p = newEmptyProject();
    upsertProject(p);
    openProject(p);
  };

  const duplicate = (p: FlowProject) => {
    const copy = duplicateProject(p);
    upsertProject(copy);
    setLibrary(loadLibrary());
    toast.success("Fluxo duplicado.");
  };

  const remove = (id: string) => {
    deleteProject(id);
    setLibrary(loadLibrary());
  };

  const importFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.flow,.flow.json,application/json";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const res = validateFlowFile(parsed);
          if (!res.ok || !res.file) {
            toast.error(res.error ?? "Arquivo inválido.");
            return;
          }
          const proj = flowFileToProject(res.file);
          upsertProject(proj);
          openProject(proj);
        } catch (e) {
          toast.error("JSON inválido: " + (e as Error).message);
        }
      };
      reader.readAsText(f);
    };
    input.click();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Toaster richColors closeButton />

      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] dot-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--brand-soft), transparent)" }}
      />

      <PublicHeader />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-brand" />
              Editor visual de fluxogramas
            </div>
            <h1 className="font-display text-[60px] leading-[0.96] text-foreground sm:text-[82px]">
              Fluxo,
              <br />
              <span className="italic text-brand">editor gratuito</span>
              <br />
              <span className="text-muted-foreground">de fluxogramas.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Crie, conecte e organize processos diretamente no navegador. Sem cadastro no MVP, com
              importação e exportação em{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                .flow
              </code>{" "}
              e PNG.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Button
                onClick={createNew}
                className="h-10 gap-2 rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
              >
                <Plus className="h-4 w-4" />
                Abrir editor grátis
              </Button>
              <Button
                variant="outline"
                onClick={importFile}
                className="h-10 gap-2 rounded-full border-border bg-card px-5"
              >
                <Upload className="h-4 w-4" />
                Importar .flow
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiOpen(true)}
                className="h-10 gap-2 rounded-full border-brand/30 bg-brand-soft/40 px-5 text-foreground hover:bg-brand-soft/70"
              >
                <Sparkles className="h-4 w-4 text-brand" />
                Criar fluxo com IA externa
              </Button>
            </div>
          </div>

          {/* Decorative mini canvas */}
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)]">
              <div className="absolute inset-0 paper-grid opacity-50" />
              <svg viewBox="0 0 280 200" className="relative h-56 w-full">
                <defs>
                  <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="currentColor" className="text-foreground/70" />
                  </marker>
                </defs>
                <g
                  className="text-foreground/70"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                >
                  <path d="M70,50 L140,50" markerEnd="url(#arr)" />
                  <path d="M170,68 L170,108" markerEnd="url(#arr)" />
                  <path d="M155,140 L80,140 L80,72" markerEnd="url(#arr)" />
                  <path d="M195,140 L240,140 L240,52" markerEnd="url(#arr)" />
                </g>
                <rect
                  x="20"
                  y="32"
                  width="50"
                  height="36"
                  rx="8"
                  fill="var(--card)"
                  stroke="var(--foreground)"
                  strokeWidth="1.4"
                />
                <text
                  x="45"
                  y="55"
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--foreground)"
                  fontFamily="Inter"
                >
                  início
                </text>
                <polygon
                  points="170,108 200,140 170,172 140,140"
                  fill="var(--brand-soft)"
                  stroke="var(--brand)"
                  strokeWidth="1.4"
                />
                <text
                  x="170"
                  y="144"
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--foreground)"
                  fontFamily="Inter"
                >
                  decisão?
                </text>
                <rect
                  x="140"
                  y="32"
                  width="60"
                  height="36"
                  rx="18"
                  fill="var(--card)"
                  stroke="var(--foreground)"
                  strokeWidth="1.4"
                />
                <text
                  x="170"
                  y="55"
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--foreground)"
                  fontFamily="Inter"
                >
                  processo
                </text>
                <circle
                  cx="240"
                  cy="40"
                  r="16"
                  fill="var(--card)"
                  stroke="var(--foreground)"
                  strokeWidth="1.4"
                />
                <text
                  x="240"
                  y="44"
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--foreground)"
                  fontFamily="Inter"
                >
                  fim
                </text>
              </svg>
              <div className="relative mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>canvas.flow</span>
                <span className="font-mono">12 nós · 14 setas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-border bg-card/55">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Gauge,
              title: "Rápido",
              text: "Comece em segundos e organize o canvas com atalhos diretos.",
            },
            {
              icon: Workflow,
              title: "Visual",
              text: "Formas, conexões e cores para processos fáceis de compreender.",
            },
            {
              icon: UserRoundX,
              title: "Sem cadastro",
              text: "Seus fluxos ficam no navegador durante esta fase do produto.",
            },
            {
              icon: FileDown,
              title: "Portátil",
              text: "Exporte em .flow para continuar depois ou em PNG para compartilhar.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="border-t border-border pt-5">
              <Icon className="h-5 w-5 text-brand" />
              <h2 className="mt-4 text-sm font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Library */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              biblioteca
            </div>
            <h2 className="font-display text-3xl tracking-tight">Seus fluxos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {library.length} {library.length === 1 ? "fluxo salvo" : "fluxos salvos"}
            </p>
          </div>
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              aria-label="Buscar fluxo na biblioteca"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar fluxo…"
              className="h-9 rounded-full border-border bg-card pl-9 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <FlowCard
              key={p.id}
              project={p}
              onOpen={() => openProject(p)}
              onDuplicate={() => duplicate(p)}
              onDelete={() => remove(p.id)}
            />
          ))}
          {filtered.length === 0 ? (
            <button
              onClick={createNew}
              className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/40 p-14 text-center text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand-soft/20"
            >
              <Plus className="h-5 w-5" />
              <span className="font-display text-xl italic text-foreground">comece um fluxo</span>
              <span>Nenhum resultado — clique para criar um novo.</span>
            </button>
          ) : null}
        </div>
      </section>

      <PublicFooter />

      <ExternalAiFlowModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        onImport={(proj) => {
          upsertProject(proj);
          openProject(proj);
        }}
      />
    </div>
  );
}

function FlowCard({
  project,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  project: FlowProject;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const date = new Date(project.updatedAt);
  const formatted = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)]">
      <button
        onClick={onOpen}
        className="relative h-36 w-full overflow-hidden border-b border-border"
        style={{ background: project.background }}
        aria-label={`Abrir ${project.name}`}
      >
        <div className="absolute inset-0 paper-grid opacity-40" />
        <div className="relative h-full">
          <Thumbnail project={project} />
        </div>
        <div className="absolute right-2 top-2 rounded-full border border-border bg-card/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
          .flow
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl tracking-tight">{project.name}</h3>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {project.nodes.length} blocos · {formatted}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Button
            size="sm"
            onClick={onOpen}
            className="h-8 gap-1 rounded-full bg-foreground px-3 text-background hover:bg-foreground/90"
          >
            Abrir
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              title="Duplicar"
              aria-label={`Duplicar ${project.name}`}
              className="h-8 w-8 rounded-full p-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              title="Excluir"
              aria-label={`Excluir ${project.name}`}
              className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Thumbnail({ project }: { project: FlowProject }) {
  if (project.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Fluxo vazio
      </div>
    );
  }
  // Compute bounds and normalize
  const xs = project.nodes.map((n) => n.position.x);
  const ys = project.nodes.map((n) => n.position.y);
  const ws = project.nodes.map((n) => n.position.x + n.size.width);
  const hs = project.nodes.map((n) => n.position.y + n.size.height);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...ws);
  const maxY = Math.max(...hs);
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  return (
    <svg
      viewBox={`${minX} ${minY} ${w} ${h}`}
      className="h-full w-full p-3"
      preserveAspectRatio="xMidYMid meet"
    >
      {project.edges.map((e) => {
        const a = project.nodes.find((n) => n.id === e.source);
        const b = project.nodes.find((n) => n.id === e.target);
        if (!a || !b) return null;
        const ax = a.position.x + a.size.width / 2;
        const ay = a.position.y + a.size.height / 2;
        const bx = b.position.x + b.size.width / 2;
        const by = b.position.y + b.size.height / 2;
        return <line key={e.id} x1={ax} y1={ay} x2={bx} y2={by} stroke="#94a3b8" strokeWidth={2} />;
      })}
      {project.nodes.map((n) => (
        <rect
          key={n.id}
          x={n.position.x}
          y={n.position.y}
          width={n.size.width}
          height={n.size.height}
          rx={n.shape === "rounded-rectangle" ? 16 : 4}
          fill={n.style.backgroundColor}
          stroke={n.style.borderColor}
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
