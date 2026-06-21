import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/PublicSite";
import { createPageHead } from "@/lib/siteMeta";

export const Route = createFileRoute("/privacidade")({
  head: () =>
    createPageHead({
      title: "Política de privacidade",
      description: "Como o Fluxo trata dados e arquivos no MVP baseado em armazenamento local.",
      path: "/privacidade",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Transparência"
      title="Política de privacidade"
      description="Esta política descreve o funcionamento atual do MVP. Última atualização: 21 de junho de 2026."
    >
      <article className="prose-public">
        <section>
          <h2>1. Dados dos fluxos</h2>
          <p>
            No MVP, os fluxos e preferências são armazenados localmente no navegador por meio de
            localStorage. O Fluxo não possui conta de usuário, banco de dados remoto ou
            sincronização em nuvem. Limpar os dados do navegador pode remover os projetos salvos
            localmente.
          </p>
        </section>
        <section>
          <h2>2. Importação e exportação</h2>
          <p>
            Arquivos .flow importados são lidos no próprio navegador. Exportações .flow e PNG são
            geradas localmente e baixadas para o dispositivo do usuário. O conteúdo não é enviado
            automaticamente a um servidor do Fluxo.
          </p>
        </section>
        <section>
          <h2>3. Serviços externos</h2>
          <p>
            O Fluxo não envia o conteúdo dos diagramas automaticamente a serviços externos. Links
            para o GitHub e o recurso de apoio a IA externa só abrem serviços de terceiros por
            decisão do usuário; as políticas desses serviços passam a valer quando eles são
            acessados.
          </p>
        </section>
        <section>
          <h2>4. Cookies, analytics e anúncios</h2>
          <p>
            Nesta versão não há login, analytics próprio, publicidade ou integração com Google
            AdSense. A política será revisada antes da inclusão de medição, consentimento, cookies
            não essenciais ou anúncios.
          </p>
        </section>
        <section>
          <h2>5. Segurança e responsabilidade do usuário</h2>
          <p>
            Evite inserir dados pessoais, confidenciais ou sensíveis nos fluxos. Mantenha cópias
            exportadas dos projetos importantes, pois o armazenamento local depende do navegador e
            do dispositivo.
          </p>
        </section>
        <section>
          <h2>6. Contato</h2>
          <p>
            Dúvidas sobre privacidade podem ser enviadas pelos canais indicados na página de
            contato.
          </p>
        </section>
      </article>
    </PublicPage>
  );
}
