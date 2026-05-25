export interface Transform {
  tx: number;
  ty: number;
  scale: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const IDENTITY: Transform = { tx: 0, ty: 0, scale: 1 };
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 8;

export function clampScale(s: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
}

export function fitToBounds(
  bounds: Bounds,
  viewportWidth: number,
  viewportHeight: number,
  paddingFraction = 0.08,
): Transform {
  if (
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return IDENTITY;
  }
  const pad = 1 - paddingFraction;
  const scale = clampScale(
    Math.min(
      (viewportWidth / bounds.width) * pad,
      (viewportHeight / bounds.height) * pad,
    ),
  );
  const tx = (viewportWidth - bounds.width * scale) / 2 - bounds.x * scale;
  const ty = (viewportHeight - bounds.height * scale) / 2 - bounds.y * scale;
  return { tx, ty, scale };
}

export function zoomToward(
  current: Transform,
  screenPoint: { x: number; y: number },
  factor: number,
): Transform {
  const nextScale = clampScale(current.scale * factor);
  if (nextScale === current.scale) return current;
  const wx = (screenPoint.x - current.tx) / current.scale;
  const wy = (screenPoint.y - current.ty) / current.scale;
  return {
    scale: nextScale,
    tx: screenPoint.x - wx * nextScale,
    ty: screenPoint.y - wy * nextScale,
  };
}

export function panBy(
  current: Transform,
  deltaX: number,
  deltaY: number,
): Transform {
  return { ...current, tx: current.tx + deltaX, ty: current.ty + deltaY };
}

export function unionBounds(rects: Bounds[]): Bounds | null {
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
