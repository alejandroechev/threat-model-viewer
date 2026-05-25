import { describe, expect, it } from "vitest";
import { parseTm7 } from "./tm7-parser";
import { loadExampleXml } from "../test-utils/load-fixture";

describe("parseTm7", () => {
  it("returns ok=false on malformed XML", () => {
    const result = parseTm7("<not-xml<");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeTruthy();
  });

  it("returns ok=false when root element is not ThreatModel", () => {
    const result = parseTm7("<Other/>");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("ThreatModel");
  });

  it("integration: example1.tm7 → 10 surfaces / 105 borders / 85 lines / 85 threats / 0 warnings", () => {
    const result = parseTm7(loadExampleXml());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { model } = result;
    expect(model.surfaces).toHaveLength(10);
    expect(model.surfaces.reduce((n, s) => n + s.borders.length, 0)).toBe(105);
    expect(model.surfaces.reduce((n, s) => n + s.lines.length, 0)).toBe(85);
    expect(model.threats).toHaveLength(85);
    expect(model.warnings).toEqual([]);
    expect(model.meta.threatModelVersion).toBe("4.3");
  });
});
