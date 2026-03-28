import { describe, it, expect } from "vitest";
import { sha256, sha256Sync } from "../src/hash.js";

describe("sha256", () => {
  it("produces 32 bytes", async () => {
    const result = await sha256("hello");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("is deterministic", async () => {
    const a = await sha256("test-input");
    const b = await sha256("test-input");
    expect(a).toEqual(b);
  });

  it("different inputs produce different hashes", async () => {
    const a = await sha256("input-a");
    const b = await sha256("input-b");
    expect(a).not.toEqual(b);
  });
});

describe("sha256Sync", () => {
  it("produces 32 bytes", () => {
    const result = sha256Sync("hello");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("matches async version", async () => {
    const sync = sha256Sync("test-string");
    const async_ = await sha256("test-string");
    expect(sync).toEqual(async_);
  });

  it("known SHA-256 value for empty string", () => {
    const result = sha256Sync("");
    const hex = Array.from(result)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("known SHA-256 value for 'hello'", () => {
    const result = sha256Sync("hello");
    const hex = Array.from(result)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });
});
