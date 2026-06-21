import {
  ArrowRight,
  Bot,
  GraduationCap,
  Headphones,
  Megaphone,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/PublicSite";
import { Button } from "@/components/ui/button";
import { createPageHead } from "@/lib/siteMeta";

const examples = [
  {
    title: "Onboarding de usuário",
    description: "Organize cadastro, ativação, primeira entrega de valor e acompanhamento.",
    icon: UserPlus,
  },
  {
    title: "Processo comercial",
    description: "Mapeie prospecção, qualificação, proposta, negociação e fechamento.",
    icon: ShoppingBag,
  },
  {
    title: "Atendimento",
    description: "Visualize triagem, responsáveis, escalonamento e resolução de chamados.",
    icon: Headphones,
  },
  {
    title: "Funil de vendas",
    description: "Compare etapas, decisões e saídas de um funil comercial.",
    icon: Megaphone,
  },
  {
    title: "Planejamento de conteúdo",
    description: "Conecte pauta, produção, revisão, aprovação, publicação e análise.",
    icon: GraduationCap,
  },
  {
    title: "Automação simples",
    description: "Descreva gatilhos, condições, ações e tratamentos de exceção.",
    icon: Bot,
  },
];

export const Route = createFileRoute("/exemplos")({
  head: () =>
    createPageHead({
      title: "Exemplos de fluxogramas",
      description:
        "Ideias de fluxogramas para processos, onboarding, vendas, conteúdo e automações.",
      path: "/exemplos",
    }),
  component: ExamplesPage,
});

function ExamplesPage() {
  return (
    <PublicPage
      eyebrow="Inspiração prática"
      title="Comece por um processo conhecido."
      description="Use estes exemplos como ponto de partida conceitual. A galeria ainda é estática; o editor abre um fluxo novo para você adaptar."
    >
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map(({ title, description, icon: Icon }) => (
          <article key={title} className="border-t border-border pt-5">
            <Icon className="h-5 w-5 text-brand" />
            <h2 className="mt-4 text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </div>
      <div className="mt-14 flex flex-col items-start justify-between gap-5 border-y border-border py-9 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-3xl">Transforme uma ideia em fluxo.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie, organize e exporte sem cadastro.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-md">
          <Link to="/editor">
            Criar fluxo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </PublicPage>
  );
}
