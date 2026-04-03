# Flurry

[![CI](https://github.com/temikus/flurry/actions/workflows/ci.yml/badge.svg)](https://github.com/temikus/flurry/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@temikus/flurry)](https://www.npmjs.com/package/@temikus/flurry)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FTemikus%2Fflurry.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FTemikus%2Fflurry?ref=badge_shield)

Generate unique snowflake SVGs from cryptographic strings — like SSH randomart, but prettier.

Spot similar keys at a glance. Every input produces a deterministic, visually distinct snowflake with true 6-fold symmetry (D6 dihedral group), just like real ice crystals. Same input always gives the same snowflake. Different inputs give different snowflakes. Display them next to SSH fingerprints, wallet addresses, or API keys so users can quickly tell them apart without comparing long hex strings character by character.

**[Live Demo](https://temikus.github.io/flurry/)**

## Install

```bash
npm install @temikus/flurry
```

## Usage

```typescript
import { generateSnowflake, generateSnowflakeSync } from "@temikus/flurry";

// Async (uses Web Crypto API)
const svg = await generateSnowflake("SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8");

// Sync (bundled SHA-256, no Web Crypto dependency)
const svg = generateSnowflakeSync("SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8");

// With options
const svg = await generateSnowflake(input, {
  size: 400,                       // viewBox size (default: 400)
  color: "#a8d8ea",                // branch color (default: ice blue)
  backgroundColor: "transparent",  // default: transparent
  strokeOnly: false,               // outline mode (default: false)
});
```

### Browser (UMD)

```html
<script src="https://unpkg.com/@temikus/flurry"></script>
<script>
  Flurry.generateSnowflakeSync("my-key", { size: 200 });
</script>
```

### Embed in a page

```typescript
const container = document.getElementById("avatar");
container.innerHTML = await generateSnowflake(user.publicKey);
```

## How it works

1. **Hash** the input string with SHA-256 (32 bytes)
2. **Parse** the bytes into snowflake growth parameters (arm length, curvature, branch count/angle/length, tip decorations, center pattern)
3. **Generate** geometry for a single 30-degree half-sector
4. **Mirror** for bilateral symmetry, then **rotate** 6 times for full D6 dihedral symmetry
5. **Render** as an SVG string with `<defs>`/`<use>` for efficiency

## Development

Requires Node.js 20+ and [just](https://github.com/casey/just).

```bash
just install    # Install dependencies
just dev        # Run demo dev server
just test       # Run tests
just build      # Build library
just build-demo # Build demo site
just lint       # Type-check
```

## License

Apache 2.0


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FTemikus%2Fflurry.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FTemikus%2Fflurry?ref=badge_large)