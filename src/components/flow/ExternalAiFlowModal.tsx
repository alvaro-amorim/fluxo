import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Check, AlertCircle } from "lucide-react";
import {
  AI_PROMPT,
  EXAMPLE_FLOW_FILE,
  validateFlowFile,
  flowFileToProject,
} from "@/lib/flow/example";
import type { FlowProject } from "@/lib/flow/types";
import { toast } from "sonner";

export function ExternalAiFlowModal({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImport: (p: FlowProject) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(EXAMPLE_FLOW_FILE, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exemplo.flow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validate = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = validateFlowFile(parsed);
      if (res.ok) {
        setStatus("ok");
        setErrorMsg("");
      } else {
        setStatus("error");
        setErrorMsg(res.error ?? "Formato inválido.");
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg("JSON malformado: " + (e as Error).message);
    }
  };

  const importNow = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = validateFlowFile(parsed);
      if (!res.ok || !res.file) {
        setStatus("error");
        setErrorMsg(res.error ?? "Formato inválido.");
        return;
      }
      onImport(flowFileToProject(res.file));
      onOpenChange(false);
    } catch (e) {
      setStatus("error");
      setErrorMsg("JSON malformado: " + (e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Criar fluxo com IA externa</DialogTitle>
          <DialogDescription>
            Copie o prompt abaixo, envie para uma IA externa (ChatGPT, Gemini, Claude…), converse
            sobre o seu fluxo e peça que ela retorne um arquivo <code>.flow.json</code> compatível.
            Depois, cole o JSON aqui para importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-muted/40">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Prompt pronto</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={copyPrompt}>
                  {copied ? (
                    <Check className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <Copy className="mr-1 h-3.5 w-3.5" />
                  )}
                  Copiar prompt
                </Button>
                <Button size="sm" variant="ghost" onClick={downloadExample}>
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Baixar exemplo
                </Button>
              </div>
            </div>
            <pre className="max-h-44 overflow-auto whitespace-pre-wrap px-3 py-2 text-xs leading-relaxed text-foreground/80">
              {AI_PROMPT}
            </pre>
          </section>

          <section>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Cole o JSON retornado pela IA
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setStatus("idle");
              }}
              rows={8}
              placeholder='{ "app": "Fluxo", ... }'
              className="font-mono text-xs"
            />
            {status === "error" ? (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}
            {status === "ok" ? (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                JSON válido. Pronto para importar.
              </div>
            ) : null}
          </section>

          <details className="rounded-lg border border-border bg-card">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
              Exemplo do formato esperado
            </summary>
            <pre className="max-h-48 overflow-auto px-3 pb-3 text-[10.5px] leading-relaxed text-foreground/70">
              {JSON.stringify(EXAMPLE_FLOW_FILE, null, 2)}
            </pre>
          </details>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={validate}>
              Validar JSON
            </Button>
            <Button onClick={importNow}>Importar e abrir fluxo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
