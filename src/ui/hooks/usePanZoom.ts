import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  IDENTITY,
  fitToBounds,
  panBy,
  zoomToward,
  type Bounds,
  type Transform,
} from "./panZoomMath";

export interface UsePanZoomOptions {
  bounds: Bounds | null;
  viewportRef: RefObject<HTMLElement | SVGElement | null>;
}

export interface UsePanZoom {
  transform: Transform;
  onWheel: (e: WheelEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  reset: () => void;
}

export function usePanZoom({ bounds, viewportRef }: UsePanZoomOptions): UsePanZoom {
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    const el = viewportRef.current;
    if (!el || !bounds) {
      setTransform(IDENTITY);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTransform(fitToBounds(bounds, rect.width, rect.height));
  }, [bounds, viewportRef]);

  useEffect(() => {
    reset();
  }, [reset]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const factor = Math.exp(-e.deltaY * 0.002);
      setTransform((t) => zoomToward(t, point, factor));
    },
    [viewportRef],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler: EventListener = (e) => onWheel(e as WheelEvent);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [viewportRef, onWheel]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Only start drag tracking when pressing on the SVG background itself,
    // not when clicking through to a shape/connector (those have their own click).
    if (e.target !== e.currentTarget) return;
    const start = { x: e.clientX, y: e.clientY };
    draggingRef.current = start;
    let totalDx = 0;
    let totalDy = 0;
    const onMove = (ev: PointerEvent) => {
      const prev = draggingRef.current;
      if (!prev) return;
      const dx = ev.clientX - prev.x;
      const dy = ev.clientY - prev.y;
      totalDx += dx;
      totalDy += dy;
      draggingRef.current = { x: ev.clientX, y: ev.clientY };
      setTransform((t) => panBy(t, dx, dy));
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const moved = Math.abs(totalDx) + Math.abs(totalDy) > 4;
      if (moved) {
        const suppress = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
          window.removeEventListener("click", suppress, true);
        };
        window.addEventListener("click", suppress, true);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  return { transform, onWheel, onPointerDown, reset };
}
