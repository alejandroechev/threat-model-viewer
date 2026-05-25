import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EXAMPLE_PATH = resolve(process.cwd(), "examples", "example1.tm7");

let cached: string | null = null;

export function loadExampleXml(): string {
  if (cached === null) {
    cached = readFileSync(EXAMPLE_PATH, "utf8");
  }
  return cached;
}
