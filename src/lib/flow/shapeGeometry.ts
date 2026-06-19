import type { FlowHandlePosition, ShapeType } from "./types";

export type ShapeFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ShapePoint = {
  x: number;
  y: number;
};

export type PhysicalShapeHandle = Exclude<FlowHandlePosition, "auto">;

const DEFAULT_INSET = 4;
const MAX_DIAMOND_RATIO = 1.35;
const THIRD = 1 / 3;
const TWO_THIRDS = 2 / 3;

const HANDLE_IDS: PhysicalShapeHandle[] = [
  "top-left",
  "top",
  "top-right",
  "right-top",
  "right",
  "right-bottom",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left-bottom",
  "left",
  "left-top",
];

const CIRCLE_HANDLE_ANGLES: Record<PhysicalShapeHandle, number> = {
  "top-left": -120,
  top: -90,
  "top-right": -60,
  "right-top": -30,
  right: 0,
  "right-bottom": 30,
  "bottom-right": 60,
  bottom: 90,
  "bottom-left": 120,
  "left-bottom": 150,
  left: 180,
  "left-top": -150,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function centerFrame(width: number, height: number, frameWidth: number, frameHeight: number) {
  return {
    x: (width - frameWidth) / 2,
    y: (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  };
}

function insetFrame(width: number, height: number, inset = DEFAULT_INSET): ShapeFrame {
  const safeInset = Math.max(0, inset);
  return {
    x: safeInset,
    y: safeInset,
    width: Math.max(1, width - safeInset * 2),
    height: Math.max(1, height - safeInset * 2),
  };
}

function pointOnSegment(start: ShapePoint, end: ShapePoint, progress: number): ShapePoint {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

function ellipsePoint(cx: number, cy: number, rx: number, ry: number, degrees: number): ShapePoint {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * rx,
    y: cy + Math.sin(radians) * ry,
  };
}

export function getShapeDrawFrame(
  shape: ShapeType,
  width: number,
  height: number,
  inset = DEFAULT_INSET,
): ShapeFrame {
  const frame = insetFrame(width, height, inset);

  if (shape === "circle") {
    const size = Math.max(1, Math.min(frame.width, frame.height));
    return centerFrame(width, height, size, size);
  }

  if (shape === "diamond") {
    let diamondWidth = frame.width;
    let diamondHeight = frame.height;
    const ratio = diamondWidth / diamondHeight;

    if (ratio > MAX_DIAMOND_RATIO) {
      diamondWidth = diamondHeight * MAX_DIAMOND_RATIO;
    } else if (ratio < 1 / MAX_DIAMOND_RATIO) {
      diamondHeight = diamondWidth * MAX_DIAMOND_RATIO;
    }

    return centerFrame(width, height, diamondWidth, diamondHeight);
  }

  return frame;
}

export function getShapeContentFrame(
  shape: ShapeType,
  width: number,
  height: number,
  padding: number,
): ShapeFrame {
  const drawFrame = getShapeDrawFrame(shape, width, height, Math.max(4, padding * 0.35));

  if (shape === "diamond") {
    const contentWidth = drawFrame.width * 0.58;
    const contentHeight = drawFrame.height * 0.58;
    return centerFrame(width, height, contentWidth, contentHeight);
  }

  if (shape === "circle") {
    const contentSize = Math.min(drawFrame.width, drawFrame.height) * 0.7;
    return centerFrame(width, height, contentSize, contentSize);
  }

  if (shape === "hexagon") {
    return {
      x: drawFrame.x + drawFrame.width * 0.16,
      y: drawFrame.y + padding,
      width: Math.max(1, drawFrame.width * 0.68),
      height: Math.max(1, drawFrame.height - padding * 2),
    };
  }

  if (shape === "cylinder") {
    const capHeight = getCylinderCapHeight(drawFrame.height);
    return {
      x: drawFrame.x + padding,
      y: drawFrame.y + capHeight * 0.72,
      width: Math.max(1, drawFrame.width - padding * 2),
      height: Math.max(1, drawFrame.height - capHeight * 1.2),
    };
  }

  return {
    x: padding,
    y: padding,
    width: Math.max(1, width - padding * 2),
    height: Math.max(1, height - padding * 2),
  };
}

export function getShapeConnectionPoints(
  shape: ShapeType,
  width: number,
  height: number,
  inset = DEFAULT_INSET,
): Record<PhysicalShapeHandle, ShapePoint> {
  return HANDLE_IDS.reduce(
    (acc, handleId) => {
      acc[handleId] = getShapeConnectionPoint(shape, width, height, handleId, inset);
      return acc;
    },
    {} as Record<PhysicalShapeHandle, ShapePoint>,
  );
}

export function getShapeConnectionPoint(
  shape: ShapeType,
  width: number,
  height: number,
  handleId: FlowHandlePosition,
  inset = DEFAULT_INSET,
): ShapePoint {
  if (handleId === "auto") {
    return { x: width / 2, y: height / 2 };
  }

  const frame = getShapeDrawFrame(shape, width, height, inset);

  if (shape === "circle") {
    return getCircleConnectionPoint(frame, handleId);
  }

  if (shape === "diamond") {
    return getDiamondConnectionPoint(frame, handleId);
  }

  if (shape === "hexagon") {
    return getHexagonConnectionPoint(frame, handleId);
  }

  if (shape === "cylinder") {
    return getCylinderConnectionPoint(frame, handleId);
  }

  return getRectangleConnectionPoint(frame, handleId);
}

export function getDiamondPoints(frame: ShapeFrame) {
  const vertices = getDiamondVertices(frame);
  return [
    `${vertices.top.x},${vertices.top.y}`,
    `${vertices.right.x},${vertices.right.y}`,
    `${vertices.bottom.x},${vertices.bottom.y}`,
    `${vertices.left.x},${vertices.left.y}`,
  ].join(" ");
}

export function getHexagonPoints(frame: ShapeFrame) {
  const vertices = getHexagonVertices(frame);
  return [
    `${vertices.topLeft.x},${vertices.topLeft.y}`,
    `${vertices.topRight.x},${vertices.topRight.y}`,
    `${vertices.right.x},${vertices.right.y}`,
    `${vertices.bottomRight.x},${vertices.bottomRight.y}`,
    `${vertices.bottomLeft.x},${vertices.bottomLeft.y}`,
    `${vertices.left.x},${vertices.left.y}`,
  ].join(" ");
}

export function getCylinderCapHeight(height: number) {
  return clamp(height * 0.24, 12, Math.max(12, Math.min(34, height * 0.42)));
}

function getRectangleConnectionPoint(frame: ShapeFrame, handleId: PhysicalShapeHandle): ShapePoint {
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;

  switch (handleId) {
    case "top-left":
      return { x: frame.x + frame.width * 0.25, y: frame.y };
    case "top":
      return { x: centerX, y: frame.y };
    case "top-right":
      return { x: frame.x + frame.width * 0.75, y: frame.y };
    case "right-top":
      return { x: right, y: frame.y + frame.height * 0.25 };
    case "right":
      return { x: right, y: centerY };
    case "right-bottom":
      return { x: right, y: frame.y + frame.height * 0.75 };
    case "bottom-right":
      return { x: frame.x + frame.width * 0.75, y: bottom };
    case "bottom":
      return { x: centerX, y: bottom };
    case "bottom-left":
      return { x: frame.x + frame.width * 0.25, y: bottom };
    case "left-bottom":
      return { x: frame.x, y: frame.y + frame.height * 0.75 };
    case "left":
      return { x: frame.x, y: centerY };
    case "left-top":
      return { x: frame.x, y: frame.y + frame.height * 0.25 };
  }
}

function getCircleConnectionPoint(frame: ShapeFrame, handleId: PhysicalShapeHandle): ShapePoint {
  const radius = Math.min(frame.width, frame.height) / 2;
  return ellipsePoint(
    frame.x + frame.width / 2,
    frame.y + frame.height / 2,
    radius,
    radius,
    CIRCLE_HANDLE_ANGLES[handleId],
  );
}

function getDiamondConnectionPoint(frame: ShapeFrame, handleId: PhysicalShapeHandle): ShapePoint {
  const vertices = getDiamondVertices(frame);

  switch (handleId) {
    case "top":
      return vertices.top;
    case "right":
      return vertices.right;
    case "bottom":
      return vertices.bottom;
    case "left":
      return vertices.left;
    case "top-left":
      return pointOnSegment(vertices.top, vertices.left, THIRD);
    case "left-top":
      return pointOnSegment(vertices.top, vertices.left, TWO_THIRDS);
    case "top-right":
      return pointOnSegment(vertices.top, vertices.right, THIRD);
    case "right-top":
      return pointOnSegment(vertices.top, vertices.right, TWO_THIRDS);
    case "right-bottom":
      return pointOnSegment(vertices.right, vertices.bottom, THIRD);
    case "bottom-right":
      return pointOnSegment(vertices.right, vertices.bottom, TWO_THIRDS);
    case "bottom-left":
      return pointOnSegment(vertices.bottom, vertices.left, THIRD);
    case "left-bottom":
      return pointOnSegment(vertices.bottom, vertices.left, TWO_THIRDS);
  }
}

function getHexagonConnectionPoint(frame: ShapeFrame, handleId: PhysicalShapeHandle): ShapePoint {
  const vertices = getHexagonVertices(frame);

  switch (handleId) {
    case "top-left":
      return vertices.topLeft;
    case "top":
      return pointOnSegment(vertices.topLeft, vertices.topRight, 0.5);
    case "top-right":
      return vertices.topRight;
    case "right-top":
      return pointOnSegment(vertices.topRight, vertices.right, 0.5);
    case "right":
      return vertices.right;
    case "right-bottom":
      return pointOnSegment(vertices.right, vertices.bottomRight, 0.5);
    case "bottom-right":
      return vertices.bottomRight;
    case "bottom":
      return pointOnSegment(vertices.bottomRight, vertices.bottomLeft, 0.5);
    case "bottom-left":
      return vertices.bottomLeft;
    case "left-bottom":
      return pointOnSegment(vertices.bottomLeft, vertices.left, 0.5);
    case "left":
      return vertices.left;
    case "left-top":
      return pointOnSegment(vertices.left, vertices.topLeft, 0.5);
  }
}

function getCylinderConnectionPoint(frame: ShapeFrame, handleId: PhysicalShapeHandle): ShapePoint {
  const capHeight = getCylinderCapHeight(frame.height);
  const left = frame.x;
  const right = frame.x + frame.width;
  const cx = frame.x + frame.width / 2;
  const topCy = frame.y + capHeight / 2;
  const bottomCy = frame.y + frame.height - capHeight / 2;
  const rx = frame.width / 2;
  const ry = capHeight / 2;
  const centerY = frame.y + frame.height / 2;

  switch (handleId) {
    case "top-left":
      return ellipsePoint(cx, topCy, rx, ry, -135);
    case "top":
      return ellipsePoint(cx, topCy, rx, ry, -90);
    case "top-right":
      return ellipsePoint(cx, topCy, rx, ry, -45);
    case "right-top":
      return { x: right, y: topCy };
    case "right":
      return { x: right, y: centerY };
    case "right-bottom":
      return { x: right, y: bottomCy };
    case "bottom-right":
      return ellipsePoint(cx, bottomCy, rx, ry, 45);
    case "bottom":
      return ellipsePoint(cx, bottomCy, rx, ry, 90);
    case "bottom-left":
      return ellipsePoint(cx, bottomCy, rx, ry, 135);
    case "left-bottom":
      return { x: left, y: bottomCy };
    case "left":
      return { x: left, y: centerY };
    case "left-top":
      return { x: left, y: topCy };
  }
}

function getDiamondVertices(frame: ShapeFrame) {
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;

  return {
    top: { x: cx, y: frame.y },
    right: { x: frame.x + frame.width, y: cy },
    bottom: { x: cx, y: frame.y + frame.height },
    left: { x: frame.x, y: cy },
  };
}

function getHexagonVertices(frame: ShapeFrame) {
  const inset = frame.width * 0.22;
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;
  const cy = frame.y + frame.height / 2;

  return {
    topLeft: { x: frame.x + inset, y: frame.y },
    topRight: { x: right - inset, y: frame.y },
    right: { x: right, y: cy },
    bottomRight: { x: right - inset, y: bottom },
    bottomLeft: { x: frame.x + inset, y: bottom },
    left: { x: frame.x, y: cy },
  };
}
