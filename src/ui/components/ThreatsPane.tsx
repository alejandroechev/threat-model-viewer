import { useEffect, useMemo, useState } from "react";
import type { PaneMode, SortBy } from "../context/ModelContext";
import { useModel } from "../context/ModelContext";
import type { Threat, ThreatPriority } from "../../domain/model";
import {
  threatsByCategory,
  threatsByElement,
  threatsByFlow,
} from "../../domain/threat-views";
import { ThreatCard } from "./ThreatCard";

const PRIORITY_ORDER: Record<ThreatPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Unknown: 3,
};

const STRIDE_ORDER: Record<string, number> = {
  Spoofing: 0,
  Tampering: 1,
  Repudiation: 2,
  "Information Disclosure": 3,
  "Denial of Service": 4,
  "Denial Of Service": 4,
  "Elevation of Privilege": 5,
  "Elevation Of Privilege": 5,
};

function categoryOrder(cat: string): number {
  return STRIDE_ORDER[cat] ?? 99;
}

function sortThreats(threats: Threat[], by: SortBy): Threat[] {
  const copy = [...threats];
  copy.sort((a, b) => {
    if (by === "priority") {
      const d = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (d !== 0) return d;
      return a.title.localeCompare(b.title);
    }
    if (by === "title") {
      return a.title.localeCompare(b.title);
    }
    // category
    const d = categoryOrder(a.category) - categoryOrder(b.category);
    if (d !== 0) return d;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
  return copy;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function filterByQuery(threats: Threat[], query: string): Threat[] {
  if (!query) return threats;
  const q = query.toLowerCase();
  return threats.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.shortDescription.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q),
  );
}

const MODE_LABELS: Record<PaneMode, string> = {
  all: "All",
  byElement: "By element",
  byFlow: "By flow",
  byCategory: "By category",
};

export function ThreatsPane() {
  const { state, dispatch } = useModel();
  const model = state.model;
  const [queryInput, setQueryInput] = useState(state.query);
  const debounced = useDebounced(queryInput, 150);

  useEffect(() => {
    if (debounced !== state.query) {
      dispatch({ type: "setQuery", query: debounced });
    }
  }, [debounced, state.query, dispatch]);

  const filteredAndGrouped = useMemo(() => {
    if (!model) return [] as { key: string; label: string; items: Threat[] }[];

    let candidates: Threat[] = model.threats;
    if (state.paneMode === "byElement") {
      if (state.selection.kind === "element" && state.selection.guid) {
        candidates =
          threatsByElement(model.threats).get(state.selection.guid) ?? [];
      } else {
        candidates = [];
      }
    } else if (state.paneMode === "byFlow") {
      if (state.selection.kind === "flow" && state.selection.guid) {
        candidates = threatsByFlow(model.threats).get(state.selection.guid) ?? [];
      } else {
        candidates = [];
      }
    }

    const filtered = filterByQuery(candidates, debounced);

    if (state.paneMode === "byCategory") {
      const groups = threatsByCategory(filtered);
      const keys = [...groups.keys()].sort(
        (a, b) => categoryOrder(a) - categoryOrder(b),
      );
      return keys.map((k) => ({
        key: k,
        label: k,
        items: sortThreats(groups.get(k) ?? [], state.sortBy),
      }));
    }

    return [
      {
        key: "all",
        label: "Threats",
        items: sortThreats(filtered, state.sortBy),
      },
    ];
  }, [model, state.paneMode, state.selection, state.sortBy, debounced]);

  if (!model) return null;
  const totalCount = filteredAndGrouped.reduce(
    (n, g) => n + g.items.length,
    0,
  );

  const onSelectThreat = (t: Threat) => {
    if (t.surfaceGuid && t.surfaceGuid !== state.surfaceGuid) {
      dispatch({ type: "selectSurface", surfaceGuid: t.surfaceGuid });
    }
    if (t.flowGuid) {
      dispatch({
        type: "selectNode",
        selection: { kind: "flow", guid: t.flowGuid },
      });
    }
  };

  return (
    <div className="flex h-full flex-col" data-testid="threats-pane-root">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Pane mode">
          {(Object.keys(MODE_LABELS) as PaneMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={state.paneMode === m}
              onClick={() => dispatch({ type: "setPaneMode", paneMode: m })}
              data-testid={`pane-mode-${m}`}
              className={
                "rounded px-2 py-1 text-xs " +
                (state.paneMode === m
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200")
              }
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search threats…"
            aria-label="Search threats"
            data-testid="threats-search"
            className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={state.sortBy}
            onChange={(e) =>
              dispatch({ type: "setSortBy", sortBy: e.target.value as SortBy })
            }
            aria-label="Sort threats by"
            data-testid="threats-sort"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="category">Category</option>
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {totalCount} threat{totalCount === 1 ? "" : "s"}
          {state.paneMode === "byElement" &&
            state.selection.kind !== "element" &&
            " — select an element"}
          {state.paneMode === "byFlow" &&
            state.selection.kind !== "flow" &&
            " — select a flow"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filteredAndGrouped.map((group) => (
          <section key={group.key} className="mb-4 last:mb-0">
            {state.paneMode === "byCategory" && (
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.label} ({group.items.length})
              </h2>
            )}
            <div className="flex flex-col gap-2">
              {group.items.map((t) => (
                <ThreatCard
                  key={t.id}
                  threat={t}
                  selected={
                    state.selection.kind === "flow" &&
                    state.selection.guid === t.flowGuid
                  }
                  onSelect={onSelectThreat}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export { sortThreats, filterByQuery, categoryOrder, PRIORITY_ORDER };
