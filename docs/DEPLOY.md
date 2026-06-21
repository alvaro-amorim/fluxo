# Deploy do Fluxo

Este documento descreve como publicar o **Fluxo** como web app público.

O projeto usa **TanStack Start com SSR e Nitro**, portanto não deve ser tratado como um site estático simples. O artefato de produção inclui runtime server/edge conforme o preset escolhido.

---

## 1. Arquitetura de entrega

O `vite.config.ts` seleciona o preset Nitro nesta ordem:

1. `NITRO_PRESET`, quando definido manualmente;
2. `vercel`, quando a variável `VERCEL` existe;
3. `netlify`, quando a variável `NETLIFY` existe;
4. `node-server`, para build local ou hospedagem Node genérica.

Por isso:

- não force `dist`, `.output/public` ou outra pasta estática como único output;
- não publique apenas assets estáticos sem validar SSR e rotas diretas;
- sempre teste refresh direto em rotas como `/sobre`, `/editor` e `/privacidade`.

---

## 2. Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `VITE_SITE_URL` | Recomendada em produção | URL pública sem barra final, usada em canonical e Open Graph. Exemplo: `https://fluxo-nine-theta.vercel.app`. |
| `NITRO_PRESET` | Opcional | Força o alvo Nitro, por exemplo `vercel`, `netlify` ou `node-server`. |

Regras:

- use `VITE_SITE_URL` sem barra final;
- se alterar variáveis de ambiente no provedor, faça novo deploy;
- se ainda estiver usando URL temporária, é aceitável configurar `VITE_SITE_URL` com a URL pública principal da Vercel/Netlify;
- quando adotar domínio próprio, atualize `VITE_SITE_URL` e redeploye.

---

## 3. Deploy na Vercel

Configuração recomendada:

| Campo | Valor |
| --- | --- |
| Framework Preset | Auto-detectado / Other, se necessário |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | deixar vazio / não forçar pasta estática |
| Node.js | 20 ou superior |

Passos:

1. Importe o repositório na Vercel.
2. Escolha o branch de produção desejado.
3. Configure `npm ci` como install command.
4. Configure `npm run build` como build command.
5. Não configure output directory manualmente.
6. Faça o primeiro deploy.
7. Copie a URL pública final.
8. Configure `VITE_SITE_URL` com essa URL.
9. Faça redeploy para aplicar a variável.
10. Valide todas as rotas públicas e o editor.

A Vercel normalmente fornece a variável `VERCEL`, então o preset Nitro `vercel` é selecionado automaticamente. Se isso falhar, configure:

```env
NITRO_PRESET=vercel
```

---

## 4. Deploy na Netlify

Configuração recomendada:

| Campo | Valor |
| --- | --- |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Publish Directory | não force `dist/client` sem validar SSR |
| Node.js | 20 ou superior |

A Netlify normalmente fornece a variável `NETLIFY`, então o preset Nitro `netlify` é selecionado automaticamente. Se necessário, configure:

```env
NITRO_PRESET=netlify
```

Valide rotas diretas depois do deploy. Se alguma rota quebrar por refresh direto, revise a estratégia de SSR/fallback antes de divulgar.

---

## 5. Servidor Node genérico

Para hospedar em um ambiente Node:

```bash
npm ci
npm run build
node .output/server/index.mjs
```

Recomendações:

- usar Node.js 20 ou superior;
- configurar `HOST`, `PORT` e `VITE_SITE_URL` conforme o ambiente;
- colocar HTTPS na frente do processo, normalmente com proxy reverso;
- monitorar logs e reiniciar o processo com um gerenciador como PM2, systemd ou similar.

---

## 6. Preview local do build

Antes de publicar:

```bash
npm run build
npm run preview
```

O preview local valida o artefato compilado, mas não substitui o teste no provedor real. Sempre teste também a URL de preview/produção da Vercel, Netlify ou servidor escolhido.

---

## 7. Checklist pós-deploy

Depois de publicar, validar:

- [ ] `/` abre a home.
- [ ] `/editor` cria/abre um fluxo.
- [ ] `/exemplos` abre.
- [ ] `/sobre` abre.
- [ ] `/privacidade` abre.
- [ ] `/termos` abre.
- [ ] `/contato` abre.
- [ ] refresh direto em cada rota funciona.
- [ ] criação de bloco funciona.
- [ ] criação de seta funciona.
- [ ] exportação `.flow` funciona.
- [ ] importação `.flow` funciona.
- [ ] exportação PNG funciona.
- [ ] atalhos `F`, `K`, `L` e `A` funcionam.
- [ ] modo apresentação funciona.
- [ ] console não mostra erro crítico.

---

## 8. Hospedagem estritamente estática

Não é o alvo atual.

Para publicar sem runtime Node/edge, seria necessário validar uma estratégia oficial de prerender para todas as páginas e tratar corretamente a rota dinâmica `/editor/:id`.

Não publique apenas `dist/client` ou `.output/public` sem confirmar que:

- SSR não é necessário;
- rotas diretas funcionam;
- 404 funciona;
- editor e import/export continuam operando.

---

## 9. Antes de divulgar publicamente

- [ ] `npm run lint` passou.
- [ ] `npm run build` passou.
- [ ] `VITE_SITE_URL` aponta para a URL pública correta.
- [ ] E-mail de contato está correto.
- [ ] Política de privacidade e termos estão publicados.
- [ ] O app foi testado em produção.
- [ ] A documentação em [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) foi revisada.