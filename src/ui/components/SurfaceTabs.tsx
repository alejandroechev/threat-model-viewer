import * as Tabs from "@radix-ui/react-tabs";
import { useModel } from "../context/ModelContext";

export function SurfaceTabs() {
  const { state, dispatch } = useModel();
  const surfaces = state.model?.surfaces ?? [];
  if (surfaces.length === 0) return null;
  const current = state.surfaceGuid ?? surfaces[0]?.guid;
  return (
    <Tabs.Root
      value={current ?? undefined}
      onValueChange={(guid) =>
        dispatch({ type: "selectSurface", surfaceGuid: guid })
      }
    >
      <Tabs.List
        data-testid="surface-tabs"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 dark:border-slate-800 dark:bg-slate-900/50"
        aria-label="Drawing surfaces"
      >
        {surfaces.map((s) => (
          <Tabs.Trigger
            key={s.guid}
            value={s.guid}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:text-slate-900 data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:text-slate-100"
          >
            {s.name || "(unnamed)"}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
