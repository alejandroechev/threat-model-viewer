import { useModel } from "../context/ModelContext";

export function ErrorBanner() {
  const { state, dispatch } = useModel();
  if (!state.error) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
    >
      <span className="flex-1">{state.error}</span>
      <button
        type="button"
        onClick={() => dispatch({ type: "setError", error: "" })}
        className="text-red-700 hover:text-red-900 dark:text-red-300"
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
}
