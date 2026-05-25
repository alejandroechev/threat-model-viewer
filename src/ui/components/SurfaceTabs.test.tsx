import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurfaceTabs } from "./SurfaceTabs";
import { ModelProvider, useModel } from "../context/ModelContext";
import type { DrawingSurface, ThreatModel } from "../../domain/model";
import { useEffect } from "react";

function makeModel(): ThreatModel {
  const surfaces: DrawingSurface[] = [
    { guid: "g1", name: "Surface One", borders: [], lines: [] },
    { guid: "g2", name: "Surface Two", borders: [], lines: [] },
    { guid: "g3", name: "Surface Three", borders: [], lines: [] },
  ];
  return {
    meta: {
      threatModelName: "T",
      owner: "",
      reviewer: "",
      contributors: "",
      assumptions: "",
      externalDependencies: "",
      highLevelSystemDescription: "",
      threatModelVersion: "4.3",
    },
    surfaces,
    threats: [],
    warnings: [],
  };
}

function Seed({ model }: { model: ThreatModel }) {
  const { dispatch } = useModel();
  useEffect(() => {
    dispatch({ type: "loadModel", model, filename: "x.tm7" });
  }, [dispatch, model]);
  return null;
}

function Spy({ onState }: { onState: (s: ReturnType<typeof useModel>["state"]) => void }) {
  const { state } = useModel();
  useEffect(() => {
    onState(state);
  });
  return null;
}

type ModelStateRef = ReturnType<typeof useModel>["state"];

describe("SurfaceTabs", () => {
  it("renders one tab per surface", () => {
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <SurfaceTabs />
      </ModelProvider>,
    );
    const tabs = within(screen.getByTestId("surface-tabs")).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Surface One",
      "Surface Two",
      "Surface Three",
    ]);
  });

  it("switching tab dispatches selectSurface and clears selection", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    let latest: ModelStateRef | null = null;
    render(
      <ModelProvider>
        <Seed model={model} />
        <SurfaceTabs />
        <Spy onState={(s) => (latest = s)} />
      </ModelProvider>,
    );
    await user.click(screen.getByRole("tab", { name: "Surface Two" }));
    const final = latest as ModelStateRef | null;
    expect(final?.surfaceGuid).toBe("g2");
    expect(final?.selection.kind).toBe("none");
  });

  it("renders nothing when no model is loaded", () => {
    const { container } = render(
      <ModelProvider>
        <SurfaceTabs />
      </ModelProvider>,
    );
    expect(container.querySelector('[data-testid="surface-tabs"]')).toBeNull();
  });
});
