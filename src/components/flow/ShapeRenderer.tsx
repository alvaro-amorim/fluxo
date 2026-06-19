import type { ShapeType } from "@/lib/flow/types";
import {
  getCylinderCapHeight,
  getDiamondPoints,
  getHexagonPoints,
  getShapeDrawFrame,
  type ShapeFrame,
} from "@/lib/flow/shapeGeometry";

type ShapeRendererProps = {
  shape: ShapeType;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  borderRadius?: number;
  selected?: boolean;
};

export function ShapeRenderer({
  shape,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 1.5,
  borderRadius = 12,
  selected = false,
}: ShapeRendererProps) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const baseStroke = selected ? "var(--brand)" : stroke;
  const frame = getShapeDrawFrame(shape, safeWidth, safeHeight, Math.max(4, strokeWidth + 3));

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${safeWidth} ${safeHeight}`}
      preserveAspectRatio="none"
    >
      {selected ? (
        <ShapePrimitive
          shape={shape}
          frame={frame}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={Math.max(strokeWidth + 5, 6)}
          borderRadius={borderRadius}
          opacity={0.24}
        />
      ) : null}
      <ShapePrimitive
        shape={shape}
        frame={frame}
        fill={fill}
        stroke={baseStroke}
        strokeWidth={selected ? Math.max(strokeWidth + 0.75, 2.25) : strokeWidth}
        borderRadius={borderRadius}
      />
      {selected ? (
        <ShapePrimitive
          shape={shape}
          frame={frame}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={1.2}
          borderRadius={borderRadius}
          opacity={0.9}
        />
      ) : null}
    </svg>
  );
}

function ShapePrimitive({
  shape,
  frame,
  fill,
  stroke,
  strokeWidth,
  borderRadius,
  opacity,
}: {
  shape: ShapeType;
  frame: ShapeFrame;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  opacity?: number;
}) {
  const common = {
    fill,
    stroke,
    strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
    opacity,
  };

  if (shape === "diamond") {
    return <polygon points={getDiamondPoints(frame)} {...common} />;
  }

  if (shape === "hexagon") {
    return <polygon points={getHexagonPoints(frame)} {...common} strokeLinejoin="round" />;
  }

  if (shape === "circle") {
    const radius = Math.min(frame.width, frame.height) / 2;
    return (
      <circle
        cx={frame.x + frame.width / 2}
        cy={frame.y + frame.height / 2}
        r={radius}
        {...common}
      />
    );
  }

  if (shape === "cylinder") {
    return <CylinderShape frame={frame} {...common} />;
  }

  const rx =
    shape === "rounded-rectangle"
      ? Math.min(borderRadius, frame.width / 4, frame.height / 4)
      : Math.min(2, frame.width / 4, frame.height / 4);

  return (
    <rect
      x={frame.x}
      y={frame.y}
      width={frame.width}
      height={frame.height}
      rx={rx}
      ry={rx}
      {...common}
    />
  );
}

function CylinderShape({
  frame,
  fill,
  stroke,
  strokeWidth,
  vectorEffect,
  opacity,
}: {
  frame: ShapeFrame;
  fill: string;
  stroke: string;
  strokeWidth: number;
  vectorEffect: "non-scaling-stroke";
  opacity?: number;
}) {
  const capHeight = getCylinderCapHeight(frame.height);
  const left = frame.x;
  const right = frame.x + frame.width;
  const cx = frame.x + frame.width / 2;
  const topCy = frame.y + capHeight / 2;
  const bottomCy = frame.y + frame.height - capHeight / 2;
  const rx = frame.width / 2;
  const ry = capHeight / 2;
  const bodyPath = [
    `M ${left} ${topCy}`,
    `C ${left} ${topCy - ry} ${right} ${topCy - ry} ${right} ${topCy}`,
    `L ${right} ${bottomCy}`,
    `C ${right} ${bottomCy + ry} ${left} ${bottomCy + ry} ${left} ${bottomCy}`,
    "Z",
  ].join(" ");

  return (
    <g opacity={opacity}>
      <path
        d={bodyPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect={vectorEffect}
        strokeLinejoin="round"
      />
      <ellipse
        cx={cx}
        cy={topCy}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect={vectorEffect}
      />
    </g>
  );
}
