# STATUS_DESENVOLVIMENTO.md

# Status de Desenvolvimento — Fluxo

## Branch de trabalho

```txt
dev/estrutura-base-fluxo
```

Esta branch foi criada a partir da `main` para manter o desenvolvimento seguro e separado.

A `main` não deve ser alterada até que esta branch seja validada localmente.

---

## Objetivo da rodada

Organizar a base técnica do app **Fluxo** sem destruir o front-end criado no Lovable.

Prioridades desta rodada:

```txt
schema .flow.json
validação
normalização
serialização
compatibilidade com formato antigo
adapters React Flow ↔ schema Fluxo
refatoração inicial do editor
atalhos essenciais
resize visual
exportação PNG real inicial
paleta flutuante arrastável
```

---

## Arquivos adicionados

```txt
docs/ANALISE_ESTADO_ATUAL.md
src/lib/flow/schema.ts
src/lib/flow/defaults.ts
src/lib/flow/normalization.ts
src/lib/flow/validation.ts
src/lib/flow/serialization.ts
src/lib/flow/adapters.ts
src/lib/export/exportPng.ts
```

---

## Arquivos alterados

```txt
package.json
src/lib/flow/types.ts
src/lib/flow/example.ts
src/lib/flow/store.ts
src/components/flow/FlowEditor.tsx
src/components/flow/FluxoNode.tsx
src/components/flow/Toolbar.tsx
src/components/flow/NodePropertiesModal.tsx
```

---

## O que foi implementado

## 1. Auditoria documentada

Criado:

```txt
docs/ANALISE_ESTADO_ATUAL.md
```

Esse arquivo registra:

- stack identificada;
- rotas principais;
- componentes principais;
- camada de domínio atual;
- funcionalidades já existentes;
- partes simuladas/incompletas;
- riscos;
- ordem segura de implementação.

---

## 2. Tipos ampliados

`src/lib/flow/types.ts` foi expandido para suportar o schema oficial definido em:

```txt
docs/SCHEMA_FLOW_JSON.md
```

Foram adicionados/preparados:

- `schemaVersion`;
- `FlowViewport`;
- `FlowProjectSettings`;
- `FlowMetadata`;
- `FlowCustomField`;
- `FlowEdgeStyle`;
- `FlowEdgeRouting`;
- handles de conexão;
- campos opcionais de projeto;
- compatibilidade com `version` antigo;
- prioridades de edge incluindo `critical`;
- tipos futuros de edge.

---

## 3. Defaults oficiais

Criado:

```txt
src/lib/flow/defaults.ts
```

Inclui:

- background padrão;
- viewport padrão;
- settings padrão;
- tamanho padrão de node;
- tamanho mínimo de node;
- ícone padrão;
- estilo padrão de edge;
- roteamento padrão;
- criação de ids;
- criação de projeto vazio;
- criação de arquivo vazio;
- lista oficial de shapes.

---

## 4. Normalização robusta

Criado:

```txt
src/lib/flow/normalization.ts
```

A normalização agora:

- aceita arquivos antigos e novos;
- aplica `schemaVersion: 0.1.0`;
- valida `app: Fluxo`;
- normaliza projeto;
- normaliza viewport;
- normaliza settings;
- normaliza nodes;
- normaliza edges;
- aplica defaults;
- remove edges inválidas;
- deduplica nodes;
- gera warnings;
- preserva informações ocultas e semânticas.

---

## 5. Validação centralizada

Criado:

```txt
src/lib/flow/validation.ts
```

Funções disponíveis:

```ts
validateFlowFile(input);
assertValidFlowFile(input);
isFlowFile(input);
```

---

## 6. Serialização oficial

Criado:

```txt
src/lib/flow/serialization.ts
```

Funções disponíveis:

```ts
projectToFlowFile(project);
flowFileToProject(file);
parseFlowFileJson(jsonText);
stringifyFlowFile(file);
slugifyFlowName(name);
getFlowFileName(name);
```

---

## 7. Ponto central do schema

Criado:

```txt
src/lib/flow/schema.ts
```

Objetivo: reexportar tipos, defaults, validação, normalização e serialização para facilitar imports futuros.

---

## 8. Adapters React Flow ↔ Fluxo

Criado:

```txt
src/lib/flow/adapters.ts
```

Funções disponíveis:

```ts
fluxoNodeToReactFlowNode(node);
fluxoEdgeToReactFlowEdge(edge);
flowProjectToReactFlow(project);
reactFlowNodeToFluxoNode(node);
reactFlowEdgeToFluxoEdge(edge);
reactFlowToFlowProject(base, nodes, edges);
```

Esses adapters começaram a ser usados diretamente no editor.

---

## 9. Exemplo atualizado

`src/lib/flow/example.ts` foi atualizado para usar o schema oficial com:

```txt
schemaVersion: 0.1.0
createdAt
updatedAt
settings
metadata
style
routing
customFields
```

Também passou a reexportar funções oficiais de validação e serialização.

---

## 10. Store local alinhado aos defaults

`src/lib/flow/store.ts` agora usa:

```txt
createEmptyFlowProject
createFlowId
nowIso
```

A duplicação de projeto também marca:

```txt
metadata.source = duplicated
```

---

## 11. Ajuste de tipagem no modal de node

`NodePropertiesModal.tsx` foi ajustado para lidar melhor com o `NodeStyle` expandido, restringindo a edição direta de cores aos campos:

```txt
backgroundColor
borderColor
textColor
```

---

## 12. Refatoração inicial do FlowEditor

`src/components/flow/FlowEditor.tsx` foi refatorado para usar:

```txt
src/lib/flow/adapters.ts
src/lib/flow/serialization.ts
```

O editor deixou de concentrar toda a conversão React Flow ↔ projeto dentro do próprio componente.

Agora usa:

```ts
flowProjectToReactFlow(project);
reactFlowToFlowProject(base, nodes, edges);
projectToFlowFile(project);
parseFlowFileJson(jsonText);
flowFileToProject(file);
stringifyFlowFile(file);
getFlowFileName(name);
```

---

## 13. Atalhos essenciais implementados

Foram adicionados ou consolidados:

```txt
Delete / Backspace — excluir seleção
Ctrl+D — duplicar seleção
Ctrl+A — selecionar tudo
Esc — limpar seleção/fechar modais
Ctrl+S — exportar .flow.json
Ctrl+E — exportar .flow.json
Ctrl+O — importar .flow.json
Ctrl+P — exportar PNG
Ctrl+L — organizar fluxo
Ctrl+Z — desfazer
Ctrl+Y — refazer
F11 — modo apresentação
```

Observação: a validação final dos atalhos precisa ser feita localmente no navegador.

---

## 14. Resize visual dos blocos

`src/components/flow/FluxoNode.tsx` agora usa `NodeResizer` do React Flow.

O resize:

- aparece quando o node está selecionado;
- respeita tamanho mínimo;
- atualiza `data.width`;
- atualiza `data.height`;
- permite que o tamanho seja preservado no `.flow.json`.

Também foram ajustados os IDs dos handles para:

```txt
top
right
bottom
left
```

Isso alinha a conexão visual com o schema oficial.

---

## 15. Exportação PNG real inicial

Adicionado ao `package.json`:

```txt
html-to-image
```

Criado:

```txt
src/lib/export/exportPng.ts
```

O botão de PNG no editor agora chama uma função real de exportação baseada em `html-to-image`.

Limitação atual:

- a exportação inicial captura o canvas React Flow visível;
- ainda não garante exportação perfeita do fluxo inteiro com bounding box/margem;
- esse refinamento deve ser feito em rodada futura ou validado localmente.

---

## 16. Toolbar flutuante arrastável

`src/components/flow/Toolbar.tsx` agora permite mover a paleta quando estiver em modo flutuante.

Comportamento:

- modo lateral continua igual;
- modo flutuante pode ser arrastado pelo cabeçalho;
- posição é mantida em estado local enquanto a tela está aberta.

Futuro:

- persistir posição da paleta;
- transformar em janela separada no Electron.

---

## Pontos que ainda precisam validação local

Como esta rodada foi feita via edição remota, ainda falta rodar localmente:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Validar manualmente:

- app abre;
- tela inicial abre;
- editor abre;
- criação de blocos funciona;
- conexão funciona;
- importação `.flow.json` funciona;
- exportação `.flow.json` funciona;
- exportação PNG funciona;
- resize aparece ao selecionar bloco;
- Ctrl+D duplica;
- Ctrl+A seleciona;
- Delete remove;
- toolbar flutuante arrasta;
- modo apresentação continua funcionando.

---

## Riscos técnicos atuais

Possíveis pontos para corrigir localmente caso apareçam erros:

- compatibilidade exata do `NodeResizer` com a versão instalada de `@xyflow/react`;
- tipos do callback `onSelectionChange`;
- comportamento do `html-to-image` com React Flow;
- necessidade de atualizar lockfile após adicionar `html-to-image`;
- performance do autosave em `localStorage`;
- resize ainda pode não registrar histórico de undo/redo de forma perfeita;
- exportação PNG ainda pode capturar controles/viewport de forma diferente dependendo do DOM renderizado.

---

## Próxima etapa recomendada

Depois da validação local básica, seguir para:

```txt
1. Corrigir eventuais erros TypeScript/build.
2. Extrair auto-layout para src/lib/flow/layout.ts.
3. Melhorar organização vertical/horizontal.
4. Preparar integração futura com ELK.js.
5. Melhorar exportação PNG para fluxo completo com bounding box.
6. Criar desktopBridge com fallbacks web.
7. Só depois iniciar Electron.
```

---

## Observação importante

A `main` não foi alterada.

As alterações estão na branch:

```txt
dev/estrutura-base-fluxo
```
