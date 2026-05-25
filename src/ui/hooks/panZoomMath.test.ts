import { describe, expect, it } from "vitest";
import {
  clampScale,
  fitToBounds,
  panBy,
  unionBounds,
  zoomToward,
  MIN_SCALE,
  MAX_SCALE,
} from "./panZoomMath";

describe("panZoomMath", () => {
  describe("clampScale", () => {
    it("clamps below minimum", () => {
      expect(clampScale(0.001)).toBe(MIN_SCALE);
    });
    it("clamps above maximum", () => {
      expect(clampScale(1000)).toBe(MAX_SCALE);
    });
    it("passes through in-range values", () => {
      expect(clampScale(1.5)).toBe(1.5);
    });
  });

  describe("fitToBounds", () => {
    it("centers bounds inside viewport with default padding", () => {
      const t = fitToBounds(
        { x: 0, y: 0, width: 100, height: 100 },
        1000,
        1000,
        0,
      );
      expect(t.scale).toBe(8);
      expect(t.tx).toBeCloseTo((1000 - 800) / 2);
      expect(t.ty).toBeCloseTo((1000 - 800) / 2);
    });

    it("picks the limiting dimension", () => {
      const t = fitToBounds(
        { x: 0, y: 0, width: 200, height: 100 },
        400,
        400,
        0,
      );
      // limited by width: 400/200 = 2
      expect(t.scale).toBe(2);
    });

    it("respects padding fraction", () => {
      const t = fitToBounds(
        { x: 0, y: 0, width: 100, height: 100 },
        200,
        200,
        0.5,
      );
      // (200/100)*0.5 = 1
      expect(t.scale).toBeCloseTo(1);
    });

    it("translates non-origin bounds correctly", () => {
      const t = fitToBounds(
        { x: 50, y: 50, width: 100, height: 100 },
        400,
        400,
        0,
      );
      const worldOriginX = (0 - t.tx) / t.scale;
      const worldCenterX = ((400 / 2) - t.tx) / t.scale;
      expect(worldCenterX).toBeCloseTo(100); // center of (50..150) is 100
      expect(worldOriginX).toBeCloseTo(50); // left edge of bounds
    });
  });

  describe("zoomToward", () => {
    it("keeps the screen point stationary in world coords", () => {
      const t = { tx: 10, ty: 20, scale: 1 };
      const point = { x: 100, y: 200 };
      const worldBefore = {
        x: (point.x - t.tx) / t.scale,
        y: (point.y - t.ty) / t.scale,
      };
      const t2 = zoomToward(t, point, 2);
      const worldAfter = {
        x: (point.x - t2.tx) / t2.scale,
        y: (point.y - t2.ty) / t2.scale,
      };
      expect(worldAfter.x).toBeCloseTo(worldBefore.x);
      expect(worldAfter.y).toBeCloseTo(worldBefore.y);
      expect(t2.scale).toBe(2);
    });

    it("returns same transform when scale is clamped to bound", () => {
      const t = { tx: 0, ty: 0, scale: MAX_SCALE };
      const t2 = zoomToward(t, { x: 0, y: 0 }, 2);
      expect(t2).toBe(t);
    });
  });

  describe("panBy", () => {
    it("offsets translation only, preserves scale", () => {
      const t = { tx: 5, ty: 10, scale: 1.5 };
      expect(panBy(t, 3, -4)).toEqual({ tx: 8, ty: 6, scale: 1.5 });
    });
  });

  describe("unionBounds", () => {
    it("returns null for empty input", () => {
      expect(unionBounds([])).toBeNull();
    });
    it("computes union of multiple rects", () => {
      const u = unionBounds([
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 50, y: 5, width: 20, height: 30 },
      ]);
      expect(u).toEqual({ x: 0, y: 0, width: 70, height: 35 });
    });
  });
});
