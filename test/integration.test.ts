import { describe, it, expect } from "vitest";
import { generateSnowflake, generateSnowflakeSync } from "../src/index.js";

describe("integration", () => {
  it("generateSnowflake produces valid SVG", async () => {
    const svg = await generateSnowflake("hello-world");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("generateSnowflakeSync produces valid SVG", () => {
    const svg = generateSnowflakeSync("hello-world");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("async and sync produce identical output", async () => {
    const input = "test-determinism";
    const asyncSvg = await generateSnowflake(input);
    const syncSvg = generateSnowflakeSync(input);
    expect(asyncSvg).toBe(syncSvg);
  });

  it("same input always produces same output", () => {
    const a = generateSnowflakeSync("deterministic");
    const b = generateSnowflakeSync("deterministic");
    expect(a).toBe(b);
  });

  it("different inputs produce different snowflakes", () => {
    const inputs = [
      "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      "550e8400-e29b-41d4-a716-446655440000",
    ];
    const svgs = inputs.map((i) => generateSnowflakeSync(i));
    const unique = new Set(svgs);
    expect(unique.size).toBe(inputs.length);
  });

  it("respects size option", () => {
    const svg = generateSnowflakeSync("test", { size: 200 });
    expect(svg).toContain('viewBox="0 0 200 200"');
    expect(svg).toContain('width="200"');
  });

  it("respects color option", () => {
    const svg = generateSnowflakeSync("test", { color: "#ff0000" });
    expect(svg).toContain("#ff0000");
  });

  it("respects backgroundColor option", () => {
    const svg = generateSnowflakeSync("test", {
      backgroundColor: "#000033",
    });
    expect(svg).toContain('fill="#000033"');
  });

  it("handles empty string input", () => {
    const svg = generateSnowflakeSync("");
    expect(svg).toContain("<svg");
    expect(svg).not.toContain("NaN");
  });

  it("handles very long input", () => {
    const svg = generateSnowflakeSync("a".repeat(10000));
    expect(svg).toContain("<svg");
    expect(svg).not.toContain("NaN");
  });
});
