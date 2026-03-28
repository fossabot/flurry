# Flurry

Snowflake SVG generator library. Takes any string, SHA-256 hashes it, maps bytes to snowflake growth parameters, generates geometry, renders SVG with 6-fold symmetry.

## Architecture

Pipeline: `input → SHA-256 → params → geometry → SVG`

- `src/hash.ts` — SHA-256 (async via Web Crypto, sync via pure JS implementation)
- `src/params.ts` — 32 bytes → SnowflakeParams (byte allocation: 0-3 global, 4-11 primary arm, 12-19 secondary branches, 20-27 tertiary, 28-31 center)
- `src/generate.ts` — Params → branch geometry for a single 30° half-sector
- `src/render.ts` — Geometry → SVG string using defs/use with 6 rotations
- `src/types.ts` — All TypeScript interfaces
- `src/index.ts` — Public API (generateSnowflake, generateSnowflakeSync)

## Commands

- `just test` — run vitest
- `just build` — build library (ESM + CJS)
- `just dev` — demo dev server
- `just lint` — type-check
