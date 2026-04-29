# Memact Schema

Version: `v0.0`

Schema is the deterministic cognitive-schema layer in the Memact architecture.

It answers:

`What virtual cognitive schema may be forming from meaningful activity?`

Activities are not schemas. Activities are evidence. Schema forms virtual cognitive-schema packets from repeated meaningful activity, co-occurring concepts, cognitive dimensions, sources, and time. This is the core Memact mirror.

## Pipeline Position

```text
Capture -> Inference -> Schema -> Interface / Query -> Influence / Origin
```

Schema consumes retained Inference packets. It does not read Capture internals and does not claim causality.

Schema is the main surface for Memact's answer engine. Origin and Influence are useful, but they support the schema mirror instead of replacing it.

## What It Does

- reads `memact.inference.v0` records
- ignores records that did not pass the Inference meaningfulness gate
- requires repeated meaningful packets
- induces schema candidates from recurring concepts instead of selecting from fixed labels
- requires evidence substance, not only topic matches
- detects virtual cognitive-schema signals once support, cohesion, source, and time thresholds are met
- keeps evidence records attached to every schema signal
- emits a schema network linking virtual schemas to markers, themes, and meaning packets
- supports answers with cautious context, not diagnosis
- uses guarded language suitable for sensitive self-understanding

## Public Output Contract

```json
{
  "schema_version": "memact.schema.v0",
  "schemas": [
    {
      "id": "induced_startup_proof_building",
      "label": "Startup / Proof Action frame",
      "formation_mode": "evidence_induced",
      "matched_themes": ["startup", "coding"],
      "matched_markers": ["startup", "proof", "building", "launch"],
      "support": 4,
      "confidence": 0.725,
      "evidence_records": [
        {
          "packet_id": "packet:act_1",
          "meaningful_score": 0.64
        }
      ],
      "schema_kind": "virtual_cognitive_schema",
      "core_interpretation": "Memact sees Startup, Proof, Building, and Launch repeatedly appearing through action signals.",
      "action_tendency": "move toward activity around startup, proof, and building",
      "marker_categories": ["action", "identity"],
      "claim_type": "virtual_cognitive_schema_signal",
      "language_guardrail": "This is a virtual cognitive-schema signal from repeated evidence, not a diagnosis or causal certainty."
    }
  ],
  "schema_network": {
    "nodes": [],
    "edges": []
  }
}
```

## Terminal Quickstart

Prerequisites:

- Node.js `20+`
- npm `10+`

Install:

```powershell
npm install
```

Run validation:

```powershell
npm run check
```

Run the sample:

```powershell
npm run sample
```

Analyze Inference output:

```powershell
npm run schema -- --input ..\inference-output.json --format report
```

Emit JSON for Interface / Query, Influence, and Origin:

```powershell
npm run schema -- --input ..\inference-output.json --format json
```

## Design Rules

- virtual schemas require repetition
- virtual schemas are built from meaningful packets only
- theme matches alone must not form schemas
- schemas are induced from evidence; hard-coded domain taxonomies are not the core engine
- broad cognitive dimensions can help scoring, but evidence clusters decide the schema
- schema language must stay cautious
- no diagnosis, no causal certainty, no personality claims
- every schema signal must cite evidence records

## License

See `LICENSE`.
