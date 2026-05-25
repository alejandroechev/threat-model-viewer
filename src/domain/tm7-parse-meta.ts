import type { ModelMeta, ParseWarning } from "./model";
import { getDirectChildText, NS_TM } from "./xml-helpers";

const EMPTY_META: ModelMeta = {
  threatModelName: "",
  owner: "",
  reviewer: "",
  contributors: "",
  assumptions: "",
  externalDependencies: "",
  highLevelSystemDescription: "",
  threatModelVersion: "",
};

export function parseMetaInformation(
  doc: Document,
  warnings: ParseWarning[],
): ModelMeta {
  const metaEl = doc.getElementsByTagNameNS(NS_TM, "MetaInformation")[0];
  if (!metaEl) {
    warnings.push({
      kind: "missing-field",
      message: "MetaInformation block not found",
      path: "/ThreatModel/MetaInformation",
    });
    return { ...EMPTY_META };
  }

  const versionEl =
    doc.getElementsByTagNameNS(NS_TM, "ThreatModelVersion")[0] ??
    doc.getElementsByTagNameNS(NS_TM, "Version")[0];

  return {
    threatModelName: getDirectChildText(metaEl, "ThreatModelName"),
    owner: getDirectChildText(metaEl, "Owner"),
    reviewer: getDirectChildText(metaEl, "Reviewer"),
    contributors: getDirectChildText(metaEl, "Contributors"),
    assumptions: getDirectChildText(metaEl, "Assumptions"),
    externalDependencies: getDirectChildText(metaEl, "ExternalDependencies"),
    highLevelSystemDescription: getDirectChildText(
      metaEl,
      "HighLevelSystemDescription",
    ),
    threatModelVersion: versionEl?.textContent?.trim() ?? "",
  };
}
