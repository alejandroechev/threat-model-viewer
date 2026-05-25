import { describe, expect, it } from "vitest";
import {
  getDirectChild,
  getDirectChildText,
  getNumericContent,
  getTextContent,
  iterAnyTypeProps,
  NS_ABS,
  NS_ARR,
  parseXml,
} from "./xml-helpers";

function parse(xml: string): Document {
  return new DOMParser().parseFromString(xml, "text/xml");
}

describe("xml-helpers", () => {
  describe("getDirectChild / getDirectChildText", () => {
    it("returns the first direct child with the matching local name", () => {
      const doc = parse(
        `<root xmlns:b="urn:b"><b:Name>hi</b:Name><Other>x</Other></root>`,
      );
      const root = doc.documentElement;
      expect(getDirectChildText(root, "Name")).toBe("hi");
      expect(getDirectChildText(root, "Other")).toBe("x");
    });

    it("returns empty string when child is missing", () => {
      const doc = parse(`<root/>`);
      expect(getDirectChildText(doc.documentElement, "Missing")).toBe("");
    });

    it("does NOT descend into grandchildren", () => {
      const doc = parse(`<root><wrap><Name>hi</Name></wrap></root>`);
      expect(getDirectChild(doc.documentElement, "Name")).toBeNull();
    });
  });

  describe("getTextContent / getNumericContent", () => {
    it("reads text via namespace + localName", () => {
      const doc = parse(
        `<root xmlns:a="${NS_ABS}"><a:Guid>abc</a:Guid></root>`,
      );
      expect(getTextContent(doc.documentElement, NS_ABS, "Guid")).toBe("abc");
    });

    it("returns empty string when not found", () => {
      const doc = parse(`<root/>`);
      expect(getTextContent(doc.documentElement, NS_ABS, "Guid")).toBe("");
    });

    it("parses numeric content; returns 0 for missing or non-numeric", () => {
      const doc = parse(
        `<root xmlns:a="${NS_ABS}"><a:Left>42.5</a:Left><a:Bad>oops</a:Bad></root>`,
      );
      expect(getNumericContent(doc.documentElement, NS_ABS, "Left")).toBe(42.5);
      expect(getNumericContent(doc.documentElement, NS_ABS, "Bad")).toBe(0);
      expect(getNumericContent(doc.documentElement, NS_ABS, "Missing")).toBe(0);
    });
  });

  describe("iterAnyTypeProps", () => {
    it("extracts DisplayName/Name/Value from each anyType entry", () => {
      const doc = parse(
        `<Properties xmlns="${NS_ABS}" xmlns:a="${NS_ARR}">
           <a:anyType>
             <DisplayName>Name</DisplayName>
             <Name>Title</Name>
             <Value>Web Server</Value>
           </a:anyType>
           <a:anyType>
             <DisplayName>Out Of Scope</DisplayName>
             <Name>OutOfScope</Name>
             <Value>true</Value>
           </a:anyType>
         </Properties>`,
      );
      const props = iterAnyTypeProps(doc.documentElement);
      expect(props).toEqual([
        { displayName: "Name", name: "Title", value: "Web Server" },
        { displayName: "Out Of Scope", name: "OutOfScope", value: "true" },
      ]);
    });

    it("returns an empty array for a Properties container with no anyType entries", () => {
      const doc = parse(`<Properties xmlns="${NS_ABS}"/>`);
      expect(iterAnyTypeProps(doc.documentElement)).toEqual([]);
    });
  });

  describe("parseXml", () => {
    it("returns the doc and null error for well-formed XML", () => {
      const { doc, error } = parseXml(`<root><child/></root>`);
      expect(error).toBeNull();
      expect(doc.documentElement.tagName).toBe("root");
    });

    it("returns an error string for malformed XML", () => {
      const { error } = parseXml(`<root><child></root>`);
      expect(error).not.toBeNull();
      expect(error).toMatch(/./);
    });
  });
});
