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

### 2. Helper para controle manual de rota

Arquivo:

```txt
src/lib/flow/edgeRouting.ts
```

Função adicionada:

```ts
getManualRouteControlPoint(sourceNode, targetNode, axis, offset)
```

Objetivo:

- padronizar a criação de pontos de desvio manual;
- evitar cálculo duplicado dentro do `FlowEditor`;
- preparar melhorias futuras de edição visual dos pontos.

Ela também foi reexportada por:

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
- label posicionado no meio geométrico aproximado da rota.

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
- numerar visualmente os pontos manuais quando a seta está selecionada.

### 2. Clareza da toolbar contextual

Arquivo:

```txt
src/components/flow/SelectionToolbar.tsx
```

A toolbar contextual recebeu textos de ajuda mais claros nos botões:

- `Auto`: recalcula saída/entrada da seta;
- `Desvio X`: cria desvio lateral manual;
- `Desvio Y`: cria desvio vertical manual;
- `Remover`: remove a seleção e informa o atalho `Delete`.

---

## Limitações ainda existentes

Ainda falta evoluir:

```txt
1. arrastar pontos intermediários diretamente no canvas;
2. adicionar/remover múltiplos pontos de rota manual pela interface;
3. melhorar seleção visual em edges muito próximas;
4. mostrar botão Editar na toolbar contextual;
5. melhorar undo/redo específico para mudanças rápidas de rota;
6. tratar cruzamentos entre várias setas com roteamento mais avançado;
7. validar visualmente exportação PNG após rotas manuais.
```

---

## Próximas etapas recomendadas

Ordem sugerida:

```txt
1. Integrar getManualRouteControlPoint no FlowEditor para substituir o cálculo local de Desvio X/Y.
2. Adicionar botão Editar na SelectionToolbar.
3. Criar handles visuais arrastáveis para routing.points.
4. Melhorar histórico para registrar rota manual de forma previsível.
5. Criar testes manuais guiados para fluxos com retorno, laço e ramificação.
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
