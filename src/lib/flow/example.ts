import type {
  FlowFile,
  FlowProject,
  FluxoEdgeSerialized,
  FluxoNodeSerialized,
  ShapeType,
} from "./types";
import { CURRENT_SCHEMA_VERSION } from "./types";
import { DEFAULT_PROJECT_SETTINGS, DEFAULT_VIEWPORT } from "./defaults";

export { projectToFlowFile, flowFileToProject } from "./serialization";
export { validateFlowFile } from "./validation";

export const AI_PROMPT = `Você vai me ajudar a criar um fluxograma para ser importado no app Fluxo.

Antes de gerar qualquer JSON, apenas responda: "Entendi. Estou pronto para receber o contexto do fluxo."

Depois disso, aguarde meu próximo comando.

Quando eu enviar o contexto, você deve me ajudar a organizar teoricamente o fluxo, fazer perguntas se necessário e só gerar o JSON quando eu pedir explicitamente.

O JSON final deve representar blocos, formas, setas, rótulos, informações ocultas, posição visual aproximada e conexões entre os elementos.

Não gere o JSON agora.
Apenas confirme que entendeu e aguarde.`;

const createdAt = new Date().toISOString();

export const EXAMPLE_FLOW_FILE: FlowFile = {
  app: "Fluxo",
  schemaVersion: CURRENT_SCHEMA_VERSION,
  project: {
    id: "example-flow",
    name: "Exemplo de Fluxo",
    description: "Exemplo compatível com o schema oficial do Fluxo.",
    createdAt,
    updatedAt: createdAt,
    background: "#f8fafc",
    viewport: { ...DEFAULT_VIEWPORT },
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    metadata: { source: "manual", tags: ["exemplo"] },
  },
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      shape: "rounded-rectangle",
      title: "Início",
      summary: "Começo do fluxo",
      hiddenInfo: "Informações internas do bloco inicial.",
      position: { x: 100, y: 100 },
      size: { width: 180, height: 80 },
      style: {
        backgroundColor: "#ffffff",
        borderColor: "#d1d5db",
        textColor: "#111827",
        borderWidth: 1,
        borderRadius: 12,
        shadow: "sm",
      },
      icon: { type: "default", name: "play", customSrc: null },
      semantic: {
        objective: "Representar o início do processo",
        inputs: [],
        outputs: ["próxima etapa"],
        rules: [],
        notes: "Esse campo deve ser útil para uma IA entender o fluxo.",
      },
      customFields: [],
    },
    {
      id: "node-2",
      type: "flowNode",
      shape: "rounded-rectangle",
      title: "Próxima etapa",
      summary: "Etapa seguinte",
      hiddenInfo: "",
      position: { x: 380, y: 100 },
      size: { width: 180, height: 80 },
      style: {
        backgroundColor: "#ffffff",
        borderColor: "#d1d5db",
        textColor: "#111827",
        borderWidth: 1,
        borderRadius: 12,
        shadow: "sm",
      },
      icon: { type: "none", name: "", customSrc: null },
      semantic: { objective: "", inputs: [], outputs: [], rules: [], notes: "" },
      customFields: [],
    },
  ],
  edges: [
    {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
      sourceHandle: "right",
      targetHandle: "left",
      label: "Continuar",
      hiddenInfo: "Essa seta representa a passagem para a próxima etapa.",
      type: "orthogonal",
      stroke: "solid",
      hasArrow: true,
      style: { stroke: "#374151", strokeWidth: 2, strokeDasharray: null, markerEnd: "arrow" },
      routing: { mode: "auto", points: [], avoidCrossings: true },
      semantic: {
        condition: "Após iniciar",
        priority: "normal",
        rules: [],
        notes: "Informações semânticas da conexão.",
      },
      customFields: [],
    },
  ],
};

export const DEMO_PROJECT: FlowProject = {
  id: "demo",
  name: "Fluxo de demonstração",
  background: "#fafafa",
  createdAt,
  updatedAt: new Date().toISOString(),
  viewport: { ...DEFAULT_VIEWPORT },
  settings: { ...DEFAULT_PROJECT_SETTINGS },
  metadata: { source: "manual", tags: ["demo"] },
  nodes: [
    mkNode("n1", "Início", 80, 80, "rounded-rectangle"),
    mkNode("n2", "Definir objetivo", 320, 80, "rectangle"),
    mkNode("n3", "Escolher caminho", 320, 220, "diamond", 200, 100),
    mkNode("n4", "Executar etapa", 600, 160, "rectangle"),
    mkNode("n5", "Revisar", 600, 320, "rectangle"),
    mkNode("n6", "Fim", 860, 240, "rounded-rectangle"),
  ],
  edges: [
    mkEdge("e1", "n1", "n2"),
    mkEdge("e2", "n2", "n3"),
    mkEdge("e3", "n3", "n4", "Sim"),
    mkEdge("e4", "n3", "n5", "Não"),
    mkEdge("e5", "n4", "n6"),
    mkEdge("e6", "n5", "n6"),
  ],
};

export const MOCK_LIBRARY: FlowProject[] = [
  DEMO_PROJECT,
  {
    id: "onboarding",
    name: "Onboarding de usuário",
    background: "#ffffff",
    createdAt,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    viewport: { ...DEFAULT_VIEWPORT },
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    metadata: { source: "manual", tags: [] },
    nodes: [
      mkNode("a", "Bem-vindo", 80, 80, "rounded-rectangle"),
      mkNode("b", "Cadastro", 320, 80, "rectangle"),
      mkNode("c", "Confirmação", 560, 80, "rounded-rectangle"),
    ],
    edges: [mkEdge("e1", "a", "b"), mkEdge("e2", "b", "c")],
  },
  {
    id: "support",
    name: "Atendimento ao cliente",
    background: "#f8fafc",
    createdAt,
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    viewport: { ...DEFAULT_VIEWPORT },
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    metadata: { source: "manual", tags: [] },
    nodes: [
      mkNode("s1", "Contato", 80, 80, "rectangle"),
      mkNode("s2", "Triagem", 320, 80, "diamond", 180, 100),
      mkNode("s3", "Resolução", 560, 80, "rectangle"),
    ],
    edges: [mkEdge("e1", "s1", "s2"), mkEdge("e2", "s2", "s3")],
  },
];

function mkNode(
  id: string,
  title: string,
  x: number,
  y: number,
  shape: ShapeType = "rounded-rectangle",
  width = 180,
  height = 80,
): FluxoNodeSerialized {
  return {
    id,
    type: "flowNode",
    shape,
    title,
    summary: "",
    hiddenInfo: "",
    position: { x, y },
    size: { width, height },
    style: {
      backgroundColor: "#ffffff",
      borderColor: "#d1d5db",
      textColor: "#111827",
      borderWidth: 1,
      borderRadius: 12,
      shadow: "sm",
    },
    icon: { type: "none", name: "", customSrc: null },
    semantic: { objective: "", inputs: [], outputs: [], rules: [], notes: "" },
    customFields: [],
  };
}

function mkEdge(id: string, source: string, target: string, label?: string): FluxoEdgeSerialized {
  return {
    id,
    source,
    target,
    sourceHandle: "auto",
    targetHandle: "auto",
    label,
    hiddenInfo: "",
    type: "orthogonal",
    stroke: "solid",
    hasArrow: true,
    style: { stroke: "#374151", strokeWidth: 2, strokeDasharray: null, markerEnd: "arrow" },
    routing: { mode: "auto", points: [], avoidCrossings: true },
    semantic: { condition: "", priority: "normal", rules: [], notes: "" },
    customFields: [],
  };
}
