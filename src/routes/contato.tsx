import { Mail, MessageSquareText } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/PublicSite";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/contato")({
  head: () =>
    createPageHead({
      title: "Contato",
      description: "Canais de contato e feedback do projeto Fluxo.",
      path: "/contato",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PublicPage
      eyebrow="Fale com o projeto"
      title="Contato e feedback"
      description="Relatos objetivos ajudam a priorizar correÃ§Ãµes e tornar o editor mais confiÃ¡vel."
    >
      <div className="grid gap-10 sm:grid-cols-2">
        <section className="border-t border-border pt-5">
          <MessageSquareText className="h-5 w-5 text-brand" />
          <h2 className="mt-4 font-display text-3xl">Issues no GitHub</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Para bugs e sugestÃµes tÃ©cnicas, abra uma issue com passos para reproduzir, resultado
            esperado e capturas de tela quando possÃ­vel.
          </p>
          <a
            href="https://github.com/alvaro-amorim/fluxo/issues"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex text-sm font-semibold text-brand hover:underline"
          >
            Abrir uma issue
          </a>
        </section>
        <section className="border-t border-border pt-5">
          <Mail className="h-5 w-5 text-brand" />
          <h2 className="mt-4 font-display text-3xl">E-mail</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Canal provisÃ³rio para contato geral. O endereÃ§o deve ser substituÃ­do pelo e-mail
            oficial antes da divulgaÃ§Ã£o pÃºblica do domÃ­nio.
          </p>
          <a
            href="mailto:comerc.ias.prod@gmail.com"
            className="mt-5 inline-flex text-sm font-semibold text-brand hover:underline"
          >
            comerc.ias.prod@gmail.com
          </a>
          <p className="mt-2 text-xs font-medium uppercase text-muted-foreground">
            TODO: substituir pelo contato oficial
          </p>
        </section>
      </div>
    </PublicPage>
  );
}
