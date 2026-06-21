# Constituição do App Fluxo

Este documento define os princípios técnicos e funcionais que devem orientar a evolução do **Fluxo**.

Ele deve ser lido antes de mudanças relevantes no editor, no schema, nas rotas públicas ou na experiência de produção.

---

## 1. Definição do produto

O Fluxo é um **web app gratuito para criação visual de fluxogramas**.

A proposta é permitir que qualquer pessoa crie, conecte, organize, apresente, importe e exporte fluxos diretamente no navegador, sem cadastro obrigatório no MVP.

O Fluxo deve ser:

- simples para começar;
- visual para entender;
- rápido para editar;
- portátil por meio de arquivos `.flow`;
- útil para processos, onboarding, automações, estudos, funis, jornadas e planejamento.

---

## 2. Estratégia atual

A estratégia atual é priorizar o Fluxo como **web app público**.

Ficam fora do foco imediato:

- Electron;
- Tauri;
- app desktop empacotado;
- login obrigatório;
- backend;
- colaboração em tempo real;
- IA interna no editor;
- anúncios dentro do canvas.

Essas possibilidades podem ser avaliadas no futuro, mas não devem comprometer a simplicidade e a estabilidade do MVP web.

---

## 3. Princípios fundamentais

### 3.1 Editor-first

O editor é o coração do produto.

Páginas públicas, exemplos, templates e SEO existem para apoiar o uso do editor, não para substituir sua experiência.

### 3.2 Web-first

O app deve funcionar bem no navegador, com deploy simples e rotas públicas claras.

O usuário deve conseguir abrir o site, criar um fluxo e exportar seu trabalho sem instalar nada.

### 3.3 Sem cadastro no MVP

O MVP não deve exigir conta para usar o editor.

Persistência remota, login e sincronização em nuvem só devem entrar se houver demanda real e justificativa de produto.

### 3.4 Local-first no armazenamento

No MVP, os fluxos ficam no navegador do usuário.

O formato `.flow` é a unidade portátil para backup, troca, importação e versionamento.

### 3.5 Manual-first

O usuário cria e edita fluxos manualmente.

IA externa pode gerar arquivos compatíveis no futuro, mas o editor não deve depender de IA interna nesta fase.

### 3.6 Visual-first

O canvas deve ser limpo, legível e produtivo.

Menus, modais e barras de ferramenta devem apoiar o desenho, não competir com ele.

### 3.7 JSON seguro

Arquivos `.flow` devem ser tratados como dados, não como código.

O app não deve executar HTML, JavaScript, SVG inseguro ou scripts vindos de arquivos importados.

### 3.8 Evolução incremental

Mudanças devem ser feitas em ciclos pequenos, com validação local e teste visual.

Evitar reescritas grandes, refatorações sem escopo e alterações que misturem editor, site público, schema e deploy ao mesmo tempo.

---

## 4. Público-alvo inicial

O Fluxo atende usuários individuais que precisam organizar visualmente ideias, processos e decisões.

Casos de uso principais:

- mapear processo comercial;
- criar onboarding de usuário;
- explicar fluxo de atendimento;
- organizar automações;
- desenhar jornada de produto;
- estudar sistemas e decisões;
- apresentar fluxos para clientes, equipe ou stakeholders.

O MVP não precisa atender colaboração em equipe, permissões, billing ou multiusuário.

---

## 5. Funcionalidades essenciais do MVP

O MVP deve permitir:

- abrir a home pública;
- criar novo fluxo;
- abrir editor;
- criar blocos;
- escolher forma do bloco;
- mover e redimensionar blocos;
- mudar título, forma e cor;
- criar linhas, setas e setas bidirecionais;
- converter linha em seta e seta em linha;
- editar propriedades de bloco e conexão;
- usar atalhos contextuais;
- usar grid, snap, zoom e minimapa;
- organizar fluxo;
- impedir sobreposição persistente entre blocos;
- desviar setas de blocos como obstáculos sólidos;
- apresentar fluxo em modo apresentação;
- exportar `.flow`;
- importar `.flow`;
- exportar PNG;
- acessar páginas públicas de sobre, exemplos, privacidade, termos e contato.

---

## 6. Funcionalidades aprovadas e preservadas

As seguintes decisões já fazem parte da identidade atual do Fluxo e devem ser preservadas salvo motivo forte:

- formas SVG para blocos complexos;
- handles geométricos nas bordas reais das formas;
- corredores visuais para múltiplas setas;
- distribuição de anchors por borda;
- autoexpansão de blocos com muitas conexões;
- blocos como obstáculos sólidos para rotas automáticas;
- prevenção de sobreposição entre blocos ao soltar/criar/duplicar/redimensionar;
- seta bidirecional como uma única conexão visual;
- botão de cor e atalhos contextuais;
- zoom out amplo;
- remoção da ferramenta de texto isolada;
- editor sem login;
- import/export como núcleo de portabilidade.

---

## 7. Formato `.flow`

O arquivo `.flow` é a representação portátil do projeto.

Ele deve preservar:

- metadados do projeto;
- nodes;
- edges;
- posições;
- tamanhos;
- formas;
- cores;
- títulos;
- resumos;
- informações ocultas;
- dados semânticos;
- configurações relevantes do fluxo.

Regras:

- manter `schemaVersion`;
- aplicar normalização ao importar;
- aceitar arquivos antigos quando possível;
- não exportar metadados internos de renderização;
- não exportar rotas temporárias, obstáculos, lanes ou slots visuais se forem apenas runtime;
- manter compatibilidade sempre que razoável.

---

## 8. Arquitetura técnica esperada

A organização deve manter separação entre:

```txt
src/components/flow/   editor, nodes, edges, toolbar e UI do canvas
src/components/site/   componentes das páginas públicas
src/hooks/             hooks reutilizáveis do editor e atalhos
src/lib/flow/          schema, defaults, normalização, layout, geometria e roteamento
src/lib/export/        exportação PNG e futuras exportações
src/lib/siteMeta.ts    metadados públicos e SEO
src/routes/            rotas TanStack Start
```

Diretrizes:

- `FlowEditor.tsx` deve ser reduzido gradualmente, sem reescrita brusca;
- funções puras devem viver em `src/lib/flow`;
- regras de schema devem ficar centralizadas;
- site público não deve acoplar lógica do editor;
- metadados temporários de renderização devem permanecer fora do `.flow`.

---

## 9. Qualidade visual

O Fluxo deve parecer uma ferramenta visual profissional.

Regras de UX:

- formas devem ter borda e preenchimento corretos;
- setas devem tocar bordas reais;
- linhas não devem atravessar blocos;
- blocos não devem permanecer sobrepostos;
- atalhos exibidos na interface precisam funcionar;
- mudanças de forma, cor e linha não devem resetar dados;
- zoom, pan e drag devem ser responsivos;
- export PNG deve representar o canvas de forma fiel.

---

## 10. Segurança e privacidade

No MVP:

- não há backend obrigatório;
- não há login;
- não há sincronização em nuvem;
- fluxos ficam no navegador do usuário;
- o usuário deve exportar `.flow` para backup;
- arquivos importados não devem executar código;
- termos e privacidade devem explicar claramente as limitações do armazenamento local.

---

## 11. Produção e deploy

Antes de qualquer release:

```bash
npm run format
npm run lint
npm run build
git diff --check
```

Também validar:

- home pública;
- editor;
- import/export;
- PNG;
- atalhos;
- rotas institucionais;
- deploy Vercel/Netlify/Node;
- `VITE_SITE_URL` quando houver URL pública definida.

Documentos relacionados:

- [DEPLOY.md](DEPLOY.md)
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- [SCHEMA_FLOW_JSON.md](SCHEMA_FLOW_JSON.md)
- [ROADMAP.md](ROADMAP.md)

---

## 12. Monetização futura

Google AdSense ou outra monetização só deve ser considerada depois de:

- o editor estar estável;
- páginas públicas terem conteúdo útil;
- termos e privacidade estarem revisados;
- políticas oficiais atualizadas serem validadas;
- impacto na experiência ser avaliado.

Regras iniciais:

- não inserir anúncios dentro do canvas/editor;
- não incentivar cliques;
- não colocar anúncios próximos de comandos críticos;
- não prejudicar performance, legibilidade ou navegação.

---

## 13. O que não fazer sem nova decisão estratégica

Não implementar sem alinhamento prévio:

- reescrita completa do editor;
- troca da biblioteca de canvas;
- backend obrigatório;
- login obrigatório;
- colaboração em tempo real;
- integração de IA interna;
- AdSense no editor;
- app desktop;
- mudanças quebráveis no schema `.flow`.

---

## 14. Critério de decisão

Sempre que houver dúvida, priorizar nesta ordem:

1. estabilidade do editor;
2. clareza visual do fluxo;
3. portabilidade dos dados;
4. performance de interação;
5. simplicidade para o usuário;
6. facilidade de deploy;
7. crescimento futuro.

O Fluxo deve evoluir como uma ferramenta útil antes de tentar virar uma plataforma complexa.