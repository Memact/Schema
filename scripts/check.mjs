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

const builderFixture = {
  schema_version: "memact.inference.v0",
  records: [
    meaningRecord("r1", "YC founder video about building proof by shipping a real MVP", ["startup"], "https://example.com/1", "2026-04-01T10:00:00Z"),
    meaningRecord("r2", "GitHub repo work to build and launch the project", ["coding"], "https://github.com/example/repo", "2026-04-02T10:00:00Z"),
    meaningRecord("r3", "Startup podcast says founders need visible proof and product momentum", ["startup"], "https://example.com/3", "2026-04-03T10:00:00Z"),
  ],
};

const builderResult = detectSchemas(builderFixture);
const builderSchema = builderResult.schemas.find((schema) => schema.id === "builder_agency");
if (!builderSchema) {
  throw new Error("Expected repeated builder evidence to form builder_agency.");
}

if (!builderSchema.virtual_schema_packet || builderSchema.schema_kind !== "virtual_cognitive_schema") {
  throw new Error("Expected a virtual cognitive-schema packet.");
}

if (!builderSchema.marker_categories?.length || !builderSchema.formation_metrics) {
  throw new Error("Expected schema formation to include marker categories and metrics.");
}

const noisyFixture = {
  schema_version: "memact.inference.v0",
  records: [
    meaningRecord("n1", "GitHub settings page", ["coding"], "https://github.com/settings", "2026-04-01T10:00:00Z"),
    meaningRecord("n2", "Code hosting dashboard", ["coding"], "https://github.com/dashboard", "2026-04-02T10:00:00Z"),
    meaningRecord("n3", "Developer account billing", ["coding"], "https://github.com/billing", "2026-04-03T10:00:00Z"),
  ],
};

const noisyResult = detectSchemas(noisyFixture);
if (noisyResult.schemas.some((schema) => schema.id === "builder_agency")) {
  throw new Error("Theme-only coding noise should not form a builder schema.");
}

console.log("Schema check passed.");

function meaningRecord(id, title, themes, url, startedAt) {
  return {
    id,
    packet_id: `packet:${id}`,
    meaningful: true,
    meaningful_score: 0.72,
    source_label: title,
    started_at: startedAt,
    ended_at: startedAt,
    canonical_themes: themes,
    evidence: {
      title,
      text_excerpt: title,
    },
    meaning_reasons: ["specific source", "repeated meaningful activity"],
    sources: [
      {
        title,
        url,
        domain: new URL(url).hostname,
        occurred_at: startedAt,
      },
    ],
  };
}
