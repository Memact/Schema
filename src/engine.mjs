const DEFAULT_MIN_SUPPORT = 3;
const DEFAULT_MIN_MEANINGFUL_SCORE = 0.38;
const DEFAULT_MIN_RECORD_SCORE = 0.28;
const DEFAULT_MIN_WEIGHTED_SUPPORT = 1.15;
const DEFAULT_MIN_MARKER_CATEGORIES = 2;

const DEFAULT_SCHEMA_RULES = [
  {
    id: "builder_agency",
    label: "Builder / agency schema",
    themes: ["startup", "coding", "ai"],
    summary: "A virtual schema where progress is interpreted through building, shipping, tools, and visible proof.",
    core_interpretation: "Progress feels real when it becomes built, shipped, or visible.",
    action_tendency: "move toward building, debugging, launching, proving, or showing work",
    emotional_signature: ["urgency", "agency", "pressure to prove"],
    marker_groups: {
      interpretation: ["real", "proof", "prove", "mvp", "visible"],
      action: ["build", "builder", "ship", "shipping", "launch", "debug", "project", "repo", "github", "product"],
      identity: ["founder", "startup", "developer", "maker"],
    },
    required_marker_categories: ["interpretation"],
    markers: [
      "build",
      "builder",
      "ship",
      "shipping",
      "launch",
      "mvp",
      "proof",
      "prove",
      "founder",
      "startup",
      "github",
      "project",
      "repo",
      "product",
      "real",
    ],
  },
  {
    id: "performance_evaluation",
    label: "Performance / evaluation schema",
    themes: ["exam", "productivity"],
    summary: "A virtual schema where progress is interpreted through scores, deadlines, output, or external evaluation.",
    core_interpretation: "Worth or readiness feels tied to measurable performance.",
    action_tendency: "compare, prepare, optimize, measure, or seek validation",
    emotional_signature: ["pressure", "comparison", "fear of falling behind"],
    marker_groups: {
      interpretation: ["worth", "readiness", "accepted", "rejected", "better than", "behind"],
      action: ["prepare", "optimize", "apply", "application", "test", "exam"],
      evaluation: ["score", "rank", "marks", "deadline", "output", "prove myself"],
    },
    required_marker_categories: ["interpretation"],
    markers: [
      "exam",
      "score",
      "rank",
      "marks",
      "test",
      "deadline",
      "output",
      "behind",
      "better than",
      "apply",
      "application",
      "accepted",
      "rejected",
      "prove myself",
    ],
  },
  {
    id: "attention_regulation",
    label: "Attention regulation schema",
    themes: ["attention", "burnout", "productivity"],
    summary: "A virtual schema where attention, focus, distraction, and overload become the frame for understanding life.",
    core_interpretation: "A thought is understood through whether attention is protected or fragmented.",
    action_tendency: "seek focus, reduce noise, create routines, or recover from overload",
    emotional_signature: ["overload", "fatigue", "need for control"],
    marker_groups: {
      interpretation: ["fragmented", "overwhelmed", "burnout", "dopamine"],
      action: ["focus", "deep work", "routine", "habit", "flow"],
      emotion: ["tired", "fatigue", "overload", "control"],
    },
    required_marker_categories: ["interpretation"],
    markers: [
      "focus",
      "attention",
      "deep work",
      "distraction",
      "dopamine",
      "overwhelmed",
      "burnout",
      "tired",
      "fatigue",
      "routine",
      "habit",
      "flow",
    ],
  },
  {
    id: "identity_direction",
    label: "Identity direction schema",
    themes: ["identity", "startup", "coding", "ai"],
    summary: "A virtual schema where choices are interpreted through becoming a certain kind of person.",
    core_interpretation: "Activities are filtered through who the user is trying to become.",
    action_tendency: "select inputs, projects, and people that reinforce a future self-image",
    emotional_signature: ["aspiration", "self-comparison", "identity tension"],
    marker_groups: {
      interpretation: ["worth", "confidence", "future", "life"],
      action: ["become", "career", "choose", "select"],
      identity: ["identity", "founder", "builder", "developer", "person", "self"],
    },
    required_marker_categories: ["interpretation"],
    markers: [
      "identity",
      "become",
      "future",
      "founder",
      "builder",
      "developer",
      "person",
      "self",
      "worth",
      "confidence",
      "career",
      "life",
    ],
  },
  {
    id: "visibility_validation",
    label: "Visibility / validation schema",
    themes: ["startup", "identity", "productivity"],
    summary: "A virtual schema where public proof, audience, followers, and recognition shape the interpretation of progress.",
    core_interpretation: "An idea feels stronger when it is seen, recognized, or validated by others.",
    action_tendency: "publish, check response, compare attention, or seek visible proof",
    emotional_signature: ["visibility pressure", "validation seeking", "public self-monitoring"],
    marker_groups: {
      interpretation: ["recognition", "validation", "visible proof"],
      action: ["post", "publish", "check response", "public"],
      social: ["followers", "views", "likes", "audience", "profile", "social", "twitter", "x.com", "linkedin", "bluesky"],
    },
    required_marker_categories: ["interpretation"],
    markers: [
      "followers",
      "views",
      "likes",
      "post",
      "public",
      "audience",
      "recognition",
      "attention",
      "viral",
      "profile",
      "social",
      "twitter",
      "x.com",
      "linkedin",
      "bluesky",
    ],
  },
];

export function detectSchemas(inferenceOutput, options = {}) {
  const minSupport = Number(options.minSupport ?? DEFAULT_MIN_SUPPORT);
  const minimumMeaningfulScore = Number(options.minimumMeaningfulScore ?? DEFAULT_MIN_MEANINGFUL_SCORE);
  const minRecordScore = Number(options.minRecordScore ?? DEFAULT_MIN_RECORD_SCORE);
  const minWeightedSupport = Number(options.minWeightedSupport ?? DEFAULT_MIN_WEIGHTED_SUPPORT);
  const minMarkerCategories = Number(options.minMarkerCategories ?? DEFAULT_MIN_MARKER_CATEGORIES);
  const records = (Array.isArray(inferenceOutput?.records) ? inferenceOutput.records : [])
    .filter((record) => record.meaningful !== false)
    .filter((record) => Number(record.meaningful_score ?? 1) >= minimumMeaningfulScore);
  const rules = options.schemaRules ?? DEFAULT_SCHEMA_RULES;
  const themeCounts = countThemes(records);
  const schemas = rules
    .map((rule) => scoreSchema(rule, records, {
      minSupport,
      minRecordScore,
      minWeightedSupport,
      minMarkerCategories,
    }))
    .filter(Boolean)
    .sort((a, b) =>
      b.confidence - a.confidence ||
      b.weighted_support - a.weighted_support ||
      b.support - a.support ||
      a.id.localeCompare(b.id)
    );

  return {
    schema_version: "memact.schema.v0",
    generated_at: new Date().toISOString(),
    source: {
      inference_schema_version: inferenceOutput?.schema_version ?? null,
      inferred_record_count: Array.isArray(inferenceOutput?.records) ? inferenceOutput.records.length : 0,
      meaningful_record_count: records.length,
    },
    min_support: minSupport,
    minimum_meaningful_score: minimumMeaningfulScore,
    min_record_score: minRecordScore,
    min_weighted_support: minWeightedSupport,
    min_marker_categories: minMarkerCategories,
    theme_counts: themeCounts,
    schemas,
    schema_network: buildSchemaNetwork(schemas),
    formation_principle: "Virtual cognitive schemas are formed from repeated meaningful packets, not raw browsing volume.",
  };
}

export function formatSchemaReport(result) {
  const lines = [
    "Memact Schema Report",
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

function scoreSchema(rule, records, thresholds) {
  const scoredRecords = records
    .map((record) => scoreRecordAgainstRule(record, rule))
    .filter((record) => record.schema_record_score >= thresholds.minRecordScore)
    .sort((a, b) => b.schema_record_score - a.schema_record_score || a.source_label.localeCompare(b.source_label));

  const support = scoredRecords.length;
  const weightedSupport = round(scoredRecords.reduce((sum, record) => sum + record.schema_record_score, 0), 4);
  const distinctSourceCount = countDistinctSources(scoredRecords);
  const activeDayCount = countActiveDays(scoredRecords);
  const matchedThemes = unique(scoredRecords.flatMap((record) => record.themes));
  const matchedMarkers = unique(scoredRecords.flatMap((record) => record.matched_markers));
  const markerCategories = unique(scoredRecords.flatMap((record) => record.marker_categories));
  const markerCoverage = rule.markers.length ? matchedMarkers.length / Math.min(rule.markers.length, 10) : 0;
  const categoryCoverage = markerCategoryNames(rule).length
    ? markerCategories.length / markerCategoryNames(rule).length
    : 0;
  const themeCoverage = rule.themes.length ? matchedThemes.length / rule.themes.length : 0;
  const evidenceDiversity = Math.min(1, ((distinctSourceCount >= 2 ? 0.5 : 0.25) + (activeDayCount >= 2 ? 0.5 : 0.25)));
  const repetition = Math.min(1, weightedSupport / Math.max(thresholds.minWeightedSupport, 3.4));
  const confidence = round(
    (repetition * 0.3) +
    (themeCoverage * 0.2) +
    (Math.min(1, markerCoverage) * 0.22) +
    (Math.min(1, categoryCoverage) * 0.16) +
    (evidenceDiversity * 0.12)
  );

  if (
    support < thresholds.minSupport ||
    weightedSupport < thresholds.minWeightedSupport ||
    !matchedThemes.length ||
    !matchedMarkers.length ||
    markerCategories.length < thresholds.minMarkerCategories ||
    !requiredMarkerCategoriesPresent(rule, markerCategories)
  ) {
    return null;
  }

  const state = resolveSchemaState({ support, weightedSupport, confidence, activeDayCount, distinctSourceCount }, thresholds);
  const evidenceRecords = scoredRecords.slice(0, 10).map((record) => ({
    id: record.id,
    packet_id: record.packet_id,
    source_label: record.source_label,
    themes: record.themes,
    matched_markers: record.matched_markers,
    schema_record_score: record.schema_record_score,
    meaningful_score: record.meaningful_score,
    meaning_reasons: record.meaning_reasons,
    sources: record.sources,
  }));

  return {
    id: rule.id,
    label: rule.label,
    summary: rule.summary,
    schema_kind: "virtual_cognitive_schema",
    virtual: true,
    cognitive_schema: true,
    core_interpretation: rule.core_interpretation,
    action_tendency: rule.action_tendency,
    emotional_signature: rule.emotional_signature,
    state,
    state_label: stateLabel(state),
    matched_themes: matchedThemes,
    matched_markers: matchedMarkers,
    marker_categories: markerCategories,
    support,
    weighted_support: weightedSupport,
    distinct_source_count: distinctSourceCount,
    active_day_count: activeDayCount,
    confidence,
    formation_basis: buildFormationBasis({ support, weightedSupport, distinctSourceCount, activeDayCount, matchedThemes, matchedMarkers, markerCategories }),
    formation_metrics: {
      support,
      weighted_support: weightedSupport,
      distinct_source_count: distinctSourceCount,
      active_day_count: activeDayCount,
      theme_coverage: round(themeCoverage),
      marker_coverage: round(Math.min(1, markerCoverage)),
      marker_category_coverage: round(Math.min(1, categoryCoverage)),
      confidence,
    },
    virtual_schema_packet: {
      id: `schema_packet:${rule.id}`,
      type: "virtual_cognitive_schema_packet",
      label: rule.label,
      core_interpretation: rule.core_interpretation,
      action_tendency: rule.action_tendency,
      emotional_signature: rule.emotional_signature,
      matched_themes: matchedThemes,
      matched_markers: matchedMarkers,
      marker_categories: markerCategories,
      support,
      weighted_support: weightedSupport,
      confidence,
      formation_metrics: {
        support,
        weighted_support: weightedSupport,
        distinct_source_count: distinctSourceCount,
        active_day_count: activeDayCount,
        marker_categories: markerCategories,
      },
      evidence_packet_ids: evidenceRecords.map((record) => record.packet_id || `packet:${record.id}`),
    },
    evidence_records: evidenceRecords,
    claim_type: "virtual_cognitive_schema_signal",
    language_guardrail: "This is a virtual cognitive-schema signal from repeated evidence, not a diagnosis or causal certainty.",
  };
}

function scoreRecordAgainstRule(record, rule) {
  const text = collectRecordText(record);
  const themes = (record.canonical_themes ?? []).filter((theme) => rule.themes.includes(theme));
  const markerMatch = findMarkerMatches(text, rule);
  const matchedMarkers = markerMatch.markers;
  const markerCategories = markerMatch.categories;
  const themeScore = rule.themes.length ? themes.length / Math.min(rule.themes.length, 3) : 0;
  const markerScore = rule.markers.length ? matchedMarkers.length / Math.min(rule.markers.length, 8) : 0;
  const categoryScore = markerCategoryNames(rule).length ? markerCategories.length / markerCategoryNames(rule).length : 0;
  const meaningfulScore = Number(record.meaningful_score ?? 0.58);
  const sourceScore = Array.isArray(record.sources) && record.sources.length ? 0.08 : 0;
  const rawScore = Math.min(
    1,
    (themeScore * 0.32) +
      (Math.min(1, markerScore) * 0.34) +
      (Math.min(1, categoryScore) * 0.16) +
      (meaningfulScore * 0.12) +
      sourceScore
  );
  const schemaRecordScore = round(matchedMarkers.length ? rawScore : Math.min(rawScore, 0.22));

  return {
    id: record.id,
    packet_id: record.packet_id ?? null,
    source_label: normalize(record.source_label || record.evidence?.title || "meaning packet"),
    started_at: record.started_at,
    ended_at: record.ended_at,
    themes,
    matched_markers: matchedMarkers,
    marker_categories: markerCategories,
    schema_record_score: schemaRecordScore,
    meaningful_score: meaningfulScore,
    meaning_reasons: record.meaning_reasons ?? [],
    sources: record.sources ?? [],
  };
}

function findMarkerMatches(text, rule) {
  const groups = rule.marker_groups || { signal: rule.markers || [] };
  const markers = new Set();
  const categories = new Set();
  Object.entries(groups).forEach(([category, terms]) => {
    (terms || []).forEach((term) => {
      if (hasPhrase(text, term)) {
        markers.add(term);
        categories.add(category);
      }
    });
  });
  (rule.markers || []).forEach((term) => {
    if (hasPhrase(text, term)) {
      markers.add(term);
    }
  });
  return {
    markers: [...markers],
    categories: [...categories],
  };
}

function markerCategoryNames(rule) {
  return Object.keys(rule.marker_groups || { signal: rule.markers || [] });
}

function requiredMarkerCategoriesPresent(rule, categories) {
  const required = Array.isArray(rule.required_marker_categories) ? rule.required_marker_categories : [];
  if (!required.length) return true;
  const categorySet = new Set(categories);
  return required.every((category) => categorySet.has(category));
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
      state: schema.state,
      confidence: schema.confidence,
    });

    (schema.matched_themes ?? []).forEach((theme) => {
      const themeId = `theme:${theme}`;
      addNode({ id: themeId, type: "theme", label: theme });
      edges.push({
        from: schemaId,
        to: themeId,
        type: "built_from_theme",
        weight: Number(schema.weighted_support || schema.support || 1),
      });
    });

    (schema.matched_markers ?? []).forEach((marker) => {
      const markerId = `marker:${slug(marker)}`;
      addNode({ id: markerId, type: "schema_marker", label: marker });
      edges.push({
        from: schemaId,
        to: markerId,
        type: "has_cognitive_marker",
        weight: 1,
      });
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

function collectRecordText(record) {
  const parts = [
    record.source_label,
    record.evidence?.title,
    record.evidence?.text_excerpt,
    ...(record.canonical_themes ?? []),
    ...(record.meaning_reasons ?? []),
  ];
  (record.themes ?? []).forEach((theme) => {
    parts.push(theme.label, ...(theme.evidence_terms ?? []));
  });
  (record.sources ?? []).forEach((source) => {
    parts.push(source.title, source.domain, source.url);
  });
  return parts.filter(Boolean).join(" ");
}

function resolveSchemaState(metrics, thresholds) {
  if (
    metrics.support >= Math.max(thresholds.minSupport * 3, 8) &&
    metrics.confidence >= 0.72 &&
    metrics.activeDayCount >= 2
  ) {
    return "stable";
  }
  if (
    metrics.support >= Math.max(thresholds.minSupport * 2, 5) ||
    (metrics.confidence >= 0.58 && metrics.distinctSourceCount >= 2)
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

function buildFormationBasis({ support, weightedSupport, distinctSourceCount, activeDayCount, matchedThemes, matchedMarkers, markerCategories }) {
  return [
    `${support} supporting meaning packets`,
    `${weightedSupport.toFixed(2)} weighted support`,
    `${distinctSourceCount} distinct source${distinctSourceCount === 1 ? "" : "s"}`,
    `${activeDayCount} active day${activeDayCount === 1 ? "" : "s"}`,
    `themes: ${matchedThemes.join(", ")}`,
    `marker groups: ${markerCategories.join(", ")}`,
    `markers: ${matchedMarkers.slice(0, 6).join(", ")}`,
  ].join("; ");
}

function countThemes(records) {
  return records.reduce((counts, record) => {
    (record.canonical_themes ?? []).forEach((theme) => {
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

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalize).filter(Boolean))];
}

function round(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 10000) / 10000;
}

function slug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "marker";
}
