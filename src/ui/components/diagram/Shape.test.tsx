import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Shape } from "./Shape";
import type { BorderElement } from "../../../domain/model";

function el(over: Partial<BorderElement> = {}): BorderElement {
  return {
    kind: "StencilEllipse",
    xsiType: "ProcessStencil",
    guid: "g1",
    genericTypeId: "GE.P",
    name: "Process A",
    position: { left: 10, top: 20, width: 80, height: 50 },
    outOfScope: false,
    properties: {},
    ...over,
  };
}

function wrap(node: React.ReactNode) {
  return (
    <svg>
      <g>{node}</g>
    </svg>
  );
}

describe("Shape", () => {
  it("renders ellipse for StencilEllipse with name", () => {
    render(wrap(<Shape element={el()} />));
    const g = screen.getByTestId("shape-g1");
    expect(g.querySelector("ellipse")).toBeTruthy();
    expect(g.textContent).toContain("Process A");
  });

  it("renders rect for StencilRectangle", () => {
    render(wrap(<Shape element={el({ kind: "StencilRectangle" })} />));
    expect(screen.getByTestId("shape-g1").querySelector("rect")).toBeTruthy();
  });

  it("renders dashed rect for BorderBoundary", () => {
    render(wrap(<Shape element={el({ kind: "BorderBoundary", name: "DMZ" })} />));
    const rect = screen.getByTestId("shape-g1").querySelector("rect");
    expect(rect?.getAttribute("stroke-dasharray")).toBeTruthy();
  });

  it("renders fallback gray dashed rect for Unknown with xsiType label", () => {
    render(
      wrap(
        <Shape
          element={el({ kind: "Unknown", name: "", xsiType: "MysteryStencil" })}
        />,
      ),
    );
    const g = screen.getByTestId("shape-g1");
    expect(g.querySelector("rect")?.getAttribute("stroke-dasharray")).toBeTruthy();
    expect(g.textContent).toContain("Mystery");
  });

  it("applies out-of-scope styling (opacity + dashed)", () => {
    render(wrap(<Shape element={el({ outOfScope: true })} />));
    const g = screen.getByTestId("shape-g1");
    expect(g.getAttribute("data-oos")).toBe("true");
    expect(g.getAttribute("style") ?? "").toMatch(/opacity:\s*0\.5/);
  });

  it("invokes onSelect with guid when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(wrap(<Shape element={el()} onSelect={onSelect} />));
    await user.click(screen.getByTestId("shape-g1"));
    expect(onSelect).toHaveBeenCalledWith("g1");
  });

  it("renders selection styling when selected", () => {
    render(wrap(<Shape element={el()} selected />));
    expect(screen.getByTestId("shape-g1").getAttribute("data-selected")).toBe(
      "true",
    );
  });

  it("renders threat count badge when > 0", () => {
    render(wrap(<Shape element={el()} threatCount={5} />));
    expect(screen.getByTestId("shape-g1").textContent).toContain("5");
  });
});
