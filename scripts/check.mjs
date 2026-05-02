import { readFile } from "node:fs/promises";
import { detectSchemas } from "../src/engine.mjs";
import {
  SCHEMA_LIFECYCLE_STATES,
  transitionSchemaLifecycle,
} from "../src/lifecycle.mjs";

const inferenceOutput = JSON.parse(await readFile(new URL("../examples/sample-inference-output.json", import.meta.url), "utf8"));
const result = detectSchemas(inferenceOutput);

if (!result.schemas.length) {
  throw new Error("Expected schema signal from sample inference output.");
}

if (!result.schemas.every((schema) => schema.formation_mode === "evidence_induced")) {
  throw new Error("Expected induced schemas, not fixed taxonomy schemas.");
}

if (!result.schemas.every((schema) => Object.values(SCHEMA_LIFECYCLE_STATES).includes(schema.state))) {
  throw new Error("Expected schema state labels to be assigned.");
}
if (!result.schemas.every((schema) => schema.lifecycle_state === schema.state && schema.state_label)) {
  throw new Error("Expected schemas to expose lifecycle state and label.");
}

const builderFixture = {
  schema_version: "memact.inference.v0",
  records: [
    meaningRecord("r1", "YC founder video about building proof by shipping a real MVP", ["startup"], "https://example.com/1", "2026-04-01T10:00:00Z"),
    meaningRecord("r2", "Startup project work to build and launch proof", ["startup", "coding"], "https://github.com/example/repo", "2026-04-02T10:00:00Z"),
    meaningRecord("r3", "Startup podcast says founders need visible proof and product momentum", ["startup"], "https://example.com/3", "2026-04-03T10:00:00Z"),
  ],
};

const builderResult = detectSchemas(builderFixture);
const builderSchema = builderResult.schemas.find((schema) => schema.matched_markers.includes("startup"));
if (!builderSchema) {
  throw new Error("Expected repeated builder evidence to induce a startup-related schema.");
}

if (!builderSchema.virtual_schema_packet || builderSchema.schema_kind !== "virtual_cognitive_schema") {
  throw new Error("Expected a virtual cognitive-schema packet.");
}

if (!builderSchema.marker_categories?.length || !builderSchema.formation_metrics) {
  throw new Error("Expected schema formation to include marker categories and metrics.");
}

const healthFixture = {
  schema_version: "memact.inference.v0",
  records: [
    meaningRecord("h1", "Sleep article about tired mornings and energy", ["sleep"], "https://health.example/sleep-energy", "2026-04-01T10:00:00Z"),
    meaningRecord("h2", "Workout video on energy, focus, and routine", ["fitness"], "https://video.example/workout-energy", "2026-04-02T10:00:00Z"),
    meaningRecord("h3", "Nutrition notes about sleep quality and feeling tired", ["nutrition"], "https://notes.example/sleep-food", "2026-04-03T10:00:00Z"),
    meaningRecord("h4", "Journal entry on sleep, energy, and stress", ["journal"], "https://journal.example/sleep-energy", "2026-04-04T10:00:00Z"),
  ],
};

const healthResult = detectSchemas(healthFixture);
if (!healthResult.schemas.some((schema) => schema.matched_markers.includes("energy") || schema.matched_markers.includes("sleep"))) {
  throw new Error("Expected non-startup health evidence to induce a general schema.");
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
if (noisyResult.schemas.length) {
  throw new Error("Theme-only navigation noise should not form a schema.");
}

const confirmedSchema = transitionSchemaLifecycle(builderSchema, {
  action: "confirm",
  reason: "user confirmed this schema",
  occurred_at: "2026-05-02T10:00:00Z",
});
if (confirmedSchema.lifecycle_state !== SCHEMA_LIFECYCLE_STATES.USER_CONFIRMED) {
  throw new Error("Expected user feedback to transition schema lifecycle state.");
}

const contradictedSchema = transitionSchemaLifecycle(builderSchema, {
  action: "contradict",
  reason: "opposing evidence arrived",
});
if (contradictedSchema.state !== SCHEMA_LIFECYCLE_STATES.CONTRADICTED) {
  throw new Error("Expected contradiction to transition schema lifecycle state.");
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
