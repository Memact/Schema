import { readFile } from "node:fs/promises";
import { detectSchemas } from "../src/engine.mjs";

const inferenceOutput = JSON.parse(await readFile(new URL("../examples/sample-inference-output.json", import.meta.url), "utf8"));
const result = detectSchemas(inferenceOutput);

if (!result.schemas.length) {
  throw new Error("Expected schema signal from sample inference output.");
}

if (!result.schemas.some((schema) => schema.id === "builder_agency")) {
  throw new Error("Expected builder_agency schema signal.");
}

if (!result.schemas.every((schema) => ["emerging", "reinforced", "stable"].includes(schema.state))) {
  throw new Error("Expected schema state labels to be assigned.");
}

console.log("Schema check passed.");
