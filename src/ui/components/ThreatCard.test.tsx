import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThreatCard } from "./ThreatCard";
import type { Threat } from "../../domain/model";

function t(over: Partial<Threat> = {}): Threat {
  return {
    id: 42,
    surfaceGuid: "s1",
    flowGuid: "f1",
    priority: "High",
    state: undefined,
    title: "Token replay attack",
    category: "Spoofing",
    shortDescription: "An attacker replays a captured token.",
    description: "Long description here.",
    possibleMitigations: "Use nonces and short TTLs.",
    sdlPhase: "Design",
    properties: {},
    ...over,
  };
}

describe("ThreatCard", () => {
  it("renders title, shortDescription, priority + category badges", () => {
    render(<ThreatCard threat={t()} />);
    expect(screen.getByText("Token replay attack")).toBeInTheDocument();
    expect(
      screen.getByText("An attacker replays a captured token."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("priority-badge").textContent).toBe("High");
    expect(screen.getByTestId("category-badge").textContent).toBe("Spoofing");
  });

  it("hides state badge when state is undefined", () => {
    render(<ThreatCard threat={t()} />);
    expect(screen.queryByTestId("state-badge")).toBeNull();
  });

  it("shows state badge when state is defined", () => {
    render(<ThreatCard threat={t({ state: "Mitigated" })} />);
    expect(screen.getByTestId("state-badge").textContent).toBe("Mitigated");
  });

  it("expands details on toggle click", async () => {
    const user = userEvent.setup();
    render(<ThreatCard threat={t()} />);
    expect(screen.queryByTestId("threat-card-details-42")).toBeNull();
    await user.click(screen.getByTestId("threat-card-toggle-42"));
    const details = screen.getByTestId("threat-card-details-42");
    expect(details.textContent).toContain("Long description here.");
    expect(details.textContent).toContain("Use nonces");
    expect(details.textContent).toContain("Design");
  });

  it("toggle does not bubble to card onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ThreatCard threat={t()} onSelect={onSelect} />);
    await user.click(screen.getByTestId("threat-card-toggle-42"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clicking the card body fires onSelect with the threat", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const threat = t();
    render(<ThreatCard threat={threat} onSelect={onSelect} />);
    await user.click(screen.getByText("Token replay attack"));
    expect(onSelect).toHaveBeenCalledWith(threat);
  });

  it("applies selected styling when selected prop set", () => {
    render(<ThreatCard threat={t()} selected />);
    expect(screen.getByTestId("threat-card-42").getAttribute("data-selected")).toBe(
      "true",
    );
  });
});
