# Memact Schema

Version: `v0.0`

Schema is the deterministic pattern layer in the Memact architecture.

It answers:

`What repeated mental frame may be forming from inferred activity themes?`

Activities are not schemas. Activities are evidence. Schemas are cautious signals inferred from repeated themes across time.

## Pipeline Position

```text
Capture -> Inference -> Schema -> Interface / Query -> Origin + Influence
```

Schema consumes Inference output. It does not read Capture internals and does not claim causality.

Schema supports Memact's citation and answer engine by identifying repeated mental-frame signals that can be shown as context beside cited answers. It should never replace citations.

## What It Does

- reads `memact.inference.v0` records
- counts repeated canonical themes
- detects possible schema signals once support thresholds are met
- keeps evidence records attached to every schema signal
- supports cited answers with cautious context, not diagnosis
- uses guarded language suitable for sensitive self-understanding

## Public Output Contract

```json
{
  "schema_version": "memact.schema.v0",
  "schemas": [
    {
      "id": "builder_agency",
      "label": "Builder / agency schema",
      "matched_themes": ["startup", "coding"],
      "support": 4,
      "confidence": 0.725,
      "claim_type": "schema_signal",
      "language_guardrail": "This is a possible schema signal, not a diagnosis or causal claim."
    }
  ]
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

Emit JSON for Interface, Origin, and Influence:

```powershell
npm run schema -- --input ..\inference-output.json --format json
```

## Design Rules

- schema signals require repetition
- schema language must stay cautious
- no diagnosis, no causal certainty, no personality claims
- every schema signal must cite evidence records

## License

See `LICENSE`.
