# Schema do arquivo `.flow`

Este documento descreve o formato de dados usado pelo **Fluxo** para importar e exportar fluxogramas.

O formato é JSON puro. A extensão preferencial atual é `.flow`, mantendo compatibilidade com arquivos antigos `.flow.json` quando possível.

---

## 1. Objetivo do schema

O arquivo `.flow` deve permitir:

1. reabrir visualmente um fluxograma salvo;
2. preservar dados de blocos, conexões, estilos e semântica;
3. transportar o fluxo entre navegadores, máquinas e versões futuras;
4. permitir leitura humana e versionamento em Git;
5. ser interpretável por ferramentas externas sem executar código.

O arquivo é dado, não script. O app não deve executar HTML, JavaScript, SVG inseguro ou qualquer código vindo do arquivo importado.

---

## 2. Estrutura raiz

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {},
  "nodes": [],
  "edges": []
}
```

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `app` | string | Sim | Deve ser `"Fluxo"`. |
| `schemaVersion` | string | Sim | Versão do schema. |
| `project` | object | Sim | Metadados e configurações do projeto. |
| `nodes` | array | Sim | Lista de blocos/formas. |
| `edges` | array | Sim | Lista de linhas, setas e conexões. |

---

## 3. Projeto

Exemplo:

```json
{
  "id": "flow-001",
  "name": "Fluxo sem título",
  "description": "",
  "createdAt": "2026-06-21T00:00:00.000Z",
  "updatedAt": "2026-06-21T00:00:00.000Z",
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
    "tags": [],
    "source": "manual"
  }
}
```

Campos importantes:

| Campo | Descrição |
| --- | --- |
| `id` | Identificador local do projeto. |
| `name` | Nome exibido ao usuário. |
| `description` | Descrição opcional. |
| `createdAt` / `updatedAt` | Datas ISO. |
| `background` | Cor do canvas. |
| `viewport` | Posição e zoom salvos. |
| `settings` | Preferências do canvas. |
| `metadata` | Tags e origem do fluxo. |

---

## 4. Node

Um node representa um bloco visual do fluxograma.

Exemplo:

```json
{
  "id": "node-1",
  "type": "flowNode",
  "shape": "rounded-rectangle",
  "title": "Início",
  "summary": "Começo do fluxo",
  "hiddenInfo": "Informação interna opcional.",
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
    "type": "none",
    "name": "",
    "customSrc": null
  },
  "semantic": {
    "objective": "Representar o início do processo.",
    "inputs": [],
    "outputs": ["Solicitação inicial"],
    "rules": [],
    "notes": ""
  },
  "customFields": []
}
```

### Shapes suportados

- `rectangle`
- `rounded-rectangle`
- `circle`
- `diamond`
- `hexagon`
- `cylinder`

As formas são renderizadas visualmente com geometria própria no editor. O schema guarda apenas o identificador da forma e seus dados visuais.

---

## 5. Edge

Um edge representa uma linha, seta ou conexão bidirecional.

Exemplo:

```json
{
  "id": "edge-1",
  "source": "node-1",
  "target": "node-2",
  "sourceHandle": "right",
  "targetHandle": "left",
  "label": "Continuar",
  "hiddenInfo": "Conexão entre as etapas.",
  "type": "orthogonal",
  "stroke": "solid",
  "hasArrow": true,
  "direction": "forward",
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
    "notes": ""
  },
  "customFields": []
}
```

### Direção

| Valor | Descrição |
| --- | --- |
| ausente | Tratado como `forward` por compatibilidade. |
| `forward` | Seta normal, de `source` para `target`. |
| `bidirectional` | Uma única conexão com ponta nos dois lados. |

### Linha vs seta

- `hasArrow: true` representa seta.
- `hasArrow: false` representa linha sem ponta.
- `direction: "bidirectional"` representa seta com duas pontas.

---

## 6. Handles

O schema aceita handles básicos e expandidos.

Valores comuns:

```txt
auto
top
right
bottom
left
top-left
top-right
bottom-left
bottom-right
left-top
left-bottom
right-top
right-bottom
```

Regras:

- `auto` permite que o editor escolha visualmente o melhor ponto.
- Handles manuais devem ser preservados ao importar/exportar.
- O editor pode calcular anchors visuais distribuídos em runtime sem alterar o valor salvo.
- Metadados de renderização como lanes, slots, obstáculos e pontos visuais não devem ser exportados.

---

## 7. Dados semânticos

Nodes e edges podem conter informações úteis para interpretação humana ou externa.

### Node semantic

```json
{
  "objective": "",
  "inputs": [],
  "outputs": [],
  "rules": [],
  "notes": ""
}
```

### Edge semantic

```json
{
  "condition": "",
  "priority": "normal",
  "rules": [],
  "notes": ""
}
```

Prioridades recomendadas:

- `low`
- `normal`
- `high`
- `critical`

---

## 8. Custom fields

`customFields` permite adicionar dados simples sem quebrar o schema.

```json
[
  {
    "key": "criticidade",
    "label": "Criticidade",
    "value": "Média"
  }
]
```

Regras:

- `key` deve ser estável;
- `label` é o texto exibido;
- `value` deve ser serializável;
- não usar esse campo para salvar estado interno de renderização.

---

## 9. O que não deve ser exportado

Não exportar campos temporários usados apenas pelo editor, como:

- obstáculos calculados;
- lanes ou corredores render-only;
- slots visuais;
- pontos de roteamento gerados em runtime;
- estado de seleção;
- estado de hover;
- estado de modais;
- dados `__visual...`;
- dados de performance/interação.

O arquivo deve guardar o projeto, não o estado transitório da UI.

---

## 10. Compatibilidade e normalização

Ao importar, o Fluxo deve:

- aceitar `.flow` e `.flow.json` quando possível;
- aplicar defaults seguros;
- tolerar campos opcionais ausentes;
- remover edges com source/target inexistentes;
- preservar dados desconhecidos apenas quando for seguro;
- manter compatibilidade com arquivos antigos;
- informar erro amigável para JSON inválido ou estrutura incompatível.

---

## 11. Exemplo mínimo válido

```json
{
  "app": "Fluxo",
  "schemaVersion": "0.1.0",
  "project": {
    "id": "flow-001",
    "name": "Fluxo sem título",
    "createdAt": "2026-06-21T00:00:00.000Z",
    "updatedAt": "2026-06-21T00:00:00.000Z",
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
      "tags": [],
      "source": "manual"
    }
  },
  "nodes": [],
  "edges": []
}
```

---

## 12. Versionamento futuro

A versão atual é:

```json
"schemaVersion": "0.1.0"
```

Mudanças futuras que exigirem quebra de compatibilidade devem:

1. criar nova versão de schema;
2. manter função de migração;
3. documentar diferença;
4. preservar importação de arquivos antigos sempre que possível.

---

## 13. Contrato do MVP

Para o MVP atual, o schema deve permanecer estável.

Novas melhorias visuais devem priorizar cálculo em runtime e evitar poluir o arquivo `.flow` com detalhes internos do render.