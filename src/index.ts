import { sha256, sha256Sync } from "./hash.js";
import { parseParams } from "./params.js";
import { generateGeometry } from "./generate.js";
import { renderSvg } from "./render.js";
import type { FlurryOptions } from "./types.js";

export type { FlurryOptions, SnowflakeParams } from "./types.js";

const DEFAULTS = {
  size: 400,
  color: "#a8d8ea",
  backgroundColor: "transparent",
  strokeOnly: false,
} as const;

function buildSvg(hash: Uint8Array, options?: FlurryOptions): string {
  const opts = {
    size: options?.size ?? DEFAULTS.size,
    color: options?.color ?? DEFAULTS.color,
    backgroundColor: options?.backgroundColor ?? DEFAULTS.backgroundColor,
    strokeOnly: options?.strokeOnly ?? DEFAULTS.strokeOnly,
  };

  const params = parseParams(hash);
  const maxRadius = opts.size * 0.34;
  const geometry = generateGeometry(params, maxRadius);
  return renderSvg(geometry, opts, hash);
}

export async function generateSnowflake(
  input: string,
  options?: FlurryOptions
): Promise<string> {
  const hash = await sha256(input);
  return buildSvg(hash, options);
}

export function generateSnowflakeSync(
  input: string,
  options?: FlurryOptions
): string {
  const hash = sha256Sync(input);
  return buildSvg(hash, options);
}
