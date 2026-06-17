import { toPng } from "html-to-image";

export type ExportFlowPngOptions = {
  root: HTMLElement | null;
  fileName: string;
  backgroundColor: string;
};

export async function exportFlowPng({ root, fileName, backgroundColor }: ExportFlowPngOptions) {
  const flowElement = root?.querySelector(".react-flow") as HTMLElement | null;

  if (!flowElement) {
    throw new Error("Não foi possível encontrar o canvas para exportar.");
  }

  const dataUrl = await toPng(flowElement, {
    cacheBust: true,
    backgroundColor,
    pixelRatio: 2,
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return (
        !node.classList.contains("react-flow__minimap") &&
        !node.classList.contains("react-flow__controls")
      );
    },
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = ensurePngExtension(fileName);
  link.click();
}

function ensurePngExtension(fileName: string) {
  const cleanName = fileName.trim() || "fluxo";
  return cleanName.toLowerCase().endsWith(".png") ? cleanName : `${cleanName}.png`;
}
