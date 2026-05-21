# Memact Schema

Schema organizes semantic evidence into reusable context packets.

Schemas work like cognitive schemas: related evidence gets grouped into a
category and, when useful, a sub-schema. For example, discount-related shopping
signals can become a shopping schema with a discount sub-schema.

## Owns

- Grouping semantic records.
- Schema packets.
- Categories and sub-schema direction.
- Source trails for context.

## Does Not Own

- Capture.
- Raw semantic understanding.
- Memory storage.
- Feature runtime.
- API gateway behavior.

## Flow

```text
Inference records -> Schema packets -> Memory -> Studio features
```

## Development

```powershell
npm install
npm run check
```
