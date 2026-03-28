import { describe, it, expect } from "vitest";
import { renderSvg } from "../src/render.js";
import { generateGeometry } from "../src/generate.js";
import { parseParams } from "../src/params.js";
import { sha256Sync } from "../src/hash.js";

function makeSvg(input: string, strokeOnly = false) {
  const hash = sha256Sync(input);
  const params = parseParams(hash);
  const geometry = generateGeometry(params, 168);
  return renderSvg(geometry, {
    size: 400,
    color: "#a8d8ea",
    backgroundColor: "transparent",
    strokeOnly,
  }, hash);
}

describe("renderSvg", () => {
  it("produces valid SVG string", () => {
    const svg = makeSvg("test");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("contains 6 use elements for rotation", () => {
    const svg = makeSvg("test");
    const useMatches = svg.match(/<use href="#f[0-9a-f]+-s"/g);
    expect(useMatches?.length).toBe(6);
  });

  it("contains defs with half-sector and sector", () => {
    const svg = makeSvg("test");
    expect(svg).toMatch(/id="f[0-9a-f]+-hs"/);
    expect(svg).toMatch(/id="f[0-9a-f]+-s"/);
  });

  it("uses correct viewBox", () => {
    const svg = makeSvg("test");
    expect(svg).toContain('viewBox="0 0 400 400"');
  });

  it("stroke-only mode uses stroke instead of fill", () => {
    const svg = makeSvg("test", true);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#a8d8ea"');
  });

  it("does not contain NaN or Infinity", () => {
    const svg = makeSvg("test");
    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("Infinity");
  });

  it("different inputs produce different SVGs", () => {
    const a = makeSvg("input-a");
    const b = makeSvg("input-b");
    expect(a).not.toBe(b);
  });

  it("generates unique IDs from hash bytes", () => {
    const svg = makeSvg("test");
    // UID derived from first 4 hash bytes as hex
    expect(svg).toMatch(/id="f[0-9a-f]{8}-hs"/);
    expect(svg).toMatch(/id="f[0-9a-f]{8}-s"/);
  });

  it("different inputs produce different SVG element IDs", () => {
    const svgA = makeSvg("input-a");
    const svgB = makeSvg("input-b");
    const idA = svgA.match(/id="(f[0-9a-f]{8})-hs"/)?.[1];
    const idB = svgB.match(/id="(f[0-9a-f]{8})-hs"/)?.[1];
    expect(idA).toBeDefined();
    expect(idB).toBeDefined();
    expect(idA).not.toBe(idB);
  });

  it("use hrefs reference the correct unique IDs", () => {
    const svg = makeSvg("test");
    const uid = svg.match(/id="(f[0-9a-f]{8})-hs"/)?.[1];
    expect(uid).toBeDefined();
    // Half-sector used in sector definition
    expect(svg).toContain(`href="#${uid}-hs"`);
    // Sector used in 6-fold rotation
    expect(svg).toContain(`href="#${uid}-s"`);
  });

  it("multiple SVGs on same page have non-colliding IDs", () => {
    const inputs = ["alpha", "beta", "gamma", "delta"];
    const svgs = inputs.map(i => makeSvg(i));
    const ids = svgs.map(svg => svg.match(/id="(f[0-9a-f]{8})-hs"/)?.[1]);
    const unique = new Set(ids);
    expect(unique.size).toBe(inputs.length);
  });

  it("renders tip decorations", () => {
    const svg = makeSvg("test");
    // Should have at least one decoration (primary arm tip is always present)
    const pathCount = (svg.match(/<path /g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(2); // at least arm + tip
  });

  it("renders center pattern with opacity", () => {
    const svg = makeSvg("test");
    expect(svg).toContain('opacity="0.7"');
  });
});
