# SCHEMA_FLOW_JSON.md

# Schema do Arquivo `.flow.json` — App Fluxo

## 1. Finalidade deste documento

Este documento define o formato oficial do arquivo `.flow.json` usado pelo app **Fluxo**.

Ele deve ser usado por:

- Codex;
- desenvolvedores;
- validações internas do app;
- importação/exportação;
- exemplos de fluxo;
- prompt de IA externa;
- futuras migrações de schema.

O `.flow.json` é o arquivo principal do app Fluxo.

Ele precisa servir para dois objetivos ao mesmo tempo:

1. **Reabrir visualmente o fluxograma exatamente como foi salvo.**
2. **Permitir que uma IA externa entenda o panorama completo do fluxo, mesmo sem ver o desenho.**

Por isso, o arquivo deve guardar tanto dados visuais quanto dados semânticos.

---

## 2. Conceito geral

A extensão oficial é:

```txt
.flow.json
```

Internamente, o arquivo é JSON puro.

Exemplo de nome de arquivo:

```txt
meu-processo.flow.json
fluxo-app-orquestrador.flow.json
mapa-de-decisao.flow.json
```

Não usar `.json` simples como extensão principal do projeto, para evitar confusão com JSONs genéricos.

---

## 3. Princípios do schema

### 3.1 O arquivo deve ser portátil

Um `.flow.json` deve poder ser:

- salvo localmente;
- enviado para outra IA;
- importado novamente no app;
- aberto em outra instalação futura do Fluxo;
- lido por humanos;
- versionado em Git, se desejado.

### 3.2 O arquivo deve ser tolerante

Ao importar, o app deve aceitar arquivos parcialmente incompletos, desde que tenham estrutura mínima válida.

Quando dados opcionais estiverem ausentes, o app deve aplicar defaults seguros.

### 3.3 O arquivo não deve executar nada

O `.flow.json` não pode conter código executável.

O app nunca deve executar scripts, HTML, JavaScript ou SVG inseguro vindo do arquivo.

### 3.4 O schema deve ser versionado

Todo arquivo deve ter:

```json
"schemaVersion": "0.1.0"
```

Versões futuras podem exigir migração.

---

## 4. Estrutura raiz

Estrutura principal:

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {},
  "nodes": [],
  "edges": []
}
```

### 4.1 Campos da raiz

| Campo           |   Tipo | Obrigatório | Descrição                            |
| --------------- | -----: | ----------: | ------------------------------------ |
| `app`           | string |         Sim | Deve ser `"Fluxo"`                   |
| `schemaVersion` | string |         Sim | Versão do schema                     |
| `project`       | object |         Sim | Metadados e configurações do projeto |
| `nodes`         |  array |         Sim | Lista de blocos/formas do fluxograma |
| `edges`         |  array |         Sim | Lista de linhas/setas/conexões       |

---

## 5. Exemplo mínimo válido

Este é o menor arquivo funcional esperado:

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {
    "id": "flow-001",
    "name": "Fluxo sem título",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "updatedAt": "2026-06-16T00:00:00.000Z",
    "background": "#f8fafc",
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    },
    "settings": {
      "theme": "light",
      "gridVisible": true,
      "snapToGrid": true,
      "gridSize": 20,
      "layoutDirection": "vertical"
    }
  },
  "nodes": [],
  "edges": []
}
```

---

## 6. Exemplo completo

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {
    "id": "flow-example-001",
    "name": "Exemplo de Fluxo",
    "description": "Fluxo de exemplo para demonstrar o formato .flow.json.",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "updatedAt": "2026-06-16T00:00:00.000Z",
    "background": "#f8fafc",
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    },
    "settings": {
      "theme": "light",
      "gridVisible": true,
      "snapToGrid": true,
      "gridSize": 20,
      "layoutDirection": "vertical"
    },
    "metadata": {
      "author": "",
      "tags": ["exemplo"],
      "source": "manual"
    }
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "flowNode",
      "shape": "rounded-rectangle",
      "title": "Início",
      "summary": "Começo do fluxo",
      "hiddenInfo": "Este bloco marca o início do processo.",
      "position": {
        "x": 120,
        "y": 100
      },
      "size": {
        "width": 180,
        "height": 80
      },
      "style": {
        "backgroundColor": "#ffffff",
        "borderColor": "#d1d5db",
        "textColor": "#111827",
        "borderWidth": 1,
        "borderRadius": 12,
        "shadow": "sm"
      },
      "icon": {
        "type": "default",
        "name": "play",
        "customSrc": null
      },
      "semantic": {
        "objective": "Representar o início do processo.",
        "inputs": [],
        "outputs": ["Solicitação inicial"],
        "rules": [],
        "notes": "Este bloco deve ser interpretado como o ponto de partida."
      },
      "customFields": []
    },
    {
      "id": "node-2",
      "type": "flowNode",
      "shape": "diamond",
      "title": "Decisão",
      "summary": "Verifica se deve continuar",
      "hiddenInfo": "A decisão determina se o fluxo segue ou se precisa retornar.",
      "position": {
        "x": 120,
        "y": 260
      },
      "size": {
        "width": 190,
        "height": 120
      },
      "style": {
        "backgroundColor": "#ffffff",
        "borderColor": "#d1d5db",
        "textColor": "#111827",
        "borderWidth": 1,
        "borderRadius": 8,
        "shadow": "sm"
      },
      "icon": {
        "type": "default",
        "name": "help-circle",
        "customSrc": null
      },
      "semantic": {
        "objective": "Avaliar condição de continuidade.",
        "inputs": ["Solicitação inicial"],
        "outputs": ["Continuar", "Revisar"],
        "rules": ["Se aprovado, segue para a próxima etapa."],
        "notes": ""
      },
      "customFields": [
        {
          "key": "criticidade",
          "label": "Criticidade",
          "value": "Média"
        }
      ]
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "bottom",
      "targetHandle": "top",
      "label": "Continuar",
      "hiddenInfo": "Conexão que leva do início para a decisão.",
      "type": "orthogonal",
      "style": {
        "stroke": "#374151",
        "strokeWidth": 2,
        "strokeDasharray": null,
        "markerEnd": "arrow"
      },
      "routing": {
        "mode": "auto",
        "points": [],
        "avoidCrossings": true
      },
      "semantic": {
        "condition": "Após iniciar",
        "priority": "normal",
        "rules": [],
        "notes": "Essa conexão representa sequência direta."
      },
      "customFields": []
    }
  ]
}
```

---

## 7. Tipos TypeScript oficiais

A implementação deve preferir tipos TypeScript centralizados.

Arquivo sugerido:

```txt
src/features/flow/flowTypes.ts
```

### 7.1 FlowProjectFile

```ts
export type FlowProjectFile = {
  app: "Fluxo";
  schemaVersion: string;
  project: FlowProjectMetadata;
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
};
```

### 7.2 FlowProjectMetadata

```ts
export type FlowProjectMetadata = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  background: string;
  viewport: FlowViewport;
  settings: FlowProjectSettings;
  metadata?: FlowMetadata;
};
```

### 7.3 FlowViewport

```ts
export type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};
```

### 7.4 FlowProjectSettings

```ts
export type FlowProjectSettings = {
  theme: "light" | "dark";
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layoutDirection: "vertical" | "horizontal" | "radial" | "compact";
};
```

### 7.5 FlowMetadata

```ts
export type FlowMetadata = {
  author?: string;
  tags?: string[];
  source?: "manual" | "external-ai" | "imported" | "duplicated";
  originalFileName?: string;
};
```

### 7.6 FlowNodeData

```ts
export type FlowNodeData = {
  id: string;
  type: "flowNode";
  shape: FlowNodeShape;
  title: string;
  summary?: string;
  hiddenInfo?: string;
  position: FlowPosition;
  size: FlowSize;
  style: FlowNodeStyle;
  icon?: FlowIcon;
  semantic?: FlowNodeSemantic;
  customFields?: FlowCustomField[];
};
```

### 7.7 FlowNodeShape

```ts
export type FlowNodeShape =
  | "rectangle"
  | "rounded-rectangle"
  | "circle"
  | "diamond"
  | "cylinder"
  | "hexagon";
```

### 7.8 FlowPosition

```ts
export type FlowPosition = {
  x: number;
  y: number;
};
```

### 7.9 FlowSize

```ts
export type FlowSize = {
  width: number;
  height: number;
};
```

### 7.10 FlowNodeStyle

```ts
export type FlowNodeStyle = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: "none" | "sm" | "md" | "lg";
};
```

### 7.11 FlowIcon

```ts
export type FlowIcon = {
  type: "none" | "default" | "custom";
  name?: string;
  customSrc?: string | null;
};
```

### 7.12 FlowNodeSemantic

```ts
export type FlowNodeSemantic = {
  objective?: string;
  inputs?: string[];
  outputs?: string[];
  rules?: string[];
  notes?: string;
};
```

### 7.13 FlowEdgeData

```ts
export type FlowEdgeData = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: FlowHandlePosition;
  targetHandle?: FlowHandlePosition;
  label?: string;
  hiddenInfo?: string;
  type: FlowEdgeType;
  style: FlowEdgeStyle;
  routing?: FlowEdgeRouting;
  semantic?: FlowEdgeSemantic;
  customFields?: FlowCustomField[];
};
```

### 7.14 FlowHandlePosition

```ts
export type FlowHandlePosition = "top" | "right" | "bottom" | "left" | "auto";
```

### 7.15 FlowEdgeType

```ts
export type FlowEdgeType = "orthogonal" | "straight" | "smooth" | "dashed" | "no-arrow";
```

### 7.16 FlowEdgeStyle

```ts
export type FlowEdgeStyle = {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string | null;
  markerEnd?: "arrow" | "none";
};
```

### 7.17 FlowEdgeRouting

```ts
export type FlowEdgeRouting = {
  mode: "auto" | "manual";
  points?: FlowPosition[];
  avoidCrossings?: boolean;
};
```

### 7.18 FlowEdgeSemantic

```ts
export type FlowEdgeSemantic = {
  condition?: string;
  priority?: "low" | "normal" | "high" | "critical";
  rules?: string[];
  notes?: string;
};
```

### 7.19 FlowCustomField

```ts
export type FlowCustomField = {
  key: string;
  label: string;
  value: string;
};
```

---

## 8. Campos obrigatórios e opcionais

## 8.1 Raiz

| Campo           | Obrigatório | Default se ausente                                     |
| --------------- | ----------: | ------------------------------------------------------ |
| `app`           |         Sim | Rejeitar ou perguntar se deseja tentar importar        |
| `schemaVersion` |         Sim | Tentar interpretar como versão legada apenas se seguro |
| `project`       |         Sim | Criar projeto padrão apenas em importação assistida    |
| `nodes`         |         Sim | `[]`                                                   |
| `edges`         |         Sim | `[]`                                                   |

## 8.2 Project

| Campo         | Obrigatório | Default                   |
| ------------- | ----------: | ------------------------- |
| `id`          |         Sim | Gerar UUID                |
| `name`        |         Sim | `"Fluxo sem título"`      |
| `description` |         Não | `""`                      |
| `createdAt`   |         Sim | Data atual                |
| `updatedAt`   |         Sim | Data atual                |
| `background`  |         Sim | `"#f8fafc"`               |
| `viewport`    |         Sim | `{ x: 0, y: 0, zoom: 1 }` |
| `settings`    |         Sim | Configurações padrão      |
| `metadata`    |         Não | `{ source: "imported" }`  |

## 8.3 Node

| Campo          | Obrigatório | Default                            |
| -------------- | ----------: | ---------------------------------- |
| `id`           |         Sim | Gerar id se estiver em modo reparo |
| `type`         |         Sim | `"flowNode"`                       |
| `shape`        |         Sim | `"rounded-rectangle"`              |
| `title`        |         Sim | `"Bloco sem título"`               |
| `summary`      |         Não | `""`                               |
| `hiddenInfo`   |         Não | `""`                               |
| `position`     |         Sim | Posição automática                 |
| `size`         |         Sim | `{ width: 180, height: 80 }`       |
| `style`        |         Sim | Estilo padrão                      |
| `icon`         |         Não | `{ type: "none" }`                 |
| `semantic`     |         Não | Objeto vazio normalizado           |
| `customFields` |         Não | `[]`                               |

## 8.4 Edge

| Campo          | Obrigatório | Default                                              |
| -------------- | ----------: | ---------------------------------------------------- |
| `id`           |         Sim | Gerar id se estiver em modo reparo                   |
| `source`       |         Sim | Sem default                                          |
| `target`       |         Sim | Sem default                                          |
| `sourceHandle` |         Não | `"auto"`                                             |
| `targetHandle` |         Não | `"auto"`                                             |
| `label`        |         Não | `""`                                                 |
| `hiddenInfo`   |         Não | `""`                                                 |
| `type`         |         Sim | `"orthogonal"`                                       |
| `style`        |         Sim | Estilo padrão                                        |
| `routing`      |         Não | `{ mode: "auto", points: [], avoidCrossings: true }` |
| `semantic`     |         Não | Objeto vazio normalizado                             |
| `customFields` |         Não | `[]`                                                 |

---

## 9. Defaults oficiais

Criar arquivo sugerido:

```txt
src/features/flow/flowDefaults.ts
```

### 9.1 Project default

```ts
export const DEFAULT_PROJECT_SETTINGS = {
  theme: "light",
  gridVisible: true,
  snapToGrid: true,
  gridSize: 20,
  layoutDirection: "vertical",
} as const;

export const DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: 1,
} as const;

export const DEFAULT_BACKGROUND = "#f8fafc";
```

### 9.2 Node default

```ts
export const DEFAULT_NODE_SIZE = {
  width: 180,
  height: 80,
} as const;

export const DEFAULT_NODE_STYLE = {
  backgroundColor: "#ffffff",
  borderColor: "#d1d5db",
  textColor: "#111827",
  borderWidth: 1,
  borderRadius: 12,
  shadow: "sm",
} as const;

export const DEFAULT_NODE_ICON = {
  type: "none",
  name: "",
  customSrc: null,
} as const;
```

### 9.3 Edge default

```ts
export const DEFAULT_EDGE_STYLE = {
  stroke: "#374151",
  strokeWidth: 2,
  strokeDasharray: null,
  markerEnd: "arrow",
} as const;

export const DEFAULT_EDGE_ROUTING = {
  mode: "auto",
  points: [],
  avoidCrossings: true,
} as const;
```

---

## 10. Validação

Criar validação centralizada.

Arquivo sugerido:

```txt
src/features/flow/flowValidation.ts
```

Pode usar validação manual ou biblioteca como Zod, se já existir no projeto ou fizer sentido.

### 10.1 Regras de validação da raiz

Validar:

- JSON parseável;
- objeto raiz;
- `app`;
- `schemaVersion`;
- `project`;
- `nodes`;
- `edges`.

### 10.2 Regras de validação dos nodes

Cada node deve:

- ser objeto;
- ter `id` string única;
- ter `title` string;
- ter `shape` compatível;
- ter `position.x` e `position.y` numéricos;
- ter `size.width` e `size.height` numéricos;
- respeitar tamanho mínimo;
- ter `style` seguro;
- não conter código executável.

### 10.3 Regras de validação das edges

Cada edge deve:

- ser objeto;
- ter `id` string única;
- ter `source` string;
- ter `target` string;
- apontar para nodes existentes;
- não apontar para node removido;
- ter `type` compatível;
- ter `style` seguro.

### 10.4 Erros amigáveis

Exemplos de mensagens:

```txt
O arquivo não é um JSON válido.
O arquivo não parece ser um projeto do Fluxo.
A conexão "edge-3" aponta para um bloco inexistente.
O bloco "node-4" está sem posição válida.
O schema do arquivo é antigo e precisa ser migrado.
```

### 10.5 Modo estrito e modo reparo

Implementar dois modos de validação:

```ts
type ValidationMode = "strict" | "repair";
```

#### Strict

Usar quando o app precisa garantir consistência.

Se houver erro estrutural grave, rejeitar importação.

#### Repair

Usar quando o app pode tentar corrigir:

- ids ausentes;
- campos opcionais ausentes;
- estilos incompletos;
- configurações ausentes;
- tamanho inválido;
- background inválido;
- viewport ausente.

Não reparar conexões cujo `source` ou `target` não exista sem avisar o usuário.

---

## 11. Normalização

Criar função:

```ts
normalizeFlowProject(input: unknown): FlowProjectFile
```

Ela deve:

- validar estrutura;
- aplicar defaults;
- remover campos perigosos;
- normalizar strings;
- garantir arrays;
- garantir ids únicos;
- garantir viewport;
- garantir settings;
- garantir style;
- garantir semantic;
- garantir customFields.

### 11.1 IDs duplicados

Se nodes tiverem ids duplicados:

- em strict: rejeitar;
- em repair: renomear duplicados e ajustar edges quando seguro.

Se edges tiverem ids duplicados:

- em strict: rejeitar;
- em repair: gerar novos ids para edges duplicadas.

### 11.2 Edges inválidas

Se uma edge aponta para node inexistente:

- em strict: rejeitar;
- em repair: remover a edge e avisar.

---

## 12. Regras para datas

Usar ISO string:

```txt
2026-06-16T00:00:00.000Z
```

Campos:

- `createdAt`;
- `updatedAt`.

Ao duplicar fluxo:

- gerar novo `project.id`;
- manter `createdAt` como data da cópia;
- atualizar `updatedAt`;
- sugerir nome com “Cópia de”.

Ao salvar:

- atualizar `updatedAt`.

---

## 13. Regras para cores

Cores devem ser strings CSS seguras.

Preferir hexadecimal:

```txt
#ffffff
#111827
#d1d5db
```

O importador pode aceitar:

- hex curto;
- hex completo;
- rgb;
- rgba.

Mas deve normalizar ou validar.

Se cor for inválida, aplicar default.

---

## 14. Regras para tamanhos

Tamanho mínimo recomendado:

```ts
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 40;
```

Tamanho padrão:

```ts
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 80;
```

Se tamanho for inválido:

- aplicar default;
- avisar em modo debug, se houver.

---

## 15. Regras para posição

Posição deve ser numérica.

Valores negativos são permitidos, porque o canvas é infinito.

Exemplo válido:

```json
"position": { "x": -240, "y": 320 }
```

Se posição estiver ausente, aplicar layout automático simples ou posicionar em cascata.

---

## 16. Shapes oficiais

Valores aceitos em `shape`:

```txt
rectangle
rounded-rectangle
circle
diamond
cylinder
hexagon
```

Nenhum shape tem significado obrigatório.

O significado é definido pelo usuário via título, descrição, informação oculta e semântica.

Se shape for desconhecido, aplicar:

```txt
rounded-rectangle
```

---

## 17. Edge types oficiais

Valores aceitos em `type`:

```txt
orthogonal
straight
smooth
dashed
no-arrow
```

### 17.1 Orthogonal

Principal estilo do app.

Deve representar linhas angulares/profissionais.

### 17.2 Straight

Linha reta.

### 17.3 Smooth

Linha curva/suave.

### 17.4 Dashed

Linha pontilhada.

Pode também ser representada por `style.strokeDasharray`.

### 17.5 No-arrow

Linha sem ponta de seta.

Pode também ser representada por:

```json
"markerEnd": "none"
```

---

## 18. Routing

O campo `routing` prepara o app para setas inteligentes.

```json
"routing": {
  "mode": "auto",
  "points": [],
  "avoidCrossings": true
}
```

### 18.1 mode

Valores:

```txt
auto
manual
```

#### auto

O app calcula rota.

#### manual

O usuário ou algoritmo salva pontos específicos.

### 18.2 points

Lista opcional de pontos intermediários.

Exemplo:

```json
"points": [
  { "x": 200, "y": 100 },
  { "x": 200, "y": 240 }
]
```

No MVP, pode ficar vazio.

No futuro, usar para roteamento manual/ortogonal avançado.

### 18.3 avoidCrossings

Booleano indicando se a conexão deve tentar evitar cruzamentos.

Não é garantia absoluta.

É uma intenção de roteamento.

---

## 19. Handles

Valores aceitos:

```txt
top
right
bottom
left
auto
```

Se `sourceHandle` ou `targetHandle` for `"auto"`, o app pode escolher o melhor lado.

Se estiverem definidos como lado específico, o app deve respeitar quando possível.

Ao mover blocos, o app pode recalcular handles se o edge estiver com `routing.mode = "auto"`.

---

## 20. Informações ocultas

Tanto nodes quanto edges podem ter:

```json
"hiddenInfo": "Texto oculto..."
```

Regras:

- não exibir sempre no canvas;
- mostrar resumo no hover;
- mostrar no painel/modal quando selecionado;
- incluir integralmente no `.flow.json`;
- preservar ao importar/exportar;
- nunca truncar ao salvar.

Se o texto for muito grande, a interface pode resumir visualmente, mas o arquivo deve preservar tudo.

---

## 21. Campos semânticos de nodes

```json
"semantic": {
  "objective": "",
  "inputs": [],
  "outputs": [],
  "rules": [],
  "notes": ""
}
```

### 21.1 objective

Objetivo do bloco.

Exemplo:

```txt
Receber o briefing inicial do usuário.
```

### 21.2 inputs

Entradas esperadas.

Exemplo:

```json
["briefing", "arquivos", "preferências"]
```

### 21.3 outputs

Saídas produzidas.

Exemplo:

```json
["tarefa classificada", "dados normalizados"]
```

### 21.4 rules

Regras internas.

Exemplo:

```json
["Se o briefing estiver incompleto, solicitar complemento."]
```

### 21.5 notes

Observações livres.

---

## 22. Campos semânticos de edges

```json
"semantic": {
  "condition": "",
  "priority": "normal",
  "rules": [],
  "notes": ""
}
```

### 22.1 condition

Condição para seguir pela conexão.

Exemplo:

```txt
Se o usuário aprovar o resultado.
```

### 22.2 priority

Valores:

```txt
low
normal
high
critical
```

### 22.3 rules

Regras da conexão.

Exemplo:

```json
["Executar apenas se todos os campos obrigatórios estiverem preenchidos."]
```

### 22.4 notes

Observações livres.

---

## 23. Custom fields

`customFields` permite expansão sem quebrar o schema.

Formato:

```json
{
  "key": "nome_tecnico",
  "label": "Nome legível",
  "value": "Valor"
}
```

Regras:

- `key` deve ser string curta;
- `label` deve ser legível;
- `value` deve ser string;
- não usar objetos complexos no MVP;
- preservar campos desconhecidos quando possível.

Exemplo:

```json
"customFields": [
  {
    "key": "risco",
    "label": "Risco",
    "value": "Alto"
  },
  {
    "key": "responsavel",
    "label": "Responsável",
    "value": "Usuário"
  }
]
```

---

## 24. Compatibilidade com React Flow

Internamente, React Flow usa estrutura própria de nodes e edges.

O app deve converter entre:

```txt
FlowProjectFile <-> ReactFlow nodes/edges
```

Não salvar diretamente o objeto bruto do React Flow como schema final.

Criar funções separadas:

```ts
flowProjectToReactFlow(project: FlowProjectFile): {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

reactFlowToFlowProject(input: {
  project: FlowProjectMetadata;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}): FlowProjectFile
```

### 24.1 Por quê?

Porque o schema do app precisa ser estável, legível e útil para IA externa.

O formato interno do React Flow pode mudar e tem dados desnecessários.

---

## 25. Conversão de node para React Flow

Um `FlowNodeData` deve virar um node do React Flow aproximadamente assim:

```ts
const reactFlowNode = {
  id: flowNode.id,
  type: "customNode",
  position: flowNode.position,
  data: {
    title: flowNode.title,
    summary: flowNode.summary,
    hiddenInfo: flowNode.hiddenInfo,
    shape: flowNode.shape,
    style: flowNode.style,
    icon: flowNode.icon,
    semantic: flowNode.semantic,
    customFields: flowNode.customFields,
  },
  width: flowNode.size.width,
  height: flowNode.size.height,
};
```

---

## 26. Conversão de edge para React Flow

Um `FlowEdgeData` deve virar uma edge do React Flow aproximadamente assim:

```ts
const reactFlowEdge = {
  id: flowEdge.id,
  source: flowEdge.source,
  target: flowEdge.target,
  sourceHandle: flowEdge.sourceHandle,
  targetHandle: flowEdge.targetHandle,
  type: "customEdge",
  label: flowEdge.label,
  data: {
    hiddenInfo: flowEdge.hiddenInfo,
    edgeType: flowEdge.type,
    style: flowEdge.style,
    routing: flowEdge.routing,
    semantic: flowEdge.semantic,
    customFields: flowEdge.customFields,
  },
};
```

---

## 27. Exemplo oficial para IA externa

Este exemplo deve ser usado no modal “Criar fluxo com IA externa” ou como arquivo de exemplo.

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {
    "id": "external-ai-example",
    "name": "Fluxo gerado por IA externa",
    "description": "Exemplo de estrutura compatível com o app Fluxo.",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "updatedAt": "2026-06-16T00:00:00.000Z",
    "background": "#f8fafc",
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    },
    "settings": {
      "theme": "light",
      "gridVisible": true,
      "snapToGrid": true,
      "gridSize": 20,
      "layoutDirection": "vertical"
    },
    "metadata": {
      "source": "external-ai",
      "tags": ["exemplo"]
    }
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "flowNode",
      "shape": "rounded-rectangle",
      "title": "Receber contexto",
      "summary": "Entrada inicial do usuário",
      "hiddenInfo": "Aqui entra todo o contexto necessário para entender o fluxo.",
      "position": {
        "x": 100,
        "y": 100
      },
      "size": {
        "width": 220,
        "height": 90
      },
      "style": {
        "backgroundColor": "#ffffff",
        "borderColor": "#d1d5db",
        "textColor": "#111827",
        "borderWidth": 1,
        "borderRadius": 12,
        "shadow": "sm"
      },
      "icon": {
        "type": "default",
        "name": "file-text",
        "customSrc": null
      },
      "semantic": {
        "objective": "Receber o contexto inicial.",
        "inputs": ["mensagem do usuário"],
        "outputs": ["contexto organizado"],
        "rules": ["Não avançar se o contexto estiver ausente."],
        "notes": ""
      },
      "customFields": []
    },
    {
      "id": "node-2",
      "type": "flowNode",
      "shape": "diamond",
      "title": "Está claro?",
      "summary": "Verifica se há informações suficientes",
      "hiddenInfo": "Decisão usada para saber se o fluxo pode seguir ou se precisa de perguntas.",
      "position": {
        "x": 100,
        "y": 260
      },
      "size": {
        "width": 200,
        "height": 120
      },
      "style": {
        "backgroundColor": "#ffffff",
        "borderColor": "#d1d5db",
        "textColor": "#111827",
        "borderWidth": 1,
        "borderRadius": 8,
        "shadow": "sm"
      },
      "icon": {
        "type": "default",
        "name": "help-circle",
        "customSrc": null
      },
      "semantic": {
        "objective": "Decidir se o contexto é suficiente.",
        "inputs": ["contexto organizado"],
        "outputs": ["sim", "não"],
        "rules": ["Se faltar informação, perguntar antes de continuar."],
        "notes": ""
      },
      "customFields": []
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "bottom",
      "targetHandle": "top",
      "label": "Analisar",
      "hiddenInfo": "Leva o contexto recebido para a etapa de análise.",
      "type": "orthogonal",
      "style": {
        "stroke": "#374151",
        "strokeWidth": 2,
        "strokeDasharray": null,
        "markerEnd": "arrow"
      },
      "routing": {
        "mode": "auto",
        "points": [],
        "avoidCrossings": true
      },
      "semantic": {
        "condition": "Após receber contexto",
        "priority": "normal",
        "rules": [],
        "notes": ""
      },
      "customFields": []
    }
  ]
}
```

---

## 28. Prompt para IA externa gerar JSON

Este prompt deve ser usado no app, no modal da tela inicial.

A IA externa deve primeiro confirmar entendimento, sem gerar JSON imediatamente.

```txt
Você vai me ajudar a criar um fluxograma para ser importado no app Fluxo.

Antes de gerar qualquer JSON, apenas responda: “Entendi. Estou pronto para receber o contexto do fluxo.”

Depois disso, aguarde meu próximo comando.

Quando eu enviar o contexto, você deve me ajudar a organizar teoricamente o fluxo, fazer perguntas se necessário e só gerar o JSON quando eu pedir explicitamente.

O JSON final deve representar blocos, formas, setas, rótulos, informações ocultas, posição visual aproximada e conexões entre os elementos.

O JSON deve seguir este formato geral:

{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "background": "#f8fafc",
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "settings": {
      "theme": "light",
      "gridVisible": true,
      "snapToGrid": true,
      "gridSize": 20,
      "layoutDirection": "vertical"
    }
  },
  "nodes": [],
  "edges": []
}

Cada node deve conter:
id, type, shape, title, summary, hiddenInfo, position, size, style, icon, semantic e customFields.

Cada edge deve conter:
id, source, target, sourceHandle, targetHandle, label, hiddenInfo, type, style, routing, semantic e customFields.

Use shapes apenas entre:
rectangle, rounded-rectangle, circle, diamond, cylinder, hexagon.

Use edges preferencialmente do tipo:
orthogonal.

Não gere o JSON agora.
Apenas confirme que entendeu e aguarde.
```

---

## 29. Regras para JSON gerado por IA externa

Quando uma IA externa gerar JSON para o app, ela deve:

- usar `app: "Fluxo"`;
- usar `schemaVersion: "0.1.0"`;
- gerar ids únicos;
- gerar posições aproximadas;
- usar layout vertical ou horizontal legível;
- não criar nodes sobrepostos;
- não deixar edges apontando para nodes inexistentes;
- preencher `hiddenInfo` quando houver contexto importante;
- preencher `semantic` de forma útil;
- usar títulos curtos;
- evitar textos enormes dentro do título;
- colocar detalhes longos em `hiddenInfo` ou `semantic.notes`;
- preferir `orthogonal` para conexões;
- usar `sourceHandle` e `targetHandle` coerentes;
- não incluir comentários fora do JSON quando o usuário pedir apenas JSON.

---

## 30. Migrações futuras

Criar arquivo futuro:

```txt
src/features/flow/flowMigrations.ts
```

Função sugerida:

```ts
migrateFlowProject(input: unknown): FlowProjectFile
```

### 30.1 Estratégia

- detectar `schemaVersion`;
- aplicar migrações em sequência;
- retornar versão atual;
- preservar dados desconhecidos quando seguro;
- avisar sobre campos removidos.

### 30.2 Versões

Versão atual:

```txt
0.1.0
```

Versões futuras possíveis:

```txt
0.2.0 — grupos e páginas
0.3.0 — rotas manuais avançadas
0.4.0 — biblioteca de ícones locais
1.0.0 — schema estável
```

---

## 31. Importação segura

Ao importar arquivo externo:

1. ler conteúdo como texto;
2. tentar `JSON.parse`;
3. validar estrutura;
4. normalizar;
5. exibir preview se possível;
6. perguntar se deseja abrir;
7. substituir projeto atual apenas após confirmação ou salvar projeto atual antes.

### 31.1 Nunca fazer

- nunca executar código;
- nunca injetar HTML bruto;
- nunca confiar em SVG externo sem sanitização;
- nunca quebrar o app se JSON for inválido;
- nunca apagar fluxo atual sem aviso.

---

## 32. Exportação segura

Ao exportar:

1. converter estado atual para `FlowProjectFile`;
2. validar internamente;
3. atualizar `updatedAt`;
4. serializar com `JSON.stringify(project, null, 2)`;
5. salvar como `.flow.json`.

### 32.1 Nome sugerido

Gerar nome limpo:

```ts
`${slugify(project.name)}.flow.json`;
```

Exemplo:

```txt
meu-fluxo.flow.json
```

---

## 33. Diferença entre salvar, exportar e autosave

### 33.1 Salvar

Atualiza o arquivo local atual.

Na versão web inicial, pode baixar `.flow.json`.

Na versão desktop, deve gravar no arquivo aberto.

### 33.2 Exportar

Cria uma cópia `.flow.json` escolhida pelo usuário.

### 33.3 Autosave

Salva rascunho temporário para recuperação.

Não substitui o arquivo oficial sem controle.

---

## 34. Campos reservados para futuro

Evitar usar estes campos com significado diferente:

```txt
pages
groups
assets
iconLibrary
comments
history
presentation
permissions
plugins
```

Eles podem ser adicionados futuramente.

---

## 35. Possível evolução do schema

Futuro exemplo:

```json
{
  "pages": [],
  "groups": [],
  "assets": [],
  "iconLibrary": [],
  "history": []
}
```

Não implementar agora.

Apenas evitar escolhas que dificultem essa evolução.

---

## 36. Testes recomendados

Criar testes para:

- JSON mínimo válido;
- JSON completo válido;
- JSON inválido;
- node sem style;
- edge apontando para node inexistente;
- ids duplicados;
- shape desconhecido;
- cor inválida;
- schemaVersion ausente;
- arquivo de IA externa;
- exportar e importar sem perda de dados.

---

## 37. Critérios de aceite do schema

O schema estará bem implementado quando:

- houver tipos TypeScript claros;
- houver defaults oficiais;
- houver validação;
- houver normalização;
- houver exemplo oficial;
- importação não quebrar com arquivo ruim;
- exportação preservar dados visuais;
- exportação preservar dados semânticos;
- `.flow.json` exportado puder ser importado novamente sem perda;
- IA externa conseguir gerar arquivo compatível seguindo o prompt.

---

## 38. Resumo final

O `.flow.json` é a base do app Fluxo.

Ele não deve ser apenas um dump visual.

Ele deve ser uma representação completa do fluxo.

A regra principal é:

```txt
Tudo que aparece no desenho, tudo que está oculto nos blocos e tudo que ajuda uma IA a entender o fluxo deve estar preservado no .flow.json.
```
