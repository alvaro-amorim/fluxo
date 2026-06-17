# Integração pendente no editor

## Contexto

Durante a rodada de melhorias de setas e seleção, foram criados arquivos auxiliares para evoluir o editor sem desmontar a base atual.

Arquivos já existentes na branch:

```txt
src/components/flow/FluxoEdge.tsx
src/components/flow/SelectionToolbar.tsx
src/lib/flow/edgeRouting.ts
```

## O que já está preparado

### FluxoEdge

Componente preparado para substituir o renderer padrão das setas do React Flow.

Objetivos:

- melhorar seleção visual da seta;
- melhorar área de clique;
- exibir label com mais controle;
- exibir tooltip por hover;
- desenhar pontos manuais de rota;
- suportar polyline quando `routing.mode = manual`.

### SelectionToolbar

Componente preparado para aparecer quando um bloco ou seta estiver selecionado.

Ações previstas:

- editar;
- duplicar bloco;
- remover seleção;
- colocar seta em modo automático;
- aplicar desvio horizontal;
- aplicar desvio vertical.

### edgeRouting

Camada de roteamento com:

- cálculo de melhor handle de saída/entrada;
- pontuação de pares de handles;
- preservação de modo manual;
- suporte inicial a pontos intermediários de rota;
- função para gerar desvio horizontal/vertical.

## Integração ainda pendente

A integração no `FlowEditor.tsx` deve ser feita localmente ou em uma rodada menor porque o arquivo é grande e central.

Itens pendentes:

```txt
1. Importar FluxoEdge no FlowEditor.
2. Registrar edgeTypes = { fluxoEdge: FluxoEdge }.
3. Passar edgeTypes para <ReactFlow />.
4. Importar SelectionToolbar.
5. Renderizar SelectionToolbar acima do canvas.
6. Criar função setSelectedEdgeRoute("auto" | "horizontal" | "vertical").
7. Usar buildManualRoutePoints() para gerar pontos de desvio manual.
8. Usar resolveReactFlowEdgeHandles() ao voltar para modo automático.
9. Atualizar selectedEdge após alteração.
10. Manter deleteSelection como ação da toolbar.
```

## Ordem segura para implementar

### Etapa 1 — Edge customizada

- Importar `FluxoEdge`.
- Criar `const edgeTypes = { fluxoEdge: FluxoEdge }`.
- Passar `edgeTypes={edgeTypes}` ao `ReactFlow`.
- Garantir que `fluxoEdgeToReactFlowEdge()` use `type: "fluxoEdge"`.

### Etapa 2 — Toolbar contextual

- Importar `SelectionToolbar`.
- Renderizar quando houver `selectedNode` ou `selectedEdge`.
- Conectar `Editar`, `Duplicar` e `Remover`.

### Etapa 3 — Rota rápida de setas

- Criar handler `setSelectedEdgeRoute`.
- Para `auto`, limpar `routing.points` e usar `routing.mode = "auto"`.
- Para `horizontal`, gerar pontos com `buildManualRoutePoints(edge, nodes, "horizontal")`.
- Para `vertical`, gerar pontos com `buildManualRoutePoints(edge, nodes, "vertical")`.

### Etapa 4 — Histórico

- Chamar `snapshot()` antes das alterações da rota.
- Garantir undo/redo de Auto, Desvio X e Desvio Y.

## Observação

O app continua funcional com o renderer padrão de setas. Esta documentação existe para registrar claramente o que já foi preparado e o que falta conectar.
