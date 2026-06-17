# EDGE_ROUTING_SCORE.md

# Roteamento inteligente por pontuação

Esta etapa melhora a escolha automática dos pontos de saída e entrada das setas.

## O que mudou

O arquivo `src/lib/flow/edgeRouting.ts` deixou de escolher o lado da seta apenas pelo maior eixo entre os centros dos blocos.

Agora ele avalia todos os pares possíveis de lados:

- top -> top
- top -> right
- top -> bottom
- top -> left
- right -> top
- right -> right
- right -> bottom
- right -> left
- bottom -> top
- bottom -> right
- bottom -> bottom
- bottom -> left
- left -> top
- left -> right
- left -> bottom
- left -> left

E escolhe o par com menor pontuação.

## Critérios usados na pontuação

O algoritmo considera:

- distância Manhattan entre as âncoras;
- se o lado de saída aponta na direção do bloco de destino;
- se o lado de entrada aponta na direção do bloco de origem;
- se existe corredor horizontal livre;
- se existe corredor vertical livre;
- se a conexão usa lados opostos naturais, como `right -> left` ou `bottom -> top`;
- penalização para lados iguais, como `right -> right`, quando isso tende a criar voltas confusas.

## Resultado esperado

Ao mover ou redimensionar blocos, setas em modo automático devem tender a:

- sair pelo lado mais natural;
- entrar pelo lado mais natural;
- preferir conexões horizontais quando há corredor horizontal livre;
- preferir conexões verticais quando há corredor vertical livre;
- reduzir conexões que dão voltas desnecessárias;
- respeitar conexões manuais.

## Limites atuais

Esta etapa ainda não implementa:

- edição visual de pontos intermediários;
- desvio real de obstáculos;
- cálculo de cruzamento entre várias setas;
- edge customizada integrada ao React Flow;
- toolbar contextual integrada ao editor.

Esses pontos continuam no plano de melhorias, mas esta etapa melhora o comportamento automático sem exigir alteração grande no `FlowEditor.tsx`.

## Como testar

1. Criar 4 ou mais blocos.
2. Conectar blocos em diferentes posições.
3. Mover blocos para cima, baixo, esquerda e direita.
4. Verificar se as setas automáticas mudam de lado de forma mais natural.
5. Abrir o modal de uma seta e definir direção manual.
6. Confirmar que a seta manual não é sobrescrita pela automação.
