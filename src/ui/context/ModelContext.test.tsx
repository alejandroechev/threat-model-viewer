import { describe, expect, it } from "vitest";
import type { ThreatModel } from "../../domain/model";
import { initialState, modelReducer } from "./ModelContext";

function fakeModel(): ThreatModel {
  return {
    meta: {
      threatModelName: "",
      owner: "",
      reviewer: "",
      contributors: "",
      assumptions: "",
      externalDependencies: "",
      highLevelSystemDescription: "",
      threatModelVersion: "4.3",
    },
    surfaces: [
      { guid: "S1", name: "Surface 1", borders: [], lines: [] },
      { guid: "S2", name: "Surface 2", borders: [], lines: [] },
    ],
    threats: [],
    warnings: [],
  };
}

describe("modelReducer", () => {
  it("loadModel resets state and selects first surface", () => {
    const state = modelReducer(
      { ...initialState, query: "stale", paneMode: "byCategory" },
      { type: "loadModel", model: fakeModel(), filename: "a.tm7" },
    );
    expect(state.model).not.toBeNull();
    expect(state.filename).toBe("a.tm7");
    expect(state.surfaceGuid).toBe("S1");
    expect(state.paneMode).toBe("all");
    expect(state.query).toBe("");
    expect(state.error).toBeNull();
  });

  it("setError preserves model but records error", () => {
    const loaded = modelReducer(initialState, {
      type: "loadModel",
      model: fakeModel(),
      filename: "a.tm7",
    });
    const errored = modelReducer(loaded, { type: "setError", error: "boom" });
    expect(errored.model).toBe(loaded.model);
    expect(errored.error).toBe("boom");
  });

  it("selectSurface clears selection when surface changes", () => {
    let state = modelReducer(initialState, {
      type: "loadModel",
      model: fakeModel(),
      filename: "a.tm7",
    });
    state = modelReducer(state, {
      type: "selectNode",
      selection: { kind: "element", guid: "n1" },
    });
    expect(state.selection.kind).toBe("element");
    state = modelReducer(state, { type: "selectSurface", surfaceGuid: "S2" });
    expect(state.surfaceGuid).toBe("S2");
    expect(state.selection).toEqual({ kind: "none" });
  });

  it("selectSurface is a no-op when GUID unchanged", () => {
    const start = modelReducer(initialState, {
      type: "loadModel",
      model: fakeModel(),
      filename: "a.tm7",
    });
    const next = modelReducer(start, { type: "selectSurface", surfaceGuid: "S1" });
    expect(next).toBe(start);
  });

  it("selectNode element infers byElement pane mode", () => {
    const state = modelReducer(initialState, {
      type: "selectNode",
      selection: { kind: "element", guid: "x" },
    });
    expect(state.paneMode).toBe("byElement");
  });

  it("selectNode flow infers byFlow pane mode", () => {
    const state = modelReducer(initialState, {
      type: "selectNode",
      selection: { kind: "flow", guid: "x" },
    });
    expect(state.paneMode).toBe("byFlow");
  });

  it("selectNode none keeps current pane mode", () => {
    const state = modelReducer(
      { ...initialState, paneMode: "byCategory" },
      { type: "selectNode", selection: { kind: "none" } },
    );
    expect(state.paneMode).toBe("byCategory");
  });

  it("setPaneMode / setSortBy / setQuery update individual fields", () => {
    let s = modelReducer(initialState, { type: "setPaneMode", paneMode: "byCategory" });
    expect(s.paneMode).toBe("byCategory");
    s = modelReducer(s, { type: "setSortBy", sortBy: "title" });
    expect(s.sortBy).toBe("title");
    s = modelReducer(s, { type: "setQuery", query: "spoof" });
    expect(s.query).toBe("spoof");
  });

  it("clearModel resets everything to initial", () => {
    const loaded = modelReducer(initialState, {
      type: "loadModel",
      model: fakeModel(),
      filename: "a.tm7",
    });
    expect(modelReducer(loaded, { type: "clearModel" })).toEqual(initialState);
  });
});
