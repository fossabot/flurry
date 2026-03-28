import { describe, it, expect } from "vitest";
import { parseParams } from "../src/params.js";
import { sha256Sync } from "../src/hash.js";

describe("parseParams", () => {
  it("returns valid SnowflakeParams structure", () => {
    const hash = sha256Sync("test");
    const params = parseParams(hash);

    expect(params.global).toBeDefined();
    expect(params.primaryArm).toBeDefined();
    expect(params.secondary).toBeDefined();
    expect(params.tertiary).toBeDefined();
    expect(params.center).toBeDefined();
  });

  it("global params are in expected ranges", () => {
    const hash = sha256Sync("test");
    const params = parseParams(hash);

    expect(params.global.sizeScale).toBeGreaterThanOrEqual(0.7);
    expect(params.global.sizeScale).toBeLessThanOrEqual(1.0);
    expect(params.global.branchWidth).toBeGreaterThanOrEqual(0.3);
    expect(params.global.branchWidth).toBeLessThanOrEqual(1.0);
    expect(params.global.detailLevel).toBeGreaterThanOrEqual(0);
    expect(params.global.detailLevel).toBeLessThanOrEqual(3);
    expect(params.global.centerType).toBeGreaterThanOrEqual(0);
    expect(params.global.centerType).toBeLessThanOrEqual(4);
  });

  it("primary arm params are in expected ranges", () => {
    const hash = sha256Sync("test");
    const params = parseParams(hash);

    expect(params.primaryArm.length).toBeGreaterThanOrEqual(0.6);
    expect(params.primaryArm.length).toBeLessThanOrEqual(1.0);
    expect(params.primaryArm.segments).toBeGreaterThanOrEqual(2);
    expect(params.primaryArm.segments).toBeLessThanOrEqual(5);
  });

  it("secondary branch count is 1-4", () => {
    const hash = sha256Sync("test");
    const params = parseParams(hash);

    expect(params.secondary.count).toBeGreaterThanOrEqual(2);
    expect(params.secondary.count).toBeLessThanOrEqual(4);
    expect(params.secondary.positions.length).toBe(params.secondary.count);
  });

  it("is deterministic", () => {
    const a = parseParams(sha256Sync("same-input"));
    const b = parseParams(sha256Sync("same-input"));
    expect(a).toEqual(b);
  });

  it("different inputs produce different params", () => {
    const a = parseParams(sha256Sync("input-a"));
    const b = parseParams(sha256Sync("input-b"));
    expect(a).not.toEqual(b);
  });
});
