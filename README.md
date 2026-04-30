# Memact Schema

Version: `v0.0`

Schema forms virtual cognitive-schema packets from retained evidence.

It owns one job:

```text
detect repeated frames in meaningful activity
```

Schema does not capture browser data, store long-term memory, or diagnose the user. It emits cautious schema signals that Memory can store and update.

## What This Repo Owns

- Reads `memact.inference.v0` records.
- Ignores records that did not pass the meaningfulness gate.
- Groups repeated concepts, markers, sources, and time patterns.
- Forms virtual cognitive-schema packets when support and cohesion are strong enough.
- Keeps evidence records attached to every schema.
- Emits a schema network for Memory and query-time engines.

## Input

```json
{
  "schema_version": "memact.inference.v0",
  "records": []
}
```

## Output

```json
{
  "schema_version": "memact.schema.v0",
  "schemas": [
    {
      "id": "induced_startup_proof_building",
      "label": "Startup / Proof Action frame",
      "formation_mode": "evidence_induced",
      "support": 4,
      "confidence": 0.72,
      "schema_kind": "virtual_cognitive_schema",
      "evidence_records": []
    }
  ],
  "schema_network": {
    "nodes": [],
    "edges": []
  }
}
```

## Run Locally

Prerequisites:

- Node.js `20+`
- npm `10+`

Install:

```powershell
npm install
```

Validate:

```powershell
npm run check
```

Run sample:

```powershell
npm run sample
```

Run against Inference output:

```powershell
npm run schema -- --input path\to\inference-output.json --format report
```

JSON output:

```powershell
npm run schema -- --input path\to\inference-output.json --format json
```

## Contract

- Activities are evidence, not schemas.
- Schemas require repeated meaningful support.
- A schema packet is a virtual mirror, not a medical claim.
- Memory decides whether a schema survives.

## License

See `LICENSE`.
