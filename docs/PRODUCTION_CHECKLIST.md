# Checklist de produção do Fluxo

Este checklist deve ser usado antes de promover uma nova versão do **Fluxo** para produção.

O objetivo é validar três frentes:

1. qualidade técnica do build;
2. funcionamento real do editor;
3. confiabilidade das páginas públicas e do deploy.

---

## 1. Validação técnica local

Execute sempre a partir da raiz do projeto:

```bash
npm ci
npm run format
npm run lint
npm run build
npm run preview
```

Critérios mínimos:

- [ ] Node.js 20 ou superior configurado.
- [ ] `npm ci` executa sem erro.
- [ ] `npm run format` conclui sem alterar arquivos inesperados.
- [ ] `npm run lint` conclui com 0 erros.
- [ ] Warnings conhecidos de Fast Refresh foram revisados e não bloqueiam o release.
- [ ] `npm run build` conclui sem erro.
- [ ] `npm run preview` serve o artefato compilado.
- [ ] `git diff --check` não aponta whitespace inválido.
- [ ] Nenhum segredo, token, `.env`, arquivo temporário ou build local foi commitado.

---

## 2. Checklist manual do editor

Valide o editor em navegador real, preferencialmente no Chrome e em pelo menos uma viewport menor.

### Fluxos básicos

- [ ] Criar um novo fluxo pela home.
- [ ] Criar um novo fluxo pela rota `/editor`.
- [ ] Abrir um fluxo existente em `/editor/:id`.
- [ ] Criar, mover, redimensionar, duplicar e excluir blocos.
- [ ] Trocar título, forma e cor sem perder dados do bloco.
- [ ] Criar linha, seta e seta bidirecional.
- [ ] Converter linha em seta com `A`.
- [ ] Converter seta em linha com `L`.
- [ ] Alternar forma do bloco selecionado com `F`.
- [ ] Alternar cor de bloco, linha ou seta com `K`.

### Canvas e roteamento

- [ ] Confirmar handles geométricos nas bordas reais das formas.
- [ ] Confirmar que múltiplas setas usam corredores visuais separados.
- [ ] Confirmar que blocos funcionam como obstáculos sólidos para rotas automáticas.
- [ ] Confirmar que blocos não permanecem sobrepostos após drag, criação, duplicação ou resize.
- [ ] Confirmar que autoexpansão de blocos não reseta conteúdo, cor, forma ou estilo.
- [ ] Testar com pelo menos 20 blocos e 30 conexões.

### Produtividade

- [ ] Testar undo e redo.
- [ ] Testar grid e snap.
- [ ] Testar organizar fluxo.
- [ ] Testar zoom amplo e ajuste à tela.
- [ ] Testar modo apresentação.
- [ ] Confirmar que atalhos não disparam enquanto o usuário digita em inputs, modais ou campos editáveis.

### Portabilidade

- [ ] Exportar `.flow`.
- [ ] Importar o mesmo arquivo `.flow`.
- [ ] Confirmar que posições, formas, setas, cores e informações ocultas são preservadas.
- [ ] Exportar PNG com formas, textos e setas visíveis.

---

## 3. Rotas públicas

Valide todas as rotas por navegação interna e por acesso direto/refresh.

| Rota | Critério |
| --- | --- |
| `/` | Home apresenta o produto, biblioteca local e CTA para o editor. |
| `/editor` | Cria um novo fluxo e abre o editor. |
| `/editor/:id` | Abre um fluxo local específico. |
| `/exemplos` | Exibe casos de uso e CTA funcional. |
| `/sobre` | Explica o produto de forma clara. |
| `/privacidade` | Descreve armazenamento local e ausência de conta no MVP. |
| `/termos` | Define responsabilidade do usuário e limitações do MVP. |
| `/contato` | Exibe e-mail de contato real. |

Também validar:

- [ ] Header e footer não têm links quebrados.
- [ ] Página 404 está em português e oferece retorno à home.
- [ ] Layout funciona em desktop e mobile.
- [ ] Console não apresenta erro crítico.

---

## 4. SEO e metadados

- [ ] `title` e `meta description` são adequados ao produto.
- [ ] Open Graph e Twitter Card aparecem no HTML renderizado.
- [ ] `lang="pt-BR"` está presente.
- [ ] `robots.txt` está acessível.
- [ ] Editor não é tratado como página principal de SEO.
- [ ] `VITE_SITE_URL` usa a URL pública final do deploy.
- [ ] Canonical não aponta para preview antigo ou domínio incorreto.
- [ ] Favicon carrega.
- [ ] Quando houver domínio estável, gerar e publicar `sitemap.xml` com URLs absolutas.

---

## 5. Privacidade, termos e contato

- [ ] Política descreve corretamente armazenamento local no navegador.
- [ ] Política explica importação/exportação local de arquivos `.flow` e PNG.
- [ ] Política informa serviços externos efetivamente usados.
- [ ] Termos deixam clara a responsabilidade do usuário pelo conteúdo criado.
- [ ] Termos orientam o usuário a manter backups dos arquivos `.flow`.
- [ ] E-mail de contato está correto.
- [ ] Nenhuma razão social, CNPJ ou entidade jurídica foi inventada.
- [ ] Revisão jurídica final foi considerada antes de escala comercial.

---

## 6. Deploy

Seguir [DEPLOY.md](DEPLOY.md).

Checklist específico:

- [ ] Deploy conectado ao branch correto.
- [ ] Build command configurado como `npm run build`.
- [ ] Install command configurado como `npm ci`.
- [ ] Output directory não foi forçado como pasta estática manual.
- [ ] `VITE_SITE_URL` configurado com a URL final.
- [ ] Redeploy executado após alterar variáveis de ambiente.
- [ ] Todas as rotas abrem por link direto no ambiente publicado.
- [ ] Importação/exportação testadas no domínio publicado.
- [ ] Dados locais de preview não foram confundidos com dados de produção.

---

## 7. Preparação futura para Google AdSense

O Fluxo ainda não deve receber anúncios dentro do editor. A prioridade é manter utilidade real, navegação clara e experiência estável.

Antes de integrar AdSense:

- [ ] Validar políticas oficiais atualizadas do Google AdSense na data da integração.
- [ ] Publicar conteúdo próprio útil além do canvas, como exemplos, tutoriais e documentação.
- [ ] Revisar política de privacidade, cookies e consentimento aplicável.
- [ ] Definir analytics e retenção de dados antes de ativá-los.
- [ ] Considerar anúncios apenas em home, páginas de conteúdo, exemplos/templates e tutoriais.
- [ ] Não colocar anúncios dentro do canvas/editor nesta fase.
- [ ] Não posicionar anúncios perto de criar bloco, importar, exportar ou outros comandos críticos.
- [ ] Não incentivar clique em anúncio.
- [ ] Não usar elementos que imitem controles do app ou placeholders enganosos.
- [ ] Avaliar impacto em performance, acessibilidade e estabilidade visual antes da publicação.

---

## 8. Critério de liberação

Uma versão só deve ser promovida quando:

- lint e build passam;
- rotas públicas abrem em produção;
- editor cria, conecta, exporta, importa e apresenta fluxos;
- atalhos principais funcionam;
- não há alterações locais pendentes;
- pendências conhecidas estão documentadas.

Se algum item crítico falhar, não promover o release.