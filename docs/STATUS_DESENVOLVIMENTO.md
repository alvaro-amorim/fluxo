# Status de Desenvolvimento — Fluxo

Este documento registra o estado atual do projeto **Fluxo**.

Última revisão documental: 2026-06-21.

---

## 1. Branch principal de desenvolvimento

```txt
dev/estrutura-base-fluxo
```

A branch `dev/estrutura-base-fluxo` concentra o estado atual validado do produto.

A `main` só deve receber merge quando houver decisão explícita de promoção.

---

## 2. Estado atual do produto

O Fluxo está publicado como **web app MVP**.

Estado atual:

- editor funcional;
- home pública;
- páginas institucionais;
- deploy Vercel validado;
- documentação de deploy e produção;
- README profissional;
- import/export `.flow`;
- export PNG;
- modo apresentação;
- atalhos contextuais;
- rotas públicas de suporte.

URL de produção atual:

```txt
https://fluxo-nine-theta.vercel.app/
```

---

## 3. Validação técnica mais recente

Validações executadas localmente após preparação de produção:

```txt
npm run lint   ✅ 0 errors, 6 warnings conhecidos
npm run build  ✅ build concluído com sucesso
```

Os 6 warnings conhecidos são de `react-refresh/only-export-components` em componentes de UI reaproveitados. Eles não bloqueiam o release.

O build gera artefatos Nitro/TanStack Start em `.output`.

---

## 4. Funcionalidades implementadas

### Editor

- Canvas com grid, snap, zoom amplo e minimapa.
- Criação, movimentação, duplicação, exclusão e redimensionamento de blocos.
- Formas SVG: retângulo, retângulo arredondado, círculo, losango, hexágono e cilindro.
- Edição rápida de título, forma e cor.
- Toolbar lateral e toolbar contextual.
- Modo compacto.
- Modo apresentação.

### Conexões

- Linhas, setas e setas bidirecionais.
- Conversão rápida entre linha e seta.
- Handles geométricos na borda real das formas.
- Anchors distribuídos por node/lado.
- Corredores visuais para múltiplas conexões.
- Desvio de blocos como obstáculos sólidos.
- Calibração visual dos endpoints das setas.

### Física do canvas

- Blocos não devem permanecer sobrepostos ao soltar.
- Criação e duplicação procuram posição livre próxima.
- Resize tenta evitar sobreposição final.
- Autoexpansão de blocos quando muitas conexões pressionam o mesmo bloco.
- Roteamento recalcula após mover/redimensionar/expandir.

### Produtividade

- Atalhos contextuais:
  - `F`: alternar forma do bloco selecionado;
  - `K`: alternar cor de bloco, linha ou seta selecionada;
  - `L`: ativar linha ou converter seta em linha;
  - `A`: ativar seta ou converter linha em seta;
  - `V`, `B`, `C`, `G`, `S`, `Alt + L`, `Ctrl + Z`, `Ctrl + Y`, `Ctrl + 0`, `Shift + P`, `Alt + E`, `Alt + P`, `Alt + O`.
- Atalhos são bloqueados em campos de texto e modais.
- Undo/redo.
- Organização automática.

### Portabilidade

- Exportação `.flow`.
- Importação `.flow`.
- Exportação PNG.
- Persistência local no navegador.

### Web público

- Home pública.
- `/editor` e `/editor/:id`.
- `/exemplos`.
- `/sobre`.
- `/privacidade`.
- `/termos`.
- `/contato`.
- SEO básico e metadados.
- Favicon e `robots.txt`.

---

## 5. Documentação atualizada

Documentos principais:

- `README.md` — visão geral pública e técnica do projeto.
- `docs/CONSTITUICAO_DO_APP.md` — princípios do produto e decisões de escopo.
- `docs/ROADMAP.md` — evolução recomendada.
- `docs/SCHEMA_FLOW_JSON.md` — contrato do arquivo `.flow`.
- `docs/DEPLOY.md` — deploy em Vercel, Netlify ou Node.
- `docs/PRODUCTION_CHECKLIST.md` — checklist de produção.
- `docs/planning/WEB_APP_IMPROVEMENT_PLAN.md` — plano histórico de evolução para web app.
- `docs/audits/REPO_STATE_AUDIT.md` — auditoria de estado do repositório.

---

## 6. Decisões estratégicas atuais

- Prioridade atual: web app público.
- Desktop/Electron não é prioridade no curto prazo.
- IA interna não faz parte do MVP.
- Backend não é obrigatório nesta fase.
- Login e colaboração ficam para avaliação futura.
- Google AdSense só deve ser considerado depois de consolidar conteúdo público, privacidade, políticas e experiência de navegação.

---

## 7. Pendências conhecidas

### Produto

- Criar templates reais em `/exemplos`.
- Criar tutoriais públicos para ajudar SEO e adoção.
- Melhorar onboarding de novo usuário dentro do editor.
- Avaliar galeria de modelos.

### Técnico

- Reduzir gradualmente responsabilidade de `FlowEditor.tsx`.
- Adicionar testes unitários para `src/lib/flow`.
- Revisar exportação PNG em fluxos muito grandes.
- Avaliar IndexedDB para persistência local mais robusta.
- Revisar acessibilidade do editor.
- Melhorar performance em fluxos extremamente grandes.
- Documentar regras de rotas manuais que atravessam blocos.

### Produção

- Manter `VITE_SITE_URL` coerente com a URL pública final.
- Gerar `sitemap.xml` quando a URL/domínio estiver estabilizado.
- Revisar termos e privacidade antes de escala comercial.

---

## 8. Critérios para continuar desenvolvendo

Antes de qualquer nova missão:

1. criar branch específica;
2. definir escopo único;
3. evitar alterações amplas sem necessidade;
4. validar com lint e build;
5. testar manualmente o editor;
6. fazer push apenas após teste local;
7. mergear na `dev/estrutura-base-fluxo` somente quando a branch estiver limpa.

Comandos mínimos:

```bash
npm run format
npm run lint
npm run build
git diff --check
```

---

## 9. Próxima direção recomendada

Ordem sugerida:

1. criar templates reais;
2. melhorar `/exemplos`;
3. criar tutorial público;
4. adicionar testes de domínio;
5. revisar acessibilidade;
6. avaliar persistência em IndexedDB;
7. só depois avaliar monetização ou backend.

O estado atual é adequado para divulgação inicial como MVP gratuito.