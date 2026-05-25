import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { ThreatsPane, sortThreats, filterByQuery, categoryOrder } from "./ThreatsPane";
import { ModelProvider, useModel } from "../context/ModelContext";
import type { Threat, ThreatModel } from "../../domain/model";

function makeThreat(over: Partial<Threat>): Threat {
  return {
    id: 0,
    surfaceGuid: "s1",
    flowGuid: "f1",
    priority: "Medium",
    title: "T",
    category: "Spoofing",
    shortDescription: "",
    description: "",
    possibleMitigations: "",
    sdlPhase: "",
    properties: {},
    ...over,
  };
}

function makeModel(threats: Threat[]): ThreatModel {
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
    surfaces: [{ guid: "s1", name: "S", borders: [], lines: [] }],
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

describe("ThreatsPane pure helpers", () => {
  it("sortThreats by priority: High < Medium < Low < Unknown", () => {
    const arr = [
      makeThreat({ id: 1, priority: "Low", title: "a" }),
      makeThreat({ id: 2, priority: "High", title: "b" }),
      makeThreat({ id: 3, priority: "Medium", title: "c" }),
      makeThreat({ id: 4, priority: "Unknown", title: "d" }),
    ];
    expect(sortThreats(arr, "priority").map((t) => t.id)).toEqual([2, 3, 1, 4]);
  });

  it("sortThreats by title alphabetically", () => {
    const arr = [
      makeThreat({ id: 1, title: "Zeta" }),
      makeThreat({ id: 2, title: "Alpha" }),
      makeThreat({ id: 3, title: "Mu" }),
    ];
    expect(sortThreats(arr, "title").map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it("sortThreats by category uses STRIDE order", () => {
    const arr = [
      makeThreat({ id: 1, category: "Tampering" }),
      makeThreat({ id: 2, category: "Spoofing" }),
      makeThreat({ id: 3, category: "Elevation of Privilege" }),
    ];
    expect(sortThreats(arr, "category").map((t) => t.id)).toEqual([2, 1, 3]);
  });

  it("filterByQuery is case insensitive and matches title/desc/category", () => {
    const arr = [
      makeThreat({ id: 1, title: "Replay attack", category: "Tampering" }),
      makeThreat({ id: 2, description: "BUFFER OVERFLOW", category: "Tampering" }),
      makeThreat({ id: 3, category: "Spoofing" }),
    ];
    expect(filterByQuery(arr, "replay").map((t) => t.id)).toEqual([1]);
    expect(filterByQuery(arr, "overflow").map((t) => t.id)).toEqual([2]);
    expect(filterByQuery(arr, "SPOOF").map((t) => t.id)).toEqual([3]);
    expect(filterByQuery(arr, "").length).toBe(3);
  });

  it("categoryOrder places STRIDE first, unknown last", () => {
    expect(categoryOrder("Spoofing")).toBeLessThan(categoryOrder("Tampering"));
    expect(categoryOrder("Elevation of Privilege")).toBeLessThan(
      categoryOrder("Custom Category"),
    );
  });
});

describe("ThreatsPane component", () => {
  it("renders one card per threat in 'all' mode sorted by priority by default", async () => {
    const model = makeModel([
      makeThreat({ id: 1, priority: "Low", title: "Low one" }),
      makeThreat({ id: 2, priority: "High", title: "High one" }),
    ]);
    render(
      <ModelProvider>
        <Seed model={model} />
        <ThreatsPane />
      </ModelProvider>,
    );
    const root = await screen.findByTestId("threats-pane-root");
    const cards = within(root).getAllByTestId(/threat-card-\d+/);
    expect(cards.map((c) => c.getAttribute("data-testid"))).toEqual([
      "threat-card-2",
      "threat-card-1",
    ]);
  });

  it("search input filters threats live (debounced)", async () => {
    const user = userEvent.setup();
    const model = makeModel([
      makeThreat({ id: 1, title: "Replay attack" }),
      makeThreat({ id: 2, title: "Privilege escalation" }),
    ]);
    render(
      <ModelProvider>
        <Seed model={model} />
        <ThreatsPane />
      </ModelProvider>,
    );
    await user.type(screen.getByTestId("threats-search"), "replay");
    // wait for debounce (150ms)
    await new Promise((r) => setTimeout(r, 250));
    expect(screen.queryByTestId("threat-card-2")).toBeNull();
    expect(screen.getByTestId("threat-card-1")).toBeInTheDocument();
  });

  it("sort dropdown reorders threats", async () => {
    const user = userEvent.setup();
    const model = makeModel([
      makeThreat({ id: 1, priority: "High", title: "Zeta" }),
      makeThreat({ id: 2, priority: "Low", title: "Alpha" }),
    ]);
    render(
      <ModelProvider>
        <Seed model={model} />
        <ThreatsPane />
      </ModelProvider>,
    );
    // default priority sort: id 1 first
    let cards = await screen.findAllByTestId(/threat-card-\d+/);
    expect(cards[0].getAttribute("data-testid")).toBe("threat-card-1");
    await user.selectOptions(screen.getByTestId("threats-sort"), "title");
    cards = screen.getAllByTestId(/threat-card-\d+/);
    expect(cards[0].getAttribute("data-testid")).toBe("threat-card-2");
  });

  it("byCategory groups with STRIDE ordering", async () => {
    const user = userEvent.setup();
    const model = makeModel([
      makeThreat({ id: 1, category: "Tampering", title: "T1" }),
      makeThreat({ id: 2, category: "Spoofing", title: "S1" }),
    ]);
    render(
      <ModelProvider>
        <Seed model={model} />
        <ThreatsPane />
      </ModelProvider>,
    );
    await user.click(screen.getByTestId("pane-mode-byCategory"));
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0].textContent).toMatch(/Spoofing/);
    expect(headings[1].textContent).toMatch(/Tampering/);
  });

  it("byElement mode shows hint when no element selected", async () => {
    const user = userEvent.setup();
    const model = makeModel([makeThreat({ id: 1 })]);
    render(
      <ModelProvider>
        <Seed model={model} />
        <ThreatsPane />
      </ModelProvider>,
    );
    await user.click(screen.getByTestId("pane-mode-byElement"));
    expect(screen.getByText(/select an element/i)).toBeInTheDocument();
  });
});
