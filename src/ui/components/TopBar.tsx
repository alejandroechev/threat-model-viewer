import { useModel } from "../context/ModelContext";

export function TopBar() {
  const { state, dispatch } = useModel();
  const warnings = state.model?.warnings ?? [];
  const warningCount = warnings.length;

  return (
    <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-base font-semibold">Threat Model Viewer</h1>
      {state.filename && (
        <span className="truncate text-sm text-slate-600 dark:text-slate-400">
          {state.filename}
        </span>
      )}
      <div className="ml-auto flex items-center gap-3">
        {warningCount > 0 && (
          <span
            title={warnings.map((w) => w.message).join("\n")}
            className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            data-testid="warnings-pill"
          >
            {warningCount} warning{warningCount === 1 ? "" : "s"}
          </span>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: "clearModel" })}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Load different file
        </button>
      </div>
    </header>
  );
}
