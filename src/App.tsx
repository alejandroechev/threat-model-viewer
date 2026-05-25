import { ModelProvider, useModel } from "./ui/context/ModelContext";
import { InputZone } from "./ui/components/InputZone";
import { Workspace } from "./ui/components/Workspace";

function AppShell() {
  const { state } = useModel();
  if (!state.model) {
    return (
      <div className="min-h-screen">
        <InputZone />
      </div>
    );
  }
  return <Workspace />;
}

export function App() {
  return (
    <ModelProvider>
      <AppShell />
    </ModelProvider>
  );
}
