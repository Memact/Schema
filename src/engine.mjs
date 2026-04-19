const DEFAULT_SCHEMA_RULES = [
  {
    id: "builder_agency",
    label: "Builder / agency schema",
    themes: ["startup", "coding", "ai"],
    summary: "Interpreting progress through building, shipping, tools, and visible proof.",
  },
  {
    id: "performance_pressure",
    label: "Performance / evaluation schema",
    themes: ["exam", "productivity"],
    summary: "Interpreting progress through scores, output, deadlines, or measurable performance.",
  },
  {
    id: "attention_protection",
    label: "Attention protection schema",
    themes: ["attention", "burnout", "productivity"],
    summary: "Interpreting life through focus, overload, distraction, and recovery of attention.",
  },
];

export function detectSchemas(inferenceOutput, options = {}) {
  const minSupport = Number(options.minSupport ?? 3);
  const records = Array.isArray(inferenceOutput?.records) ? inferenceOutput.records : [];
  const rules = options.schemaRules ?? DEFAULT_SCHEMA_RULES;
  const themeCounts = countThemes(records);
  const schemas = rules
    .map((rule) => scoreSchema(rule, records, themeCounts, minSupport))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence || b.support - a.support || a.id.localeCompare(b.id));

  return {
    schema_version: "memact.schema.v0",
    generated_at: new Date().toISOString(),
    source: {
      inference_schema_version: inferenceOutput?.schema_version ?? null,
      inferred_record_count: records.length,
    },
    min_support: minSupport,
    theme_counts: themeCounts,
    schemas,
  };
}

export function formatSchemaReport(result) {
  const lines = [
    "Memact Schema Report",
    `Inferred records: ${result.source.inferred_record_count}`,
    `Minimum support: ${result.min_support}`,
    "",
    "Schema Signals",
  ];

  if (!result.schemas.length) {
    lines.push("No schema signals met the support threshold.");
    return lines.join("\n");
  }

  result.schemas.forEach((schema, index) => {
    lines.push(`${index + 1}. ${schema.label}`);
    lines.push(`   support=${schema.support} confidence=${schema.confidence.toFixed(3)}`);
    lines.push(`   themes=${schema.matched_themes.join(", ")}`);
    lines.push(`   ${schema.summary}`);
  });

  return lines.join("\n");
}

function scoreSchema(rule, records, themeCounts, minSupport) {
  const matchedThemes = rule.themes.filter((theme) => (themeCounts[theme] ?? 0) > 0);
  const support = matchedThemes.reduce((sum, theme) => sum + (themeCounts[theme] ?? 0), 0);

  if (support < minSupport || matchedThemes.length === 0) {
    return null;
  }

  const evidenceRecords = records
    .filter((record) => record.canonical_themes?.some((theme) => matchedThemes.includes(theme)))
    .slice(0, 8)
    .map((record) => ({
      id: record.id,
      source_label: record.source_label,
      themes: record.canonical_themes?.filter((theme) => matchedThemes.includes(theme)) ?? [],
      sources: record.sources ?? [],
    }));

  const themeCoverage = matchedThemes.length / rule.themes.length;
  const repetition = Math.min(1, support / Math.max(minSupport, 8));
  const confidence = Number(((themeCoverage * 0.45) + (repetition * 0.55)).toFixed(4));

  return {
    id: rule.id,
    label: rule.label,
    summary: rule.summary,
    matched_themes: matchedThemes,
    support,
    confidence,
    evidence_records: evidenceRecords,
    claim_type: "schema_signal",
    language_guardrail: "This is a possible schema signal, not a diagnosis or causal claim.",
  };
}

function countThemes(records) {
  return records.reduce((counts, record) => {
    (record.canonical_themes ?? []).forEach((theme) => {
      counts[theme] = (counts[theme] ?? 0) + 1;
    });
    return counts;
  }, {});
}
