import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/PublicSite";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/termos")({
  head: () =>
    createPageHead({
      title: "Termos de uso",
      description: "Termos básicos para uso do editor de fluxogramas Fluxo.",
      path: "/termos",
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicPage
      eyebrow="Uso responsável"
      title="Termos de uso"
      description="Condições básicas aplicáveis ao uso do MVP do Fluxo. Última atualização: 21 de junho de 2026."
    >
      <article className="prose-public">
        <section>
          <h2>1. Finalidade do serviço</h2>
          <p>
            O Fluxo é uma ferramenta de apoio à criação e organização visual de fluxogramas. O
            serviço é oferecido no estado atual do MVP e pode receber correções, mudanças ou
            interrupções.
          </p>
        </section>
        <section>
          <h2>2. Conteúdo do usuário</h2>
          <p>
            O usuário mantém a responsabilidade pelo conteúdo criado, importado ou exportado. Não
            use o editor para armazenar ou distribuir conteúdo ilegal, abusivo, enganoso ou que
            viole direitos de terceiros.
          </p>
        </section>
        <section>
          <h2>3. Armazenamento e cópias de segurança</h2>
          <p>
            Os projetos do MVP ficam no armazenamento local do navegador. O usuário deve exportar
            arquivos .flow e manter cópias de segurança dos trabalhos importantes. Não há garantia
            de recuperação após limpeza do navegador, falha do dispositivo ou perda de dados locais.
          </p>
        </section>
        <section>
          <h2>4. Disponibilidade e resultados</h2>
          <p>
            O Fluxo busca oferecer uma experiência estável, mas não garante disponibilidade
            ininterrupta nem adequação a uma finalidade específica. Diagramas usados em decisões
            críticas devem ser revisados pelo usuário e pelas pessoas responsáveis pelo processo
            representado.
          </p>
        </section>
        <section>
          <h2>5. Propriedade e uso do produto</h2>
          <p>
            A interface, a marca e o código seguem os direitos e a licença definidos no repositório
            do projeto. Estes termos não transferem direitos sobre o produto nem sobre conteúdos de
            terceiros.
          </p>
        </section>
        <section>
          <h2>6. Alterações</h2>
          <p>
            Estes termos podem ser atualizados conforme o MVP evoluir. Mudanças relevantes devem ser
            refletidas nesta página com nova data de atualização.
          </p>
        </section>
      </article>
    </PublicPage>
  );
}
