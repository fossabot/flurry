import { describe, it, expect } from "vitest";
import { generateGeometry } from "../src/generate.js";
import { parseParams } from "../src/params.js";
import { sha256Sync } from "../src/hash.js";

describe("generateGeometry", () => {
  const params = parseParams(sha256Sync("test-geometry"));
  const geometry = generateGeometry(params, 168);

  it("produces a primary arm with points", () => {
    expect(geometry.primaryArm.points.length).toBeGreaterThanOrEqual(3);
  });

  it("primary arm starts at origin", () => {
    const start = geometry.primaryArm.points[0]!;
    expect(start.x).toBe(0);
    expect(start.y).toBe(0);
  });

  it("primary arm extends along positive x", () => {
    const end = geometry.primaryArm.points[geometry.primaryArm.points.length - 1]!;
    expect(end.x).toBeGreaterThan(0);
  });

  it("produces secondary branches", () => {
    expect(geometry.secondaryBranches.length).toBeGreaterThanOrEqual(1);
  });

  it("secondary branches start on the primary arm", () => {
    for (const branch of geometry.secondaryBranches) {
      const start = branch.points[0]!;
      expect(start.x).toBeGreaterThan(0);
    }
  });

  it("produces tip decorations", () => {
    expect(geometry.tipDecorations.length).toBeGreaterThanOrEqual(1);
  });

  it("produces a center pattern string", () => {
    expect(typeof geometry.centerPattern).toBe("string");
    expect(geometry.centerPattern.length).toBeGreaterThan(0);
  });

  it("no NaN or Infinity in any points", () => {
    const allPoints = [
      ...geometry.primaryArm.points,
      ...geometry.secondaryBranches.flatMap((b) => b.points),
      ...geometry.tertiaryBranches.flatMap((b) => b.points),
      ...geometry.tipDecorations.map((d) => d.position),
    ];
    for (const p of allPoints) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe("branch clamping", () => {
  it("secondary branches stay within bounding radius", () => {
    // Test with many different inputs to catch overflow cases
    const inputs = ["clamp-test-1", "clamp-test-2", "clamp-test-3", "long-branch-test", "overflow-check"];
    const maxRadius = 168;
    for (const input of inputs) {
      const hash = sha256Sync(input);
      const params = parseParams(hash);
      const geometry = generateGeometry(params, maxRadius);
      for (const branch of geometry.secondaryBranches) {
        for (const p of branch.points) {
          const dist = Math.sqrt(p.x * p.x + p.y * p.y);
          // Points should stay within reasonable bounds (armTipX * ~1.0)
          expect(dist).toBeLessThanOrEqual(maxRadius * 1.5);
        }
      }
    }
  });

  it("secondary branch Y values are clamped", () => {
    const hash = sha256Sync("clamping-y-test");
    const params = parseParams(hash);
    const geometry = generateGeometry(params, 168);
    const armTipX = geometry.primaryArm.points[geometry.primaryArm.points.length - 1]!.x;
    for (const branch of geometry.secondaryBranches) {
      for (const p of branch.points) {
        expect(Math.abs(p.y)).toBeLessThanOrEqual(armTipX * 1.1);
      }
    }
  });
});

describe("side plates", () => {
  it("generates side plates when sidePlates param >= 0.15", () => {
    // Find an input that produces sidePlates >= 0.15
    // sidePlates comes from byte 11 (primaryArm bytes[7]), norm(0, 0.6)
    // byte value > 64 gives sidePlates > 0.15
    const inputs = ["side-plate-a", "side-plate-b", "side-plate-c", "plates-test", "crystal-ridge"];
    let foundPlates = false;
    for (const input of inputs) {
      const hash = sha256Sync(input);
      const params = parseParams(hash);
      if (params.primaryArm.sidePlates >= 0.15) {
        const geometry = generateGeometry(params, 168);
        // Side plates are added to tertiaryBranches
        expect(geometry.tertiaryBranches.length).toBeGreaterThan(0);
        foundPlates = true;
        break;
      }
    }
    expect(foundPlates).toBe(true);
  });

  it("skips side plates when sidePlates param < 0.15", () => {
    // Manually construct params with sidePlates = 0
    const hash = sha256Sync("test");
    const params = parseParams(hash);
    params.primaryArm.sidePlates = 0;
    params.global.detailLevel = 0; // also disable tertiary branches
    const geometry = generateGeometry(params, 168);
    expect(geometry.tertiaryBranches.length).toBe(0);
  });
});

describe("center pattern types", () => {
  it("generates all 5 center pattern types", () => {
    const patterns = new Set<number>();
    // Brute-force find inputs that produce each center type
    for (let i = 0; i < 100 && patterns.size < 5; i++) {
      const hash = sha256Sync(`center-type-${i}`);
      const params = parseParams(hash);
      patterns.add(params.center.type);
    }
    expect(patterns.size).toBe(5);
  });

  it("each center pattern type produces valid SVG path data", () => {
    for (let i = 0; i < 100; i++) {
      const hash = sha256Sync(`center-${i}`);
      const params = parseParams(hash);
      const geometry = generateGeometry(params, 168);
      expect(geometry.centerPattern).toMatch(/^M/); // starts with MoveTo
      expect(geometry.centerPattern).toContain("Z"); // closes the path
    }
  });
});

describe("tip decorations", () => {
  it("always includes primary arm tip decoration", () => {
    const hash = sha256Sync("tip-test");
    const params = parseParams(hash);
    const geometry = generateGeometry(params, 168);
    // First decoration is always the primary arm tip
    expect(geometry.tipDecorations.length).toBeGreaterThanOrEqual(1);
    const armTip = geometry.primaryArm.points[geometry.primaryArm.points.length - 1]!;
    expect(geometry.tipDecorations[0]!.position.x).toBe(armTip.x);
    expect(geometry.tipDecorations[0]!.position.y).toBe(armTip.y);
  });

  it("includes secondary branch tip decorations at detail level >= 1", () => {
    const hash = sha256Sync("detail-tips");
    const params = parseParams(hash);
    params.global.detailLevel = 2;
    const geometry = generateGeometry(params, 168);
    // Should have 1 (primary) + N (secondary) decorations
    expect(geometry.tipDecorations.length).toBe(1 + geometry.secondaryBranches.length);
  });

  it("covers all 4 tip shapes across inputs", () => {
    const tipShapes = new Set<number>();
    const plateShapes = new Set<number>();
    for (let i = 0; i < 100 && (tipShapes.size < 4 || plateShapes.size < 4); i++) {
      const hash = sha256Sync(`tip-shape-${i}`);
      const params = parseParams(hash);
      tipShapes.add(params.primaryArm.tipStyle);
      plateShapes.add(params.tertiary.plateShape);
    }
    expect(tipShapes.size).toBe(4);
    expect(plateShapes.size).toBe(4);
  });
});

describe("detail levels", () => {
  it("detail level 0 produces no tertiary branches", () => {
    const hash = sha256Sync("detail-test");
    const params = parseParams(hash);
    params.global.detailLevel = 0;
    params.primaryArm.sidePlates = 0; // also disable side plates
    const geometry = generateGeometry(params, 168);
    expect(geometry.tertiaryBranches.length).toBe(0);
  });

  it("detail level >= 1 produces tertiary branches", () => {
    const hash = sha256Sync("detail-test");
    const params = parseParams(hash);
    params.global.detailLevel = 2;
    const geometry = generateGeometry(params, 168);
    expect(geometry.tertiaryBranches.length).toBeGreaterThan(0);
  });

  it("higher detail level produces more tertiary branches", () => {
    const hash = sha256Sync("detail-compare");
    const params1 = parseParams(hash);
    params1.global.detailLevel = 1;
    params1.tertiary.density = 0.3;
    params1.primaryArm.sidePlates = 0;
    const geo1 = generateGeometry(params1, 168);

    const params2 = parseParams(hash);
    params2.global.detailLevel = 2;
    params2.tertiary.density = 0.8;
    params2.primaryArm.sidePlates = 0;
    const geo2 = generateGeometry(params2, 168);

    expect(geo2.tertiaryBranches.length).toBeGreaterThanOrEqual(geo1.tertiaryBranches.length);
  });
});
