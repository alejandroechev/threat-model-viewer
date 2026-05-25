import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";

const MINIMAL_TM7 = `<?xml version="1.0"?>
<ThreatModel xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.datacontract.org/2004/07/ThreatModeling.Model">
  <DrawingSurfaceList>
    <DrawingSurfaceModel>
      <GenericTypeId>DRAWINGSURFACE</GenericTypeId>
      <Guid>11111111-1111-1111-1111-111111111111</Guid>
      <Properties/>
      <TypeId>DRAWINGSURFACE</TypeId>
      <Borders/>
      <Header>Surface 1</Header>
      <Lines/>
      <Zoom>1</Zoom>
    </DrawingSurfaceModel>
  </DrawingSurfaceList>
  <MetaInformation>
    <ThreatModelName>Demo</ThreatModelName>
  </MetaInformation>
  <ThreatInstances/>
  <Version>4.3</Version>
</ThreatModel>`;

describe("App shell", () => {
  it("renders InputZone when no model is loaded", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /threat model viewer/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/or paste xml/i)).toBeInTheDocument();
  });

  it("swaps to Workspace once a model is loaded via paste", async () => {
    const user = userEvent.setup();
    render(<App />);
    const textarea = screen.getByLabelText(/or paste xml/i);
    await user.click(textarea);
    await user.paste(MINIMAL_TM7);
    await user.click(screen.getByRole("button", { name: /load pasted xml/i }));
    expect(await screen.findByTestId("workspace-grid")).toBeInTheDocument();
    expect(screen.getByTestId("diagram-pane")).toBeInTheDocument();
    expect(screen.getByTestId("threats-pane")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /load different file/i }),
    ).toBeInTheDocument();
  });

  it("returns to InputZone when 'Load different file' is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const textarea = screen.getByLabelText(/or paste xml/i);
    await user.click(textarea);
    await user.paste(MINIMAL_TM7);
    await user.click(screen.getByRole("button", { name: /load pasted xml/i }));
    await screen.findByTestId("workspace-grid");
    await user.click(
      screen.getByRole("button", { name: /load different file/i }),
    );
    expect(screen.getByLabelText(/or paste xml/i)).toBeInTheDocument();
  });
});
