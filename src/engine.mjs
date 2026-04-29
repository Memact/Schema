const DEFAULT_MIN_SUPPORT = 3;
const DEFAULT_MIN_MEANINGFUL_SCORE = 0.38;
const DEFAULT_MIN_WEIGHTED_SUPPORT = 1.15;
const DEFAULT_MIN_COHESION = 0.05;
const DEFAULT_MAX_SCHEMAS = 8;

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "before",
  "being",
  "can",
  "com",
  "did",
  "does",
  "for",
  "from",
  "has",
  "have",
  "how",
  "into",
  "just",
  "like",
  "not",
  "now",
  "off",
  "once",
  "only",
  "page",
  "that",
  "the",
  "then",
  "this",
  "through",
  "toward",
  "was",
  "were",
  "what",
  "when",
  "where",
  "while",
  "with",
  "your",
]);

const LOW_SIGNAL_TERMS = new Set([
  "account",
  "admin",
  "billing",
  "dashboard",
  "example",
  "home",
  "login",
  "meaningful",
  "page",
  "privacy",
  "profile",
  "settings",
  "signin",
  "signup",
  "source",
  "specific",
  "repeated",
  "activity",
]);

const COGNITIVE_DIMENSIONS = {
  action: [
    "apply",
    "build",
    "change",
    "choose",
    "create",
    "debug",
    "decide",
    "finish",
    "fix",
    "launch",
    "learn",
    "make",
    "plan",
    "practice",
    "prepare",
    "prove",
    "publish",
    "ship",
    "solve",
    "start",
    "work",
  ],
  evaluation: [
    "accepted",
    "behind",
    "better",
    "compare",
    "deadline",
    "fail",
    "grade",
    "judge",
    "rank",
    "ready",
    "rejected",
    "score",
    "test",
    "value",
    "worth",
  ],
  identity: [
    "become",
    "career",
    "confidence",
    "founder",
    "future",
    "identity",
    "life",
    "myself",
    "person",
    "self",
  ],
  affect: [
    "anxiety",
    "burnout",
    "feel",
    "fear",
    "focus",
    "guilt",
    "happy",
    "obsessed",
    "overwhelmed",
    "pressure",
    "stress",
    "tired",
  ],
  social: [
    "audience",
    "followers",
    "friends",
    "likes",
    "people",
    "public",
    "recognition",
    "share",
    "social",
    "views",
  ],
};

export function detectSchemas(inferenceOutput, options = {}) {
  const minSupport = Number(options.minSupport ?? DEFAULT_MIN_SUPPORT);
  const minimumMeaningfulScore = Number(options.minimumMeaningfulScore ?? DEFAULT_MIN_MEANINGFUL_SCORE);
  const minWeightedSupport = Number(options.minWeightedSupport ?? DEFAULT_MIN_WEIGHTED_SUPPORT);
  const minCohesion = Number(options.minCohesion ?? DEFAULT_MIN_COHESION);
  const maxSchemas = Number(options.maxSchemas ?? DEFAULT_MAX_SCHEMAS);
  const records = (Array.isArray(inferenceOutput?.records) ? inferenceOutput.records : [])
    .filter((record) => record.meaningful !== false)
    .filter((record) => Number(record.meaningful_score ?? 1) >= minimumMeaningfulScore)
    .map(profileRecord);

  const themeCounts = countThemes(records);
  const schemas = induceSchemas(records, {
    minSupport,
    minWeightedSupport,
    minCohesion,
    maxSchemas,
  });

  return {
    schema_version: "memact.schema.v0",
    generated_at: new Date().toISOString(),
    source: {
      inference_schema_version: inferenceOutput?.schema_version ?? null,
      inferred_record_count: Array.isArray(inferenceOutput?.records) ? inferenceOutput.records.length : 0,
      meaningful_record_count: records.length,
    },
    formation_mode: "evidence_induced",
    min_support: minSupport,
    minimum_meaningful_score: minimumMeaningfulScore,
    min_weighted_support: minWeightedSupport,
    min_cohesion: minCohesion,
    theme_counts: themeCounts,
    schemas,
    schema_network: buildSchemaNetwork(schemas),
    formation_principle: "Virtual cognitive schemas are induced from repeated meaningful activity, co-occurring concepts, cognitive dimensions, source spread, and time. They are not selected from a fixed topic taxonomy.",
  };
}

export function formatSchemaReport(result) {
  const lines = [
    "Memact Schema Report",
    `Formation mode: ${result.formation_mode || "unknown"}`,
    `Inferred records: ${result.source.inferred_record_count}`,
    `Meaningful records: ${result.source.meaningful_record_count}`,
    `Minimum support: ${result.min_support}`,
    "",
    "Virtual Cognitive Schemas",
  ];

  if (!result.schemas.length) {
    lines.push("No virtual cognitive schemas met the formation threshold.");
    return lines.join("\n");
  }

  result.schemas.forEach((schema, index) => {
    lines.push(`${index + 1}. ${schema.label}`);
    lines.push(`   state=${schema.state} support=${schema.support} weighted=${schema.weighted_support.toFixed(3)} confidence=${schema.confidence.toFixed(3)}`);
    lines.push(`   basis=${schema.formation_basis}`);
    lines.push(`   frame=${schema.core_interpretation}`);
  });

  return lines.join("\n");
}

function induceSchemas(records, thresholds) {
  const anchorCounts = countAnchors(records);
  const anchors = [...anchorCounts.entries()]
    .filter(([, count]) => count >= thresholds.minSupport)
    .map(([anchor]) => anchor)
    .filter((anchor) => !LOW_SIGNAL_TERMS.has(anchor));

  const candidates = anchors
    .map((anchor) => buildCandidate(anchor, records, thresholds))
    .filter(Boolean)
    .sort((a, b) =>
      b.confidence - a.confidence ||
      b.weighted_support - a.weighted_support ||
      b.support - a.support ||
      a.id.localeCompare(b.id)
    );

  return dedupeSchemas(candidates).slice(0, thresholds.maxSchemas);
}

function buildCandidate(anchor, records, thresholds) {
  const scoredRecords = records
    .map((record) => scoreRecordForAnchor(record, anchor))
    .filter((record) => record.schema_record_score > 0)
    .sort((a, b) => b.schema_record_score - a.schema_record_score || a.source_label.localeCompare(b.source_label));
  const support = scoredRecords.length;
  const weightedSupport = round(scoredRecords.reduce((sum, record) => sum + record.schema_record_score, 0), 4);
  const activeDayCount = countActiveDays(scoredRecords);
  const distinctSourceCount = countDistinctSources(scoredRecords);
  const concepts = topTerms(scoredRecords.flatMap((record) => record.concepts), 10);
  const repeatedConcepts = repeatedTerms(scoredRecords.flatMap((record) => record.concepts), 2);
  const cognitiveDimensions = unique(scoredRecords.flatMap((record) => record.cognitive_dimensions));
  const matchedThemes = topTerms(scoredRecords.flatMap((record) => record.themes), 8);
  const cohesion = round(averageCohesion(scoredRecords));

  if (
    support < thresholds.minSupport ||
    weightedSupport < thresholds.minWeightedSupport ||
    cohesion < thresholds.minCohesion ||
    !hasSchemaSubstance({ anchor, repeatedConcepts, cognitiveDimensions, distinctSourceCount })
  ) {
    return null;
  }

  const evidenceRecords = scoredRecords.slice(0, 10).map((record) => ({
    id: record.id,
    packet_id: record.packet_id,
    source_label: record.source_label,
    concepts: record.concepts,
    themes: record.themes,
    cognitive_dimensions: record.cognitive_dimensions,
    schema_record_score: record.schema_record_score,
    meaningful_score: record.meaningful_score,
    meaning_reasons: record.meaning_reasons,
    sources: record.sources,
  }));
  const repetition = Math.min(1, support / Math.max(thresholds.minSupport, 8));
  const sourceSpread = Math.min(1, distinctSourceCount / Math.max(2, Math.min(support, 4)));
  const timeSpread = Math.min(1, activeDayCount / Math.max(2, Math.min(support, 4)));
  const dimensionSpread = Math.min(1, cognitiveDimensions.length / 3);
  const conceptSpread = Math.min(1, repeatedConcepts.length / 5);
  const confidence = round(
    (repetition * 0.24) +
      (sourceSpread * 0.18) +
      (timeSpread * 0.12) +
      (cohesion * 0.18) +
      (dimensionSpread * 0.16) +
      (conceptSpread * 0.12)
  );
  const state = resolveSchemaState({ support, confidence, activeDayCount, distinctSourceCount }, thresholds);
  const label = buildDynamicLabel(anchor, concepts, cognitiveDimensions);
  const coreInterpretation = buildCoreInterpretation(concepts, cognitiveDimensions);
  const actionTendency = buildActionTendency(concepts, cognitiveDimensions);
  const emotionalSignature = buildEmotionalSignature(cognitiveDimensions, concepts);

  return {
    id: `induced_${slug([anchor, ...concepts.slice(0, 3)].join("_"))}`,
    label,
    summary: `An induced virtual schema connecting ${concepts.slice(0, 5).join(", ")} across repeated meaningful activity.`,
    schema_kind: "virtual_cognitive_schema",
    formation_mode: "evidence_induced",
    virtual: true,
    cognitive_schema: true,
    core_interpretation: coreInterpretation,
    action_tendency: actionTendency,
    emotional_signature: emotionalSignature,
    state,
    state_label: stateLabel(state),
    anchor_concept: anchor,
    matched_themes: matchedThemes,
    matched_markers: concepts,
    marker_categories: cognitiveDimensions,
    support,
    weighted_support: weightedSupport,
    distinct_source_count: distinctSourceCount,
    active_day_count: activeDayCount,
    cohesion,
    confidence,
    formation_basis: buildFormationBasis({
      support,
      weightedSupport,
      distinctSourceCount,
      activeDayCount,
      concepts,
      cognitiveDimensions,
      cohesion,
    }),
    formation_metrics: {
      support,
      weighted_support: weightedSupport,
      distinct_source_count: distinctSourceCount,
      active_day_count: activeDayCount,
      cohesion,
      repeated_concept_count: repeatedConcepts.length,
      cognitive_dimension_count: cognitiveDimensions.length,
      confidence,
    },
    virtual_schema_packet: {
      id: `schema_packet:induced_${slug([anchor, ...concepts.slice(0, 3)].join("_"))}`,
      type: "virtual_cognitive_schema_packet",
      label,
      formation_mode: "evidence_induced",
      core_interpretation: coreInterpretation,
      action_tendency: actionTendency,
      emotional_signature: emotionalSignature,
      matched_themes: matchedThemes,
      matched_markers: concepts,
      marker_categories: cognitiveDimensions,
      support,
      weighted_support: weightedSupport,
      cohesion,
      confidence,
      formation_metrics: {
        support,
        weighted_support: weightedSupport,
        distinct_source_count: distinctSourceCount,
        active_day_count: activeDayCount,
        cohesion,
        cognitive_dimensions: cognitiveDimensions,
      },
      evidence_packet_ids: evidenceRecords.map((record) => record.packet_id || `packet:${record.id}`),
    },
    evidence_records: evidenceRecords,
    claim_type: "virtual_cognitive_schema_signal",
    language_guardrail: "This is an induced virtual cognitive-schema signal from repeated evidence, not a diagnosis or causal certainty.",
  };
}

function profileRecord(record) {
  const text = collectRecordText(record);
  const tokens = tokenize(text);
  const themes = unique(record.canonical_themes ?? []);
  const concepts = unique([
    ...themes.map((theme) => normalize(theme).toLowerCase()),
    ...tokens.filter((token) => !LOW_SIGNAL_TERMS.has(token)),
    ...extractBigrams(tokens),
  ]).slice(0, 40);
  const cognitiveDimensions = detectCognitiveDimensions(text, concepts);
  return {
    id: record.id,
    packet_id: record.packet_id ?? null,
    source_label: normalize(record.source_label || record.evidence?.title || "meaning packet"),
    started_at: record.started_at,
    ended_at: record.ended_at,
    concepts,
    themes,
    cognitive_dimensions: cognitiveDimensions,
    meaningful_score: Number(record.meaningful_score ?? 0.58),
    meaning_reasons: record.meaning_reasons ?? [],
    sources: record.sources ?? [],
  };
}

function scoreRecordForAnchor(record, anchor) {
  const conceptSet = new Set(record.concepts);
  if (!conceptSet.has(anchor)) {
    return { ...record, schema_record_score: 0 };
  }
  const conceptDensity = Math.min(1, record.concepts.length / 12);
  const dimensionScore = Math.min(1, record.cognitive_dimensions.length / 3);
  const sourceScore = Array.isArray(record.sources) && record.sources.length ? 0.08 : 0;
  const meaningfulScore = Number(record.meaningful_score ?? 0.58);
  const score = round(
    Math.min(1, 0.42 + (conceptDensity * 0.18) + (dimensionScore * 0.2) + (meaningfulScore * 0.12) + sourceScore)
  );
  return {
    ...record,
    schema_record_score: score,
  };
}

function hasSchemaSubstance({ anchor, repeatedConcepts, cognitiveDimensions, distinctSourceCount }) {
  const repeatedBeyondAnchor = repeatedConcepts.filter((term) => term !== anchor && !LOW_SIGNAL_TERMS.has(term));
  return cognitiveDimensions.length > 0 || (repeatedBeyondAnchor.length >= 2 && distinctSourceCount >= 2);
}

function buildDynamicLabel(anchor, concepts, cognitiveDimensions) {
  const labelConcepts = unique([anchor, ...concepts.filter((concept) => concept !== anchor)]).slice(0, 2);
  const dimension = cognitiveDimensions[0] ? `${titleCase(cognitiveDimensions[0])} frame` : "Repeated frame";
  return `${labelConcepts.map(titleCase).join(" / ")} ${dimension}`;
}

function buildCoreInterpretation(concepts, dimensions) {
  const conceptText = concepts.slice(0, 4).map(titleCase).join(", ");
  if (dimensions.length) {
    return `Memact sees ${conceptText} repeatedly appearing through ${dimensions.join(", ")} signals.`;
  }
  return `Memact sees ${conceptText} repeatedly appearing together across meaningful activity.`;
}

function buildActionTendency(concepts, dimensions) {
  if (dimensions.includes("action")) {
    return `move toward activity around ${concepts.slice(0, 3).join(", ")}`;
  }
  if (dimensions.includes("evaluation")) {
    return `judge or compare activity around ${concepts.slice(0, 3).join(", ")}`;
  }
  if (dimensions.includes("identity")) {
    return `connect ${concepts.slice(0, 3).join(", ")} to self-direction`;
  }
  return `revisit and connect ${concepts.slice(0, 3).join(", ")}`;
}

function buildEmotionalSignature(dimensions, concepts) {
  const output = [];
  if (dimensions.includes("affect")) output.push("emotion-linked");
  if (dimensions.includes("evaluation")) output.push("evaluation pressure");
  if (dimensions.includes("identity")) output.push("identity relevance");
  if (dimensions.includes("social")) output.push("social visibility");
  if (!output.length && concepts.length) output.push("repeated salience");
  return output;
}

function countAnchors(records) {
  const counts = new Map();
  records.forEach((record) => {
    unique(record.concepts).forEach((concept) => {
      counts.set(concept, (counts.get(concept) || 0) + 1);
    });
  });
  return counts;
}

function averageCohesion(records) {
  if (records.length <= 1) return 1;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      total += jaccard(records[i].concepts, records[j].concepts);
      pairs += 1;
    }
  }
  return pairs ? total / pairs : 0;
}

function jaccard(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (!union.size) return 0;
  let intersection = 0;
  leftSet.forEach((value) => {
    if (rightSet.has(value)) intersection += 1;
  });
  return intersection / union.size;
}

function dedupeSchemas(candidates) {
  const accepted = [];
  for (const candidate of candidates) {
    const duplicate = accepted.some((schema) => jaccard(schema.matched_markers, candidate.matched_markers) >= 0.72);
    if (!duplicate) accepted.push(candidate);
  }
  return accepted;
}

function buildSchemaNetwork(schemas) {
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const addNode = (node) => {
    if (!node?.id || seen.has(node.id)) return;
    seen.add(node.id);
    nodes.push(node);
  };

  schemas.forEach((schema) => {
    const schemaId = `schema:${schema.id}`;
    addNode({
      id: schemaId,
      type: "virtual_cognitive_schema",
      label: schema.label,
      formation_mode: schema.formation_mode,
      state: schema.state,
      confidence: schema.confidence,
    });

    (schema.matched_markers ?? []).forEach((concept) => {
      const conceptId = `concept:${slug(concept)}`;
      addNode({ id: conceptId, type: "concept", label: concept });
      edges.push({ from: schemaId, to: conceptId, type: "contains_concept", weight: 1 });
    });

    (schema.marker_categories ?? []).forEach((dimension) => {
      const dimensionId = `dimension:${slug(dimension)}`;
      addNode({ id: dimensionId, type: "cognitive_dimension", label: dimension });
      edges.push({ from: schemaId, to: dimensionId, type: "has_cognitive_dimension", weight: 1 });
    });

    (schema.evidence_records ?? []).forEach((record) => {
      const packetId = record.packet_id || `packet:${record.id}`;
      addNode({
        id: packetId,
        type: "meaning_packet",
        label: record.source_label,
        score: Number(record.meaningful_score ?? 1),
      });
      edges.push({
        from: schemaId,
        to: packetId,
        type: "supported_by_packet",
        weight: Number(record.schema_record_score ?? record.meaningful_score ?? 1),
      });
    });
  });

  return { nodes, edges };
}

function detectCognitiveDimensions(text, concepts) {
  const haystack = `${normalize(text).toLowerCase()} ${concepts.join(" ")}`;
  return Object.entries(COGNITIVE_DIMENSIONS)
    .filter(([, terms]) => terms.some((term) => hasPhrase(haystack, term)))
    .map(([dimension]) => dimension);
}

function collectRecordText(record) {
  const parts = [
    record.source_label,
    record.evidence?.title,
    record.evidence?.text_excerpt,
    ...(record.canonical_themes ?? []),
  ];
  (record.themes ?? []).forEach((theme) => {
    parts.push(theme.label, ...(theme.evidence_terms ?? []));
  });
  return parts.filter(Boolean).join(" ");
}

function extractBigrams(tokens) {
  const bigrams = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = tokens[index];
    const right = tokens[index + 1];
    if (LOW_SIGNAL_TERMS.has(left) || LOW_SIGNAL_TERMS.has(right)) continue;
    bigrams.push(`${left} ${right}`);
  }
  return bigrams;
}

function tokenize(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9+#./-]+/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^www\./, "").replace(/\.(com|org|net|io|ai)$/i, ""))
    .filter((token) => token.length >= 3)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => !/^\d+$/.test(token));
}

function resolveSchemaState(metrics, thresholds) {
  if (
    metrics.support >= Math.max(thresholds.minSupport * 3, 8) &&
    metrics.confidence >= 0.7 &&
    metrics.activeDayCount >= 2
  ) {
    return "stable";
  }
  if (
    metrics.support >= Math.max(thresholds.minSupport * 2, 5) ||
    (metrics.confidence >= 0.56 && metrics.distinctSourceCount >= 2)
  ) {
    return "reinforced";
  }
  return "emerging";
}

function stateLabel(state) {
  return state === "stable"
    ? "Stable virtual schema"
    : state === "reinforced"
      ? "Reinforced virtual schema"
      : "Emerging virtual schema";
}

function buildFormationBasis({ support, weightedSupport, distinctSourceCount, activeDayCount, concepts, cognitiveDimensions, cohesion }) {
  return [
    `${support} supporting meaning packets`,
    `${weightedSupport.toFixed(2)} weighted support`,
    `${distinctSourceCount} distinct source${distinctSourceCount === 1 ? "" : "s"}`,
    `${activeDayCount} active day${activeDayCount === 1 ? "" : "s"}`,
    `cohesion ${cohesion.toFixed(2)}`,
    `concepts: ${concepts.slice(0, 6).join(", ")}`,
    `dimensions: ${cognitiveDimensions.join(", ") || "concept-only"}`,
  ].join("; ");
}

function countThemes(records) {
  return records.reduce((counts, record) => {
    (record.themes ?? []).forEach((theme) => {
      counts[theme] = (counts[theme] ?? 0) + 1;
    });
    return counts;
  }, {});
}

function countDistinctSources(records) {
  const sources = new Set();
  records.forEach((record) => {
    (record.sources ?? []).forEach((source) => {
      const key = source.url || source.domain || source.title;
      if (key) sources.add(key);
    });
  });
  return sources.size || (records.length ? 1 : 0);
}

function countActiveDays(records) {
  const days = new Set();
  records.forEach((record) => {
    const value = record.started_at || record.ended_at;
    const timestamp = Date.parse(value || "");
    if (Number.isFinite(timestamp)) {
      days.add(new Date(timestamp).toISOString().slice(0, 10));
    }
  });
  return days.size || (records.length ? 1 : 0);
}

function repeatedTerms(values, minCount) {
  return topTerms(values, 100).filter((term) => countValues(values).get(term) >= minCount);
}

function topTerms(values, limit = 8) {
  return [...countValues(values).entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

function countValues(values) {
  const counts = new Map();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const key = normalize(value).toLowerCase();
    if (!key || LOW_SIGNAL_TERMS.has(key)) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function hasPhrase(text, phrase) {
  const haystack = normalize(text).toLowerCase();
  const needle = normalize(phrase).toLowerCase();
  if (!haystack || !needle) return false;
  if (/^[a-z0-9]+$/.test(needle)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`, "i").test(haystack);
  }
  return haystack.includes(needle);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalize).filter(Boolean))];
}

function round(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 10000) / 10000;
}

function titleCase(value) {
  return normalize(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "schema";
}
