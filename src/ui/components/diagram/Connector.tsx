import type { LineElement, Point } from "../../../domain/model";

export interface ConnectorProps {
  line: LineElement;
  selected?: boolean;
  onSelect?: (guid: string) => void;
  threatCount?: number;
}

export function quadraticPath(source: Point, handle: Point, target: Point): string {
  return `M ${source.x} ${source.y} Q ${handle.x} ${handle.y} ${target.x} ${target.y}`;
}

export function midpointOnQuadratic(
  source: Point,
  handle: Point,
  target: Point,
  t = 0.5,
): Point {
  const omt = 1 - t;
  return {
    x: omt * omt * source.x + 2 * omt * t * handle.x + t * t * target.x,
    y: omt * omt * source.y + 2 * omt * t * handle.y + t * t * target.y,
  };
}

export const ARROW_MARKER_ID = "tm-arrow";

export function ConnectorDefs() {
  return (
    <defs>
      <marker
        id={ARROW_MARKER_ID}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2937" />
      </marker>
    </defs>
  );
}

export function Connector({
  line,
  selected,
  onSelect,
  threatCount,
}: ConnectorProps) {
  const isBoundary = line.kind === "LineBoundary";
  const stroke = selected ? "#2563eb" : isBoundary ? "#475569" : "#1f2937";
  const strokeWidth = selected ? 2.5 : 1.5;
  const dash = isBoundary ? "8 6" : undefined;
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(line.guid);
  };
  const mid = midpointOnQuadratic(line.source, line.handle, line.target);

  return (
    <g
      data-testid={`connector-${line.guid}`}
      data-kind={line.kind}
      data-selected={selected ? "true" : "false"}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <title>{line.name || line.kind}</title>
      {/* invisible wider hit target */}
      <path
        d={quadraticPath(line.source, line.handle, line.target)}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        pointerEvents="stroke"
      />
      <path
        d={quadraticPath(line.source, line.handle, line.target)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        markerEnd={isBoundary ? undefined : `url(#${ARROW_MARKER_ID})`}
        pointerEvents="none"
      />
      {line.name && !isBoundary && (
        <text
          x={mid.x}
          y={mid.y - 6}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          pointerEvents="none"
        >
          {line.name}
        </text>
      )}
      {threatCount && threatCount > 0 && (
        <g transform={`translate(${mid.x + 14}, ${mid.y - 14})`} pointerEvents="none">
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
