import type { Threat } from "./model";

export function threatsByFlow(threats: Threat[]): Map<string, Threat[]> {
  const map = new Map<string, Threat[]>();
  for (const t of threats) {
    if (!t.flowGuid) continue;
    const arr = map.get(t.flowGuid) ?? [];
    arr.push(t);
    map.set(t.flowGuid, arr);
  }
  return map;
}

export function threatsByElement(threats: Threat[]): Map<string, Threat[]> {
  const map = new Map<string, Threat[]>();
  const push = (guid: string | undefined, threat: Threat) => {
    if (!guid) return;
    const arr = map.get(guid) ?? [];
    arr.push(threat);
    map.set(guid, arr);
  };
  for (const t of threats) {
    push(t.sourceGuid, t);
    if (t.targetGuid && t.targetGuid !== t.sourceGuid) {
      push(t.targetGuid, t);
    }
  }
  return map;
}

export function threatsByCategory(threats: Threat[]): Map<string, Threat[]> {
  const map = new Map<string, Threat[]>();
  for (const t of threats) {
    const key = t.category || "Uncategorized";
    const arr = map.get(key) ?? [];
    arr.push(t);
    map.set(key, arr);
  }
  return map;
}
