# Checklist de produÃ§Ã£o do Fluxo

## InstalaÃ§Ã£o e validaÃ§Ã£o tÃ©cnica

```bash
npm ci
npm run format
npm run lint
npm run build
npm run preview
```

- [ ] Node.js 20 ou superior configurado.
- [ ] Build termina sem erros.
- [ ] Lint nÃ£o apresenta erros.
- [ ] `git diff --check` nÃ£o apresenta whitespace invÃ¡lido.
- [ ] Nenhum segredo, token ou arquivo `.env` foi commitado.
- [ ] Preset Nitro corresponde ao provedor de deploy.

## Checklist manual do editor

- [ ] Criar um fluxo pela home e pela rota `/editor`.
- [ ] Criar, mover, redimensionar, duplicar e excluir blocos.
- [ ] Trocar forma, cor e propriedades sem perder dados.
- [ ] Criar seta normal e bidirecional.
- [ ] Confirmar handles, anchors, corredores e desvio de blocos.
- [ ] Confirmar que blocos nÃ£o permanecem sobrepostos apÃ³s o drag.
- [ ] Testar undo e redo.
- [ ] Testar grid, snap, organizar, zoom e modo apresentaÃ§Ã£o.
- [ ] Exportar `.flow`, importar o mesmo arquivo e comparar o conteÃºdo.
- [ ] Exportar PNG com formas, textos e setas visÃ­veis.
- [ ] Confirmar atalhos contextuais F, K, L e A sem disparar em campos de texto.
- [ ] Testar com pelo menos 20 blocos e 30 conexÃµes.

## Rotas pÃºblicas

- [ ] `/` apresenta o produto e abre o editor.
- [ ] `/editor` cria um projeto e redireciona para `/editor/:id`.
- [ ] `/exemplos` abre e possui CTA funcional.
- [ ] `/sobre`, `/privacidade`, `/termos` e `/contato` abrem por URL direta.
- [ ] Links de header e footer nÃ£o retornam 404.
- [ ] PÃ¡gina 404 estÃ¡ em portuguÃªs e oferece retorno Ã  home.
- [ ] Layout funciona em desktop e mobile.
- [ ] Console nÃ£o apresenta erros crÃ­ticos.

## SEO bÃ¡sico

- [ ] `title` e `meta description` sÃ£o especÃ­ficos por pÃ¡gina.
- [ ] Open Graph e Twitter Card aparecem no HTML renderizado.
- [ ] `lang="pt-BR"` estÃ¡ presente.
- [ ] `robots.txt` estÃ¡ acessÃ­vel.
- [ ] Editor estÃ¡ marcado como `noindex` e bloqueado no `robots.txt`.
- [ ] `VITE_SITE_URL` usa o domÃ­nio final antes do deploy pÃºblico.
- [ ] Canonical nÃ£o aponta para preview ou domÃ­nio provisÃ³rio.
- [ ] Favicon carrega.
- [ ] Gerar `sitemap.xml` com URLs absolutas apÃ³s definiÃ§Ã£o do domÃ­nio final.

## Privacidade, termos e contato

- [ ] PolÃ­tica descreve corretamente localStorage, importaÃ§Ã£o e exportaÃ§Ã£o local.
- [ ] PolÃ­tica informa serviÃ§os externos efetivamente usados.
- [ ] Termos deixam clara a responsabilidade pelo conteÃºdo e por backups.
- [ ] Substituir `comerc.ias.prod@gmail.com` pelo e-mail oficial.
- [ ] Confirmar que nÃ£o foi inventada razÃ£o social ou entidade jurÃ­dica.
- [ ] Revisar textos com responsÃ¡vel jurÃ­dico antes de escala comercial.

## Deploy

- [ ] Seguir [DEPLOY.md](DEPLOY.md).
- [ ] Testar a URL de preview do provedor.
- [ ] Abrir cada rota por refresh e link direto.
- [ ] Verificar HTTPS, headers e cache dos assets.
- [ ] Repetir teste de importaÃ§Ã£o/exportaÃ§Ã£o no domÃ­nio publicado.
- [ ] Confirmar que dados locais de um domÃ­nio de preview nÃ£o sÃ£o confundidos com produÃ§Ã£o.

## PreparaÃ§Ã£o futura para Google AdSense

NÃ£o integrar anÃºncios antes de o site ter utilidade real, conteÃºdo pÃºblico suficiente e navegaÃ§Ã£o estÃ¡vel.

- [ ] Validar as polÃ­ticas oficiais atualizadas do Google AdSense na data da integraÃ§Ã£o.
- [ ] Publicar conteÃºdo prÃ³prio Ãºtil alÃ©m do canvas, como exemplos, tutoriais e documentaÃ§Ã£o.
- [ ] Revisar polÃ­tica de privacidade, cookies e mecanismo de consentimento aplicÃ¡vel.
- [ ] Definir analytics e retenÃ§Ã£o de dados antes de ativÃ¡-los.
- [ ] Considerar anÃºncios apenas na home, pÃ¡ginas de conteÃºdo, exemplos/templates e tutoriais.
- [ ] NÃ£o colocar anÃºncios dentro do canvas/editor nesta fase.
- [ ] NÃ£o posicionar anÃºncios perto de criar bloco, importar, exportar ou outros comandos crÃ­ticos.
- [ ] NÃ£o usar incentivo a clique, elementos que imitem controles ou placeholders enganosos.
- [ ] Avaliar impacto em performance, acessibilidade e estabilidade visual antes da publicaÃ§Ã£o.

## CritÃ©rio de liberaÃ§Ã£o

O release sÃ³ deve ser promovido quando build, lint, rotas pÃºblicas e fluxo completo de ediÃ§Ã£o/importaÃ§Ã£o/exportaÃ§Ã£o estiverem validados no ambiente de preview. PendÃªncias conhecidas devem ser registradas antes do merge.
