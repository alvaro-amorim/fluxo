# Deploy do Fluxo

## Arquitetura de entrega

O Fluxo usa TanStack Start com SSR e Nitro. Portanto, o projeto **não deve ser publicado copiando apenas uma pasta estática**. O preset Nitro precisa corresponder ao ambiente de hospedagem.

O `vite.config.ts` seleciona o preset nesta ordem:

1. valor explícito de `NITRO_PRESET`;
2. `vercel` quando a variável `VERCEL` existe;
3. `netlify` quando a variável `NETLIFY` existe;
4. `node-server` para build local ou hospedagem Node genérica.

## Variáveis de ambiente

| Variável        | Obrigatória             | Uso                                                                                                    |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `VITE_SITE_URL` | Recomendada em produção | URL pública sem barra final, usada em canonical e Open Graph. Exemplo: `https://dominio-real.example`. |
| `NITRO_PRESET`  | Opcional                | Força o alvo Nitro, por exemplo `vercel`, `netlify` ou `node-server`.                                  |

Não defina `VITE_SITE_URL` com domínio provisório. Canonical é omitido quando a variável não existe.

## Vercel

1. Importe o repositório na Vercel.
2. Use Node.js 20 ou superior.
3. Comando de instalação: `npm ci`.
4. Comando de build: `npm run build`.
5. Não configure uma pasta estática como output manual.
6. Cadastre `VITE_SITE_URL` com o domínio final.

A Vercel fornece a variável `VERCEL`; o build seleciona automaticamente o preset Nitro `vercel`. Se o ambiente não fornecer essa variável, configure `NITRO_PRESET=vercel`.

## Netlify

1. Conecte o repositório na Netlify.
2. Use Node.js 20 ou superior.
3. Comando de instalação: `npm ci`.
4. Comando de build: `npm run build`.
5. Não force `dist/client` como publicação estática.
6. Cadastre `VITE_SITE_URL` com o domínio final.

A Netlify fornece a variável `NETLIFY`; o build seleciona automaticamente o preset Nitro `netlify`. Se necessário, configure `NITRO_PRESET=netlify` explicitamente.

## Servidor Node genérico

```bash
npm ci
npm run build
node .output/server/index.mjs
```

O build local usa o preset `node-server`. Defina `HOST`, `PORT` e `VITE_SITE_URL` conforme o ambiente. Coloque um proxy reverso com HTTPS na frente do processo Node.

## Preview local

```bash
npm run build
npm run preview
```

O preview valida a aplicação compilada localmente. Ele não substitui o teste do artefato específico do provedor.

## Hospedagem estritamente estática

Não é o alvo atual. Para publicar sem runtime Node/edge, será necessário validar uma estratégia oficial de prerender para todas as páginas e tratar a rota dinâmica `/editor/:id`. Não publique somente `dist/client`, pois isso pode quebrar SSR, rotas diretas e respostas 404.

## Antes de apontar o domínio

- executar `npm run lint` e `npm run build`;
- testar todas as rotas por acesso direto, não apenas por navegação interna;
- definir `VITE_SITE_URL`;
- substituir o e-mail provisório da página de contato;
- gerar `sitemap.xml` com URLs absolutas depois que o domínio final estiver definido;
- confirmar cache de assets e fallback de rotas no provedor;
- revisar [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).
