const SITE_NAME = "Fluxo";
const SITE_DESCRIPTION =
  "Editor gratuito de fluxogramas para criar, organizar, importar e exportar processos diretamente no navegador.";

const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, "");

export function createPageHead({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}) {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  const canonical = configuredSiteUrl
    ? `${configuredSiteUrl}${path === "/" ? "" : path}`
    : undefined;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      ...(canonical ? [{ property: "og:url", content: canonical }] : []),
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      ...(noIndex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: canonical ? [{ rel: "canonical", href: canonical }] : [],
  };
}
