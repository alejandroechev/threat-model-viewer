import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { Workspace } from "./Workspace";
import { ModelProvider, useModel } from "../context/ModelContext";
import type { BorderElement, LineElement, Threat, ThreatModel } from "../../domain/model";

function makeModel(): ThreatModel {
  const borders: BorderElement[] = [
    {
      kind: "StencilEllipse",
      xsiType: "ProcessStencil",
      guid: "E1",
      genericTypeId: "GE.P",
      name: "Service",
      position: { left: 100, top: 100, width: 80, height: 60 },
      outOfScope: false,
      properties: {},
    },
    {
      kind: "StencilRectangle",
      xsiType: "ExternalEntity",
      guid: "E2",
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
      guid: "F1",
      genericTypeId: "GE.DF",
      name: "request",
      source: { x: 180, y: 130 },
      target: { x: 300, y: 130 },
      handle: { x: 240, y: 100 },
      sourceGuid: "E1",
      targetGuid: "E2",
      properties: {},
    },
  ];
  // surface 2 has its own flow with a threat
  const borders2: BorderElement[] = [
    {
      kind: "StencilEllipse",
      xsiType: "ProcessStencil",
      guid: "E3",
      genericTypeId: "GE.P",
      name: "Auth",
      position: { left: 50, top: 50, width: 80, height: 60 },
      outOfScope: false,
      properties: {},
    },
  ];
  const lines2: LineElement[] = [
    {
      kind: "Connector",
      guid: "F2",
      genericTypeId: "GE.DF",
      name: "login",
      source: { x: 130, y: 80 },
      target: { x: 200, y: 80 },
      handle: { x: 165, y: 60 },
      sourceGuid: "E3",
      targetGuid: "E3",
      properties: {},
    },
  ];

  const threats: Threat[] = [
    {
      id: 1,
      surfaceGuid: "S1",
      flowGuid: "F1",
      sourceGuid: "E1",
      targetGuid: "E2",
      priority: "High",
      title: "Replay on F1",
      category: "Spoofing",
      shortDescription: "Replay attack on request flow",
      description: "",
      possibleMitigations: "",
      sdlPhase: "",
      properties: {},
    },
    {
      id: 2,
      surfaceGuid: "S2",
      flowGuid: "F2",
      sourceGuid: "E3",
      targetGuid: "E3",
      priority: "Medium",
      title: "Replay on F2",
      category: "Spoofing",
      shortDescription: "Replay attack on login flow",
      description: "",
      possibleMitigations: "",
      sdlPhase: "",
      properties: {},
    },
  ];

  return {
    meta: {
      threatModelName: "M",
      owner: "",
      reviewer: "",
      contributors: "",
      assumptions: "",
      externalDependencies: "",
      highLevelSystemDescription: "",
      threatModelVersion: "4.3",
    },
    surfaces: [
      { guid: "S1", name: "Surface 1", borders, lines },
      { guid: "S2", name: "Surface 2", borders: borders2, lines: lines2 },
    ],
    threats,
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

describe("cross-pane sync", () => {
  it("clicking a connector switches threats pane to byFlow and lists only its threats", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Workspace />
      </ModelProvider>,
    );
    await user.click(await screen.findByTestId("connector-F1"));
    const pane = screen.getByTestId("threats-pane-root");
    expect(within(pane).getByTestId("threat-card-1")).toBeInTheDocument();
    expect(within(pane).queryByTestId("threat-card-2")).toBeNull();
  });

  it("clicking a threat card switches surface and selects its flow on diagram", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Workspace />
      </ModelProvider>,
    );
    // initially on Surface 1; surface 2's threat #2 visible in 'all' mode
    await user.click(await screen.findByTestId("threat-card-2"));
    // Surface switched: connector F2 should now be in DOM
    expect(await screen.findByTestId("connector-F2")).toBeInTheDocument();
    // F2 marked selected
    expect(screen.getByTestId("connector-F2").getAttribute("data-selected")).toBe(
      "true",
    );
  });

  it("clicking a shape switches threats pane to byElement", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Workspace />
      </ModelProvider>,
    );
    await user.click(await screen.findByTestId("shape-E1"));
    const pane = screen.getByTestId("threats-pane-root");
    // threat #1 has sourceGuid E1, so should be present
    expect(within(pane).getByTestId("threat-card-1")).toBeInTheDocument();
    // threat #2 is on E3 only
    expect(within(pane).queryByTestId("threat-card-2")).toBeNull();
  });

  it("switching surface tab resets selection", async () => {
    const user = userEvent.setup();
    const model = makeModel();
    render(
      <ModelProvider>
        <Seed model={model} />
        <Workspace />
      </ModelProvider>,
    );
    await user.click(await screen.findByTestId("connector-F1"));
    expect(screen.getByTestId("connector-F1").getAttribute("data-selected")).toBe(
      "true",
    );
    await user.click(screen.getByRole("tab", { name: "Surface 2" }));
    expect(
      screen.getByTestId("connector-F2").getAttribute("data-selected"),
    ).toBe("false");
  });
});
