import { useModel } from "../context/ModelContext";
import { DiagramPane } from "./DiagramPane";
import { ErrorBanner } from "./ErrorBanner";
import { SurfaceTabs } from "./SurfaceTabs";
import { ThreatsPane } from "./ThreatsPane";
import { TopBar } from "./TopBar";

export function Workspace() {
  const { state } = useModel();
  const surface =
    state.model?.surfaces.find((s) => s.guid === state.surfaceGuid) ?? null;
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <ErrorBanner />
      <main
        className="grid flex-1 overflow-hidden grid-cols-1 grid-rows-[55vh_1fr] md:grid-cols-[1fr_360px] md:grid-rows-1"
        data-testid="workspace-grid"
      >
        <section
          className="flex min-h-0 flex-col overflow-hidden border-b border-slate-200 md:border-b-0 md:border-r dark:border-slate-800"
          data-testid="diagram-pane"
        >
          <SurfaceTabs />
          <div className="min-h-0 flex-1">
            {surface ? (
              <DiagramPane key={surface.guid} surface={surface} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Select a surface
              </div>
            )}
          </div>
        </section>
        <aside
          className="min-h-0 overflow-y-auto"
          data-testid="threats-pane"
        >
          <ThreatsPane />
        </aside>
      </main>
    </div>
  );
}
