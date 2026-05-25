import type { BorderElement } from "../../../domain/model";

export interface ShapeProps {
  element: BorderElement;
  selected?: boolean;
  onSelect?: (guid: string) => void;
  threatCount?: number;
}

const FILL = "#ffffff";
const STROKE = "#1f2937";
const TEXT = "#0f172a";

export function Shape({ element, selected, onSelect, threatCount }: ShapeProps) {
  const { kind, position, name, outOfScope, xsiType } = element;
  const opacity = outOfScope ? 0.5 : 1;
  const dashed = outOfScope || kind === "BorderBoundary" || kind === "Unknown";
  const strokeDash = dashed ? "6 4" : undefined;
  const strokeWidth = selected ? 3 : kind === "BorderBoundary" ? 2 : 1.5;
  const stroke = selected ? "#2563eb" : kind === "BorderBoundary" ? "#475569" : STROKE;
  const fill = kind === "BorderBoundary" || kind === "Unknown" ? "transparent" : FILL;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(element.guid);
  };

  const cx = position.left + position.width / 2;
  const cy = position.top + position.height / 2;

  return (
    <g
      data-testid={`shape-${element.guid}`}
      data-kind={kind}
      data-selected={selected ? "true" : "false"}
      data-oos={outOfScope ? "true" : "false"}
      onClick={handleClick}
      style={{ cursor: "pointer", opacity }}
    >
      <title>{name || xsiType}</title>
      {kind === "StencilEllipse" && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={position.width / 2}
          ry={position.height / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
        />
      )}
      {kind === "StencilRectangle" && (
        <rect
          x={position.left}
          y={position.top}
          width={position.width}
          height={position.height}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
        />
      )}
      {kind === "StencilParallelLines" && (
        <>
          <rect
            x={position.left}
            y={position.top}
            width={position.width}
            height={position.height}
            fill={fill}
            stroke="none"
          />
          <line
            x1={position.left}
            y1={position.top}
            x2={position.left + position.width}
            y2={position.top}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
          <line
            x1={position.left}
            y1={position.top + position.height}
            x2={position.left + position.width}
            y2={position.top + position.height}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        </>
      )}
      {kind === "BorderBoundary" && (
        <rect
          x={position.left}
          y={position.top}
          width={position.width}
          height={position.height}
          fill="transparent"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray="10 6"
          pointerEvents="stroke"
        />
      )}
      {kind === "Unknown" && (
        <rect
          x={position.left}
          y={position.top}
          width={position.width}
          height={position.height}
          fill="#f1f5f9"
          stroke="#94a3b8"
          strokeWidth={strokeWidth}
          strokeDasharray="6 4"
        />
      )}

      <text
        x={cx}
        y={kind === "BorderBoundary" ? position.top + 14 : cy}
        textAnchor="middle"
        dominantBaseline={kind === "BorderBoundary" ? "hanging" : "middle"}
        fill={TEXT}
        fontSize={12}
        fontFamily="system-ui, sans-serif"
        pointerEvents="none"
      >
        {truncate(name || (kind === "Unknown" ? xsiType : ""), Math.max(8, Math.floor(position.width / 7)))}
      </text>

      {threatCount && threatCount > 0 && (
        <g
          transform={`translate(${position.left + position.width - 8}, ${position.top + 8})`}
          pointerEvents="none"
        >
          <circle r={9} fill="#ef4444" />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={10}
            fontWeight={700}
          >
            {threatCount > 99 ? "99+" : threatCount}
          </text>
        </g>
      )}
    </g>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + "…";
}
