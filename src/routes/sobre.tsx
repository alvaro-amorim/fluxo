import { createFileRoute } from "@tanstack/react-router";
import { EditorCallout, PublicPage } from "@/components/site/PublicSite";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/sobre")({
  head: () =>
    createPageHead({
      title: "Sobre",
      description: "Conheça o Fluxo, um editor gratuito de fluxogramas que funciona no navegador.",
      path: "/sobre",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicPage
      eyebrow="Sobre o produto"
      title="Pensar visualmente deve ser simples."
      description="O Fluxo é um editor web para transformar processos, decisões e ideias em diagramas claros, sem exigir cadastro ou instalação."
    >
      <div className="space-y-10 text-[15px] leading-7 text-muted-foreground">
        <section>
          <h2 className="font-display text-3xl text-foreground">O que o Fluxo resolve</h2>
          <p className="mt-3">
            Processos ficam difíceis de discutir quando existem apenas em mensagens, documentos ou
            na memória das pessoas. O Fluxo oferece um canvas visual para montar blocos, conectar
            etapas, organizar caminhos e compartilhar o resultado como arquivo ou imagem.
          </p>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">Princípios do MVP</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="border-l-2 border-brand pl-4">Uso direto no navegador.</li>
            <li className="border-l-2 border-brand pl-4">Sem cadastro obrigatório.</li>
            <li className="border-l-2 border-brand pl-4">Dados sob controle do usuário.</li>
            <li className="border-l-2 border-brand pl-4">Arquivos .flow legíveis e portáteis.</li>
            <li className="border-l-2 border-brand pl-4">Exportação PNG para apresentação.</li>
            <li className="border-l-2 border-brand pl-4">Editor limpo, rápido e previsível.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-3xl text-foreground">Evolução responsável</h2>
          <p className="mt-3">
            O produto está em evolução. Recursos de conta, nuvem, colaboração e monetização não
            fazem parte deste MVP. A prioridade atual é consolidar uma ferramenta útil e confiável
            para criação manual de fluxogramas.
          </p>
        </section>
      </div>
      <EditorCallout />
    </PublicPage>
  );
}
