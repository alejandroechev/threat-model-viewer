import { describe, expect, it } from "vitest";
import type { ParseWarning } from "./model";
import { parseSurfaces } from "./tm7-parse-surfaces";
import { parseXml } from "./xml-helpers";
import { loadExampleXml } from "../test-utils/load-fixture";

const NS_TM = "http://schemas.datacontract.org/2004/07/ThreatModeling.Model";
const NS_ABS = "http://schemas.datacontract.org/2004/07/ThreatModeling.Model.Abstracts";
const NS_ARR = "http://schemas.microsoft.com/2003/10/Serialization/Arrays";
const NS_XSI = "http://www.w3.org/2001/XMLSchema-instance";

function wrap(inner: string): Document {
  const xml = `<ThreatModel xmlns="${NS_TM}"
                xmlns:a="${NS_ABS}"
                xmlns:arr="${NS_ARR}"
                xmlns:i="${NS_XSI}">${inner}</ThreatModel>`;
  const { doc, error } = parseXml(xml);
  if (error) throw new Error(error);
  return doc;
}

// Helper to build a single border KeyValue entry
function borderEntry(opts: {
  xsiType: string;
  guid: string;
  name?: string;
  outOfScope?: boolean;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  extraProps?: Record<string, string>;
}): string {
  const props =
    `<arr:anyType><a:DisplayName>Name</a:DisplayName><a:Name/><a:Value>${opts.name ?? ""}</a:Value></arr:anyType>` +
    `<arr:anyType><a:DisplayName>Out Of Scope</a:DisplayName><a:Name/><a:Value>${opts.outOfScope ? "true" : "false"}</a:Value></arr:anyType>` +
    Object.entries(opts.extraProps ?? {})
      .map(
        ([k, v]) =>
          `<arr:anyType><a:DisplayName>${k}</a:DisplayName><a:Name/><a:Value>${v}</a:Value></arr:anyType>`,
      )
      .join("");
  return `
    <arr:KeyValueOfguidanyType>
      <arr:Key>${opts.guid}</arr:Key>
      <arr:Value i:type="${opts.xsiType}">
        <a:Guid>${opts.guid}</a:Guid>
        <a:GenericTypeId>GE.P</a:GenericTypeId>
        <a:Properties>${props}</a:Properties>
        <a:Left>${opts.left ?? 10}</a:Left>
        <a:Top>${opts.top ?? 20}</a:Top>
        <a:Width>${opts.width ?? 100}</a:Width>
        <a:Height>${opts.height ?? 50}</a:Height>
        <a:StrokeThickness>1</a:StrokeThickness>
        <a:StrokeDashArray i:nil="true"/>
      </arr:Value>
    </arr:KeyValueOfguidanyType>`;
}

function connectorEntry(opts: {
  guid: string;
  sourceGuid: string;
  targetGuid: string;
  portSource?: string;
  portTarget?: string;
  name?: string;
}): string {
  return `
    <arr:KeyValueOfguidanyType>
      <arr:Key>${opts.guid}</arr:Key>
      <arr:Value i:type="Connector">
        <a:Guid>${opts.guid}</a:Guid>
        <a:GenericTypeId>GE.DF</a:GenericTypeId>
        <a:Properties>
          <arr:anyType><a:DisplayName>Name</a:DisplayName><a:Name/><a:Value>${opts.name ?? ""}</a:Value></arr:anyType>
        </a:Properties>
        <a:HandleX>5</a:HandleX>
        <a:HandleY>6</a:HandleY>
        <a:SourceX>1</a:SourceX>
        <a:SourceY>2</a:SourceY>
        <a:TargetX>3</a:TargetX>
        <a:TargetY>4</a:TargetY>
        <a:SourceGuid>${opts.sourceGuid}</a:SourceGuid>
        <a:TargetGuid>${opts.targetGuid}</a:TargetGuid>
        ${opts.portSource ? `<a:PortSource>${opts.portSource}</a:PortSource>` : ""}
        ${opts.portTarget ? `<a:PortTarget>${opts.portTarget}</a:PortTarget>` : ""}
      </arr:Value>
    </arr:KeyValueOfguidanyType>`;
}

function surfaceShell(content: { borders?: string; lines?: string }): string {
  return `
    <DrawingSurfaceList>
      <DrawingSurfaceModel>
        <a:Guid>surface-1</a:Guid>
        <a:Properties>
          <arr:anyType><a:DisplayName>Name</a:DisplayName><a:Value>Surface One</a:Value></arr:anyType>
        </a:Properties>
        <Borders>${content.borders ?? ""}</Borders>
        <Lines>${content.lines ?? ""}</Lines>
      </DrawingSurfaceModel>
    </DrawingSurfaceList>`;
}

describe("parseSurfaces", () => {
  it("returns [] when DrawingSurfaceList is absent", () => {
    const doc = wrap("");
    const warnings: ParseWarning[] = [];
    expect(parseSurfaces(doc, warnings)).toEqual([]);
  });

  it("parses a surface guid + name", () => {
    const doc = wrap(surfaceShell({}));
    const warnings: ParseWarning[] = [];
    const surfaces = parseSurfaces(doc, warnings);
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].guid).toBe("surface-1");
    expect(surfaces[0].name).toBe("Surface One");
    expect(warnings).toEqual([]);
  });

  it("parses all 4 known border kinds with name + position + outOfScope", () => {
    const doc = wrap(
      surfaceShell({
        borders:
          borderEntry({ xsiType: "StencilEllipse", guid: "g1", name: "Process A", left: 1, top: 2, width: 3, height: 4 }) +
          borderEntry({ xsiType: "StencilRectangle", guid: "g2", name: "Store B" }) +
          borderEntry({ xsiType: "StencilParallelLines", guid: "g3", name: "Actor C", outOfScope: true }) +
          borderEntry({ xsiType: "BorderBoundary", guid: "g4", name: "Trust X" }),
      }),
    );
    const warnings: ParseWarning[] = [];
    const [s] = parseSurfaces(doc, warnings);
    expect(s.borders.map((b) => b.kind)).toEqual([
      "StencilEllipse",
      "StencilRectangle",
      "StencilParallelLines",
      "BorderBoundary",
    ]);
    expect(s.borders[0]).toMatchObject({
      kind: "StencilEllipse",
      xsiType: "StencilEllipse",
      guid: "g1",
      name: "Process A",
      position: { left: 1, top: 2, width: 3, height: 4 },
      outOfScope: false,
    });
    expect(s.borders[2].outOfScope).toBe(true);
    expect(warnings).toEqual([]);
  });

  it("preserves unknown stencil xsi:types as kind=Unknown + warning", () => {
    const doc = wrap(
      surfaceShell({
        borders: borderEntry({ xsiType: "StencilWeird", guid: "gx", name: "Mystery" }),
      }),
    );
    const warnings: ParseWarning[] = [];
    const [s] = parseSurfaces(doc, warnings);
    expect(s.borders).toHaveLength(1);
    expect(s.borders[0].kind).toBe("Unknown");
    expect(s.borders[0].xsiType).toBe("StencilWeird");
    expect(s.borders[0].name).toBe("Mystery");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe("unknown-xsi-type");
  });

  it("collects all <Properties> entries into the properties bag", () => {
    const doc = wrap(
      surfaceShell({
        borders: borderEntry({
          xsiType: "StencilEllipse",
          guid: "g1",
          name: "Web",
          extraProps: { "Code Type": "Managed", "Authenticates Itself": "Yes" },
        }),
      }),
    );
    const warnings: ParseWarning[] = [];
    const [s] = parseSurfaces(doc, warnings);
    expect(s.borders[0].properties).toMatchObject({
      Name: "Web",
      "Out Of Scope": "false",
      "Code Type": "Managed",
      "Authenticates Itself": "Yes",
    });
  });

  it("extracts stroke with nil dashArray as empty string", () => {
    const doc = wrap(
      surfaceShell({
        borders: borderEntry({ xsiType: "StencilEllipse", guid: "g1", name: "P" }),
      }),
    );
    const warnings: ParseWarning[] = [];
    const [s] = parseSurfaces(doc, warnings);
    expect(s.borders[0].stroke).toEqual({ thickness: 1, dashArray: "" });
  });

  it("parses Connector with SourceGuid/TargetGuid/PortSource/PortTarget", () => {
    const doc = wrap(
      surfaceShell({
        lines: connectorEntry({
          guid: "c1",
          sourceGuid: "g1",
          targetGuid: "g2",
          portSource: "NorthEast",
          portTarget: "SouthWest",
          name: "Request",
        }),
      }),
    );
    const warnings: ParseWarning[] = [];
    const [s] = parseSurfaces(doc, warnings);
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0]).toMatchObject({
      kind: "Connector",
      guid: "c1",
      name: "Request",
      sourceGuid: "g1",
      targetGuid: "g2",
      portSource: "NorthEast",
      portTarget: "SouthWest",
      source: { x: 1, y: 2 },
      target: { x: 3, y: 4 },
      handle: { x: 5, y: 6 },
    });
    expect(warnings).toEqual([]);
  });

  it("warns and skips unknown line xsi:types", () => {
    const doc = wrap(
      surfaceShell({
        lines: `
          <arr:KeyValueOfguidanyType>
            <arr:Key>weird</arr:Key>
            <arr:Value i:type="WeirdLine"><a:Guid>w</a:Guid></arr:Value>
          </arr:KeyValueOfguidanyType>`,
      }),
    );
    const warnings: ParseWarning[] = [];
    const [s] = parseSurfaces(doc, warnings);
    expect(s.lines).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe("unknown-xsi-type");
  });

  it("integration: real example fixture has 10 surfaces with 105 borders + 85 lines and 0 warnings", () => {
    const { doc, error } = parseXml(loadExampleXml());
    expect(error).toBeNull();
    const warnings: ParseWarning[] = [];
    const surfaces = parseSurfaces(doc, warnings);
    expect(surfaces).toHaveLength(10);
    const totalBorders = surfaces.reduce((n, s) => n + s.borders.length, 0);
    const totalLines = surfaces.reduce((n, s) => n + s.lines.length, 0);
    expect(totalBorders).toBe(105);
    expect(totalLines).toBe(85);
    expect(warnings).toEqual([]);

    // Spot-check: at least one connector has PortSource/PortTarget
    const connectorsWithPorts = surfaces.flatMap((s) =>
      s.lines.filter((l) => l.kind === "Connector" && l.portSource && l.portTarget),
    );
    expect(connectorsWithPorts.length).toBeGreaterThan(0);
  });
});
