# EDGE_INTERACTION_STATUS.md

# Status — Interação e inteligência das setas

Este documento registra a etapa de melhoria das conexões do app **Fluxo** após a integração da edge customizada no `FlowEditor`.

---

## Estado confirmado

A branch de trabalho é:

```txt
dev/estrutura-base-fluxo
```

Após o rebase local feito no Windows, o commit do Codex foi enviado para o GitHub e validado localmente com:

```txt
npm run lint   ✅ 0 errors, 6 warnings conhecidos
npm run build  ✅ sucesso
```

Os warnings conhecidos continuam sendo de `react-refresh/only-export-components` em componentes de UI compartilhados.

---

## Integração já presente no editor

O editor já integra:

```txt
src/components/flow/FluxoEdge.tsx
src/components/flow/SelectionToolbar.tsx
src/lib/flow/layout.ts
src/lib/flow/edgeRouting.ts
```

Recursos já conectados:

- edge customizada `fluxo` registrada no React Flow;
- toolbar contextual para seleção;
- botão `Auto` para voltar a seta ao modo automático;
- botões `Desvio X` e `Desvio Y` para criar rota manual simples;
- botão `Remover` para excluir seleção;
- `calculateAutoLayout` integrado ao menu Organizar;
- recálculo de handles automáticos ao mover/redimensionar blocos.

---

## Melhorias adicionadas nesta etapa

### 1. Pontuação de handles inteligentes

Arquivo:

```txt
src/lib/flow/edgeRouting.ts
```

A escolha automática de saída/entrada da seta não depende mais apenas do eixo dominante entre os centros dos blocos.

Agora o algoritmo avalia todos os pares possíveis:

```txt
top -> top
top -> right
top -> bottom
top -> left
right -> top
right -> right
right -> bottom
right -> left
bottom -> top
bottom -> right
bottom -> bottom
bottom -> left
left -> top
left -> right
left -> bottom
left -> left
```

A pontuação considera:

- distância entre os pontos de conexão;
- alinhamento da saída em direção ao bloco de destino;
- alinhamento da entrada em direção ao bloco de origem;
- preferência por pares opostos naturais, como `right -> left` e `bottom -> top`;
- existência de corredor horizontal ou vertical entre os blocos;
- penalização para pares que tendem a gerar voltas confusas.

Resultado esperado:

```txt
As setas automáticas devem escolher lados mais naturais em fluxos com blocos deslocados, retornos e ramificações.
```

---

### 2. Helpers para controle manual de rota

Arquivo:

```txt
src/lib/flow/edgeRouting.ts
```

Funções disponíveis:

```ts
getManualRouteControlPoint(sourceNode, targetNode, axis, offset);
getManualRouteControlPoints(sourceNode, targetNode, options);
normalizeManualRoutePoints(points);
replaceManualRoutePoint(points, index, nextPoint);
insertManualRoutePoint(points, index, point);
removeManualRoutePoint(points, index);
nudgeManualRoutePoints(points, delta);
```

Objetivo:

- padronizar a criação de pontos de desvio manual;
- evitar cálculo duplicado dentro do `FlowEditor`;
- preparar rotas manuais com 1 ou 2 pontos;
- criar corredores laterais ou verticais mais previsíveis;
- permitir futuras operações de edição visual, como arrastar, inserir, remover e deslocar pontos;
- evitar que pontos inválidos quebrem o path SVG da seta.

A função `getManualRouteControlPoints` gera dois pontos quando necessário, formando um caminho mais ortogonal para `Desvio X` e `Desvio Y`.

As funções também foram reexportadas por:

```txt
src/lib/flow/schema.ts
```

---

### 3. Renderização manual mais preparada

Arquivo:

```txt
src/components/flow/FluxoEdge.tsx
```

A edge customizada passou a preparar melhor rotas manuais:

- suporte a `routing.points`;
- área clicável maior;
- destaque visual quando selecionada;
- pontos de controle visíveis quando a seta manual está selecionada;
- label posicionado no meio geométrico aproximado da rota;
- normalização compartilhada de pontos via `normalizeManualRoutePoints`;
- pontos manuais com `data-route-point-index`, cursor e metadados para futura edição visual.

---

## Refinamentos adicionados depois da integração do Codex

### 1. Robustez da `FluxoEdge`

Arquivo:

```txt
src/components/flow/FluxoEdge.tsx
```

A renderização da seta customizada foi refinada para:

- corrigir o cálculo do ponto central usado pelo label em caminhos simples;
- sanitizar `routing.points` antes de montar o path manual;
- evitar que pontos inválidos quebrem a renderização da seta;
- aumentar a área de interação da edge para facilitar clique;
- numerar visualmente os pontos manuais quando a seta está selecionada;
- preparar os pontos visuais para uma futura interação de arrastar.

### 2. Clareza e preparação da toolbar contextual

Arquivo:

```txt
src/components/flow/SelectionToolbar.tsx
```

A toolbar contextual recebeu textos de ajuda mais claros nos botões:

- `Auto`: recalcula saída/entrada da seta;
- `Desvio X`: cria desvio lateral manual;
- `Desvio Y`: cria desvio vertical manual;
- `Remover`: remove a seleção e informa o atalho `Delete`.

Ela também foi preparada para receber ações opcionais:

- `Editar`;
- `Duplicar`.

Esses botões só aparecem quando o `FlowEditor` passar os callbacks correspondentes, evitando quebrar a integração atual.

### 3. Correção de direção e inversão rápida

Arquivos:

```txt
src/components/flow/FluxoNode.tsx
src/components/flow/FluxoEdge.tsx
```

A etapa atual corrige dois pontos práticos percebidos no uso:

- reduziu a chance de iniciar uma conexão pelo handle invisível de entrada, que podia gerar seta invertida ao arrastar de A para B;
- adicionou um botão rápido `Inverter` diretamente na seta selecionada.

Com isso, ao selecionar uma seta, aparece uma ação rápida próxima ao caminho da conexão para trocar `source` e `target` sem abrir modal.

Ao inverter uma seta manual, os pontos de rota também são invertidos para preservar melhor o desenho visual do caminho.

---

## Limitações ainda existentes

Ainda falta evoluir:

```txt
1. conectar Editar e Duplicar no FlowEditor;
2. substituir o cálculo local de Desvio X/Y no FlowEditor por getManualRouteControlPoints;
3. arrastar pontos intermediários diretamente no canvas;
4. adicionar/remover múltiplos pontos de rota manual pela interface;
5. melhorar seleção visual em edges muito próximas;
6. melhorar undo/redo específico para mudanças rápidas de rota;
7. tratar cruzamentos entre várias setas com roteamento mais avançado;
8. validar visualmente exportação PNG após rotas manuais.
```

---

## Próximas etapas recomendadas

Ordem sugerida:

```txt
1. Integrar getManualRouteControlPoints no FlowEditor para substituir o cálculo local de Desvio X/Y.
2. Conectar Editar e Duplicar na SelectionToolbar.
3. Conectar replace/insert/remove/nudge de pontos manuais ao canvas.
4. Criar handles visuais arrastáveis para routing.points.
5. Melhorar histórico para registrar rota manual de forma previsível.
6. Criar testes manuais guiados para fluxos com retorno, laço e ramificação.
```

---

## Comandos de validação local

Depois de puxar esta rodada:

```powershell
git pull
npm run format
npm run lint
npm run build
npm run dev
```

Resultado esperado:

```txt
lint: 0 errors, 6 warnings conhecidos
build: sucesso
app: abre em localhost
```
