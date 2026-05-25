import type {
  BorderElement,
  BorderKind,
  DrawingSurface,
  LineElement,
  LineKind,
  ParseWarning,
  Point,
  Rect,
} from "./model";
import {
  getNumericContent,
  getTextContent,
  iterAnyTypeProps,
  NS_ABS,
  NS_ARR,
  NS_TM,
  NS_XSI,
} from "./xml-helpers";

const KNOWN_BORDER_KINDS: ReadonlySet<string> = new Set([
  "StencilEllipse",
  "StencilRectangle",
  "StencilParallelLines",
  "BorderBoundary",
]);

const KNOWN_LINE_KINDS: ReadonlySet<string> = new Set([
  "Connector",
  "LineBoundary",
]);

export function parseSurfaces(
  doc: Document,
  warnings: ParseWarning[],
): DrawingSurface[] {
  const surfaceNodes = doc.getElementsByTagNameNS(NS_TM, "DrawingSurfaceModel");
  const surfaces: DrawingSurface[] = [];
  for (let i = 0; i < surfaceNodes.length; i++) {
    surfaces.push(parseDrawingSurface(surfaceNodes[i], warnings));
  }
  return surfaces;
}

function parseDrawingSurface(
  node: Element,
  warnings: ParseWarning[],
): DrawingSurface {
  const guid = getTextContent(node, NS_ABS, "Guid");
  const name = extractName(node);

  const bordersContainer = childInNs(node, NS_TM, "Borders");
  const linesContainer = childInNs(node, NS_TM, "Lines");

  const borders = bordersContainer
    ? parseBorders(bordersContainer, warnings, `surface:${guid}`)
    : [];
  const lines = linesContainer
    ? parseLines(linesContainer, warnings, `surface:${guid}`)
    : [];

  return { guid, name, borders, lines };
}

function childInNs(parent: Element, ns: string, localName: string): Element | null {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (child.localName === localName && child.namespaceURI === ns) return child;
  }
  return null;
}

function parseBorders(
  container: Element,
  warnings: ParseWarning[],
  path: string,
): BorderElement[] {
  const entries = container.getElementsByTagNameNS(
    NS_ARR,
    "KeyValueOfguidanyType",
  );
  const result: BorderElement[] = [];

  for (let i = 0; i < entries.length; i++) {
    const valueEl = entries[i].getElementsByTagNameNS(NS_ARR, "Value")[0];
    if (!valueEl) continue;

    const xsiType = valueEl.getAttributeNS(NS_XSI, "type") ?? "";
    // Skip line-type entries that may have leaked into Borders (defensive)
    if (KNOWN_LINE_KINDS.has(xsiType)) continue;

    const kind: BorderKind = KNOWN_BORDER_KINDS.has(xsiType)
      ? (xsiType as BorderKind)
      : "Unknown";

    if (kind === "Unknown") {
      warnings.push({
        kind: "unknown-xsi-type",
        message: `Unknown border xsi:type "${xsiType}"`,
        path,
      });
    }

    const properties = collectProperties(valueEl);

    result.push({
      kind,
      xsiType,
      guid: getTextContent(valueEl, NS_ABS, "Guid"),
      genericTypeId: getTextContent(valueEl, NS_ABS, "GenericTypeId"),
      name: properties["Name"] ?? "",
      position: extractPosition(valueEl),
      outOfScope: properties["Out Of Scope"] === "true",
      properties,
      stroke: extractStroke(valueEl),
    });
  }

  return result;
}

function parseLines(
  container: Element,
  warnings: ParseWarning[],
  path: string,
): LineElement[] {
  const entries = container.getElementsByTagNameNS(
    NS_ARR,
    "KeyValueOfguidanyType",
  );
  const result: LineElement[] = [];

  for (let i = 0; i < entries.length; i++) {
    const valueEl = entries[i].getElementsByTagNameNS(NS_ARR, "Value")[0];
    if (!valueEl) continue;

    const xsiType = valueEl.getAttributeNS(NS_XSI, "type") ?? "";

    if (!KNOWN_LINE_KINDS.has(xsiType)) {
      warnings.push({
        kind: "unknown-xsi-type",
        message: `Unknown line xsi:type "${xsiType}"`,
        path,
      });
      continue;
    }

    const kind = xsiType as LineKind;
    const properties = collectProperties(valueEl);

    const base: LineElement = {
      kind,
      guid: getTextContent(valueEl, NS_ABS, "Guid"),
      genericTypeId: getTextContent(valueEl, NS_ABS, "GenericTypeId"),
      name: properties["Name"] ?? "",
      source: {
        x: getNumericContent(valueEl, NS_ABS, "SourceX"),
        y: getNumericContent(valueEl, NS_ABS, "SourceY"),
      },
      target: {
        x: getNumericContent(valueEl, NS_ABS, "TargetX"),
        y: getNumericContent(valueEl, NS_ABS, "TargetY"),
      },
      handle: {
        x: getNumericContent(valueEl, NS_ABS, "HandleX"),
        y: getNumericContent(valueEl, NS_ABS, "HandleY"),
      },
      properties,
    };

    if (kind === "Connector") {
      base.sourceGuid = getTextContent(valueEl, NS_ABS, "SourceGuid");
      base.targetGuid = getTextContent(valueEl, NS_ABS, "TargetGuid");
      const portSource = getTextContent(valueEl, NS_ABS, "PortSource");
      const portTarget = getTextContent(valueEl, NS_ABS, "PortTarget");
      if (portSource) base.portSource = portSource;
      if (portTarget) base.portTarget = portTarget;
    }

    result.push(base);
  }

  return result;
}

function extractName(surfaceNode: Element): string {
  const propsContainer = surfaceNode.getElementsByTagNameNS(NS_ABS, "Properties")[0];
  if (!propsContainer) return "";
  const props = iterAnyTypeProps(propsContainer);
  return props.find((p) => p.displayName === "Name")?.value ?? "";
}

function collectProperties(el: Element): Record<string, string> {
  // First direct Properties child, not nested ones (a Connector may contain a child element
  // that also has Properties — but xsiType filtering means we only call this on the right node).
  const propsContainer = directDescendantOfNs(el, NS_ABS, "Properties");
  if (!propsContainer) return {};
  const out: Record<string, string> = {};
  for (const p of iterAnyTypeProps(propsContainer)) {
    if (!p.displayName) continue;
    out[p.displayName] = p.value;
  }
  return out;
}

function directDescendantOfNs(
  parent: Element,
  ns: string,
  localName: string,
): Element | null {
  for (let i = 0; i < parent.children.length; i++) {
    const c = parent.children[i];
    if (c.localName === localName && c.namespaceURI === ns) return c;
  }
  return null;
}

function extractPosition(el: Element): Rect {
  return {
    left: getNumericContent(el, NS_ABS, "Left"),
    top: getNumericContent(el, NS_ABS, "Top"),
    width: getNumericContent(el, NS_ABS, "Width"),
    height: getNumericContent(el, NS_ABS, "Height"),
  };
}

function extractStroke(el: Element):
  | { thickness: number; dashArray: string }
  | undefined {
  const thicknessEl = el.getElementsByTagNameNS(NS_ABS, "StrokeThickness")[0];
  const dashEl = el.getElementsByTagNameNS(NS_ABS, "StrokeDashArray")[0];
  if (!thicknessEl && !dashEl) return undefined;
  const dashIsNil = dashEl?.getAttributeNS(NS_XSI, "nil") === "true";
  return {
    thickness: thicknessEl ? Number(thicknessEl.textContent?.trim() ?? "0") || 0 : 0,
    dashArray: dashIsNil ? "" : dashEl?.textContent?.trim() ?? "",
  };
}

// Unused exports kept off the surface; only parseSurfaces is the public API.
// Keep Point used by re-export for module consumers if needed.
export type { Point };
