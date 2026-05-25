import type { ParseResult, ParseWarning, ThreatModel } from "./model";
import { parseMetaInformation } from "./tm7-parse-meta";
import { parseSurfaces } from "./tm7-parse-surfaces";
import { parseThreats } from "./tm7-parse-threats";
import { parseXml } from "./xml-helpers";

export function parseTm7(xml: string): ParseResult {
  const { doc, error } = parseXml(xml);
  if (error) return { ok: false, error };

  const root = doc.documentElement;
  if (!root || root.localName !== "ThreatModel") {
    return {
      ok: false,
      error: `Expected root <ThreatModel>, got <${root?.localName ?? "nothing"}>`,
    };
  }

  const warnings: ParseWarning[] = [];
  const meta = parseMetaInformation(doc, warnings);
  const surfaces = parseSurfaces(doc, warnings);
  const threats = parseThreats(doc, warnings);

  const model: ThreatModel = { meta, surfaces, threats, warnings };
  return { ok: true, model };
}
