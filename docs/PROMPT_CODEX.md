# PROMPT_CODEX.md

# Prompt para Codex — Projeto Local `fluxo`

## 1. Como usar este arquivo

Este arquivo contém o prompt principal para iniciar o trabalho no Codex.

Use este documento quando o projeto já estiver baixado localmente no seu computador, dentro de uma pasta chamada:

```txt
fluxo/
```

Antes de executar o Codex, garanta que estes arquivos existam:

```txt
fluxo/docs/CONSTITUICAO_DO_APP.md
fluxo/docs/SCHEMA_FLOW_JSON.md
fluxo/docs/PROMPT_CODEX.md
```

O Codex deve ler a documentação local antes de modificar o projeto.

Não dependa de repositório remoto.

Não assuma que o projeto está conectado a GitHub.

O projeto deve ser tratado como uma pasta local.

---

# PROMPT PRINCIPAL PARA COLAR NO CODEX

Você é um engenheiro de software sênior especializado em:

- React;
- TypeScript;
- Vite;
- TanStack Router/Start, se estiver presente no projeto;
- React Flow / `@xyflow/react`;
- aplicações desktop locais;
- Electron;
- arquitetura local-first;
- importação/exportação de JSON;
- ferramentas visuais de fluxograma;
- UX minimalista;
- refatoração incremental segura.

Você está trabalhando no projeto local chamado:

```txt
fluxo/
```

Este projeto começou como um front-end criado no Lovable.

O Lovable foi usado para gerar uma primeira versão visual do app **Fluxo**, com tela inicial, biblioteca de fluxos, editor de fluxograma, canvas, toolbar, blocos, setas, modais, modo apresentação e importação/exportação visual de `.flow.json`.

Agora sua tarefa é analisar o projeto local e evoluí-lo para um app funcional, preservando o que já foi criado.

## Regra principal

**Não recomece o projeto do zero.**

Você deve analisar o código existente e evoluir a base atual.

Refatorar é permitido.

Apagar e recriar tudo só é permitido se houver uma justificativa técnica muito forte e documentada antes.

---

## 2. Documentos obrigatórios para leitura

Antes de qualquer alteração, leia:

```txt
docs/CONSTITUICAO_DO_APP.md
docs/SCHEMA_FLOW_JSON.md
```

Depois leia este arquivo:

```txt
docs/PROMPT_CODEX.md
```

Esses documentos definem:

- visão do produto;
- escopo;
- regras funcionais;
- decisões já tomadas;
- formato `.flow.json`;
- comportamento esperado do app;
- limites do MVP;
- o que não deve ser implementado agora.

---

## 3. Contexto do produto

O app se chama:

```txt
Fluxo
```

Ele é um aplicativo pessoal, local e minimalista para desenhar fluxogramas manualmente.

Ele deve permitir ao usuário criar fluxos visuais com:

- blocos;
- formas;
- linhas;
- setas;
- informações ocultas;
- campos semânticos;
- rótulos;
- cores;
- ícones;
- posições livres;
- tamanho livre;
- canvas infinito;
- importação/exportação `.flow.json`;
- exportação PNG;
- modo apresentação editável.

O app não tem IA interna.

O app não deve depender de internet.

O app não deve ter login.

O app não deve ter backend remoto.

O app deve ser local-first.

---

## 4. O que já existe no projeto

O projeto atual foi gerado visualmente pelo Lovable.

Você deve verificar os arquivos reais, mas espere encontrar algo próximo de:

- `package.json`;
- app React/TypeScript;
- rotas;
- tela inicial;
- editor;
- componentes de canvas;
- componentes de toolbar;
- modais;
- uso de `@xyflow/react`;
- tipos iniciais de fluxo;
- importação/exportação simulada ou parcial;
- estado em `localStorage`;
- modo apresentação;
- botões de atalhos;
- modal de criação com IA externa.

Você deve preservar o máximo possível da experiência visual criada.

---

## 5. Objetivo da primeira rodada de desenvolvimento

Sua primeira rodada deve focar em tornar o front atual mais sólido e funcional, sem tentar implementar tudo de uma vez.

Prioridade máxima:

1. rodar o projeto;
2. corrigir erros de build, lint ou TypeScript;
3. entender a estrutura real;
4. estabilizar tipos;
5. consolidar o schema `.flow.json`;
6. implementar ou melhorar importação/exportação `.flow.json`;
7. implementar validação e normalização do JSON;
8. melhorar ações básicas do editor;
9. implementar undo/redo real ou melhorar o existente;
10. implementar exportação PNG real se viável;
11. melhorar redimensionamento visual dos blocos se viável;
12. preparar arquitetura para Electron, mas sem quebrar o app web atual.

Não tente implementar todas as features desktop avançadas na primeira rodada se isso comprometer a estabilidade.

---

## 6. Processo obrigatório antes de codar

Antes de escrever ou alterar código, faça uma auditoria curta do projeto.

Responda internamente ou em um arquivo de notas se necessário:

1. Qual stack real está no `package.json`?
2. Como o app inicia?
3. Quais scripts existem?
4. Qual roteador está sendo usado?
5. Onde está a tela inicial?
6. Onde está o editor?
7. Onde estão os tipos de fluxo?
8. Onde está a lógica de import/export?
9. Onde está o estado principal?
10. Quais funções estão simuladas?
11. Quais componentes devem ser preservados?
12. Quais partes precisam de refatoração?

Depois disso, implemente de forma incremental.

---

## 7. Regras de implementação

### 7.1 Não destruir o front existente

Preserve:

- layout geral;
- tela inicial;
- editor visual;
- toolbar;
- modais;
- fluxo de navegação;
- estilos minimalistas;
- uso de React Flow;
- conceito de `.flow.json`;
- modal de IA externa na tela inicial;
- modo apresentação;
- informações ocultas em blocos e setas.

### 7.2 Não implementar funcionalidades fora do escopo

Não implemente agora:

- login;
- autenticação;
- usuários;
- nuvem;
- banco remoto;
- colaboração;
- chat com IA;
- pagamentos;
- landing page;
- analytics;
- tracking;
- marketplace;
- backend remoto;
- sincronização online.

### 7.3 Manter local-first

Tudo deve funcionar localmente.

Na versão atual, o projeto pode continuar rodando como web app local.

Depois ele será transformado em app desktop com Electron ou Tauri.

Prepare a arquitetura para isso, mas não quebre o modo web/local.

### 7.4 Preferir TypeScript forte

Evite `any` desnecessário.

Crie tipos centrais para:

- projeto;
- node;
- edge;
- viewport;
- settings;
- style;
- semantic;
- customFields;
- validação;
- import/export.

### 7.5 Criar funções puras para lógica importante

Crie funções testáveis e independentes para:

- criar projeto vazio;
- normalizar projeto;
- validar projeto;
- serializar projeto;
- desserializar projeto;
- converter para React Flow;
- converter de React Flow;
- exportar `.flow.json`;
- importar `.flow.json`;
- gerar exemplo `.flow.json`.

---

## 8. Arquivos recomendados para criar ou consolidar

Adapte à estrutura real do projeto.

Sugestão:

```txt
src/features/flow/flowTypes.ts
src/features/flow/flowDefaults.ts
src/features/flow/flowValidation.ts
src/features/flow/flowNormalization.ts
src/features/flow/flowSerialization.ts
src/features/flow/flowAdapters.ts
src/features/flow/flowExamples.ts
src/features/flow/flowStore.ts
src/features/flow/flowHistory.ts

src/features/export/exportPng.ts

src/features/layout/autoLayout.ts
src/features/layout/elkLayout.ts
src/features/layout/edgeRouting.ts

src/features/desktop/desktopBridge.ts
```

Não crie estrutura duplicada se o projeto já tiver arquivos equivalentes.

Se existirem nomes diferentes, adapte e documente.

---

## 9. Schema `.flow.json`

O schema oficial está em:

```txt
docs/SCHEMA_FLOW_JSON.md
```

Implemente o app para exportar e importar `.flow.json` de acordo com esse documento.

A raiz deve seguir este formato:

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {},
  "nodes": [],
  "edges": []
}
```

Cada node deve preservar:

- id;
- tipo;
- shape;
- título;
- resumo;
- informação oculta;
- posição;
- tamanho;
- estilo;
- ícone;
- semântica;
- campos customizados.

Cada edge deve preservar:

- id;
- origem;
- destino;
- handles;
- label;
- informação oculta;
- tipo;
- estilo;
- roteamento;
- semântica;
- campos customizados.

O `.flow.json` deve servir tanto para reabrir o desenho quanto para uma IA externa entender o fluxo.

---

## 10. Importação `.flow.json`

Implemente ou melhore a importação com:

- seleção de arquivo;
- leitura de texto;
- `JSON.parse`;
- validação;
- normalização;
- mensagens de erro amigáveis;
- abertura no editor;
- preservação de informações ocultas;
- preservação visual.

Se o arquivo tiver campos ausentes, aplique defaults seguros.

Se a edge apontar para node inexistente, trate o erro.

Se o JSON estiver inválido, não quebre o app.

---

## 11. Exportação `.flow.json`

Implemente ou melhore a exportação com:

- conversão do estado atual para schema oficial;
- atualização de `updatedAt`;
- `JSON.stringify(project, null, 2)`;
- download com extensão `.flow.json`;
- nome de arquivo baseado no nome do projeto;
- preservação completa de dados visuais e semânticos.

Se o projeto estiver em futura versão desktop, salvar no arquivo atual quando possível.

---

## 12. Exportação PNG

Se viável nesta rodada, implemente exportação PNG real.

Requisitos:

- exportar fluxo completo, não apenas viewport visível;
- aplicar margem;
- respeitar background;
- incluir blocos;
- incluir setas;
- incluir labels;
- incluir ícones visíveis;
- sugerir nome baseado no projeto.

Pode usar abordagem client-side adequada para React Flow.

Se não for possível concluir PNG real nesta rodada, deixe a interface funcionando e marque claramente com `TODO`, mas priorize implementar se a base permitir.

---

## 13. Editor de fluxograma

O editor deve permitir:

- criar blocos;
- mover blocos;
- redimensionar blocos;
- editar blocos;
- conectar blocos;
- editar setas;
- excluir elementos;
- duplicar seleção;
- undo;
- redo;
- zoom;
- pan;
- grid;
- snap;
- importar;
- exportar;
- modo apresentação;
- organizar fluxo.

Se algo estiver só simulado, implemente pelo menos a lógica básica.

---

## 14. Blocos

Blocos devem ter formas neutras:

- retângulo;
- retângulo arredondado;
- círculo;
- losango;
- cilindro;
- hexágono.

Nenhuma forma tem significado fixo.

O usuário define o significado.

Blocos devem permitir:

- título visível;
- ícone opcional;
- informação oculta;
- resumo;
- objetivo;
- entradas;
- saídas;
- regras;
- observações;
- cor de fundo;
- cor da borda;
- cor do texto;
- largura;
- altura;
- posição.

Informações ocultas devem aparecer:

- no hover;
- ao selecionar;
- em modal de edição.

---

## 15. Redimensionamento visual

Se ainda não existir, implementar redimensionamento visual de blocos.

Requisitos:

- alças de resize;
- largura e altura independentes;
- tamanho mínimo;
- atualizar estado;
- preservar no `.flow.json`;
- registrar no undo/redo ao final da ação.

Se React Flow já oferecer suporte por `NodeResizer` ou equivalente, usar de forma integrada.

---

## 16. Setas e linhas

Setas devem ser preferencialmente:

```txt
ortogonais / angulares / estilo fluxograma profissional
```

Cada seta deve permitir:

- origem;
- destino;
- rótulo visível;
- informação oculta;
- condição;
- prioridade;
- regras;
- observações;
- tipo visual;
- estilo.

Ao mover um bloco, as setas ligadas devem acompanhar.

Se possível, recalcular melhor lado de entrada/saída.

Não mover blocos automaticamente ao arrastar um bloco.

Mover blocos automaticamente apenas quando o usuário clicar em:

```txt
Organizar fluxo
```

---

## 17. Auto-layout

Implementar botão:

```txt
Organizar fluxo
```

Opções:

- vertical;
- horizontal;
- radial;
- compacto.

MVP obrigatório:

- vertical;
- horizontal.

Se possível, usar ELK.js ou deixar preparado para ELK.js.

O auto-layout deve:

- evitar sobreposição;
- organizar por camadas;
- respeitar conexões;
- reduzir cruzamentos quando possível;
- manter espaçamento legível.

Não reorganizar automaticamente a cada movimento do usuário.

---

## 18. Toolbar

A toolbar deve continuar simples.

Ela não deve ter categorias semânticas como “IA”, “Banco” ou “API”.

Ela deve ter ferramentas neutras:

- selecionar;
- bloco;
- forma;
- linha;
- seta;
- conectar;
- texto;
- cor;
- ícone;
- organizar;
- importar;
- exportar;
- PNG;
- grid;
- snap;
- atalhos;
- modo apresentação.

A toolbar deve poder alternar entre:

- lateral fixa;
- flutuante.

Se possível, tornar a paleta flutuante arrastável.

No futuro desktop, ela poderá virar uma janela separada.

---

## 19. Modal “Criar fluxo com IA externa”

Este modal deve ficar apenas na tela inicial.

Não colocar na toolbar do editor.

Ele deve conter:

- prompt para copiar;
- botão copiar;
- botão baixar exemplo `.flow.json`;
- campo para colar JSON;
- validar JSON;
- importar e abrir fluxo;
- erro amigável.

O prompt interno deve instruir a IA externa a apenas confirmar entendimento e aguardar o próximo comando.

Não integrar IA interna.

Não fazer chamada para API de IA.

---

## 20. Tela inicial

A tela inicial deve conter:

- nome Fluxo;
- criar novo fluxo;
- importar fluxo;
- criar fluxo com IA externa;
- biblioteca de fluxos recentes;
- busca;
- cards;
- abrir;
- duplicar.

No MVP, a biblioteca pode usar armazenamento local.

Na versão desktop, deve evoluir para arquivos recentes ou pasta de biblioteca.

---

## 21. Modo apresentação editável

O modo apresentação deve:

- limpar a interface;
- dar foco ao canvas;
- esconder barras desnecessárias;
- manter edição ativa;
- permitir selecionar e mover blocos;
- permitir atalhos;
- manter paleta disponível como flutuante;
- abrir modais de forma que não cubram desnecessariamente o fluxo.

Futuramente, no desktop, o canvas ficará em uma janela/tela cheia e a paleta em outra janela.

---

## 22. Atalhos

Implementar ou consolidar estes atalhos:

```txt
V                selecionar / mover
B                criar bloco
F                criar forma
L                criar linha
A                criar seta
C                conectar
T                editar texto
I                trocar ícone
R                redimensionar
G                ligar/desligar grid
S                ligar/desligar snap, exceto Ctrl+S
Ctrl+S           salvar/exportar .flow.json
Ctrl+O           abrir/importar .flow.json
Ctrl+E           exportar
Ctrl+P           exportar PNG
Ctrl+L           organizar fluxo
Ctrl+Z           desfazer
Ctrl+Y           refazer
Ctrl+D           duplicar seleção
Ctrl+A           selecionar tudo
Delete           excluir seleção
Esc              cancelar ação ou fechar modal
Espaço+arrastar  mover canvas
+                zoom in
-                zoom out
Ctrl+0           ajustar fluxo à tela
F11              modo apresentação
Shift+arrastar   mover em linha reta
Alt+arrastar     duplicar bloco
```

Se algum atalho conflitar com o navegador, documente e prepare para desktop.

---

## 23. Undo/redo

Undo/redo deve cobrir:

- criar node;
- remover node;
- mover node;
- redimensionar node;
- editar node;
- criar edge;
- remover edge;
- editar edge;
- alterar cor;
- alterar shape;
- alterar ícone;
- organizar fluxo.

Evite registrar histórico a cada pixel de movimento.

Registre ao final do drag/resize.

---

## 24. Preparação para desktop

Depois que o front estiver estável, preparar para app desktop.

A opção recomendada é Electron.

Não implemente Electron se isso for quebrar a primeira rodada.

Mas prepare a arquitetura para:

- salvar arquivo local;
- abrir arquivo local;
- exportar PNG;
- listar monitores;
- tela cheia;
- janela de toolbar separada;
- recent files;
- app offline.

Crie abstrações como:

```ts
desktopBridge.saveFile();
desktopBridge.openFile();
desktopBridge.exportPng();
desktopBridge.getDisplays();
desktopBridge.setPresentationMode();
```

No web/local, essas funções podem usar fallbacks.

---

## 25. Critérios de aceite da primeira rodada

Ao final da primeira rodada, o projeto deve:

- instalar dependências;
- rodar sem erro;
- compilar;
- manter tela inicial;
- manter editor;
- criar fluxo;
- abrir editor;
- criar blocos;
- mover blocos;
- editar blocos;
- conectar blocos;
- editar setas;
- exportar `.flow.json`;
- importar `.flow.json`;
- validar JSON;
- preservar dados ocultos;
- preservar campos semânticos;
- não quebrar modo apresentação;
- ter código mais organizado;
- ter TODOs claros para o que ficar pendente.

Se PNG real, resize real ou auto-layout avançado forem implementados, melhor.

Se não forem implementados, deixe preparado e documente.

---

## 26. Ordem sugerida de execução

Siga esta ordem:

### Fase 1 — Auditoria

- rodar `npm install`;
- rodar `npm run dev`;
- rodar build/lint se houver;
- mapear arquivos;
- identificar problemas.

### Fase 2 — Tipos e schema

- criar/consolidar tipos;
- criar defaults;
- criar validação;
- criar normalização;
- criar exemplos.

### Fase 3 — Import/export

- exportar `.flow.json` oficial;
- importar `.flow.json`;
- validar e normalizar;
- preservar dados.

### Fase 4 — Editor

- melhorar criação;
- melhorar edição;
- melhorar setas;
- melhorar tooltips;
- melhorar seleção;
- implementar delete/duplicar se faltar.

### Fase 5 — Histórico

- undo/redo robusto.

### Fase 6 — Resize e PNG

- resize visual;
- exportação PNG real.

### Fase 7 — Layout

- melhorar organizar fluxo;
- preparar ELK.js.

### Fase 8 — Preparação desktop

- criar abstrações;
- documentar próxima etapa;
- não quebrar web/local.

---

## 27. Saída esperada do Codex

Ao finalizar, explique:

1. o que você encontrou no projeto;
2. quais arquivos foram alterados;
3. quais funcionalidades foram implementadas;
4. quais funções eram simuladas e viraram reais;
5. quais TODOs ficaram;
6. como rodar o projeto;
7. como testar import/export;
8. como testar o `.flow.json`;
9. quais próximos passos recomenda.

---

## 28. Importante

Não use este projeto como base para criar uma aplicação SaaS.

Não adicione autenticação.

Não adicione IA interna.

Não adicione servidor remoto.

Não remova a filosofia minimalista.

Não transforme blocos em categorias fixas.

Não assuma que formatos como losango, cilindro ou hexágono têm significado obrigatório.

O app deve continuar sendo uma ferramenta livre de construção visual.

A decisão mais importante é:

```txt
O usuário define o significado dos blocos e setas.
O app oferece apenas a ferramenta visual e a estrutura de dados.
```

---

# PROMPT CURTO ALTERNATIVO PARA CODEX

Use este se precisar de uma versão menor:

```txt
Leia primeiro docs/CONSTITUICAO_DO_APP.md e docs/SCHEMA_FLOW_JSON.md.

Você está no projeto local fluxo/, criado inicialmente no Lovable como front-end visual do app Fluxo.

Não recomece do zero. Analise a base atual, preserve a interface e evolua o app de forma incremental.

O objetivo é transformar o front atual em uma ferramenta local-first para criar fluxogramas manualmente, com blocos, formas, setas, informações ocultas, importação/exportação .flow.json, exportação PNG, undo/redo, resize visual, auto-layout por botão e preparação futura para Electron.

Não implemente login, IA interna, backend remoto, colaboração, cloud, pagamentos ou landing page.

Priorize:
1. corrigir erros e rodar o projeto;
2. consolidar tipos e schema .flow.json;
3. implementar validação/normalização;
4. melhorar import/export .flow.json;
5. preservar informações ocultas e semânticas;
6. melhorar editor de blocos/setas;
7. implementar undo/redo, delete e duplicar;
8. implementar resize visual e PNG real se possível;
9. preparar arquitetura para app desktop local.

No final, explique o que foi feito, arquivos alterados, como rodar e próximos passos.
```
