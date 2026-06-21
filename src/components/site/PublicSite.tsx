import type { ReactNode } from "react";
import { ArrowRight, Github } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Exemplos", to: "/exemplos" as const },
  { label: "Sobre", to: "/sobre" as const },
  { label: "Privacidade", to: "/privacidade" as const },
];

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card shadow-sm">
        <span className="font-display text-lg leading-none italic">F</span>
        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-brand" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">Fluxo</span>
        <span className="block text-[10px] uppercase text-muted-foreground">editor visual</span>
      </span>
    </span>
  );
}

export function PublicHeader() {
  return (
    <header className="relative z-20 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link to="/" aria-label="Fluxo, página inicial">
          <BrandMark />
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
          aria-label="Principal"
        >
          {navigation.map((item) => (
            <Link key={item.to} to={item.to} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="gap-1.5 rounded-md">
          <Link to="/editor">
            Abrir editor
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:px-6 md:grid-cols-[1fr_auto]">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-md leading-6 text-muted-foreground">
            Fluxogramas claros, criados e salvos no seu navegador. Sem cadastro no MVP.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-muted-foreground sm:grid-cols-3">
          <Link to="/exemplos" className="hover:text-foreground">
            Exemplos
          </Link>
          <Link to="/sobre" className="hover:text-foreground">
            Sobre
          </Link>
          <Link to="/contato" className="hover:text-foreground">
            Contato
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link to="/termos" className="hover:text-foreground">
            Termos
          </Link>
          <a
            href="https://github.com/alvaro-amorim/fluxo"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export function PublicPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>
        <header className="border-b border-border bg-card/45">
          <div className="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase text-brand">{eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function EditorCallout({
  title = "Pronto para organizar seu próximo fluxo?",
}: {
  title?: string;
}) {
  return (
    <section className="mt-14 border-y border-border py-10">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-3xl">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Abra o editor gratuitamente. Nenhum cadastro é necessário no MVP.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-md">
          <Link to="/editor">
            Abrir editor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
