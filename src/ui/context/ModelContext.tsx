import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { ThreatModel } from "../../domain/model";

export type PaneMode = "all" | "byElement" | "byFlow" | "byCategory";
export type SortBy = "priority" | "title" | "category";

export interface Selection {
  kind: "none" | "element" | "flow";
  guid?: string;
}

export interface ModelState {
  model: ThreatModel | null;
  filename: string | null;
  surfaceGuid: string | null;
  selection: Selection;
  paneMode: PaneMode;
  sortBy: SortBy;
  query: string;
  error: string | null;
}

export const initialState: ModelState = {
  model: null,
  filename: null,
  surfaceGuid: null,
  selection: { kind: "none" },
  paneMode: "all",
  sortBy: "priority",
  query: "",
  error: null,
};

export type ModelAction =
  | { type: "loadModel"; model: ThreatModel; filename: string }
  | { type: "setError"; error: string }
  | { type: "clearModel" }
  | { type: "selectSurface"; surfaceGuid: string }
  | { type: "selectNode"; selection: Selection }
  | { type: "clearSelection" }
  | { type: "setPaneMode"; paneMode: PaneMode }
  | { type: "setSortBy"; sortBy: SortBy }
  | { type: "setQuery"; query: string };

export function modelReducer(state: ModelState, action: ModelAction): ModelState {
  switch (action.type) {
    case "loadModel": {
      const firstSurface = action.model.surfaces[0]?.guid ?? null;
      return {
        ...initialState,
        model: action.model,
        filename: action.filename,
        surfaceGuid: firstSurface,
      };
    }
    case "setError":
      return { ...state, error: action.error };
    case "clearModel":
      return { ...initialState };
    case "selectSurface":
      if (action.surfaceGuid === state.surfaceGuid) return state;
      return {
        ...state,
        surfaceGuid: action.surfaceGuid,
        selection: { kind: "none" },
      };
    case "selectNode": {
      const next = action.selection;
      const inferredMode: PaneMode =
        next.kind === "element"
          ? "byElement"
          : next.kind === "flow"
            ? "byFlow"
            : state.paneMode;
      return { ...state, selection: next, paneMode: inferredMode };
    }
    case "clearSelection":
      return { ...state, selection: { kind: "none" } };
    case "setPaneMode":
      return { ...state, paneMode: action.paneMode };
    case "setSortBy":
      return { ...state, sortBy: action.sortBy };
    case "setQuery":
      return { ...state, query: action.query };
    default:
      return state;
  }
}

interface ModelContextValue {
  state: ModelState;
  dispatch: Dispatch<ModelAction>;
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(modelReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
