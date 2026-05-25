import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Connector, midpointOnQuadratic, quadraticPath } from "./Connector";
import type { LineElement } from "../../../domain/model";

function line(over: Partial<LineElement> = {}): LineElement {
  return {
    kind: "Connector",
    guid: "L1",
    genericTypeId: "GE.DF",
    name: "Auth Token",
    source: { x: 0, y: 0 },
    target: { x: 100, y: 0 },
    handle: { x: 50, y: 50 },
    properties: {},
    ...over,
  };
}

function wrap(n: React.ReactNode) {
  return <svg>{n}</svg>;
}

describe("Connector math", () => {
  it("quadraticPath formats SVG path correctly", () => {
    expect(quadraticPath({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 })).toBe(
      "M 0 0 Q 50 50 100 0",
    );
  });

  it("midpoint at t=0 equals source", () => {
    expect(
      midpointOnQuadratic({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }, 0),
    ).toEqual({ x: 0, y: 0 });
  });

  it("midpoint at t=1 equals target", () => {
    expect(
      midpointOnQuadratic({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }, 1),
    ).toEqual({ x: 100, y: 0 });
  });

  it("midpoint at t=0.5 lies between endpoints", () => {
    const m = midpointOnQuadratic(
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
      0.5,
    );
    expect(m.x).toBe(50);
    expect(m.y).toBe(50);
  });
});

describe("Connector component", () => {
  it("renders a path with arrow marker by default", () => {
    render(wrap(<Connector line={line()} />));
    const g = screen.getByTestId("connector-L1");
    const paths = g.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
    const visible = paths[1];
    expect(visible.getAttribute("marker-end")).toMatch(/tm-arrow/);
  });

  it("renders dashed and no arrow for LineBoundary", () => {
    render(wrap(<Connector line={line({ kind: "LineBoundary", name: "boundary" })} />));
    const visible = screen
      .getByTestId("connector-L1")
      .querySelectorAll("path")[1];
    expect(visible.getAttribute("stroke-dasharray")).toBeTruthy();
    expect(visible.getAttribute("marker-end")).toBeNull();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(wrap(<Connector line={line()} onSelect={onSelect} />));
    await user.click(screen.getByTestId("connector-L1"));
    expect(onSelect).toHaveBeenCalledWith("L1");
  });

  it("shows threat count badge when > 0", () => {
    render(wrap(<Connector line={line()} threatCount={3} />));
    expect(screen.getByTestId("connector-L1").textContent).toContain("3");
  });
});
