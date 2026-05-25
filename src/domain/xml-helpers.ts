export const NS_TM =
  "http://schemas.datacontract.org/2004/07/ThreatModeling.Model";
export const NS_ABS =
  "http://schemas.datacontract.org/2004/07/ThreatModeling.Model.Abstracts";
export const NS_KB =
  "http://schemas.datacontract.org/2004/07/ThreatModeling.KnowledgeBase";
export const NS_ARR =
  "http://schemas.microsoft.com/2003/10/Serialization/Arrays";
export const NS_XSI = "http://www.w3.org/2001/XMLSchema-instance";

export function getDirectChild(
  parent: Element,
  localName: string,
): Element | null {
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].localName === localName) {
      return parent.children[i];
    }
  }
  return null;
}

export function getDirectChildText(
  parent: Element,
  localName: string,
): string {
  const child = getDirectChild(parent, localName);
  return child?.textContent?.trim() ?? "";
}

export function getTextContent(
  parent: Element,
  ns: string,
  localName: string,
): string {
  const el = parent.getElementsByTagNameNS(ns, localName)[0];
  return el?.textContent?.trim() ?? "";
}

export function getNumericContent(
  parent: Element,
  ns: string,
  localName: string,
): number {
  const text = getTextContent(parent, ns, localName);
  if (text === "") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

export interface AnyTypeProperty {
  displayName: string;
  value: string;
  name: string;
}

export function iterAnyTypeProps(propertiesContainer: Element): AnyTypeProperty[] {
  const entries = propertiesContainer.getElementsByTagNameNS(NS_ARR, "anyType");
  const result: AnyTypeProperty[] = [];
  for (let i = 0; i < entries.length; i++) {
    const el = entries[i];
    result.push({
      displayName: getDirectChildText(el, "DisplayName"),
      name: getDirectChildText(el, "Name"),
      value: getDirectChildText(el, "Value"),
    });
  }
  return result;
}

export function parseXml(xml: string): { doc: Document; error: string | null } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const errEl = doc.getElementsByTagName("parsererror")[0];
  if (errEl) {
    return { doc, error: errEl.textContent?.trim() ?? "Unknown XML parse error" };
  }
  return { doc, error: null };
}
