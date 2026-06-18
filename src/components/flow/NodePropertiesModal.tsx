import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Type, Palette, Brain, EyeOff, X } from "lucide-react";
import { DEFAULT_SEMANTIC, type FluxoNodeData, type ShapeType } from "@/lib/flow/types";

type EditableColorKey = "backgroundColor" | "borderColor" | "textColor";

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: "rectangle", label: "Retângulo" },
  { id: "rounded-rectangle", label: "Arredondado" },
  { id: "circle", label: "Círculo" },
  { id: "diamond", label: "Losango" },
  { id: "cylinder", label: "Cilindro" },
  { id: "hexagon", label: "Hexágono" },
];

const PALETTES: { name: string; bg: string; border: string; text: string }[] = [
  { name: "Papel", bg: "#ffffff", border: "#1f1d1a", text: "#1f1d1a" },
  { name: "Areia", bg: "#f7f1e6", border: "#9c8259", text: "#4a3a22" },
  { name: "Terracota", bg: "#fde2d3", border: "#c2654a", text: "#5a2316" },
  { name: "Sálvia", bg: "#e6efe4", border: "#5f8a5f", text: "#1f3a1f" },
  { name: "Céu", bg: "#e0eefb", border: "#3c7bbd", text: "#0f2747" },
  { name: "Lavanda", bg: "#ece6f5", border: "#7a5cc4", text: "#2a1a4a" },
  { name: "Carvão", bg: "#1f1d1a", border: "#1f1d1a", text: "#fafaf7" },
  { name: "Tinta", bg: "#0f172a", border: "#0f172a", text: "#fafaf7" },
];

export function NodePropertiesModal({
  open,
  data,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  data: FluxoNodeData | null;
  onOpenChange: (o: boolean) => void;
  onSave: (d: FluxoNodeData) => void;
  onDelete?: () => void;
}) {
  const latestDataRef = useRef<FluxoNodeData | null>(data);
  const [draft, setDraft] = useState<FluxoNodeData | null>(null);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    setDraft(open && latestDataRef.current ? createNodeDraft(latestDataRef.current) : null);
  }, [open]);

  if (!draft) return null;

  const update = (patch: Partial<FluxoNodeData>) => setDraft({ ...draft, ...patch });
  const updateStyle = (k: EditableColorKey, v: string) =>
    setDraft({ ...draft, style: { ...draft.style, [k]: v } });
  const updateSemantic = (k: keyof FluxoNodeData["semantic"], v: unknown) =>
    setDraft({ ...draft, semantic: { ...draft.semantic, [k]: v } });

  const applyPalette = (p: (typeof PALETTES)[number]) =>
    setDraft({
      ...draft,
      style: { ...draft.style, backgroundColor: p.bg, borderColor: p.border, textColor: p.text },
    });

  const submit = () => {
    onSave(createNodeDraft(draft));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="relative border-b border-border bg-card px-6 pt-6 pb-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand/40 to-transparent" />
          <div className="flex items-start gap-4">
            <NodePreview draft={draft} />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                editar bloco
              </div>
              <DialogTitle className="font-display text-2xl italic tracking-tight">
                {draft.title || "sem título"}
              </DialogTitle>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {draft.summary || "Adicione uma descrição curta para contexto."}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <Tabs defaultValue="content">
            <TabsList className="rounded-full bg-muted p-1">
              <TabsTrigger value="content" className="rounded-full gap-1.5 px-3 text-xs">
                <Type className="h-3.5 w-3.5" /> Conteúdo
              </TabsTrigger>
              <TabsTrigger value="style" className="rounded-full gap-1.5 px-3 text-xs">
                <Palette className="h-3.5 w-3.5" /> Estilo
              </TabsTrigger>
              <TabsTrigger value="semantic" className="rounded-full gap-1.5 px-3 text-xs">
                <Brain className="h-3.5 w-3.5" /> Semântica
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-5">
              <Field label="Título" hint="Aparece dentro do bloco">
                <Input
                  value={draft.title}
                  onChange={(e) => update({ title: e.target.value })}
                  className="h-10 font-display text-lg italic"
                  autoFocus
                />
              </Field>
              <Field label="Descrição curta" hint="Resumo visível no hover">
                <Input
                  value={draft.summary}
                  onChange={(e) => update({ summary: e.target.value })}
                />
              </Field>
              <Field
                label="Informação oculta"
                hint="Notas internas — aparecem como tooltip"
                icon={<EyeOff className="h-3 w-3" />}
              >
                <Textarea
                  rows={3}
                  value={draft.hiddenInfo}
                  onChange={(e) => update({ hiddenInfo: e.target.value })}
                  className="resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Largura">
                  <NumberStepper
                    value={draft.width}
                    min={60}
                    step={10}
                    onChange={(v) => update({ width: v })}
                  />
                </Field>
                <Field label="Altura">
                  <NumberStepper
                    value={draft.height}
                    min={40}
                    step={10}
                    onChange={(v) => update({ height: v })}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-5 pt-5">
              <Field label="Formato">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {SHAPES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => update({ shape: s.id })}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] transition ${
                        draft.shape === s.id
                          ? "border-foreground bg-accent shadow-inner"
                          : "border-border bg-card hover:border-foreground/40 hover:bg-accent/40"
                      }`}
                    >
                      <ShapeGlyph shape={s.id} />
                      <span className="leading-none">{s.label}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Paletas rápidas">
                <div className="grid grid-cols-4 gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPalette(p)}
                      title={p.name}
                      className="group flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 transition hover:border-foreground/30"
                    >
                      <span
                        className="h-7 w-9 rounded-md border"
                        style={{
                          background: p.bg,
                          borderColor: p.border,
                        }}
                      >
                        <span
                          className="block h-full w-full"
                          style={{
                            color: p.text,
                            fontSize: 10,
                            lineHeight: "28px",
                            textAlign: "center",
                          }}
                        >
                          Aa
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <ColorField
                  label="Fundo"
                  value={draft.style.backgroundColor}
                  onChange={(v) => updateStyle("backgroundColor", v)}
                />
                <ColorField
                  label="Borda"
                  value={draft.style.borderColor}
                  onChange={(v) => updateStyle("borderColor", v)}
                />
                <ColorField
                  label="Texto"
                  value={draft.style.textColor}
                  onChange={(v) => updateStyle("textColor", v)}
                />
              </div>

              <Field label="Ícone (nome)" hint="ex: play, check, user">
                <Input
                  placeholder="nome do ícone Lucide"
                  value={draft.icon?.name ?? ""}
                  onChange={(e) =>
                    update({
                      icon: e.target.value
                        ? { type: "default", name: e.target.value, customSrc: null }
                        : { type: "none", name: "", customSrc: null },
                    })
                  }
                />
              </Field>
            </TabsContent>

            <TabsContent value="semantic" className="space-y-4 pt-5">
              <Field label="Objetivo" hint="O que este bloco realiza">
                <Input
                  value={draft.semantic.objective}
                  onChange={(e) => updateSemantic("objective", e.target.value)}
                />
              </Field>
              <ChipsField
                label="Entradas"
                values={draft.semantic.inputs}
                onChange={(v) => updateSemantic("inputs", v)}
                placeholder="Adicione uma entrada e pressione Enter"
              />
              <ChipsField
                label="Saídas"
                values={draft.semantic.outputs}
                onChange={(v) => updateSemantic("outputs", v)}
                placeholder="Adicione uma saída e pressione Enter"
              />
              <ChipsField
                label="Regras"
                values={draft.semantic.rules}
                onChange={(v) => updateSemantic("rules", v)}
                placeholder="Adicione uma regra e pressione Enter"
              />
              <Field label="Observações">
                <Textarea
                  rows={3}
                  value={draft.semantic.notes}
                  onChange={(e) => updateSemantic("notes", e.target.value)}
                  className="resize-none"
                />
              </Field>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Salvar alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function createNodeDraft(data: FluxoNodeData): FluxoNodeData {
  return {
    shape: data.shape,
    title: data.title ?? "",
    summary: data.summary ?? "",
    hiddenInfo: data.hiddenInfo ?? "",
    style: { ...data.style },
    icon: data.icon ? { ...data.icon } : { type: "none", name: "", customSrc: null },
    semantic: {
      objective: data.semantic?.objective ?? DEFAULT_SEMANTIC.objective,
      inputs: [...(data.semantic?.inputs ?? DEFAULT_SEMANTIC.inputs)],
      outputs: [...(data.semantic?.outputs ?? DEFAULT_SEMANTIC.outputs)],
      rules: [...(data.semantic?.rules ?? DEFAULT_SEMANTIC.rules)],
      notes: data.semantic?.notes ?? DEFAULT_SEMANTIC.notes,
    },
    width: data.width,
    height: data.height,
    customFields: data.customFields?.map((field) => ({ ...field })) ?? [],
  };
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
      </div>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </Field>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  step: number;
}) {
  return (
    <Input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
    />
  );
}

function ChipsField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...values, v]);
    setInput("");
  };
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2">
        {values.map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
          >
            {v}
            <button onClick={() => onChange(values.filter((_, i) => i !== idx))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={values.length ? "" : placeholder}
          className="min-w-40 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </Field>
  );
}

function NodePreview({ draft }: { draft: FluxoNodeData }) {
  return (
    <div
      className="flex h-14 w-20 shrink-0 items-center justify-center border text-[10px] font-medium shadow-sm"
      style={{
        background: draft.style.backgroundColor,
        borderColor: draft.style.borderColor,
        color: draft.style.textColor,
        borderRadius: draft.shape === "circle" ? 999 : draft.shape === "rounded-rectangle" ? 12 : 4,
        transform: draft.shape === "diamond" ? "rotate(45deg)" : undefined,
        clipPath:
          draft.shape === "hexagon"
            ? "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)"
            : undefined,
      }}
    >
      <span style={{ transform: draft.shape === "diamond" ? "rotate(-45deg)" : undefined }}>
        Aa
      </span>
    </div>
  );
}

function ShapeGlyph({ shape }: { shape: ShapeType }) {
  const base = "h-7 w-9 border border-current bg-background/70";
  if (shape === "circle") return <span className={`${base} rounded-full`} />;
  if (shape === "rounded-rectangle") return <span className={`${base} rounded-lg`} />;
  if (shape === "diamond") return <span className={`${base} rotate-45 rounded-sm`} />;
  if (shape === "hexagon")
    return (
      <span
        className={base}
        style={{ clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" }}
      />
    );
  if (shape === "cylinder")
    return <span className={base} style={{ borderRadius: "999px / 12px" }} />;
  return <span className={`${base} rounded-sm`} />;
}
