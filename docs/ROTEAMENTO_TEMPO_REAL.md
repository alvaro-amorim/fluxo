# ROTEAMENTO_TEMPO_REAL.md

# Roteamento automático em tempo real — Fluxo

## Objetivo desta etapa

Esta etapa faz parte do plano de melhoria do editor visual.

O foco é melhorar a inteligência dos pontos de conexão das setas sem tentar resolver ainda todos os problemas de roteamento avançado, pontos intermediários, desvio de cruzamentos ou edição manual completa do caminho.

A meta desta fase é:

```txt
Quando o usuário mover ou redimensionar blocos, as setas em modo automático devem recalcular sozinhas o melhor lado de saída e entrada.
```

---

## O que foi implementado

## 1. Handles em todos os lados do bloco

Arquivo alterado:

```txt
src/components/flow/FluxoNode.tsx
```

Antes, o bloco tinha handles limitados por tipo:

```txt
top    target
bottom source
left   target
right  source
```

Isso dificultava uma seta sair pelo topo ou pela esquerda, por exemplo.

Agora cada lado possui handle de `source` e `target`:

```txt
top    source + target
right  source + target
bottom source + target
left   source + target
```

Resultado esperado:

- uma conexão pode sair por qualquer lado;
- uma conexão pode entrar por qualquer lado;
- o algoritmo de roteamento pode escolher livremente o melhor lado;
- o usuário mantém controle manual pelo modal da seta.

---

## 2. Roteamento automático considerando modo manual/auto

Arquivo alterado:

```txt
src/lib/flow/edgeRouting.ts
```

A função de roteamento agora considera:

- posição dos blocos;
- tamanho dos blocos;
- centro geométrico de origem e destino;
- `routing.mode` da seta;
- handles manuais escolhidos pelo usuário.

Regras:

```txt
routing.mode = auto   → recalcula handles automaticamente
routing.mode = manual → preserva handles escolhidos pelo usuário
```

O cálculo básico continua sendo:

```txt
alvo à direita  → source right / target left
alvo à esquerda → source left / target right
alvo abaixo     → source bottom / target top
alvo acima      → source top / target bottom
```

---

## 3. Recálculo durante edição dos blocos

Arquivo alterado:

```txt
src/components/flow/FlowEditor.tsx
```

`onNodesChange` passou a detectar mudanças de posição e dimensão:

```txt
position
 dimensions
```

Quando isso acontece, o editor atualiza as setas em modo automático em tempo real.

Comportamento esperado:

- mover bloco recalcula as setas automáticas;
- redimensionar bloco recalcula as setas automáticas;
- setas manuais não são sobrescritas;
- o usuário ainda pode travar uma direção específica no modal da seta.

---

## 4. Organização automática passou a usar camada separada

O botão de organização agora passa a usar a função reutilizável:

```txt
src/lib/flow/layout.ts
calculateAutoLayout()
```

Isso remove parte da lógica duplicada do editor e prepara o caminho para integração futura com ELK.js.

---

## Limitações conhecidas

Esta etapa ainda não resolve:

- desvio avançado de cruzamentos;
- pontos intermediários editáveis;
- arrastar manualmente o caminho da seta;
- roteamento ortogonal com múltiplas curvas inteligentes;
- edição visual direta da linha;
- evitar todos os cruzamentos automaticamente.

Esses itens ficam para fases futuras.

---

## Próxima fase recomendada

Após validação local desta etapa, avançar para:

```txt
1. facilitar exclusão de blocos e setas por botão/context menu;
2. melhorar seleção visual da seta;
3. permitir edição manual de rota com pontos intermediários;
4. melhorar labels das setas;
5. preparar um CustomEdge próprio se o smoothstep do React Flow não for suficiente.
```

---

## Como testar

Rodar localmente:

```powershell
git pull
npm run format
npm run lint
npm run build
npm run dev
```

Teste manual:

```txt
1. Abra um fluxo com vários blocos.
2. Conecte blocos em modo automático.
3. Mova blocos para cima, baixo, esquerda e direita.
4. Veja se as setas mudam o ponto de saída/entrada sozinhas.
5. Dê duplo clique em uma seta.
6. Escolha manualmente saída/entrada.
7. Mova os blocos novamente.
8. Confirme que a seta manual preserva a direção escolhida.
```
