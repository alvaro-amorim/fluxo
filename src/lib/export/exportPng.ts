import { toPng } from "html-to-image";

export type ExportFlowPngOptions = {
  root: HTMLElement | null;
  fileName: string;
  backgroundColor: string;
  margin?: number;
};

export async function exportFlowPng({
  root,
  fileName,
  backgroundColor,
  margin = 48,
}: ExportFlowPngOptions) {
  const flowElement = root?.querySelector(".react-flow") as HTMLElement | null;
  const viewportElement = root?.querySelector(".react-flow__viewport") as HTMLElement | null;

  if (!flowElement || !viewportElement) {
    throw new Error("Não foi possível encontrar o canvas para exportar.");
  }

  const options = getFullFlowExportOptions(flowElement, viewportElement, backgroundColor, margin);

  try {
    const dataUrl = await toPng(viewportElement, options);
    downloadDataUrl(dataUrl, fileName);
  } catch (error) {
    console.warn("Falha ao exportar fluxo completo. Tentando exportar viewport visível.", error);

    const fallbackDataUrl = await toPng(flowElement, {
      cacheBust: true,
      backgroundColor,
      pixelRatio: 2,
      filter: shouldExportNode,
    });

    downloadDataUrl(fallbackDataUrl, fileName);
  }
}

function getFullFlowExportOptions(
  flowElement: HTMLElement,
  viewportElement: HTMLElement,
  backgroundColor: string,
  margin: number,
) {
  const nodeBounds = getNodeBounds(flowElement);

  if (!nodeBounds) {
    return {
      cacheBust: true,
      backgroundColor,
      pixelRatio: 2,
      filter: shouldExportNode,
    };
  }

  const computedTransform = getComputedStyle(viewportElement).transform;
  const originalTransform = computedTransform && computedTransform !== "none" ? computedTransform : "";
  const width = Math.ceil(nodeBounds.width + margin * 2);
  const height = Math.ceil(nodeBounds.height + margin * 2);
  const translateX = margin - nodeBounds.x;
  const translateY = margin - nodeBounds.y;

  return {
    cacheBust: true,
    backgroundColor,
    pixelRatio: 2,
    width,
    height,
    filter: shouldExportNode,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${translateX}px, ${translateY}px) ${originalTransform}`.trim(),
      transformOrigin: "top left",
    },
  };
}

function getNodeBounds(flowElement: HTMLElement) {
  const flowRect = flowElement.getBoundingClientRect();
  const nodeElements = Array.from(flowElement.querySelectorAll(".react-flow__node")) as HTMLElement[];

  if (nodeElements.length === 0) {
    return null;
  }

  const bounds = nodeElements.reduce(
    (acc, nodeElement) => {
      const rect = nodeElement.getBoundingClientRect();
      return {
        minX: Math.min(acc.minX, rect.left - flowRect.left),
        minY: Math.min(acc.minY, rect.top - flowRect.top),
        maxX: Math.max(acc.maxX, rect.right - flowRect.left),
        maxY: Math.max(acc.maxY, rect.bottom - flowRect.top),
      };
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY)) {
    return null;
  }

  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

function shouldExportNode(node: HTMLElement | Element) {
  if (!(node instanceof HTMLElement)) return true;
  return (
    !node.classList.contains("react-flow__minimap") &&
    !node.classList.contains("react-flow__controls")
  );
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = ensurePngExtension(fileName);
  link.click();
}

function ensurePngExtension(fileName: string) {
  const cleanName = fileName.trim() || "fluxo";
  return cleanName.toLowerCase().endsWith(".png") ? cleanName : `${cleanName}.png`;
}
