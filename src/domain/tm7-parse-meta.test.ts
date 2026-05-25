import { describe, expect, it } from "vitest";
import type { ParseWarning } from "./model";
import { parseMetaInformation } from "./tm7-parse-meta";
import { NS_TM, parseXml } from "./xml-helpers";
import { loadExampleXml } from "../test-utils/load-fixture";

function docOf(inner: string): Document {
  const { doc } = parseXml(
    `<ThreatModel xmlns="${NS_TM}">${inner}</ThreatModel>`,
  );
  return doc;
}

describe("parseMetaInformation", () => {
  it("extracts populated meta fields", () => {
    const doc = docOf(`
      <MetaInformation>
        <ThreatModelName>My System</ThreatModelName>
        <Owner>Alice</Owner>
        <Reviewer>Bob</Reviewer>
        <Contributors>Carol, Dan</Contributors>
        <Assumptions>HTTPS only</Assumptions>
        <ExternalDependencies>OAuth provider</ExternalDependencies>
        <HighLevelSystemDescription>SaaS app</HighLevelSystemDescription>
      </MetaInformation>
      <ThreatModelVersion>1.0</ThreatModelVersion>
    `);
    const warnings: ParseWarning[] = [];
    const meta = parseMetaInformation(doc, warnings);
    expect(meta).toEqual({
      threatModelName: "My System",
      owner: "Alice",
      reviewer: "Bob",
      contributors: "Carol, Dan",
      assumptions: "HTTPS only",
      externalDependencies: "OAuth provider",
      highLevelSystemDescription: "SaaS app",
      threatModelVersion: "1.0",
    });
    expect(warnings).toEqual([]);
  });

  it("returns empty strings (no warnings) when meta children are self-closing", () => {
    const doc = docOf(`
      <MetaInformation>
        <Assumptions/><Contributors/><ExternalDependencies/>
        <HighLevelSystemDescription/><Owner/><Reviewer/><ThreatModelName/>
      </MetaInformation>
    `);
    const warnings: ParseWarning[] = [];
    const meta = parseMetaInformation(doc, warnings);
    expect(meta.threatModelName).toBe("");
    expect(meta.owner).toBe("");
    expect(meta.threatModelVersion).toBe("");
    expect(warnings).toEqual([]);
  });

  it("emits a missing-field warning when MetaInformation block is absent", () => {
    const doc = docOf(``);
    const warnings: ParseWarning[] = [];
    const meta = parseMetaInformation(doc, warnings);
    expect(meta.threatModelName).toBe("");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe("missing-field");
  });

  it("parses MetaInformation from the real example fixture without warnings", () => {
    const { doc, error } = parseXml(loadExampleXml());
    expect(error).toBeNull();
    const warnings: ParseWarning[] = [];
    const meta = parseMetaInformation(doc, warnings);
    expect(meta).toEqual({
      threatModelName: "",
      owner: "",
      reviewer: "",
      contributors: "",
      assumptions: "",
      externalDependencies: "",
      highLevelSystemDescription: "",
      threatModelVersion: "4.3",
    });
    expect(warnings).toEqual([]);
  });
});
