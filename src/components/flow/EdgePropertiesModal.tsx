import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, EyeOff, ArrowRight, MoveHorizontal } from "lucide-react";
import type {
  FluxoEdgeData,
  EdgeLineType,
  EdgeStrokeType,
  FlowEdgeStyle,
  FlowHandlePosition,
} from "@/lib/flow/types";

const LINE_TYPES: { id: EdgeLineType; label: string }[] = [
  { id: "orthogonal", label: "Ortogonal" },
  { id: "bezier", label: "Curva" },
  { id: "straight", label: "Reta" },
];

const STROKES: { id: EdgeStrokeType; label: string }[] = [
  { id: "solid", label: "Contínua" },
  { id: "dashed", label: "Pontilhada" },
];

const EDGE_COLORS = ["#374151", "#111827", "#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0f766e"];

const HANDLE_OPTIONS: { id: Exclude<FlowHandlePosition, "auto">; label: string }[] = [
  { id: "top", label: "Topo" },
  { id: "right", label: "Direita" },
  { id: "bottom", label: "Baixo" },
  { id: "left", label: "Esquerda" },
];

const PRIORITIES: {
  id: FluxoEdgeData["semantic"]["priority"];
  label: string;
  className: string;
}[] = [
  { id: "low", label: "Baixa", className: "bg-muted text-muted-foreground" },
  { id: "normal", label: "Normal", className: "bg-accent text-accent-foreground" },
  { id: "high", label: "Alta", className: "bg-brand text-brand-foreground" },
];

export function EdgePropertiesModal({
  open,
  data,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  data: FluxoEdgeData | null;
  onOpenChange: (o: boolean) => void;
  onSave: (d: FluxoEdgeData) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<FluxoEdgeData | null>(data);
  useEffect(() => setDraft(data), [data]);
  if (!draft) return null;

  const update = (patch: Partial<FluxoEdgeData>) => setDraft({ ...draft, ...patch });
  const sem = (patch: Partial<FluxoEdgeData["semantic"]>) =>
    setDraft({ ...draft, semantic: { ...draft.semantic, ...patch } });
  const updateStyle = (patch: Partial<FlowEdgeStyle>) =>
    setDraft({ ...draft, style: normalizeEdgeStyle(draft, patch) });
  const updateStroke = (stroke: EdgeStrokeType) =>
    setDraft({
      ...draft,
      stroke,
      style: normalizeEdgeStyle(
        { ...draft, stroke },
        { strokeDasharray: stroke === "dashed" ? "5 4" : null },
      ),
    });
  const updateArrow = (hasArrow: boolean) =>
    setDraft({
      ...draft,
      hasArrow,
      style: normalizeEdgeStyle({ ...draft, hasArrow }, { markerEnd: hasArrow ? "arrow" : "none" }),
    });

  const setHandle = (field: "sourceHandle" | "targetHandle", value: FlowHandlePosition) => {
    setDraft({
      ...draft,
      [field]: value,
      routing: {
        ...(draft.routing ?? { points: [], avoidCrossings: true }),
        mode: "manual",
      },
    });
  };

  const useAutoRouting = () => {
    setDraft({
      ...draft,
      routing: {
        ...(draft.routing ?? { points: [], avoidCrossings: true }),
        mode: "auto",
      },
    });
  };

  const submit = () => {
    onSave({ ...draft, style: normalizeEdgeStyle(draft) });
    onOpenChange(false);
  };

  const edgeColor = draft.style?.stroke ?? "#374151";
  const edgeWidth = draft.style?.strokeWidth ?? 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="relative border-b border-border bg-card px-6 pt-6 pb-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand/40 to-transparent" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            editar conexão
          </div>
          <DialogTitle className="font-display text-2xl italic tracking-tight">
            {draft.label || "seta sem rótulo"}
          </DialogTitle>
          <EdgePreview
            lineType={draft.lineType}
            stroke={draft.stroke}
            hasArrow={draft.hasArrow}
            edgeStyle={draft.style}
          />
        </DialogHeader>

        {/* Body */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          <Row label="Rótulo" hint="Texto exibido sobre a seta">
            <Input
              value={draft.label ?? ""}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="ex: se aprovado"
              className="h-10 font-display text-base italic"
              autoFocus
            />
          </Row>

          <Row label="Informação oculta" icon={<EyeOff className="h-3 w-3" />}>
            <Textarea
              rows={2}
              value={draft.hiddenInfo}
              onChange={(e) => update({ hiddenInfo: e.target.value })}
              className="resize-none"
            />
          </Row>

          <div className="grid grid-cols-2 gap-3">
            <Row label="Tipo de linha">
              <SegmentedGroup
                options={LINE_TYPES.map((t) => ({
                  id: t.id,
                  label: t.label,
                  icon: <LineGlyph lineType={t.id} stroke="solid" />,
                }))}
                value={draft.lineType}
                onChange={(v) => update({ lineType: v as EdgeLineType })}
              />
            </Row>
            <Row label="Traço">
              <SegmentedGroup
                options={STROKES.map((s) => ({
                  id: s.id,
                  label: s.label,
                  icon: <LineGlyph lineType="straight" stroke={s.id} />,
                }))}
                value={draft.stroke}
                onChange={(v) => updateStroke(v as EdgeStrokeType)}
              />
            </Row>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
            <Row label="Cor da seta" hint="Linha e ponta">
              <div className="flex items-center overflow-hidden rounded-md border border-border bg-background">
                <label className="relative h-9 w-10 cursor-pointer border-r border-border">
                  <span className="absolute inset-1 rounded" style={{ background: edgeColor }} />
                  <input
                    type="color"
                    value={edgeColor}
                    onChange={(e) => updateStyle({ stroke: e.target.value })}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <Input
                  value={edgeColor}
                  onChange={(e) => updateStyle({ stroke: e.target.value })}
                  className="h-9 border-0 font-mono text-xs focus-visible:ring-0"
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                {EDGE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateStyle({ stroke: color })}
                    className={`h-6 flex-1 rounded-md border transition ${
                      edgeColor === color
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border hover:border-foreground/40"
                    }`}
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </Row>

            <Row label="Espessura" hint="1 a 10 px">
              <Input
                type="number"
                min={1}
                max={10}
                step={1}
                value={edgeWidth}
                onChange={(e) =>
                  updateStyle({
                    strokeWidth: Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                  })
                }
              />
            </Row>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                  <MoveHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Direção da conexão</div>
                  <div className="text-xs text-muted-foreground">
                    Escolha de qual lado a seta sai e em qual lado ela entra.
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={useAutoRouting} className="rounded-full">
                Automático
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Row label="Sai do bloco origem">
                <SegmentedGroup
                  options={HANDLE_OPTIONS}
                  value={
                    (draft.sourceHandle === "auto"
                      ? "right"
                      : (draft.sourceHandle ?? "right")) as Exclude<FlowHandlePosition, "auto">
                  }
                  onChange={(v) => setHandle("sourceHandle", v as FlowHandlePosition)}
                />
              </Row>
              <Row label="Entra no bloco destino">
                <SegmentedGroup
                  options={HANDLE_OPTIONS}
                  value={
                    (draft.targetHandle === "auto"
                      ? "left"
                      : (draft.targetHandle ?? "left")) as Exclude<FlowHandlePosition, "auto">
                  }
                  onChange={(v) => setHandle("targetHandle", v as FlowHandlePosition)}
                />
              </Row>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Manual trava os lados escolhidos. Automático preserva o desenho atual e permite que a
              lógica inteligente recalcule os pontos nas próximas rotinas de organização.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Mostrar ponta de seta</div>
                <div className="text-xs text-muted-foreground">Conexão direcional ou simples</div>
              </div>
            </div>
            <Switch checked={draft.hasArrow} onCheckedChange={updateArrow} />
          </div>

          <Row label="Condição" hint="Quando este caminho é percorrido">
            <Input
              value={draft.semantic.condition}
              onChange={(e) => sem({ condition: e.target.value })}
              placeholder="ex: resposta === 'sim'"
              className="font-mono text-xs"
            />
          </Row>

          <Row label="Prioridade">
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => {
                const active = draft.semantic.priority === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => sem({ priority: p.id })}
                    className={`flex-1 rounded-full border px-3 py-1.5 text-xs transition ${
                      active
                        ? `${p.className} border-transparent shadow-sm`
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Row>

          <Row label="Observações">
            <Textarea
              rows={2}
              value={draft.semantic.notes}
              onChange={(e) => sem({ notes: e.target.value })}
              className="resize-none"
            />
          </Row>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-6 py-3">
          {onDelete ? (
            <Button
              variant="ghost"
              onClick={onDelete}
              className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir seta
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button
              onClick={submit}
              className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
            >
              Salvar seta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function normalizeEdgeStyle(draft: FluxoEdgeData, patch: Partial<FlowEdgeStyle> = {}): FlowEdgeStyle {
  const stroke = patch.stroke ?? draft.style?.stroke ?? "#374151";
  const strokeWidth = patch.strokeWidth ?? draft.style?.strokeWidth ?? 2;
  const strokeDasharray =
    patch.strokeDasharray !== undefined
      ? patch.strokeDasharray
      : draft.stroke === "dashed"
        ? "5 4"
        : null;
  const markerEnd = patch.markerEnd ?? (draft.hasArrow ? "arrow" : "none");

  return {
    stroke,
    strokeWidth,
    strokeDasharray,
    markerEnd,
  };
}

function Row({
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
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
        </Label>
        {hint ? <span className="text-[10px] text-muted-foreground/70">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function SegmentedGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-muted p-1">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition ${
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LineGlyph({ lineType, stroke }: { lineType: EdgeLineType; stroke: EdgeStrokeType }) {
  const dash = stroke === "dashed" ? "4 3" : undefined;
  return (
    <svg viewBox="0 0 24 12" className="h-3 w-6 text-current">
      {lineType === "straight" && (
        <line
          x1="1"
          y1="6"
          x2="23"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={dash}
        />
      )}
      {lineType === "orthogonal" && (
        <path
          d="M1 10 L1 6 L23 6 L23 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={dash}
        />
      )}
      {lineType === "bezier" && (
        <path
          d="M1 10 C 8 10, 16 2, 23 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={dash}
        />
      )}
    </svg>
  );
}

function EdgePreview({
  lineType,
  stroke,
  hasArrow,
  edgeStyle,
}: {
  lineType: EdgeLineType;
  stroke: EdgeStrokeType;
  hasArrow: boolean;
  edgeStyle?: FlowEdgeStyle;
}) {
  const dash = stroke === "dashed" ? "6 4" : undefined;
  const color = edgeStyle?.stroke ?? "currentColor";
  const width = edgeStyle?.strokeWidth ?? 1.6;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <span className="h-6 w-10 rounded-md border border-border bg-card" />
      <svg viewBox="0 0 80 16" className="h-4 flex-1 text-foreground/70">
        <defs>
          <marker id="modal-arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 z" fill={color} />
          </marker>
        </defs>
        {lineType === "straight" && (
          <line
            x1="2"
            y1="8"
            x2="78"
            y2="8"
            stroke={color}
            strokeWidth={width}
            strokeDasharray={dash}
            markerEnd={hasArrow ? "url(#modal-arr)" : undefined}
          />
        )}
        {lineType === "orthogonal" && (
          <path
            d="M2 14 L2 8 L78 8 L78 2"
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeDasharray={dash}
            markerEnd={hasArrow ? "url(#modal-arr)" : undefined}
          />
        )}
        {lineType === "bezier" && (
          <path
            d="M2 14 C 20 14, 60 2, 78 2"
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeDasharray={dash}
            markerEnd={hasArrow ? "url(#modal-arr)" : undefined}
          />
        )}
      </svg>
      <span className="h-6 w-10 rounded-md border border-border bg-card" />
    </div>
  );
}
