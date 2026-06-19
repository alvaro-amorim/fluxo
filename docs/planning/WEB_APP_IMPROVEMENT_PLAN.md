# Plano de evolução do Fluxo como web app público

Data: 2026-06-19.

Este plano foi feito a partir da leitura do estado local do projeto: `package.json`, rotas em `src/routes`, componentes em `src/components/flow`, domínio em `src/lib/flow`, exportação em `src/lib/export`, documentos em `docs/` e auditoria em `docs/audits/REPO_STATE_AUDIT.md`.

## 1. Visão de produto

O Fluxo deve evoluir para um editor web de fluxogramas simples, rápido e visual, disponível via navegador, com uso livre e sem exigir instalação desktop no curto prazo.

A experiência principal deve continuar sendo o editor: criar blocos, conectar ideias, ajustar formas, organizar visualmente e exportar o resultado. O usuário deve conseguir começar rápido, trabalhar manualmente e manter controle total sobre o desenho.

Direção do produto:

- editor de fluxogramas simples, rápido e visual;
- uso livre via navegador;
- foco em criação manual e importação/exportação de arquivos `.flow`;
- persistência local no navegador como primeira camada;
- possibilidade futura de compartilhamento público de fluxos;
- possibilidade futura de monetização com anúncios, sem prejudicar a experiência de edição;
- páginas públicas úteis para descoberta, exemplos, templates e documentação;
- editor sem login no MVP público;
- backend opcional apenas quando houver necessidade real de salvar na nuvem, compartilhar URLs ou gerenciar contas.

O Fluxo não deve virar, no curto prazo, uma suíte pesada, ferramenta colaborativa complexa, app desktop empacotado, ou produto dependente de IA interna. A força do produto é a utilidade imediata no navegador.

## 2. Estado atual do app

### Funcionalidades implementadas

Com base no código e documentos atuais, o app já possui:

- React 19, TypeScript, Vite 8, TanStack Router/Start, React Query e `@xyflow/react`;
- UI baseada em Tailwind, Radix e componentes locais;
- rota pública principal em `src/routes/index.tsx`;
- rota do editor em `src/routes/editor.$id.tsx`;
- home com hero, criação de fluxo, importação, modal de IA externa e biblioteca local;
- biblioteca em `localStorage` via `src/lib/flow/store.ts`;
- criação, duplicação, exclusão e abertura de projetos locais;
- importação de `.json`, `.flow` e `.flow.json`;
- exportação `.flow.json`;
- exportação PNG inicial via `html-to-image`;
- editor com canvas React Flow, grid, zoom, minimap e controles;
- blocos customizados em `FluxoNode`;
- shapes: retângulo, arredondado, círculo, losango, cilindro e hexágono;
- resize visual via `NodeResizer`;
- fonte responsiva por tamanho de bloco e modo compacto;
- informações ocultas em tooltip;
- modal de propriedades de bloco;
- modal de propriedades de seta;
- toolbar lateral/flutuante arrastável;
- toolbar contextual para seleção;
- edição rápida de nome do bloco;
- edição rápida de forma do bloco;
- setas customizadas em `FluxoEdge`;
- handles expandidos em 12 posições visuais por bloco;
- cálculo automático de handles por heurística em `edgeRouting.ts`;
- cor automática para setas duplicadas entre o mesmo par de blocos;
- rotas manuais simples com desvio X/Y;
- modo apresentação;
- atalhos para selecionar, criar bloco, importar/exportar, PNG, organizar, undo/redo, duplicar, selecionar tudo e deletar;
- schema próprio `.flow.json` com normalização, validação, serialização e adapters React Flow.

### Pontos fortes

- O editor já é funcional e tem núcleo de produto real.
- A camada `src/lib/flow` já separa parte importante do domínio: tipos, defaults, normalização, validação, serialização, adapters, layout e roteamento.
- O schema `.flow.json` já preserva dados visuais e semânticos.
- O projeto já tem import/export suficientes para uma primeira experiência local no navegador.
- A UI tem boa base visual e linguagem própria.
- A toolbar contextual reduz atrito para edição rápida.
- A arquitetura usa React Flow, biblioteca madura para canvas de nós e conexões.
- O uso de `localStorage` é aceitável como primeira persistência web local.
- O build e o lint estão passando após o commit de Prettier, com warnings conhecidos de Fast Refresh em componentes de UI.

### Limitações atuais

- `FlowEditor.tsx` ainda concentra muita responsabilidade: estado, persistência, export/import, atalhos, layout, seleção, histórico e UI.
- `addBlock()` cria blocos em posição aleatória quando acionado pela toolbar/atalho; isso pode nascer fora da viewport atual percebida pelo usuário.
- A home mistura landing, biblioteca local e entrada no editor; para web app público, convém separar marketing/conteúdo público de app/editor.
- A root route ainda tem metadados genéricos de Lovable em `src/routes/__root.tsx`.
- Há sinais de encoding ruim em textos exibidos no terminal e em alguns documentos/código. Pode ser apenas rendering do terminal, mas precisa de revisão cuidadosa antes de tocar em textos públicos.
- A exportação PNG é inicial e precisa de validação visual em fluxos grandes.
- Undo/redo existe, mas ainda depende de snapshots dentro do editor e pode não cobrir perfeitamente resize/move em granularidade ideal.
- A normalização de handles em `normalization.ts` aceita apenas `top`, `right`, `bottom`, `left`, `auto`, enquanto os tipos e UI já aceitam 12 handles. Isso é uma inconsistência técnica relevante.
- O schema documentado em `docs/SCHEMA_FLOW_JSON.md` ainda fala em handles básicos, enquanto o código evoluiu para posições expandidas.
- O roteamento tenta reduzir cruzamentos por heurística, mas ainda não há contrato explícito de slots/capacidade por bloco.
- A renderização atual das formas ainda trata boa parte dos blocos como variações de uma caixa retangular com CSS, `border`, `border-radius`, `transform` e `clip-path`.
- Formas não retangulares apresentam problemas visuais: hexágono com borda incompleta, losango deformado e setas/handles ancorados no retângulo invisível em vez da geometria real.
- Bordas, preenchimento, seleção e pontos de conexão ainda não têm uma camada geométrica única que funcione para retângulo, retângulo arredondado, círculo, losango, hexágono e cilindro.
- O app ainda não tem testes automatizados de domínio, import/export, roteamento ou regressão visual.

### Riscos técnicos

- Acoplamento excessivo do editor a React Flow e ao estado de UI.
- Divergência entre schema documentado, tipos TypeScript e normalização real.
- Risco de inconsistência visual entre forma desenhada, área de seleção, pontos de conexão e exportação PNG.
- Roteamento de setas complexo sem testes visuais pode regredir facilmente.
- Persistência em `localStorage` pode ser perdida pelo usuário ou ficar inconsistente.
- Export PNG pode falhar em fluxos grandes, zooms específicos ou browsers diferentes.
- Páginas públicas e editor podem ficar acoplados se a arquitetura de rotas não for separada.
- Monetização precoce pode prejudicar performance, SEO, privacidade e experiência do editor.

### Dívidas técnicas

- Extrair partes do `FlowEditor` para hooks/funções focadas.
- Alinhar schema, docs, tipos e normalização.
- Criar uma camada dedicada de geometria/renderização de formas.
- Substituir formas complexas baseadas apenas em CSS por SVG com `fill` e `stroke` reais.
- Calcular handles por geometria real da forma, não pelo bounding box retangular.
- Criar testes de funções puras em `src/lib/flow`.
- Criar checklist manual versionado para regressão do editor.
- Revisar metadados, idioma e textos públicos.
- Separar `app/editor` de páginas públicas.
- Planejar persistência local mais robusta, provavelmente IndexedDB antes de backend.
- Revisar bundle e dependências não usadas antes de publicar.

## 3. Decisão estratégica: web app, não desktop

Priorizar web app agora é a decisão correta porque:

- o projeto atual já é uma aplicação web funcional;
- o valor principal está no editor, não em APIs desktop;
- publicação web permite validação rápida com usuários reais;
- SEO, exemplos e templates só fazem sentido em ambiente público;
- monetização futura por AdSense depende de páginas públicas úteis e navegáveis;
- manter tudo no navegador reduz escopo e risco;
- import/export `.flow.json` preserva portabilidade mesmo sem desktop.

Fora de escopo no curto prazo:

- Electron;
- Tauri;
- instalador desktop;
- app local empacotado;
- janelas separadas;
- múltiplos monitores;
- APIs nativas de filesystem;
- empacotamento Windows/macOS/Linux.

O que deve ser preservado:

- funcionamento local no navegador;
- editor sem login;
- importação/exportação `.flow.json`;
- export PNG;
- biblioteca local no navegador;
- arquivos `.flow`/`.flow.json` como unidade portátil;
- compatibilidade com fluxos antigos sempre que razoável.

Os documentos antigos ainda podem ser úteis como histórico, mas `docs/CONSTITUICAO_DO_APP.md`, `docs/ROADMAP.md` e `docs/PROMPT_CODEX.md` ainda priorizam desktop/local-first. Eles devem ser atualizados em uma missão futura para refletir a estratégia web pública.

## 4. Problemas pendentes prioritários

Problemas editoriais e visuais:

- bloco novo nasce fora da viewport atual quando criado por toolbar/atalho;
- setas duplicadas ainda podem disputar pontos;
- setas entram/saem por pontos visualmente ruins em fluxos complexos;
- blocos não expandem automaticamente quando há excesso visual de conexões;
- roteamento global anti-cruzamento ainda é heurístico e incompleto;
- organização visual de fluxos grandes ainda depende de auto-layout simples;
- modo leitura/foco ainda é limitado;
- minimap e navegação de fluxos grandes podem evoluir;
- export PNG precisa ser mais previsível;
- responsividade do editor precisa de validação em telas menores;
- acessibilidade básica ainda precisa de revisão: foco, labels, teclado, contraste e anúncios futuros;
- persistência local precisa evoluir de `localStorage` para camada mais robusta;
- eventual backend futuro deve ser planejado sem contaminar o MVP;
- SEO e páginas públicas ainda não estão prontos;
- preparação para AdSense ainda não existe;
- política de privacidade e termos ainda não existem;
- performance e bundle precisam de auditoria antes de publicação pública.

Problemas técnicos específicos:

- `FlowHandlePosition` já inclui 12 handles, mas a documentação e a normalização ainda não estão alinhadas;
- `FlowEditor.tsx` tem mais de 1200 linhas e deve ser reduzido com extrações graduais;
- `setSelectedEdgeDeviation()` ainda calcula pontos localmente em vez de usar `getManualRouteControlPoints()`;
- `compactView` é injetado no `data` renderizado, mas deve continuar fora do schema exportado;
- `NodeResizer` atualiza tamanho no próprio node, mas o snapshot ideal de undo/redo precisa ser garantido ao final do resize;
- root metadata ainda não reflete Fluxo como produto público.

## 5. Roadmap recomendado por fases

### Fase 0 — estabilização da base

Prioridade: alta. Risco: baixo.

- manter lint/build sempre passando;
- preservar `docs/audits/REPO_STATE_AUDIT.md`;
- manter checklist de regressão manual;
- atualizar docs estratégicos para remover prioridade desktop no curto prazo;
- registrar estado de warnings conhecidos;
- criar padrão de aceite de branch.

Critério de saída: qualquer branch deve passar `npm run format`, `npm run lint` e `npm run build`, ou documentar claramente por que parou.

### Fase 1 — UX essencial do editor

Prioridade: alta. Risco: baixo/médio.

- criar bloco no centro da viewport atual;
- preservar criação por clique em posição específica;
- melhorar feedback da ferramenta ativa;
- melhorar toolbar sem adicionar complexidade;
- reforçar atalhos realmente implementados;
- evitar ações destrutivas acidentais;
- confirmar undo/redo para ações essenciais;
- revisar texto de erros de import/export.

Critério de saída: criar bloco por botão/atalho sempre coloca o bloco no centro visível; criação por clique continua usando o ponto clicado.

### Fase 2 — qualidade visual das formas e geometria

Prioridade: alta. Risco: alto.

- criar camada dedicada de geometria de formas;
- renderizar formas complexas em SVG;
- corrigir hexágono com borda completa;
- corrigir losango proporcional;
- garantir círculo realmente circular quando aplicável;
- desenhar cilindro com contorno coerente;
- separar preenchimento e borda;
- fazer seleção visual acompanhar a silhueta da forma;
- calcular pontos de conexão na borda real da forma;
- recalcular pontos após resize ou troca de shape.

Critério de saída: cada forma precisa parecer correta, ter borda completa, seleção coerente, export PNG fiel e pontos de conexão na borda visível.

### Fase 3 — arquitetura de conexões e setas

Prioridade: alta. Risco: alto.

- desenhar modelo formal de handles/slots;
- diferenciar handle manual e handle automático;
- definir slots por lado do bloco;
- alinhar docs, tipos, normalização e adapters;
- calcular contagem de conexões por bloco/lado;
- expandir bloco automaticamente quando exceder capacidade visual;
- distribuir setas duplicadas sem sobrepor portas;
- evitar sobreposição de entrada e saída;
- melhorar roteamento anti-cruzamento;
- criar testes visuais manuais obrigatórios.

Critério de saída: fluxos com múltiplas conexões entre os mesmos blocos e múltiplas entradas/saídas em um bloco permanecem legíveis.

### Fase 4 — fluxos grandes

Prioridade: média/alta. Risco: médio.

- modo leitura;
- foco em caminho selecionado;
- agrupamentos/seções;
- colapsar/expandir grupos;
- minimap melhor;
- busca dentro do fluxo;
- performance com muitos blocos e setas;
- reduzir recomputações pesadas durante drag.

Critério de saída: fluxo com pelo menos 100 blocos e 200 setas permanece navegável e editável.

### Fase 5 — web app público

Prioridade: alta para produto. Risco: médio.

- home pública;
- editor público;
- páginas de exemplos;
- templates;
- galeria opcional;
- salvar no navegador;
- import/export claro;
- URL compartilhável futura;
- separação de rotas públicas e app;
- metadados, idioma e preview social corretos.

Critério de saída: usuário novo entende o produto, cria um fluxo e exporta/importa sem documentação externa.

### Fase 6 — monetização e SEO

Prioridade: média. Risco: médio/alto se feito cedo.

- landing pages indexáveis;
- páginas informativas;
- exemplos e templates indexáveis;
- preparação para anúncios sem atrapalhar o editor;
- definir áreas onde anúncio pode aparecer;
- definir áreas onde anúncio não deve aparecer;
- política de privacidade;
- termos de uso;
- consentimento/cookies, se necessário;
- validação futura com documentação oficial atualizada do Google AdSense.

Critério de saída: site público útil e navegável antes de qualquer anúncio agressivo.

### Fase 7 — backend futuro opcional

Prioridade: baixa no MVP. Risco: alto.

- contas de usuário;
- salvar fluxos na nuvem;
- compartilhamento público;
- duplicar template;
- limite por plano;
- analytics;
- possível plano pago;
- moderação de galeria pública.

Critério de entrada: só iniciar quando o editor web local e as páginas públicas já estiverem estáveis.

## 6. Arquitetura técnica recomendada

### Organização atual

Estrutura relevante atual:

- `src/routes/index.tsx`: home, biblioteca local, importação e modal de IA externa;
- `src/routes/editor.$id.tsx`: carrega projeto e renderiza `FlowEditor`;
- `src/components/flow/FlowEditor.tsx`: editor central;
- `src/components/flow/FluxoNode.tsx`: node customizado;
- `src/components/flow/FluxoEdge.tsx`: edge customizada;
- `src/components/flow/Toolbar.tsx`: toolbar lateral/flutuante;
- `src/components/flow/SelectionToolbar.tsx`: toolbar contextual;
- `src/components/flow/NodePropertiesModal.tsx`: edição completa de bloco;
- `src/components/flow/EdgePropertiesModal.tsx`: edição completa de seta;
- `src/lib/flow`: domínio do schema e algoritmos;
- `src/lib/export/exportPng.ts`: exportação PNG;
- `src/lib/flow/store.ts`: persistência local temporária via `localStorage`.

### Organização recomendada

Sem grande refactor inicial, a direção deve ser:

```txt
src/
  routes/
    index.tsx                  home pública futura ou redirecionador do app
    editor.$id.tsx             editor
    examples/                  páginas públicas futuras
    templates/                 páginas públicas futuras
    privacy.tsx                futura política
    terms.tsx                  futuros termos

  components/
    flow/                      componentes específicos do editor
      ShapeRenderer.tsx         renderização SVG das formas
    public/                    componentes de páginas públicas
    ui/                        componentes base

  lib/
    flow/                      engine/schema/algoritmos do domínio
      shapeGeometry.ts          geometria, bordas e pontos de conexão
    persistence/               persistência web local futura
    export/                    exportações
    public-content/            templates/exemplos estáticos futuros
```

### Separação recomendada

Editor:

- `FlowEditor` deve orquestrar a UI;
- hooks devem concentrar atalhos, histórico, seleção, import/export e persistência;
- componentes visuais devem continuar em `src/components/flow`;
- algoritmos devem ficar em `src/lib/flow`.

Engine de fluxo:

- tipos, defaults, normalização, serialização e adapters em `src/lib/flow`;
- geometria de formas em `src/lib/flow/shapeGeometry.ts`;
- roteamento em `src/lib/flow/edgeRouting.ts`;
- layout em `src/lib/flow/layout.ts`;
- futura migração em `src/lib/flow/migrations.ts`;
- futura análise de grafos em `src/lib/flow/graph.ts`.

Renderização visual:

- formas complexas devem passar por `ShapeRenderer`;
- `FluxoNode` deve orquestrar estado, texto, resize e handles;
- `ShapeRenderer` deve cuidar de fill, stroke, seleção e silhueta;
- pontos de conexão devem ser derivados de `shapeGeometry.ts`;
- `FluxoEdge` deve usar pontos visuais coerentes com a geometria sempre que possível.

Persistência local:

- manter `store.ts` como interface pública enquanto possível;
- depois mover implementação para `src/lib/persistence/localFlowStore.ts`;
- preferir IndexedDB para biblioteca mais robusta no navegador;
- manter export/import como caminho portátil e confiável.

Páginas públicas:

- não colocar marketing dentro de `FlowEditor`;
- não colocar ads diretamente no canvas;
- criar layout público separado;
- manter editor em rota própria;
- conteúdo público deve ser indexável e leve.

Como evitar acoplamento:

- editor não deve importar componentes de landing;
- landing não deve depender do estado interno do editor;
- templates públicos devem virar `FlowFile` ou `FlowProject` por adapter;
- anúncios devem ficar em componentes de layout público, não dentro da engine/editor;
- persistência deve ter interface, não chamadas espalhadas de `localStorage`.

## 7. Qualidade visual das formas

O Fluxo precisa deixar de tratar todas as formas como variações de uma caixa retangular com CSS simples. Esse modelo foi suficiente para protótipo, mas falha quando a forma precisa ter borda real, seleção coerente e pontos de conexão na silhueta visível.

Requisito de produto: o usuário deve perceber que cada forma é uma geometria real, não um retângulo invisível disfarçado.

Requisitos por forma:

- hexágono com borda completa em todos os lados;
- losango proporcional, equilibrado e sem aparência de retângulo inclinado;
- círculo realmente circular quando a forma escolhida for círculo;
- cilindro com contorno coerente, incluindo topo/base elípticos;
- retângulo arredondado com raio real considerado nos pontos de conexão;
- seleção visual acompanhando a silhueta da forma;
- preenchimento e borda desenhados separadamente;
- suporte consistente a cor de borda, cor de fundo e espessura;
- handles posicionados na borda real, não no bounding box invisível;
- export PNG preservando o mesmo visual visto no editor.

### Problema atual com CSS simples

Formas como losango e hexágono não devem depender apenas de `border`, `transform: rotate(...)` ou `clip-path` em um elemento HTML retangular. Em especial:

- `clip-path` recorta o preenchimento, mas a borda CSS continua sendo calculada como borda da caixa original ou pode ficar visualmente incompleta;
- `transform` em losango rotaciona o conteúdo e força compensações frágeis;
- a área de seleção continua retangular;
- os handles tendem a usar a caixa retangular;
- setas parecem sair do ar, entrar dentro do bloco ou tocar pontos errados.

### Requisito de consistência visual

Para cada shape, estas camadas devem concordar entre si:

1. preenchimento;
2. borda;
3. highlight de seleção;
4. área visual do bloco;
5. pontos de conexão;
6. início/fim das setas;
7. exportação PNG.

Se uma seta toca o retângulo invisível em vez da borda visível, o resultado deve ser considerado bug visual.

## 8. Arquitetura recomendada para renderização de formas

Recomendação: criar uma camada dedicada para geometria e renderização de formas.

Arquivos sugeridos:

```txt
src/lib/flow/shapeGeometry.ts
src/components/flow/ShapeRenderer.tsx
```

### `shapeGeometry.ts`

Responsabilidades:

- calcular pontos de contorno de cada forma;
- calcular pontos de conexão possíveis;
- calcular ponto de borda mais próximo de um vetor alvo;
- calcular capacidade visual de conexões por lado/região;
- calcular tamanho mínimo recomendado quando há conexões demais;
- manter fórmulas puras e testáveis, sem React.

Funções sugeridas:

```ts
getShapeConnectionPoints(shape, width, height);
getShapeBoundaryPoint(shape, width, height, direction);
getNearestConnectionPoint(shape, width, height, targetVector);
getConnectionCapacity(shape, width, height, side);
getExpandedSizeForConnections(shape, width, height, connectionCount);
```

### `ShapeRenderer.tsx`

Responsabilidades:

- renderizar a forma em SVG;
- desenhar `fill` e `stroke` reais;
- receber shape, width, height, style e estado de seleção;
- renderizar seleção acompanhando a forma;
- não misturar texto com geometria;
- deixar o conteúdo textual em uma camada acima da forma.

Estrutura visual recomendada:

```txt
FluxoNode
  ShapeRenderer   -> SVG com fill/stroke/selection
  NodeContent     -> título, resumo, ícone, indicadores
  ConnectionLayer -> handles geométricos
```

Formas complexas devem preferencialmente ser renderizadas com SVG, não apenas CSS:

- hexágono: `polygon`;
- losango: `polygon`;
- círculo: `circle` ou `ellipse`, conforme decisão de proporção;
- cilindro: `path` com elipses/curvas;
- retângulo/retângulo arredondado: `rect`;
- seleção: segundo path/polygon/rect com stroke de seleção.

### Texto acima da forma

O texto não deve ser deformado pela geometria. Mesmo quando o shape for losango ou hexágono:

- a forma fica no SVG de fundo;
- o texto fica em uma camada HTML ou SVG separada;
- o texto não deve sofrer `rotate`;
- o padding interno deve respeitar a área útil da forma;
- o truncamento deve considerar a menor área interna, não só o bounding box.

### Seleção visual acompanhando a forma

Quando o bloco estiver selecionado:

- a borda de seleção deve seguir a silhueta;
- o glow/ring deve seguir o path quando viável;
- o retângulo externo do React Flow pode existir internamente, mas não deve parecer a forma selecionada;
- handles devem aparecer junto à borda real.

### Bordas de hexágono e formas com clip-path

Bordas em elementos com `clip-path` podem falhar visualmente e não devem ser a base definitiva do editor.

Regra:

- não depender de `border` CSS para formas não retangulares;
- desenhar a borda pelo próprio SVG, polygon ou path;
- preservar espessura de borda;
- garantir que fill e stroke usem as cores do bloco;
- validar export PNG dessas formas.

### Losango proporcional

O losango tem regra especial:

- não deve ficar deformado;
- deve manter proporção visual consistente;
- deve parecer um losango de fluxograma, não um retângulo inclinado;
- se o texto exigir mais espaço, o bloco pode crescer de forma proporcional;
- se necessário, width e height podem ser vinculados ou normalizados para preservar o aspecto correto;
- se o usuário redimensionar manualmente de forma extrema, o app deve limitar, ajustar ou indicar que a proporção foi preservada;
- o losango deve ter pontos geométricos claros em cima, direita, baixo, esquerda e pontos intermediários nas arestas.

Decisão recomendada para MVP:

- círculo mantém `width === height`, salvo decisão explícita futura de permitir elipse;
- losango mantém razão visual controlada, por exemplo entre `0.8` e `1.25`, ou cresce proporcionalmente;
- hexágono aceita variação de largura/altura, mas recalcula vértices e conexão pelas arestas reais;
- cilindro aceita largura/altura, mas mantém elipses coerentes.

## 9. Plano específico para setas, handles e geometria de conexão

### Diagnóstico atual

O código já evoluiu para 12 handles visuais:

- `top-left`, `top`, `top-right`;
- `right-top`, `right`, `right-bottom`;
- `bottom-right`, `bottom`, `bottom-left`;
- `left-bottom`, `left`, `left-top`;
- `auto`.

O roteamento em `edgeRouting.ts` avalia pares de handles, uso de portas, uso de lados, rotas paralelas, cruzamentos e colisões com blocos. Isso é uma boa base, mas ainda é um conjunto de heurísticas sem modelo explícito de slots.

Problema crítico: `normalizeHandle()` em `normalization.ts` reduz qualquer handle expandido para `auto`. Isso pode perder informação ao importar/exportar fluxos com handles como `right-top` ou `left-bottom`.

Problema visual adicional: os handles e as setas ainda tendem a usar o retângulo invisível do node como referência. Para formas como círculo, losango, hexágono e cilindro, o ponto correto deve ser calculado na borda real da forma.

### Modelo recomendado

Separar três conceitos:

1. `requestedHandle`: intenção salva no schema.
2. `resolvedHandle`: handle físico calculado para renderização.
3. `slotIndex`: posição ordenada dentro de um lado quando há múltiplas conexões.

Proposta:

```ts
type FlowHandleMode = "auto" | "manual";

type FlowPortSide = "top" | "right" | "bottom" | "left";

type FlowConnectionEndpoint = {
  mode: FlowHandleMode;
  side?: FlowPortSide;
  handle?: FlowHandlePosition;
  slotIndex?: number;
};
```

No MVP, pode manter `sourceHandle` e `targetHandle`, mas o algoritmo deve internamente calcular uma estrutura equivalente para não misturar intenção manual com renderização automática.

### Pontos de conexão baseados na geometria real

Cada shape deve expor uma lista de pontos de conexão possíveis. Esses pontos não devem ser simplesmente posicionados no bounding box retangular.

Regras:

- para cada forma, os pontos devem estar na borda real da forma;
- as setas devem iniciar/terminar na borda visível;
- a seta não deve começar fora do bloco sem tocar a forma;
- a seta não deve entrar para dentro do bloco antes de aparecer;
- para retângulos arredondados, considerar raio de borda;
- para círculo, calcular pontos pela circunferência;
- para losango, calcular pontos nas arestas reais e nos vértices;
- para hexágono, calcular pontos nas arestas reais do polygon;
- para cilindro, considerar corpo, topo e base elípticos;
- após resize ou troca de shape, recalcular pontos visuais;
- export PNG deve preservar essas conexões.

Funções sugeridas:

```ts
getShapeConnectionPoints(shape, width, height);
getShapeBoundaryPoint(shape, width, height, direction);
getNearestConnectionPoint(shape, width, height, targetVector);
getConnectionCapacity(shape, width, height, side);
getExpandedSizeForConnections(shape, width, height, connectionCount);
```

O React Flow pode continuar recebendo handles, mas esses handles devem representar pontos derivados da geometria. Quando houver limitação da biblioteca, o app deve aproximar o handle físico ao ponto real e corrigir o path visual da edge para tocar a silhueta.

### Handles manuais vs automáticos

Manual:

- usuário escolhe `right-top`, `left`, `bottom-right`, etc.;
- o app deve respeitar enquanto possível;
- `routing.mode = "manual"` deve preservar a decisão;
- rota manual pode ter `routing.points`.
- não deve ser recalculado só porque o bloco moveu;
- deve ser recalculado apenas se a forma mudou e o handle deixou de existir, com fallback documentado.

Automático:

- schema pode salvar `auto`;
- algoritmo calcula `resolvedHandle`;
- cálculo deve considerar posição, lados livres, portas já usadas e cruzamentos;
- o valor resolvido não deve sobrescrever a intenção `auto` no schema.
- pode ser recalculado ao mover/redimensionar o bloco;
- pode mudar de slot se isso reduzir sobreposição, desde que não cause instabilidade visual.

Migrado de fluxos antigos:

- `left`, `right`, `top`, `bottom` podem virar pontos centrais equivalentes na geometria atual;
- `auto` continua recalculável;
- handles ausentes viram `auto`;
- handles desconhecidos viram `auto` com warning;
- handles expandidos já existentes devem ser preservados.

Recalculável:

- handle automático;
- handle migrado sem intenção explícita do usuário;
- handle cujo shape mudou e exige normalização visual.

Não recalculável automaticamente:

- handle manual escolhido pelo usuário;
- rota manual com pontos editados;
- edge marcada como `routing.mode = "manual"`, salvo ação explícita "Auto".

### Slots por lado

Cada bloco deve ter capacidade visual por lado:

```txt
top:    slots 0..n
right:  slots 0..n
bottom: slots 0..n
left:   slots 0..n
```

Primeira implementação:

- capacidade base: 3 slots por lado, compatível com os 12 handles atuais;
- ao exceder 3, calcular slots virtuais;
- se houver muitos slots virtuais, aumentar dimensão mínima do bloco ou sugerir expansão automática.

### Contagem de conexões por bloco

Calcular para cada node:

- saídas por lado;
- entradas por lado;
- total por lado;
- total global;
- conexões manuais;
- conexões automáticas;
- conexões duplicadas A -> B;
- conexões bidirecionais A <-> B.

Essa contagem deve alimentar:

- escolha do lado;
- escolha do slot;
- autoexpansão;
- score de roteamento;
- warnings visuais futuros.

### Expansão automática do bloco

Regra recomendada:

- não aumentar bloco por qualquer conexão;
- aumentar apenas quando a quantidade de conexões por lado exceder a capacidade visual;
- respeitar tamanho definido manualmente pelo usuário;
- registrar no histórico;
- preservar no `.flow.json`;
- evitar expandir durante cada pixel de drag.
- preservar proporção da forma quando necessário;
- não destruir conteúdo, cor, título, resumo, dados ocultos ou estilo.

Estratégia:

- `minimumSizeForConnections(node, connectionStats)` calcula largura/altura mínima;
- largura cresce para excesso em `top/bottom`;
- altura cresce para excesso em `left/right`;
- se usuário reduziu manualmente abaixo do necessário, mostrar indicação discreta antes de forçar.
- para losango, expandir de forma proporcional;
- para círculo, manter círculo por padrão ou permitir elipse apenas como decisão explícita;
- para hexágono, recalcular vértices e pontos após expansão;
- para cilindro, preservar proporção mínima das elipses.

Critérios de aceitação:

- criar 8 ou mais setas entre dois blocos sem todas ocuparem o mesmo ponto;
- setas devem tocar visualmente a borda correta;
- hexágono deve ter borda completa;
- losango deve parecer equilibrado;
- ao mudar forma, conexões devem ser recalculadas visualmente;
- resize manual deve recalcular handles;
- export PNG deve manter o visual correto.

### Distribuição por lado

Para automático:

- escolher lado principal pela posição relativa;
- penalizar lados já saturados;
- preferir lados opostos naturais;
- penalizar reutilização de mesma porta;
- distribuir duplicatas em slots distintos;
- separar A -> B de B -> A quando bidirecional.

Para manual:

- não redistribuir sem ação explícita;
- se o handle manual ficar inválido por migração, aplicar fallback e gerar warning.

### Critério de roteamento

Score recomendado:

- distância total;
- número de curvas;
- cruzamentos com outras rotas;
- sobreposição com outras rotas;
- passagem por cima de blocos;
- uso repetido de porta;
- uso saturado do lado;
- mudança desnecessária de lado durante drag;
- preferência por estabilidade visual.

Estabilidade é importante: a seta não deve ficar pulando entre lados a cada pequena movimentação. Depois da primeira escolha, usar hysteresis/tolerância.

### Prevenção de cruzamentos

Curto prazo:

- melhorar score atual;
- ordenar processamento das edges por importância;
- manter rotas já resolvidas como obstáculos;
- penalizar interseções e sobreposições.

Médio prazo:

- criar grafo de visibilidade simples;
- gerar corredores ortogonais;
- permitir pontos manuais arrastáveis;
- permitir "recalcular rotas" por botão.

Longo prazo:

- avaliar biblioteca madura para roteamento/layout quando o problema exigir, como ELK para layout de grafos. Não adicionar dependência sem ganho claro.

### Migração de fluxos antigos

Fluxos com:

- `auto`: manter como automático;
- `left`, `right`, `top`, `bottom`: tratar como manual central ou como lado preferido, conforme `routing.mode`;
- handle ausente: normalizar para `auto`;
- handle expandido já existente: preservar;
- handle desconhecido: normalizar para `auto` com warning.

Correção necessária antes de avançar: alinhar `normalizeHandle()` para aceitar todos os valores de `FlowHandlePosition`.

Migração visual:

- fluxos antigos com handles genéricos devem continuar abrindo;
- ao carregar, o app pode normalizar visualmente para pontos geométricos reais;
- a normalização visual não deve quebrar schema `.flow`;
- se forem adicionados novos handles, manter compatibilidade com os antigos;
- `sourceHandle` e `targetHandle` antigos devem continuar exportáveis/importáveis;
- uma versão futura do schema pode adicionar dados de slot sem remover campos antigos.

### Riscos

- refatorar roteamento sem testes visuais pode piorar fluxos simples;
- autoexpansão pode incomodar se mudar blocos inesperadamente;
- slots virtuais podem divergir dos handles reais do React Flow;
- schema pode ficar complexo cedo demais;
- tentativa de resolver todos os cruzamentos agora pode travar o progresso.
- geometria errada da forma pode invalidar qualquer melhoria de roteamento, por isso deve ser corrigida antes do anti-cruzamento complexo.

### Testes visuais necessários

- 2 blocos com 1 seta;
- 2 blocos com 5 setas A -> B;
- 2 blocos com setas A -> B e B -> A;
- 1 bloco central com 8 entradas;
- 1 bloco central com 8 saídas;
- fluxo em árvore;
- fluxo com retorno;
- fluxo com loop;
- fluxo com blocos muito próximos;
- fluxo com blocos redimensionados;
- import/export mantendo handles expandidos.
- hexágono com borda completa em editor e PNG;
- losango proporcional em tamanhos pequeno, médio e grande;
- círculo com conexão na circunferência;
- cilindro com conexão coerente no corpo e nas elipses;
- troca de shape recalculando pontos de conexão.

## 10. Plano específico para criação de blocos na viewport

Problema atual: `addBlock()` usa posição aleatória quando chamado sem coordenada:

```ts
const pos = atFlow ?? { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 };
```

Isso é aceitável para protótipo, mas ruim para usuário real em canvas grande.

Plano de implementação:

1. Usar a viewport atual do React Flow.
2. Obter a área visível do wrapper/canvas.
3. Calcular o centro da tela em coordenadas de tela.
4. Converter o centro para coordenada do canvas com `screenToFlowPosition`.
5. Subtrair metade do tamanho padrão do bloco para centralizar o bloco.
6. Criar o bloco nessa posição.
7. Preservar a criação por clique: quando `atFlow` for passado, usar `atFlow`.
8. Preservar toolbar/atalho: quando não houver `atFlow`, usar centro visível.

Critério sugerido:

```txt
toolbar/atalho -> centro visível atual
clique no canvas com ferramenta bloco -> posição clicada
duplicar -> deslocamento relativo perto da seleção
importar -> posições do arquivo
```

Testes necessários:

- criar bloco no zoom 100%;
- criar bloco com zoom alto;
- criar bloco com zoom baixo;
- pan para longe e criar bloco;
- usar toolbar lateral;
- usar toolbar flutuante;
- usar atalho `B`;
- clicar no canvas com ferramenta bloco;
- confirmar que o bloco fica inteiro ou majoritariamente visível.

## 11. Plano de dados e schema `.flow`

### Estado atual do schema

O projeto usa `.flow.json`, com:

- `app: "Fluxo"`;
- `schemaVersion`;
- `project`;
- `nodes`;
- `edges`;
- dados visuais;
- dados semânticos;
- routing;
- handles;
- custom fields.

O plano de produto pode chamar o arquivo de `.flow` em comunicação simplificada, mas tecnicamente a extensão atual exportada é `.flow.json`. Se a extensão curta `.flow` for adotada no futuro, ela deve conter o mesmo JSON e a importação deve continuar aceitando `.flow.json`.

### Campos que devem continuar

Raiz:

- `app`;
- `schemaVersion`;
- `project`;
- `nodes`;
- `edges`.

Projeto:

- `id`;
- `name`;
- `description`;
- `createdAt`;
- `updatedAt`;
- `background`;
- `viewport`;
- `settings`;
- `metadata`.

Node:

- `id`;
- `type`;
- `shape`;
- `title`;
- `summary`;
- `hiddenInfo`;
- `position`;
- `size`;
- `style`;
- `icon`;
- `semantic`;
- `customFields`.

Edge:

- `id`;
- `source`;
- `target`;
- `sourceHandle`;
- `targetHandle`;
- `label`;
- `hiddenInfo`;
- `type`;
- `stroke`;
- `hasArrow`;
- `style`;
- `routing`;
- `semantic`;
- `customFields`.

Geometria:

- shape e size continuam sendo a fonte para recalcular geometria;
- pontos resolvidos automaticamente não precisam ser exportados se puderem ser reproduzidos;
- handles manuais devem ser preservados;
- slots futuros podem ser adicionados de forma compatível;
- estilos de borda/fundo/espessura devem continuar no node style.

### Campos temporários que não devem ser exportados

Não exportar:

- `selected`;
- `dragging`;
- `measured`;
- `compactView`;
- estado de modal aberto;
- estado de toolbar;
- estado de hover;
- posições temporárias de pointer;
- cache de score de roteamento;
- `resolvedHandle` se ele representar apenas renderização automática;
- pontos geométricos calculados em runtime;
- path SVG resolvido quando derivável de shape e size;
- qualquer objeto interno bruto do React Flow sem passar por adapter.

### Compatibilidade com versões antigas

Manter:

- leitura de `version` antigo;
- tolerância a campos ausentes;
- defaults seguros;
- remoção de edges inválidas com warning;
- deduplicação de nodes.

Adicionar:

- preservação de handles expandidos;
- preservação de shapes atuais sem exigir novos campos;
- normalização visual de pontos geométricos ao abrir, sem quebrar schema;
- migrations explícitas quando o schema evoluir;
- testes com exemplos antigos.

### Versionamento do schema

Curto prazo:

- manter `0.1.0`;
- corrigir normalização sem mudar versão se for só bug de compatibilidade.

Médio prazo:

- `0.2.0` para slots/handles formais;
- `0.3.0` para grupos/seções;
- `1.0.0` quando o formato estiver estável.

### Migração futura

Criar depois:

```txt
src/lib/flow/migrations.ts
```

Responsabilidades:

- detectar versão;
- migrar em sequência;
- preservar dados desconhecidos quando seguro;
- retornar warnings;
- nunca quebrar importação por falta de campo opcional.

## 12. Plano de qualidade

### Checklist manual de regressão

Executar antes de aceitar branch relevante:

- abrir home;
- criar novo fluxo;
- abrir editor;
- criar bloco por toolbar;
- criar bloco por clique;
- renomear bloco pela toolbar contextual;
- trocar forma pela toolbar contextual;
- confirmar que hexágono tem borda completa;
- confirmar que losango é proporcional;
- confirmar que círculo não vira elipse sem decisão explícita;
- confirmar que cilindro mantém contorno coerente;
- abrir modal do bloco;
- editar cor, resumo e hidden info;
- redimensionar bloco;
- conectar dois blocos por drag;
- conectar por modo conectar;
- criar duas setas duplicadas A -> B;
- criar 8 ou mais setas entre dois blocos;
- confirmar que setas tocam a borda visível da forma;
- trocar shape de um bloco conectado e confirmar recálculo visual das conexões;
- editar label da seta;
- trocar cor da seta;
- trocar handle manual da seta;
- voltar seta para automático;
- inverter seta;
- aplicar desvio X/Y;
- deletar node e verificar remoção de edges ligadas;
- duplicar bloco;
- desfazer/refazer;
- organizar horizontal/vertical;
- alternar modo compacto;
- alternar modo apresentação;
- exportar `.flow.json`;
- importar o mesmo arquivo;
- exportar PNG;
- recarregar a página e confirmar persistência local.

### Testes unitários recomendados

Adicionar quando houver setup de testes:

- `normalizeFlowFile`;
- `parseFlowFileJson`;
- `projectToFlowFile`;
- `flowFileToProject`;
- `flowProjectToReactFlow`;
- `reactFlowToFlowProject`;
- `calculateAutoLayout`;
- `getSmartHandles`;
- `applySmartHandlesToReactFlowEdges`;
- `normalizeManualRoutePoints`;
- futuras funções de `shapeGeometry.ts`;
- cálculo de ponto de borda por shape;
- cálculo de capacidade de conexão por shape/lado;
- cálculo de expansão mínima por excesso de conexões;
- futura migração de schema.

### Testes visuais recomendados

Usar Playwright ou ferramenta equivalente no futuro:

- screenshot da home desktop;
- screenshot da home mobile;
- screenshot do editor com fluxo demo;
- screenshot do editor em modo compacto;
- screenshot de setas duplicadas;
- screenshot de bloco com muitas conexões;
- screenshot de hexágono selecionado e exportado;
- screenshot de losango proporcional em múltiplos tamanhos;
- screenshot de círculo com setas tocando a circunferência;
- screenshot de cilindro com setas tocando pontos coerentes;
- screenshot da exportação PNG comparada visualmente.

### Testes de import/export

- arquivo mínimo válido;
- arquivo completo válido;
- arquivo com handles expandidos;
- arquivo com shapes não retangulares conectados;
- arquivo com edge inválida;
- arquivo com node sem style;
- arquivo com cor inválida;
- arquivo com schema antigo;
- arquivo com JSON malformado;
- round trip export -> import -> export sem perda relevante.

### Testes de performance

Metas:

- 100 blocos e 200 setas no MVP público;
- 500 blocos e 1000 setas como meta futura.

Medir:

- tempo de abertura;
- tempo de pan/zoom;
- tempo de drag;
- tempo de recálculo de edges;
- tempo de export PNG;
- tamanho do bundle.

### Critérios para aceitar uma branch

- `npm run format`;
- `npm run lint`;
- `npm run build`;
- checklist manual proporcional ao risco;
- sem alteração fora do escopo;
- sem mudança de schema sem migração ou justificativa;
- sem quebra de import/export;
- sem warnings novos não explicados;
- diff revisável e pequeno.

## 13. Plano de SEO/AdSense/web público

Este plano não fixa políticas definitivas de AdSense. As regras devem ser validadas novamente em documentação oficial atualizada antes de qualquer integração.

Fontes oficiais a validar na fase de monetização:

- [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en);
- [Eligibility requirements for AdSense](https://support.google.com/adsense/answer/9724?hl=en);
- [Make sure your site's pages are ready for AdSense](https://support.google.com/adsense/answer/7299563?hl=en);
- [Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en);
- [How AdSense uses cookies](https://support.google.com/adsense/answer/7549925?hl=en);
- [How the Google Consent Management Platform works](https://support.google.com/adsense/answer/16918505?hl=en).

### Páginas públicas necessárias

MVP público:

- `/`: home pública clara;
- `/editor/:id`: editor;
- `/examples`: exemplos;
- `/templates`: templates;
- `/docs`: guia simples;
- `/privacy`: política de privacidade;
- `/terms`: termos de uso;
- `/contact` ou seção de contato.

Futuro:

- `/examples/[slug]`;
- `/templates/[slug]`;
- `/share/[id]`;
- `/blog` apenas se houver estratégia real de conteúdo útil.

### Estrutura sugerida de conteúdo

Home:

- o que é Fluxo;
- abrir editor;
- importar `.flow`;
- exemplos visuais reais;
- benefícios práticos;
- sem hero pesado que esconda a ferramenta.

Examples/templates:

- fluxos de processo;
- decisão;
- onboarding;
- atendimento;
- arquitetura simples;
- automação;
- planejamento.

Docs:

- como criar um fluxo;
- como importar/exportar;
- como usar `.flow.json`;
- atalhos;
- privacidade de dados locais;
- limitações conhecidas.

### Onde anúncios poderiam aparecer

Somente após validação oficial e experiência pública estável:

- páginas públicas de conteúdo;
- listagens de templates;
- páginas de exemplo;
- áreas laterais fora do editor;
- rodapé público;
- tela de biblioteca, se não atrapalhar ações principais.

### Onde anúncios não devem aparecer

- sobre o canvas;
- dentro do fluxo;
- em cima de modais;
- no menu contextual de edição;
- em áreas de drag/drop;
- em ações críticas como exportar/importar;
- em telas pequenas onde reduzam a usabilidade;
- enquanto o usuário está editando ativamente.

### Requisitos de experiência

- páginas navegáveis e úteis;
- conteúdo próprio e relevante;
- performance aceitável;
- sem popups intrusivos;
- sem bloqueio do editor por anúncio;
- layout estável, evitando shifts;
- consentimento e privacidade conforme jurisdição;
- opção de usar editor livre sem confusão.

### Privacidade, termos e analytics

Antes de anúncios:

- declarar como fluxos são armazenados localmente;
- declarar se há analytics;
- declarar cookies e tecnologias de terceiros;
- explicar import/export;
- explicar que arquivos do usuário não são enviados ao servidor no MVP local;
- definir termos de uso para conteúdo gerado pelo usuário no futuro;
- validar necessidade de CMP/consentimento conforme público e regiões atendidas.

### Riscos de monetização precoce

- prejudicar UX do editor;
- piorar performance;
- aumentar risco legal sem política e consentimento;
- reduzir confiança do usuário;
- atrapalhar aprovação se o site não tiver conteúdo público suficiente;
- transformar o produto em landing vazia antes da utilidade real.

Recomendação: lançar primeiro com utilidade real, exemplos e templates. Só depois testar monetização leve em páginas públicas, nunca dentro da área ativa do editor.

## 14. Ordem de execução recomendada

### 1. Commitar plano e auditoria

- Branch sugerida: `docs/web-app-planning-baseline`
- Objetivo: preservar auditoria, backup patch e plano web app como baseline de decisão.
- Arquivos prováveis: `docs/audits/REPO_STATE_AUDIT.md`, `docs/audits/git-state-backup-20260618-2125.patch`, `docs/planning/WEB_APP_IMPROVEMENT_PLAN.md`.
- Risco: baixo.
- Critério de aceitação: commit contém somente documentação e backup; nenhuma lógica do app alterada.
- Testes manuais: `git status --short`, revisão do diff e abertura do Markdown.

### 2. Criar blocos no centro da viewport atual

- Branch sugerida: `fix/create-node-at-viewport-center`
- Objetivo: criar bloco no centro visível quando acionado por toolbar/atalho.
- Arquivos prováveis: `src/components/flow/FlowEditor.tsx`.
- Risco: baixo.
- Critério de aceitação: bloco nasce no centro visível em qualquer pan/zoom; criação por clique preservada.
- Testes manuais: zoom, pan, toolbar lateral, toolbar flutuante, atalho `B`, clique no canvas.

### 3. Refatorar renderização visual de formas com ShapeRenderer/SVG

- Branch sugerida: `feat/shape-renderer-svg`
- Objetivo: criar camada dedicada para desenhar formas com SVG, separando fill, stroke, seleção e conteúdo textual.
- Arquivos prováveis: `src/components/flow/ShapeRenderer.tsx`, `src/components/flow/FluxoNode.tsx`, `src/lib/flow/shapeGeometry.ts`.
- Risco: médio/alto.
- Critério de aceitação: retângulo, arredondado, círculo, losango, hexágono e cilindro renderizam com fill/stroke consistentes e seleção coerente.
- Testes manuais: criar cada shape, selecionar, trocar cores, redimensionar, alternar modo compacto e exportar PNG.

### 4. Corrigir losango proporcional e bordas de hexágono

- Branch sugerida: `fix/shape-visual-integrity`
- Objetivo: garantir losango equilibrado e hexágono com borda completa, sem depender de `border` CSS em `clip-path`.
- Arquivos prováveis: `src/components/flow/ShapeRenderer.tsx`, `src/lib/flow/shapeGeometry.ts`, `src/components/flow/FluxoNode.tsx`.
- Risco: médio.
- Critério de aceitação: hexágono tem borda completa; losango não parece deformado; círculo não vira elipse sem decisão explícita.
- Testes manuais: shapes em tamanhos pequeno/médio/grande, resize manual, seleção, PNG.

### 5. Implementar pontos de conexão baseados na geometria real da forma

- Branch sugerida: `feat/geometric-connection-points`
- Objetivo: calcular handles na borda real da forma, não no bounding box retangular.
- Arquivos prováveis: `src/lib/flow/shapeGeometry.ts`, `src/lib/flow/edgeRouting.ts`, `src/components/flow/FluxoNode.tsx`, `src/components/flow/FluxoEdge.tsx`.
- Risco: alto.
- Critério de aceitação: setas tocam a borda visível em retângulo, arredondado, círculo, losango, hexágono e cilindro.
- Testes manuais: conectar cada shape em todos os lados, mover, redimensionar, trocar shape com conexões existentes.

### 6. Diferenciar handles manuais e automáticos

- Branch sugerida: `feat/manual-auto-handle-contract`
- Objetivo: formalizar intenção manual, auto, migrada e resolvida sem sobrescrever escolha explícita do usuário.
- Arquivos prováveis: `src/lib/flow/types.ts`, `src/lib/flow/normalization.ts`, `src/lib/flow/adapters.ts`, `src/lib/flow/edgeRouting.ts`, `docs/SCHEMA_FLOW_JSON.md`.
- Risco: alto.
- Critério de aceitação: handle manual permanece estável; handle automático recalcula; handles antigos continuam abrindo.
- Testes manuais: edge manual, edge auto, import/export, mover node, redimensionar node, trocar shape.

### 7. Distribuir setas duplicadas por slots reais da forma

- Branch sugerida: `feat/geometric-connection-slots`
- Objetivo: distribuir setas duplicadas e múltiplas entradas/saídas usando capacidade real da forma.
- Arquivos prováveis: `src/lib/flow/shapeGeometry.ts`, `src/lib/flow/edgeRouting.ts`, `src/components/flow/FluxoNode.tsx`.
- Risco: alto.
- Critério de aceitação: 8 ou mais setas entre dois blocos não ocupam o mesmo ponto e continuam tocando a borda correta.
- Testes manuais: duplicatas A -> B, bidirecional A <-> B, bloco central com muitas entradas/saídas, export/import.

### 8. Autoexpandir blocos quando conexões excederem capacidade visual

- Branch sugerida: `feat/auto-expand-node-for-connections`
- Objetivo: expandir bloco quando o tamanho atual não comporta conexões legíveis.
- Arquivos prováveis: `src/lib/flow/shapeGeometry.ts`, `src/lib/flow/edgeRouting.ts`, `src/components/flow/FlowEditor.tsx`, `src/components/flow/FluxoNode.tsx`.
- Risco: médio/alto.
- Critério de aceitação: expansão preserva título, resumo, hiddenInfo, estilo, cor, shape e proporção quando necessário.
- Testes manuais: 8 entradas, 8 saídas, losango proporcional, círculo preservado, hexágono recalculado, undo/redo e PNG.

### 9. Melhorar roteamento anti-cruzamento

- Branch sugerida: `feat/edge-crossing-avoidance`
- Objetivo: melhorar score global de rotas depois que pontos geométricos e slots reais estiverem estáveis.
- Arquivos prováveis: `src/lib/flow/edgeRouting.ts`, `src/components/flow/FluxoEdge.tsx`, `src/components/flow/FlowEditor.tsx`.
- Risco: alto.
- Critério de aceitação: fluxos com retornos, ramificações e duplicatas reduzem cruzamentos sem instabilidade visual.
- Testes manuais: árvore, loop, retorno, blocos próximos, muitas conexões, rotas manuais e automáticas.

### 10. Preparar estrutura de web app público

- Branch sugerida: `feat/public-web-app-structure`
- Objetivo: separar páginas públicas do editor e preparar SEO/legal sem acoplar marketing ao canvas.
- Arquivos prováveis: `src/routes/__root.tsx`, `src/routes/index.tsx`, novas rotas públicas, `src/components/public/*`.
- Risco: médio.
- Critério de aceitação: home pública clara; editor continua funcional; metadados não são genéricos de Lovable; páginas legais planejadas.
- Testes manuais: abrir home, criar fluxo, abrir editor, importar/exportar, navegar páginas públicas, build.

## 15. O que não fazer agora

- não implementar Electron;
- não implementar Tauri;
- não criar instalador desktop;
- não adicionar IA interna no MVP;
- não integrar AdSense antes de páginas públicas, termos e privacidade;
- não adicionar backend antes de validar o editor público;
- não adicionar autenticação antes de haver necessidade real;
- não refatorar o app inteiro de uma vez;
- não trocar React Flow sem evidência forte;
- não alterar schema sem migração;
- não corrigir losango/hexágono com remendos visuais frágeis que mantenham handles no bounding box;
- não avançar para anti-cruzamento complexo antes de estabilizar geometria, bordas e pontos de conexão;
- não mexer no roteamento complexo sem testes visuais;
- não colocar anúncios dentro do canvas;
- não transformar a home em landing genérica sem acesso direto ao editor;
- não apagar o backup patch da auditoria.

## 16. Resumo executivo final

Diagnóstico: o Fluxo já tem uma base de editor web real, com domínio de fluxo razoavelmente separado e funcionalidades suficientes para evoluir para web app público. A maior parte do valor já está no navegador; insistir em desktop agora aumentaria escopo sem resolver os problemas centrais de produto.

Maior risco técnico: geometria visual de formas e conexões. O código já tem heurística avançada para handles, mas as formas ainda precisam de renderização própria, bordas reais, seleção coerente e pontos de conexão calculados na silhueta. Sem essa base, qualquer roteamento anti-cruzamento continuará ancorado em pontos visualmente errados.

Maior oportunidade de produto: transformar o editor em uma ferramenta pública simples, com exemplos e templates úteis, mantendo import/export `.flow.json` como diferencial de portabilidade e compatibilidade com IA externa.

Próxima missão recomendada: primeiro commitar este plano e a auditoria; em seguida, criar blocos no centro da viewport atual. Depois disso, a prioridade técnica deve ser renderização SVG/ShapeRenderer antes de roteamento complexo.

O projeto ainda não está pronto para virar web app público completo. Antes disso faltam: melhorar UX essencial do editor, estabilizar formas/bordas/handles geométricos, separar páginas públicas do app, revisar SEO/metadados/textos legais, validar export PNG e criar checklist de regressão. A direção está correta, mas a base pública precisa ser construída com fases pequenas.
