import { describe, expect, it } from "vitest";
import type { Threat } from "./model";
import {
  threatsByCategory,
  threatsByElement,
  threatsByFlow,
} from "./threat-views";

function t(overrides: Partial<Threat>): Threat {
  return {
    id: 1,
    surfaceGuid: "S",
    flowGuid: "F",
    sourceGuid: "A",
    targetGuid: "B",
    priority: "High",
    state: undefined,
    title: "",
    category: "Spoofing",
    shortDescription: "",
    description: "",
    possibleMitigations: "",
    sdlPhase: "",
    properties: {},
    ...overrides,
  };
}

describe("threatsByFlow", () => {
  it("groups by flowGuid", () => {
    const t1 = t({ id: 1, flowGuid: "F1" });
    const t2 = t({ id: 2, flowGuid: "F1" });
    const t3 = t({ id: 3, flowGuid: "F2" });
    const m = threatsByFlow([t1, t2, t3]);
    expect(m.get("F1")?.map((x) => x.id)).toEqual([1, 2]);
    expect(m.get("F2")?.map((x) => x.id)).toEqual([3]);
  });

  it("skips threats without flowGuid", () => {
    const m = threatsByFlow([t({ flowGuid: "" })]);
    expect(m.size).toBe(0);
  });
});

describe("threatsByElement", () => {
  it("attaches each threat to both source and target elements", () => {
    const x = t({ id: 1, sourceGuid: "A", targetGuid: "B" });
    const m = threatsByElement([x]);
    expect(m.get("A")?.map((y) => y.id)).toEqual([1]);
    expect(m.get("B")?.map((y) => y.id)).toEqual([1]);
  });

  it("does not double-add when source === target", () => {
    const x = t({ id: 1, sourceGuid: "A", targetGuid: "A" });
    const m = threatsByElement([x]);
    expect(m.get("A")).toHaveLength(1);
  });

  it("skips missing guids", () => {
    const x = t({ sourceGuid: undefined, targetGuid: undefined });
    expect(threatsByElement([x]).size).toBe(0);
  });
});

describe("threatsByCategory", () => {
  it("groups by category", () => {
    const a = t({ id: 1, category: "Spoofing" });
    const b = t({ id: 2, category: "Tampering" });
    const c = t({ id: 3, category: "Spoofing" });
    const m = threatsByCategory([a, b, c]);
    expect(m.get("Spoofing")?.map((x) => x.id)).toEqual([1, 3]);
    expect(m.get("Tampering")?.map((x) => x.id)).toEqual([2]);
  });

  it("buckets empty category under 'Uncategorized'", () => {
    const m = threatsByCategory([t({ category: "" })]);
    expect(m.get("Uncategorized")).toHaveLength(1);
  });
});
