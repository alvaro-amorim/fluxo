import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { FluxoNode } from "./FluxoNode";
import { FluxoEdge } from "./FluxoEdge";
import { Toolbar, type Tool } from "./Toolbar";
import { NodePropertiesModal } from "./NodePropertiesModal";
import { EdgePropertiesModal } from "./EdgePropertiesModal";
import { ShortcutHelpModal } from "./ShortcutHelpModal";
import { SelectionToolbar } from "./SelectionToolbar";
import {
  DEFAULT_EDGE_SEMANTIC,
  DEFAULT_NODE_STYLE,
  DEFAULT_SEMANTIC,
  type FlowLayoutDirection,
  type FlowProject,
  type FluxoEdgeData,
  type FluxoEdgeSerialized,
  type FluxoNodeData,
} from "@/lib/flow/types";
import {
  flowProjectToReactFlow,
  fluxoEdgeToReactFlowEdge,
  reactFlowToFlowProject,
} from "@/lib/flow/adapters";
import {
  flowFileToProject,
  getFlowFileName,
  parseFlowFileJson,
  projectToFlowFile,
  stringifyFlowFile,
} from "@/lib/flow/serialization";
import { exportFlowPng } from "@/lib/export/exportPng";
import { setCurrentProject, upsertProject } from "@/lib/flow/store";
import { calculateAutoLayout } from "@/lib/flow/layout";
import { applySmartHandlesToReactFlowEdges } from "@/lib/flow/edgeRouting";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, Palette, Presentation, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const nodeTypes: NodeTypes = { fluxo: FluxoNode };
const edgeTypes: EdgeTypes = { fluxo: FluxoEdge };

type FlowSnapshot = { nodes: Node[]; edges: Edge[] };

interface FlowEditorProps {
  project: FlowProject;
}

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}

function FlowEditorInner({ project: initialProject }: FlowEditorProps) {
  const [project, setProject] = useState<FlowProject>(initialProject);
  const projectRef = useRef<FlowProject>(initialProject);

  const initial = useMemo(() => flowProjectToReactFlow(initialProject), [initialProject]);
  const [nodes, setNodes] = useState<Node[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [compactView, setCompactView] = useState(false);

  const renderedNodes = useMemo<Node[]>(
    () =>
      nodes.map((node) => ({
        ...node,
        data: { ...(node.data as Record<string, unknown>), compactView },
      })),
    [nodes, compactView],
  );

  const [tool, setTool] = useState<Tool>("select");
  const [pendingConnectionSource, setPendingConnectionSource] = useState<string | null>(null);
  const [toolbarMode, setToolbarMode] = useState<"side" | "floating">("side");
  const [gridOn, setGridOn] = useState(initialProject.settings?.gridVisible ?? true);
  const [snapOn, setSnapOn] = useState(initialProject.settings?.snapToGrid ?? true);
  const [presentation, setPresentation] = useState(false);
  const [background, setBackground] = useState(initialProject.background);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [edgeModalOpen, setEdgeModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<{
    nodeId: string;
    handleId: string;
    handleType: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const historyRef = useRef<FlowSnapshot[]>([]);
  const futureRef = useRef<FlowSnapshot[]>([]);
  const isRestoringRef = useRef(false);
  const inlineRenameNodeIdRef = useRef<string | null>(null);

  const snapshot = useCallback(() => {
    if (isRestoringRef.current) return;
    historyRef.current.push({ nodes, edges });
    if (historyRef.current.length > 80) historyRef.current.shift();
    futureRef.current = [];
  }, [nodes, edges]);

  const persistProject = useCallback((next: FlowProject) => {
    projectRef.current = next;
    setProject(next);
    setCurrentProject(next);
    upsertProject(next);
  }, []);

  useEffect(() => {
    const updated = reactFlowToFlowProject(
      {
        ...projectRef.current,
        background,
        settings: {
          ...(projectRef.current.settings ?? {
            theme: "light",
            gridVisible: true,
            snapToGrid: true,
            gridSize: 20,
            layoutDirection: "vertical",
          }),
          gridVisible: gridOn,
          snapToGrid: snapOn,
        },
      },
      nodes,
      edges,
    );
    persistProject(updated);
  }, [nodes, edges, background, gridOn, snapOn, persistProject]);

  const resolveAutoEdges = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    return applySmartHandlesToReactFlowEdges(
      nextNodes,
      nextEdges.map((edge) => {
        const data = edge.data as FluxoEdgeData | undefined;
        if (data?.routing?.mode !== "auto") return edge;

        return {
          ...edge,
          sourceHandle: "auto",
          targetHandle: "auto",
          data: {
            ...data,
            sourceHandle: "auto",
            targetHandle: "auto",
          },
        };
      }),
    ) as Edge[];
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        setEdges((eds) => resolveAutoEdges(nextNodes, eds));
        return nextNodes;
      }),
    [resolveAutoEdges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const createEdge = useCallback((edge: FluxoEdgeSerialized) => fluxoEdgeToReactFlowEdge(edge), []);

  const onConnectStart = useCallback(
    (
      event: MouseEvent | TouchEvent | null,
      params: { nodeId: string | null; handleId: string | null; handleType: string | null },
    ) => {
      if (!params.nodeId) return;
      const { nodeId, handleId, handleType } = params;
      setConnectionState({
        nodeId,
        handleId: handleId ?? "auto",
        handleType: handleType ?? "source",
      });
    },
    [],
  );

  const onConnectEnd = useCallback(() => {
    setConnectionState(null);
  }, []);

  const onConnect = useCallback(
    (conn: Connection) => {
      try {
        if (!conn.source || !conn.target) return;

        // Determinar direção real baseada no connectionState
        let source = conn.source;
        let target = conn.target;

        if (connectionState) {
          if (connectionState.nodeId === conn.source) {
            // Manter source/target como estão
          } else if (connectionState.nodeId === conn.target) {
            // Inverter source/target
            [source, target] = [target, source];
          }
        }

        // Rejeitar self-loop após calcular a direção real
        if (source === target) {
          toast.warning("Conexões para o mesmo bloco não são permitidas");
          return;
        }

        snapshot();
        const id = `edge-${Date.now()}`;
        const serialized: FluxoEdgeSerialized = {
          id,
          source,
          target,
          sourceHandle: (conn.sourceHandle as FluxoEdgeSerialized["sourceHandle"]) ?? "auto",
          targetHandle: (conn.targetHandle as FluxoEdgeSerialized["targetHandle"]) ?? "auto",
          label: undefined,
          hiddenInfo: "",
          type: "orthogonal",
          stroke: "solid",
          hasArrow: true,
          style: { stroke: "#374151", strokeWidth: 2, strokeDasharray: null, markerEnd: "arrow" },
          routing: { mode: "auto", points: [], avoidCrossings: true },
          semantic: { ...DEFAULT_EDGE_SEMANTIC },
          customFields: [],
        };

        setEdges((eds) => resolveAutoEdges(nodes, addEdge(createEdge(serialized), eds)));
        setSelectedEdge(null);
      } finally {
        setConnectionState(null);
      }
    },
    [createEdge, nodes, resolveAutoEdges, snapshot, connectionState],
  );

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (tool === "connect") {
        if (!pendingConnectionSource) {
          setPendingConnectionSource(node.id);
          toast.info("Agora escolha o bloco de destino");
          return;
        }

        if (pendingConnectionSource === node.id) {
          toast.warning("Conexões para o mesmo bloco não são permitidas");
          return;
        }

        const id = `edge-${Date.now()}`;
        const serialized: FluxoEdgeSerialized = {
          id,
          source: pendingConnectionSource,
          target: node.id,
          sourceHandle: "auto",
          targetHandle: "auto",
          label: undefined,
          hiddenInfo: "",
          type: "orthogonal",
          stroke: "solid",
          hasArrow: true,
          style: { stroke: "#374151", strokeWidth: 2, strokeDasharray: null, markerEnd: "arrow" },
          routing: { mode: "auto", points: [], avoidCrossings: true },
          semantic: { ...DEFAULT_EDGE_SEMANTIC },
          customFields: [],
        };

        snapshot();
        setEdges((eds) => resolveAutoEdges(nodes, addEdge(createEdge(serialized), eds)));
        setPendingConnectionSource(null);
      } else {
        setSelectedNode(node);
        setSelectedEdge(null);
      }
    },
    [tool, pendingConnectionSource, createEdge, nodes, resolveAutoEdges, snapshot],
  );

  const addBlock = useCallback(
    (atFlow?: { x: number; y: number }) => {
      snapshot();
      const id = `node-${Date.now()}`;
      const pos = atFlow ?? { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 };
      const data: FluxoNodeData = {
        shape: "rounded-rectangle",
        title: "Novo bloco",
        summary: "",
        hiddenInfo: "",
        style: { ...DEFAULT_NODE_STYLE },
        icon: { type: "none", name: "", customSrc: null },
        semantic: { ...DEFAULT_SEMANTIC },
        width: 180,
        height: 80,
        customFields: [],
      };
      setNodes((nds) => [...nds, { id, type: "fluxo", position: pos, data }]);
    },
    [snapshot],
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push({ nodes, edges });
    isRestoringRef.current = true;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectionState(null);
    setPendingConnectionSource(null);
    queueMicrotask(() => {
      isRestoringRef.current = false;
    });
  }, [nodes, edges]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push({ nodes, edges });
    isRestoringRef.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectionState(null);
    setPendingConnectionSource(null);
    queueMicrotask(() => {
      isRestoringRef.current = false;
    });
  }, [nodes, edges]);

  const deleteSelection = useCallback(() => {
    const selectedNodeIds = new Set(
      nodes.filter((n) => n.selected || n.id === selectedNode?.id).map((n) => n.id),
    );
    const selectedEdgeIds = new Set(
      edges.filter((e) => e.selected || e.id === selectedEdge?.id).map((e) => e.id),
    );

    if (!selectedNodeIds.size && !selectedEdgeIds.size) return;

    snapshot();
    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !selectedEdgeIds.has(e.id) &&
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target),
      ),
    );
    setSelectedNode(null);
    setSelectedEdge(null);
    setNodeModalOpen(false);
    setEdgeModalOpen(false);
    setConnectionState(null);
    setPendingConnectionSource(null);
  }, [edges, nodes, selectedEdge?.id, selectedNode?.id, snapshot]);

  const duplicateSelection = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected || n.id === selectedNode?.id);
    if (!selectedNodes.length) return;

    snapshot();
    const idMap = new Map<string, string>();
    const timestamp = Date.now();
    const duplicatedNodes = selectedNodes.map((node, index) => {
      const newId = `node-${timestamp}-${index}`;
      idMap.set(node.id, newId);
      const data = node.data as FluxoNodeData;
      return {
        ...node,
        id: newId,
        selected: true,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        data: { ...data, title: `${data.title} cópia` },
      } satisfies Node;
    });

    const duplicatedEdges = edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map(
        (edge, index) =>
          ({
            ...edge,
            id: `edge-${timestamp}-${index}`,
            source: idMap.get(edge.source)!,
            target: idMap.get(edge.target)!,
            selected: true,
          }) satisfies Edge,
      );

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...duplicatedNodes]);
    setEdges((eds) => [...eds.map((e) => ({ ...e, selected: false })), ...duplicatedEdges]);
    setSelectedNode(duplicatedNodes[0] ?? null);
    setSelectedEdge(null);
    setPendingConnectionSource(null);
  }, [edges, nodes, selectedNode?.id, snapshot]);

  const selectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
    setSelectedNode(null);
    setSelectedEdge(null);
    setPendingConnectionSource(null);
  }, []);

  const organize = useCallback(
    (dir: FlowLayoutDirection = "horizontal") => {
      snapshot();
      const nextNodes = calculateAutoLayout(nodes, edges, {
        direction: dir,
        layerGap: dir === "compact" ? 200 : dir === "radial" ? 160 : 220,
        nodeGap: dir === "compact" ? 120 : 260,
        startX: 180,
        startY: 140,
      });
      setNodes(nextNodes);
      setEdges((eds) => resolveAutoEdges(nextNodes, eds));
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    },
    [edges, nodes, fitView, resolveAutoEdges, snapshot],
  );

  const updateSelectedEdge = useCallback(
    (updater: (edge: Edge) => Edge) => {
      if (!selectedEdge) return;
      snapshot();
      setEdges((eds) => {
        const nextEdges = eds.map((edge) => (edge.id === selectedEdge.id ? updater(edge) : edge));
        const updatedEdge = nextEdges.find((edge) => edge.id === selectedEdge.id) ?? null;
        setSelectedEdge(updatedEdge);
        return resolveAutoEdges(nodes, nextEdges);
      });
    },
    [nodes, resolveAutoEdges, selectedEdge, snapshot],
  );

  const setSelectedEdgeAutoRouting = useCallback(() => {
    updateSelectedEdge((edge) => {
      const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
      if (!data) return edge;

      return {
        ...edge,
        sourceHandle: "auto",
        targetHandle: "auto",
        data: {
          ...data,
          sourceHandle: "auto",
          targetHandle: "auto",
          routing: { ...(data.routing ?? {}), mode: "auto", points: [] },
        },
      };
    });
  }, [updateSelectedEdge]);

  const setSelectedEdgeDeviation = useCallback(
    (axis: "x" | "y") => {
      updateSelectedEdge((edge) => {
        const data = (edge.data as FluxoEdgeData | undefined) ?? undefined;
        if (!data) return edge;

        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        const midX = ((source?.position.x ?? 0) + (target?.position.x ?? 0)) / 2;
        const midY = ((source?.position.y ?? 0) + (target?.position.y ?? 0)) / 2;
        const currentPoint = data.routing?.points?.[0] ?? { x: midX, y: midY };
        const controlPoint =
          axis === "x" ? { x: currentPoint.x + 80, y: midY } : { x: midX, y: currentPoint.y + 80 };

        return {
          ...edge,
          data: {
            ...data,
            routing: {
              ...(data.routing ?? {}),
              mode: "manual",
              points: [controlPoint],
            },
          },
        };
      });
    },
    [nodes, updateSelectedEdge],
  );

  const invertSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;

    snapshot();
    setEdges((eds) => {
      const nextEdges = eds.map((edge) => {
        if (edge.id !== selectedEdge.id) return edge;

        const data = edge.data as FluxoEdgeData | undefined;

        return {
          ...edge,
          source: edge.target,
          target: edge.source,
          sourceHandle: "auto",
          targetHandle: "auto",
          data: data
            ? {
                ...data,
                sourceHandle: "auto",
                targetHandle: "auto",
                routing: {
                  ...(data.routing ?? {}),
                  mode: "auto",
                  points: [],
                },
              }
            : edge.data,
        } satisfies Edge;
      });

      const resolvedEdges = resolveAutoEdges(nodes, nextEdges);
      setSelectedEdge(resolvedEdges.find((edge) => edge.id === selectedEdge.id) ?? null);
      return resolvedEdges;
    });
  }, [nodes, resolveAutoEdges, selectedEdge, snapshot]);
  const exportJson = useCallback(() => {
    try {
      const current = reactFlowToFlowProject({ ...projectRef.current, background }, nodes, edges);
      const file = projectToFlowFile(current);
      const blob = new Blob([stringifyFlowFile(file)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFlowFileName(file.project.name);
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fluxo exportado.");
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível exportar o fluxo.");
    }
  }, [nodes, edges, background]);

  const exportPng = useCallback(async () => {
    try {
      await exportFlowPng({
        root: wrapperRef.current,
        fileName: getFlowFileName(projectRef.current.name).replace(/\.flow\.json$/i, ".png"),
        backgroundColor: background,
      });
      toast.success("PNG exportado.");
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível exportar PNG.");
    }
  }, [background]);

  const triggerImport = useCallback(() => fileInputRef.current?.click(), []);

  const onImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseFlowFileJson(String(reader.result));
        if (!parsed.ok || !parsed.file) {
          toast.error(parsed.error ?? "Arquivo inválido.");
          return;
        }

        try {
          snapshot();
          const importedProject = flowFileToProject(parsed.file);
          const rf = flowProjectToReactFlow(importedProject);
          persistProject(importedProject);
          setBackground(importedProject.background);
          setGridOn(importedProject.settings?.gridVisible ?? true);
          setSnapOn(importedProject.settings?.snapToGrid ?? true);
          setNodes(rf.nodes);
          setEdges(rf.edges);
          setSelectedNode(null);
          setSelectedEdge(null);
          setConnectionState(null);
          setPendingConnectionSource(null);
          toast.success("Fluxo importado.");
        } catch (error) {
          toast.error((error as Error).message || "Não foi possível importar o fluxo.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [persistProject, snapshot],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      )
        return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrl && key === "s") {
        e.preventDefault();
        exportJson();
        return;
      }
      if (ctrl && key === "e") {
        e.preventDefault();
        exportJson();
        return;
      }
      if (ctrl && key === "o") {
        e.preventDefault();
        triggerImport();
        return;
      }
      if (ctrl && key === "p") {
        e.preventDefault();
        void exportPng();
        return;
      }
      if (ctrl && key === "l") {
        e.preventDefault();
        organize("horizontal");
        return;
      }
      if (ctrl && key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (ctrl && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && key === "d") {
        e.preventDefault();
        duplicateSelection();
        return;
      }
      if (ctrl && key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }
      if (ctrl && e.key === "0") {
        e.preventDefault();
        fitView({ padding: 0.2 });
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
        return;
      }
      if (e.key === "Escape") {
        setSelectedNode(null);
        setSelectedEdge(null);
        setNodeModalOpen(false);
        setEdgeModalOpen(false);
        setConnectionState(null);
        setPendingConnectionSource(null);
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        setPresentation((v) => !v);
        return;
      }

      if (key === "v") setTool("select");
      else if (key === "b") addBlock();
      else if (key === "f") setTool("shape");
      else if (key === "l") setTool("line");
      else if (key === "a") setTool("arrow");
      else if (key === "c") setTool("connect");
      else if (key === "t") setTool("text");
      else if (key === "g") setGridOn((v) => !v);
      else if (key === "s") setSnapOn((v) => !v);
      else if (key === "?") setHelpOpen(true);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    addBlock,
    deleteSelection,
    duplicateSelection,
    exportJson,
    exportPng,
    fitView,
    organize,
    redo,
    selectAll,
    triggerImport,
    undo,
  ]);

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === "block") {
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        addBlock(pos);
        setTool("select");
      }
      setSelectedNode(null);
      setSelectedEdge(null);
      setConnectionState(null);
      setPendingConnectionSource(null);
    },
    [tool, addBlock, screenToFlowPosition],
  );

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setConnectionState(null);
    setPendingConnectionSource(null);
  }, []);

  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    setSelectedNode(node);
    setNodeModalOpen(true);
    setPendingConnectionSource(null);
  }, []);

  const onEdgeDoubleClick = useCallback((_: unknown, edge: Edge) => {
    setSelectedEdge(edge);
    setEdgeModalOpen(true);
  }, []);

  const onSaveNode = useCallback(
    (data: FluxoNodeData) => {
      if (!selectedNode) return;
      snapshot();
      setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data } : n)));
      setSelectedNode((n) => (n ? { ...n, data } : n));
    },
    [selectedNode, snapshot],
  );

  const activeSelectedNode = useMemo(
    () =>
      selectedNode ? (nodes.find((node) => node.id === selectedNode.id) ?? selectedNode) : null,
    [nodes, selectedNode],
  );

  const updateSelectedNodeTitle = useCallback(
    (title: string) => {
      const nodeId = selectedNode?.id;
      if (!nodeId) return;

      if (inlineRenameNodeIdRef.current !== nodeId) {
        snapshot();
        inlineRenameNodeIdRef.current = nodeId;
      }

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;

          const data = node.data as FluxoNodeData;
          return {
            ...node,
            data: {
              ...data,
              title,
            },
          };
        }),
      );

      setSelectedNode((node) => {
        if (!node || node.id !== nodeId) return node;

        const data = node.data as FluxoNodeData;
        return {
          ...node,
          data: {
            ...data,
            title,
          },
        };
      });
    },
    [selectedNode?.id, snapshot],
  );

  const finishInlineRename = useCallback(() => {
    inlineRenameNodeIdRef.current = null;
  }, []);

  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    deleteSelection();
  }, [deleteSelection, selectedNode]);

  const onSaveEdge = useCallback(
    (data: FluxoEdgeData) => {
      if (!selectedEdge) return;
      snapshot();
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== selectedEdge.id) return edge;
          return createEdge({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle:
              data.sourceHandle ??
              (edge.sourceHandle as FluxoEdgeSerialized["sourceHandle"]) ??
              "auto",
            targetHandle:
              data.targetHandle ??
              (edge.targetHandle as FluxoEdgeSerialized["targetHandle"]) ??
              "auto",
            label: data.label,
            hiddenInfo: data.hiddenInfo,
            type: data.lineType,
            stroke: data.stroke,
            hasArrow: data.hasArrow,
            style: data.style ?? {
              stroke: "#374151",
              strokeWidth: 2,
              strokeDasharray: data.stroke === "dashed" ? "5 4" : null,
              markerEnd: data.hasArrow ? "arrow" : "none",
            },
            routing: data.routing ?? { mode: "auto", points: [], avoidCrossings: true },
            semantic: data.semantic,
            customFields: data.customFields ?? [],
          });
        }),
      );
      setSelectedEdge((edge) => (edge ? { ...edge, data, label: data.label } : edge));
    },
    [createEdge, selectedEdge, snapshot],
  );

  const onDeleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    deleteSelection();
  }, [deleteSelection, selectedEdge]);

  const updateProjectName = useCallback(
    (name: string) => {
      const next = { ...projectRef.current, name, updatedAt: new Date().toISOString() };
      persistProject(next);
    },
    [persistProject],
  );

  return (
    <div ref={wrapperRef} className="relative h-screen w-screen overflow-hidden bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.flow,.flow.json,application/json"
        className="hidden"
        onChange={onImportFile}
      />

      {!presentation && (
        <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-border bg-card/85 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Fluxo
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <input
                value={project.name}
                onChange={(e) => updateProjectName(e.target.value)}
                className="bg-transparent font-display text-base italic tracking-tight outline-none focus:underline"
                style={{ width: `${Math.max(project.name.length, 8)}ch` }}
              />
            </div>
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
              · {nodes.length} blocos · {edges.length} setas
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full gap-1.5">
                  <Palette className="h-4 w-4" />
                  Aparência
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div>
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Cor do canvas
                  </Label>
                  <div className="mt-2 flex items-center overflow-hidden rounded-md border border-border bg-background">
                    <label className="relative h-9 w-10 cursor-pointer border-r border-border">
                      <span className="absolute inset-1 rounded" style={{ background }} />
                      <input
                        type="color"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                    <Input
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="h-9 border-0 font-mono text-xs focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Predefinidos
                  </Label>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {["#ffffff", "#fafaf7", "#f7f1e6", "#e0eefb", "#ece6f5", "#0f172a"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setBackground(color)}
                          className={`h-8 rounded-md border transition ${
                            background === color
                              ? "border-foreground ring-2 ring-foreground/20"
                              : "border-border hover:border-foreground/40"
                          }`}
                          style={{ background: color }}
                        />
                      ),
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  Organizar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => organize("horizontal")}>
                  Horizontal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => organize("vertical")}>Vertical</DropdownMenuItem>
                <DropdownMenuItem onClick={() => organize("radial")}>Radial</DropdownMenuItem>
                <DropdownMenuItem onClick={() => organize("compact")}>Compacto</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpOpen(true)}
              className="rounded-full"
              title="Atalhos"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setPresentation(true)}
              className="rounded-full gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              <Presentation className="h-3.5 w-3.5" />
              Apresentar
            </Button>
          </div>
        </div>
      )}

      {presentation && (
        <button
          onClick={() => setPresentation(false)}
          className="absolute right-4 top-4 z-40 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Sair do modo apresentação
        </button>
      )}

      <div
        className="absolute inset-0"
        style={{
          paddingTop: presentation ? 0 : 48,
          paddingLeft: !presentation && toolbarMode === "side" ? 220 : 0,
        }}
      >
        <ReactFlow
          nodes={renderedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
          onNodeClick={handleNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeDragStart={snapshot}
          onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
            setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0]! : null);
            setSelectedEdge(selectedEdges.length === 1 ? selectedEdges[0]! : null);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid={snapOn}
          snapGrid={[16, 16]}
          fitView
          style={{ backgroundColor: background }}
          proOptions={{ hideAttribution: true }}
        >
          {gridOn ? (
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
          ) : null}
          <Controls position="bottom-right" showInteractive={false} className="!shadow-sm" />
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            maskColor="rgba(15,23,42,0.04)"
            nodeColor={(node) => (node.data as FluxoNodeData)?.style?.backgroundColor ?? "#ffffff"}
            nodeStrokeColor={(node) =>
              (node.data as FluxoNodeData)?.style?.borderColor ?? "#d1d5db"
            }
            style={{ width: 160, height: 110 }}
          />
        </ReactFlow>
      </div>

      {!presentation ? (
        <SelectionToolbar
          visible={Boolean(selectedNode || selectedEdge)}
          hasEdgeSelection={Boolean(selectedEdge)}
          nodeTitle={
            activeSelectedNode && !selectedEdge
              ? ((activeSelectedNode.data as FluxoNodeData).title ?? "")
              : undefined
          }
          onNodeTitleChange={
            activeSelectedNode && !selectedEdge ? updateSelectedNodeTitle : undefined
          }
          onNodeTitleCommit={finishInlineRename}
          onEdit={selectedEdge ? () => setEdgeModalOpen(true) : undefined}
          onDuplicate={activeSelectedNode && !selectedEdge ? duplicateSelection : undefined}
          onInvert={selectedEdge ? invertSelectedEdge : undefined}
          onAuto={setSelectedEdgeAutoRouting}
          onDeviationX={() => setSelectedEdgeDeviation("x")}
          onDeviationY={() => setSelectedEdgeDeviation("y")}
          onRemove={deleteSelection}
        />
      ) : null}

      <Toolbar
        mode={toolbarMode}
        onModeChange={setToolbarMode}
        tool={tool}
        onToolChange={setTool}
        gridOn={gridOn}
        snapOn={snapOn}
        compactView={compactView}
        onToggleGrid={() => setGridOn((v) => !v)}
        onToggleSnap={() => setSnapOn((v) => !v)}
        onToggleCompactView={() => setCompactView((v) => !v)}
        onUndo={undo}
        onRedo={redo}
        onOrganize={() => organize("horizontal")}
        onExportJson={exportJson}
        onExportPng={() => void exportPng()}
        onImportJson={triggerImport}
        onFitView={() => fitView({ padding: 0.2 })}
        onPresentation={() => setPresentation(true)}
        onAddBlock={() => addBlock()}
      />

      <NodePropertiesModal
        open={nodeModalOpen}
        data={(selectedNode?.data as FluxoNodeData) ?? null}
        onOpenChange={setNodeModalOpen}
        onSave={onSaveNode}
        onDelete={onDeleteNode}
      />
      <EdgePropertiesModal
        open={edgeModalOpen}
        data={(selectedEdge?.data as FluxoEdgeData) ?? null}
        onOpenChange={setEdgeModalOpen}
        onSave={onSaveEdge}
        onDelete={onDeleteEdge}
      />
      <ShortcutHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
