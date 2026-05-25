import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { DiagramPane } from "./DiagramPane";
import { ModelProvider, useModel } from "../context/ModelContext";
import type { BorderElement, LineElement, ThreatModel } from "../../domain/model";

function makeModel(): ThreatModel {
  const borders: BorderElement[] = [
    {
      kind: "StencilEllipse",
      xsiType: "ProcessStencil",
      guid: "e1",
      genericTypeId: "GE.P",
      name: "Service",
      position: { left: 100, top: 100, width: 80, height: 60 },
      outOfScope: false,
      properties: {},
    },
    {
      kind: "StencilRectangle",
      xsiType: "ExternalEntity",
      guid: "e2",
      genericTypeId: "GE.E",
      name: "User",
      position: { left: 300, top: 100, width: 80, height: 60 },
      outOfScope: false,
      properties: {},
    },
  ];
  const lines: LineElement[] = [
    {
      kind: "Connector",
      guid: "L1",
      genericTypeId: "GE.DF",
      name: "request",
      source: { x: 180, y: 130 },
      target: { x: 300, y: 130 },
      handle: { x: 240, y: 100 },
      sourceGuid: "e1",
      targetGuid: "e2",
      properties: {},
    },
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
    surfaces: [{ guid: "s1", name: "S", borders, lines }],
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

function Harness() {
  const { state } = useModel();
  const surface = state.model?.surfaces[0];
  if (!surface) return null;
  return <DiagramPane surface={surface} />;
}

function SelectionDisplay() {
  const { state } = useModel();
  return (
    <div data-testid="selection">
      {state.selection.kind}:{state.selection.guid ?? ""}
    </div>
  );
}

describe("DiagramPane", () => {
  it("renders one Shape per border and one Connector per line", async () => {
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Harness />
      </ModelProvider>,
    );
    expect(await screen.findByTestId("shape-e1")).toBeInTheDocument();
    expect(screen.getByTestId("shape-e2")).toBeInTheDocument();
    expect(screen.getByTestId("connector-L1")).toBeInTheDocument();
  });

  it("clicking a shape sets element selection", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Harness />
        <SelectionDisplay />
      </ModelProvider>,
    );
    await user.click(await screen.findByTestId("shape-e1"));
    expect(screen.getByTestId("selection").textContent).toBe("element:e1");
  });

  it("clicking a connector sets flow selection", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Harness />
        <SelectionDisplay />
      </ModelProvider>,
    );
    await user.click(await screen.findByTestId("connector-L1"));
    expect(screen.getByTestId("selection").textContent).toBe("flow:L1");
  });
});
