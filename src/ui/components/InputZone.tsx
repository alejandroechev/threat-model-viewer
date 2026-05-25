import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { parseTm7 } from "../../domain/tm7-parser";
import { useModel } from "../context/ModelContext";

export interface InputZoneProps {
  showExampleButton?: boolean;
  loadExampleXml?: () => Promise<string>;
}

const ACCEPT = ".tm7,application/xml,text/xml";

export function InputZone({
  showExampleButton = isDevFlag(),
  loadExampleXml = defaultLoadExampleXml,
}: InputZoneProps) {
  const { state, dispatch } = useModel();
  const [pasted, setPasted] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleXml = useCallback(
    (xml: string, filename: string) => {
      const result = parseTm7(xml);
      if (!result.ok) {
        dispatch({ type: "setError", error: result.error });
        return;
      }
      dispatch({ type: "loadModel", model: result.model, filename });
    },
    [dispatch],
  );

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const text = await readFileText(file);
        handleXml(text, file.name);
      } catch (err) {
        dispatch({
          type: "setError",
          error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
    [dispatch, handleXml],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onLoadPasted = () => {
    if (!pasted.trim()) {
      dispatch({ type: "setError", error: "Paste a .tm7 XML document first." });
      return;
    }
    handleXml(pasted, "pasted.tm7");
  };

  const onLoadExample = async () => {
    try {
      const xml = await loadExampleXml();
      handleXml(xml, "example1.tm7");
    } catch (err) {
      dispatch({
        type: "setError",
        error: `Failed to load example: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Threat Model Viewer</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Drop a Microsoft Threat Modeling Tool <code>.tm7</code> file, or paste its XML
          contents below.
        </p>
      </header>

      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200"
        >
          {state.error}
        </div>
      )}

      <div
        data-testid="drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors " +
          (dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600")
        }
      >
        <p className="text-base font-medium">Drop a .tm7 file here</p>
        <p className="mt-1 text-xs text-neutral-500">or click to browse</p>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileChange}
          data-testid="file-input"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="paste-area" className="text-sm font-medium">
          Or paste XML
        </label>
        <textarea
          id="paste-area"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="<ThreatModel xmlns=…>…</ThreatModel>"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLoadPasted}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Load pasted XML
          </button>
          {showExampleButton && (
            <button
              type="button"
              onClick={onLoadExample}
              data-testid="load-example"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Load example
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function isDevFlag(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    return new URLSearchParams(window.location.search).has("dev");
  } catch {
    return false;
  }
}

async function defaultLoadExampleXml(): Promise<string> {
  const mod = await import("../../../examples/example1.tm7?raw");
  return mod.default;
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("FileReader returned non-string result"));
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsText(file);
  });
}
