import type {
  SnowflakeParams,
  GlobalParams,
  PrimaryArmParams,
  SecondaryBranchParams,
  TertiaryParams,
  CenterParams,
} from "./types.js";

// Normalize a byte (0-255) to a float in [min, max]
function norm(byte: number, min: number, max: number): number {
  return min + (byte / 255) * (max - min);
}

function parseGlobal(bytes: Uint8Array): GlobalParams {
  return {
    sizeScale: norm(bytes[0]!, 0.75, 1.0),
    branchWidth: norm(bytes[1]!, 0.5, 1.0),
    detailLevel: bytes[2]! % 4,
    centerType: bytes[3]! % 5,
  };
}

function parsePrimaryArm(bytes: Uint8Array): PrimaryArmParams {
  return {
    length: norm(bytes[0]!, 0.6, 1.0),
    curvature: norm(bytes[1]!, -0.3, 0.3),
    taperRate: norm(bytes[2]!, 0.3, 0.9),
    segments: 2 + (bytes[3]! % 4), // 2-5
    baseWidth: norm(bytes[4]!, 0.5, 1.0),
    tipStyle: bytes[5]! % 4,
    curveDirection: bytes[6]! % 2,
    sidePlates: norm(bytes[7]!, 0, 0.6),
  };
}

function parseSecondary(bytes: Uint8Array): SecondaryBranchParams {
  // Minimum 2 branches so every snowflake has visible structure
  const count = 2 + (bytes[0]! % 3); // 2-4
  const positions: number[] = [];
  const angles: number[] = [];
  const lengths: number[] = [];

  for (let i = 0; i < count; i++) {
    // Spread branches evenly along the arm with hash-driven offsets
    const basePos = (i + 1) / (count + 1);
    const offset = norm(bytes[1 + i]! ?? 128, -0.06, 0.06);
    positions.push(Math.max(0.15, Math.min(0.85, basePos + offset)));
    // Each branch gets a unique angle from different byte combinations
    const angleByte = (bytes[(1 + i) % 8]! + bytes[(5 + i) % 8]! * 3) & 0xff;
    angles.push(norm(angleByte, 0.15, 0.95));
    // Each branch gets a unique length
    const lenByte = (bytes[(2 + i) % 8]! + bytes[(7 - i + 8) % 8]! * 5) & 0xff;
    lengths.push(norm(lenByte, 0.3, 0.95));
  }

  return {
    count,
    positions,
    angles,
    lengths,
    taper: norm(bytes[6]!, 0.3, 0.85),
    width: norm(bytes[7]!, 0.4, 0.85),
  };
}

function parseTertiary(bytes: Uint8Array): TertiaryParams {
  return {
    density: norm(bytes[0]!, 0, 1),
    angle: norm(bytes[1]!, 0.3, 0.8),
    length: norm(bytes[2]!, 0.1, 0.4),
    plateShape: bytes[3]! % 4,
    plateSize: norm(bytes[4]!, 0.2, 0.8),
    subBranchAngle: norm(bytes[5]!, 0.3, 0.7),
    subBranchLength: norm(bytes[6]!, 0.1, 0.3),
    complexity: norm(bytes[7]!, 0, 1),
  };
}

function parseCenter(bytes: Uint8Array): CenterParams {
  return {
    type: bytes[0]! % 5,
    size: norm(bytes[1]!, 0.3, 0.8),
    innerDetail: norm(bytes[2]!, 0, 1),
    rotation: norm(bytes[3]!, 0, Math.PI / 6), // 0-30 degrees
  };
}

export function parseParams(hash: Uint8Array): SnowflakeParams {
  return {
    global: parseGlobal(hash.slice(0, 4)),
    primaryArm: parsePrimaryArm(hash.slice(4, 12)),
    secondary: parseSecondary(hash.slice(12, 20)),
    tertiary: parseTertiary(hash.slice(20, 28)),
    center: parseCenter(hash.slice(28, 32)),
  };
}
