import { useMemo, useRef } from "react";
import type { DrawingSurface } from "../../domain/model";
import {
  threatsByElement,
  threatsByFlow,
} from "../../domain/threat-views";
import { useModel } from "../context/ModelContext";
import { usePanZoom } from "../hooks/usePanZoom";
import { unionBounds, type Bounds } from "../hooks/panZoomMath";
import { Connector, ConnectorDefs } from "./diagram/Connector";
import { Shape } from "./diagram/Shape";

export interface DiagramPaneProps {
  surface: DrawingSurface;
}

export function DiagramPane({ surface }: DiagramPaneProps) {
  const { state, dispatch } = useModel();
  const containerRef = useRef<HTMLDivElement>(null);

  const bounds: Bounds | null = useMemo(() => {
    const borderRects = surface.borders.map((b) => ({
      x: b.position.left,
      y: b.position.top,
      width: b.position.width,
      height: b.position.height,
    }));
    const lineRects = surface.lines.flatMap((l) => [
      { x: l.source.x, y: l.source.y, width: 1, height: 1 },
      { x: l.target.x, y: l.target.y, width: 1, height: 1 },
      { x: l.handle.x, y: l.handle.y, width: 1, height: 1 },
    ]);
    return unionBounds([...borderRects, ...lineRects]);
  }, [surface]);

  const { transform, onPointerDown, reset } = usePanZoom({
    bounds,
    viewportRef: containerRef,
  });

  const elementCounts = useMemo(
    () => (state.model ? threatsByElement(state.model.threats) : new Map()),
    [state.model],
  );
  const flowCounts = useMemo(
    () => (state.model ? threatsByFlow(state.model.threats) : new Map()),
    [state.model],
  );

  const selectShape = (guid: string) =>
    dispatch({ type: "selectNode", selection: { kind: "element", guid } });
  const selectFlow = (guid: string) =>
    dispatch({ type: "selectNode", selection: { kind: "flow", guid } });

  const onBackgroundClick = () => dispatch({ type: "clearSelection" });

  return (
    <div
      ref={containerRef}
      data-testid="diagram-svg-container"
      className="relative h-full w-full overflow-hidden bg-white dark:bg-slate-900"
    >
      <button
        type="button"
        onClick={reset}
        className="absolute right-2 top-2 z-10 rounded border border-slate-300 bg-white/90 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90"
        aria-label="Reset view"
      >
        Reset view
      </button>
      <svg
        width="100%"
        height="100%"
        onPointerDown={onPointerDown}
        onClick={onBackgroundClick}
        style={{ cursor: "grab", touchAction: "none" }}
        data-testid="diagram-svg"
      >
        <ConnectorDefs />
        <g
          transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}
        >
          {/* Render boundaries first (so they sit underneath) */}
          {surface.borders
            .filter((b) => b.kind === "BorderBoundary")
            .map((b) => (
              <Shape
                key={b.guid}
                element={b}
                selected={
                  state.selection.kind === "element" &&
                  state.selection.guid === b.guid
                }
                onSelect={selectShape}
                threatCount={(elementCounts.get(b.guid) ?? []).length}
              />
            ))}
          {surface.lines.map((l) => (
            <Connector
              key={l.guid}
              line={l}
              selected={
                state.selection.kind === "flow" &&
                state.selection.guid === l.guid
              }
              onSelect={selectFlow}
              threatCount={(flowCounts.get(l.guid) ?? []).length}
            />
          ))}
          {surface.borders
            .filter((b) => b.kind !== "BorderBoundary")
            .map((b) => (
              <Shape
                key={b.guid}
                element={b}
                selected={
                  state.selection.kind === "element" &&
                  state.selection.guid === b.guid
                }
                onSelect={selectShape}
                threatCount={(elementCounts.get(b.guid) ?? []).length}
              />
            ))}
        </g>
      </svg>
    </div>
  );
}
