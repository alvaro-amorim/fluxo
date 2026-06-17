export {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_EDGE_SEMANTIC,
  DEFAULT_NODE_STYLE,
  DEFAULT_SEMANTIC,
} from "./types";

export type {
  EdgeLineType,
  EdgeSemantic,
  EdgeStrokeType,
  FlowCustomField,
  FlowEdgeRouting,
  FlowEdgeStyle,
  FlowFile,
  FlowHandlePosition,
  FlowMetadata,
  FlowProject,
  FlowProjectSettings,
  FlowSchemaVersion,
  FlowValidationResult,
  FlowViewport,
  FluxoEdgeData,
  FluxoEdgeSerialized,
  FluxoNodeData,
  FluxoNodeSerialized,
  NodeIcon,
  NodeSemantic,
  NodeStyle,
  ShapeType,
} from "./types";

export {
  ALLOWED_SHAPES,
  DEFAULT_BACKGROUND,
  DEFAULT_EDGE_ROUTING,
  DEFAULT_EDGE_STYLE,
  DEFAULT_NODE_ICON,
  DEFAULT_NODE_SIZE,
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_VIEWPORT,
  MIN_NODE_SIZE,
  createDefaultEdge,
  createDefaultNode,
  createEmptyFlowFile,
  createEmptyFlowProject,
  createFlowId,
  nowIso,
} from "./defaults";

export { normalizeFlowFile } from "./normalization";
export { assertValidFlowFile, isFlowFile, validateFlowFile } from "./validation";
export {
  flowFileToProject,
  getFlowFileName,
  parseFlowFileJson,
  projectToFlowFile,
  slugifyFlowName,
  stringifyFlowFile,
} from "./serialization";
export { calculateAutoLayout } from "./layout";
export type { AutoLayoutOptions } from "./layout";
export {
  applySmartHandlesToReactFlowEdges,
  getManualRouteControlPoint,
  getSmartHandles,
  resolveReactFlowEdgeHandles,
  resolveSerializedEdgeHandles,
} from "./edgeRouting";
export type { SmartHandles } from "./edgeRouting";
