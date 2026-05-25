import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelProvider, useModel } from "../context/ModelContext";
import { InputZone } from "./InputZone";

function withProvider(ui: React.ReactNode) {
  return <ModelProvider>{ui}</ModelProvider>;
}

function StateProbe() {
  const { state } = useModel();
  return (
    <div>
      <span data-testid="filename">{state.filename ?? ""}</span>
      <span data-testid="surfaces">{state.model?.surfaces.length ?? 0}</span>
      <span data-testid="error">{state.error ?? ""}</span>
    </div>
  );
}

const MINIMAL_TM7 = `<?xml version="1.0"?>
<ThreatModel xmlns="http://schemas.datacontract.org/2004/07/ThreatModeling.Model"
             xmlns:a="http://schemas.datacontract.org/2004/07/ThreatModeling.Model.Abstracts"
             xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays"
             xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
  <DrawingSurfaceList>
    <DrawingSurfaceModel>
      <a:Guid>surface-1</a:Guid>
      <a:Properties/>
      <Borders/>
      <Lines/>
    </DrawingSurfaceModel>
  </DrawingSurfaceList>
  <ThreatModelVersion>4.3</ThreatModelVersion>
</ThreatModel>`;

describe("InputZone", () => {
  it("dev flag hides Load example button when false", () => {
    render(withProvider(<InputZone showExampleButton={false} />));
    expect(screen.queryByTestId("load-example")).toBeNull();
  });

  it("dev flag shows Load example button when true", () => {
    render(withProvider(<InputZone showExampleButton={true} />));
    expect(screen.getByTestId("load-example")).toBeInTheDocument();
  });

  it("loading pasted XML dispatches loadModel", async () => {
    const user = userEvent.setup();
    render(
      withProvider(
        <>
          <InputZone showExampleButton={false} />
          <StateProbe />
        </>,
      ),
    );
    const textarea = screen.getByLabelText(/paste xml/i);
    await user.click(textarea);
    // userEvent.type would be slow for 600 chars; use fireEvent change instead
    fireEvent.change(textarea, { target: { value: MINIMAL_TM7 } });
    await user.click(screen.getByRole("button", { name: /load pasted xml/i }));
    expect(screen.getByTestId("filename").textContent).toBe("pasted.tm7");
    expect(screen.getByTestId("surfaces").textContent).toBe("1");
  });

  it("loading empty paste shows error", async () => {
    const user = userEvent.setup();
    render(
      withProvider(
        <>
          <InputZone showExampleButton={false} />
          <StateProbe />
        </>,
      ),
    );
    await user.click(screen.getByRole("button", { name: /load pasted xml/i }));
    expect(screen.getByTestId("error").textContent).toMatch(/paste/i);
  });

  it("loading malformed XML sets parser error", async () => {
    const user = userEvent.setup();
    render(
      withProvider(
        <>
          <InputZone showExampleButton={false} />
          <StateProbe />
        </>,
      ),
    );
    const textarea = screen.getByLabelText(/paste xml/i);
    fireEvent.change(textarea, { target: { value: "<not-valid<" } });
    await user.click(screen.getByRole("button", { name: /load pasted xml/i }));
    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).not.toBe("");
    });
  });

  it("dropping a file loads it", async () => {
    render(
      withProvider(
        <>
          <InputZone showExampleButton={false} />
          <StateProbe />
        </>,
      ),
    );
    const file = new File([MINIMAL_TM7], "dropped.tm7", { type: "text/xml" });
    const dropZone = screen.getByTestId("drop-zone");
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByTestId("filename").textContent).toBe("dropped.tm7");
    });
  });

  it("Load example button calls injected loader", async () => {
    const user = userEvent.setup();
    const loader = vi.fn().mockResolvedValue(MINIMAL_TM7);
    render(
      withProvider(
        <>
          <InputZone showExampleButton={true} loadExampleXml={loader} />
          <StateProbe />
        </>,
      ),
    );
    await user.click(screen.getByTestId("load-example"));
    await waitFor(() => {
      expect(screen.getByTestId("filename").textContent).toBe("example1.tm7");
    });
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
