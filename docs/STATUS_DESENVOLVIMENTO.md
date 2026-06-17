# STATUS_DESENVOLVIMENTO.md

# Status de Desenvolvimento — Fluxo

## Branch de trabalho

```txt
dev/estrutura-base-fluxo
```

Esta branch foi criada a partir da `main` para manter o desenvolvimento seguro e separado.

A `main` não deve ser alterada até que esta branch seja validada localmente.

---

## Validação local mais recente

Validação feita no Windows, na pasta local `fluxo`, após formatação com Prettier e normalização de line endings.

Resultado informado:

```txt
npm run dev    ✅ aplicação rodou em localhost
npm run build  ✅ build concluído com sucesso
npm run lint   ✅ 0 errors, 6 warnings
```

Observação: os 6 warnings restantes são de `react-refresh/only-export-components` em componentes UI reaproveitados. Eles não bloqueiam o build nem o funcionamento atual.

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
layout reutilizável
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
src/lib/flow/layout.ts
src/lib/export/exportPng.ts
```

---

## Arquivos alterados

```txt
.gitattributes
package.json
package-lock.json
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

Objetivo: reexportar tipos, defaults, validação, normalização, serialização e layout para facilitar imports futuros.

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

## 9. Refatoração inicial do editor

`src/components/flow/FlowEditor.tsx` foi refatorado para usar:

```ts
flowProjectToReactFlow();
reactFlowToFlowProject();
projectToFlowFile();
flowFileToProject();
parseFlowFileJson();
stringifyFlowFile();
getFlowFileName();
```

Objetivo: reduzir duplicação de lógica de schema/import/export dentro do componente.

---

## 10. Atalhos essenciais

Foram adicionados/reforçados:

```txt
Delete / Backspace  excluir seleção
Ctrl+D              duplicar seleção
Ctrl+A              selecionar tudo
Esc                 limpar seleção / fechar modais
Ctrl+P              exportar PNG
```

---

## 11. Resize visual

`FluxoNode` passou a usar `NodeResizer` do React Flow.

Objetivo:

- permitir redimensionamento visual no canvas;
- respeitar tamanho mínimo;
- atualizar `width` e `height` do node;
- preservar dimensões no `.flow.json`.

---

## 12. Exportação PNG real inicial

Criado:

```txt
src/lib/export/exportPng.ts
```

A exportação usa `html-to-image`.

Evolução feita nesta etapa:

- tenta capturar o fluxo completo com base nos nodes presentes no DOM;
- aplica margem;
- ignora minimap e controles;
- usa fallback para exportar a viewport visível se a captura completa falhar.

Ainda precisa validação visual local em fluxos grandes.

---

## 13. Paleta flutuante arrastável

`Toolbar` foi ajustada para permitir movimentação quando estiver no modo flutuante.

Objetivo: aproximar a experiência futura de janela/paleta separada.

---

## 14. Layout reutilizável

Criado:

```txt
src/lib/flow/layout.ts
```

Objetivo:

- preparar o botão “Organizar fluxo” para usar lógica fora do `FlowEditor`;
- permitir layout vertical/horizontal em função pura;
- facilitar futura troca por ELK.js sem reescrever a UI.

Ainda precisa ser integrado ao botão do editor.

---

## Próxima etapa recomendada

```txt
1. Integrar calculateAutoLayout ao botão Organizar fluxo
2. Melhorar histórico para registrar resize/move no momento correto
3. Testar exportação PNG em fluxo grande
4. Avaliar bugs visuais do NodeResizer
5. Preparar desktopBridge antes de Electron
```

---

## Comandos de validação local

Após puxar alterações da branch, rodar:

```powershell
git pull
npm install
npm run format
npm run lint
npm run build
npm run dev
```

Resultado esperado:

```txt
lint: 0 errors, warnings aceitáveis
build: sucesso
app: abre em localhost
```
