import type {
  SnowflakeParams,
  Point,
  Branch,
  TipDecoration,
  SnowflakeGeometry,
} from "./types.js";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pointOnLine(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// Generate primary arm along +X axis with curvature
function generatePrimaryArm(params: SnowflakeParams, maxRadius: number): Branch {
  const { primaryArm, global } = params;
  const armLength = primaryArm.length * maxRadius * global.sizeScale;
  const segCount = Math.max(primaryArm.segments, 3);
  const points: Point[] = [{ x: 0, y: 0 }];

  for (let i = 1; i <= segCount; i++) {
    const t = i / segCount;
    const x = armLength * t;
    const curveMag = primaryArm.curvature * armLength * 0.12;
    const curveSign = primaryArm.curveDirection === 0 ? 1 : -1;
    const y = curveMag * curveSign * 4 * t * (1 - t);
    points.push({ x, y });
  }

  // Width in actual pixels — scale with maxRadius
  const baseWidthPx = lerp(2.5, 5.5, primaryArm.baseWidth) * (maxRadius / 168);

  return {
    points,
    width: baseWidthPx * global.branchWidth,
    taperRate: primaryArm.taperRate,
  };
}

// Generate secondary branches sprouting from the primary arm
function generateSecondaryBranches(
  params: SnowflakeParams,
  primaryArm: Branch
): Branch[] {
  const { secondary, global } = params;
  const branches: Branch[] = [];
  const armPoints = primaryArm.points;
  const armLen = armPoints.length - 1;
  const armTipX = armPoints[armLen]!.x;

  for (let i = 0; i < secondary.count; i++) {
    const pos = secondary.positions[i]!;
    const exactIdx = pos * armLen;
    const idx = Math.floor(exactIdx);
    const frac = exactIdx - idx;
    const basePoint = pointOnLine(
      armPoints[Math.min(idx, armLen)]!,
      armPoints[Math.min(idx + 1, armLen)]!,
      frac
    );

    // Angle between 15-80 degrees for dramatic visual variety
    const angle = lerp(0.26, 1.40, secondary.angles[i]!);
    // Branch length scales with total arm length — creates dendritic vs plate-like variation
    let branchLen = secondary.lengths[i]! * armTipX * 0.6 * (1 - pos * 0.25);

    // Clamp so the endpoint stays within the bounding radius
    // The half-sector spans 0-30 degrees, so y must stay within bounds
    const maxY = armTipX * 0.95; // keep within viewBox after rotation
    const projectedY = Math.abs(basePoint.y + Math.sin(angle) * branchLen);
    if (projectedY > maxY) {
      branchLen *= maxY / projectedY;
    }

    const endPoint: Point = {
      x: basePoint.x + Math.cos(angle) * branchLen,
      y: basePoint.y + Math.sin(angle) * branchLen,
    };

    // Midpoint with slight bend for organic feel
    const midPoint: Point = {
      x: lerp(basePoint.x, endPoint.x, 0.45),
      y: lerp(basePoint.y, endPoint.y, 0.5),
    };

    branches.push({
      points: [basePoint, midPoint, endPoint],
      width: primaryArm.width * secondary.width,
      taperRate: secondary.taper,
    });
  }

  return branches;
}

// Tertiary branches off secondaries
function generateTertiaryBranches(
  params: SnowflakeParams,
  secondaryBranches: Branch[]
): Branch[] {
  const { tertiary, global } = params;
  if (global.detailLevel < 1) return [];

  const branches: Branch[] = [];

  for (const sec of secondaryBranches) {
    const secEnd = sec.points[sec.points.length - 1]!;
    const secStart = sec.points[0]!;
    const secDx = secEnd.x - secStart.x;
    const secDy = secEnd.y - secStart.y;
    const secLen = Math.sqrt(secDx * secDx + secDy * secDy);
    const secAngle = Math.atan2(secDy, secDx);

    // 1-3 tertiary branches per secondary based on detail + density
    const count = global.detailLevel >= 2 ? (tertiary.density > 0.5 ? 3 : 2) : 1;

    for (let i = 0; i < count; i++) {
      const t = lerp(0.3, 0.8, (i + 0.5) / count);
      const base = pointOnLine(secStart, secEnd, t);

      // Tertiary branches angle away from secondary
      const offset = tertiary.angle * (Math.PI / 3.5);
      const branchAngle = secAngle + offset * (i % 2 === 0 ? 1 : -0.6);
      const branchLen = secLen * tertiary.length * 0.8;

      const end: Point = {
        x: base.x + Math.cos(branchAngle) * branchLen,
        y: base.y + Math.sin(branchAngle) * branchLen,
      };

      branches.push({
        points: [base, end],
        width: sec.width * 0.5,
        taperRate: 0.85,
      });
    }
  }

  return branches;
}

// Side plate decorations along the primary arm (hexagonal plate features)
function generateSidePlates(
  params: SnowflakeParams,
  primaryArm: Branch
): Branch[] {
  const { primaryArm: armParams } = params;
  if (armParams.sidePlates < 0.15) return [];

  const plates: Branch[] = [];
  const armPoints = primaryArm.points;
  const armLen = armPoints.length - 1;
  const plateCount = armParams.sidePlates > 0.4 ? 3 : 2;

  for (let i = 0; i < plateCount; i++) {
    const t = lerp(0.15, 0.7, i / Math.max(plateCount - 1, 1));
    const exactIdx = t * armLen;
    const idx = Math.floor(exactIdx);
    const frac = exactIdx - idx;
    const base = pointOnLine(
      armPoints[Math.min(idx, armLen)]!,
      armPoints[Math.min(idx + 1, armLen)]!,
      frac
    );

    // Small perpendicular bars (cross-bars like real ice crystal ridges)
    const barLen = primaryArm.width * (2 + armParams.sidePlates * 4) * (1 - t * 0.5);
    const up: Point = { x: base.x, y: base.y + barLen };
    const down: Point = { x: base.x, y: base.y - barLen };

    plates.push({
      points: [down, base, up],
      width: primaryArm.width * 0.4,
      taperRate: 0.3,
    });
  }

  return plates;
}

// Generate tip decorations
function generateTipDecorations(
  params: SnowflakeParams,
  primaryArm: Branch,
  secondaryBranches: Branch[]
): TipDecoration[] {
  const { primaryArm: armParams, tertiary, global } = params;
  const decorations: TipDecoration[] = [];
  const scale = primaryArm.width;

  // Primary arm tip — always present, larger
  const tip = primaryArm.points[primaryArm.points.length - 1]!;
  decorations.push({
    position: tip,
    shape: armParams.tipStyle,
    size: lerp(3, 8, tertiary.plateSize) * scale * 0.8,
    rotation: 0,
  });

  // Secondary branch tips
  if (global.detailLevel >= 1) {
    for (const branch of secondaryBranches) {
      const branchTip = branch.points[branch.points.length - 1]!;
      decorations.push({
        position: branchTip,
        shape: tertiary.plateShape,
        size: lerp(2, 5, tertiary.plateSize) * scale * 0.6,
        rotation: Math.atan2(
          branchTip.y - branch.points[0]!.y,
          branchTip.x - branch.points[0]!.x
        ),
      });
    }
  }

  return decorations;
}

// Generate center pattern SVG path data
function generateCenterPattern(params: SnowflakeParams, maxRadius: number): string {
  const { center, global } = params;
  const size = lerp(6, 16, center.size) * global.sizeScale * (maxRadius / 168);

  switch (center.type) {
    case 0:
      return hexagonPath(size);
    case 1:
      return starPath(size);
    case 2:
      return hexagonPath(size) + " " + hexagonPath(size * 0.55);
    case 3:
      return circlePath(size);
    case 4:
      return gemPath(size);
    default:
      return hexagonPath(size);
  }
}

function hexagonPath(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(
      `${i === 0 ? "M" : "L"}${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`
    );
  }
  return pts.join(" ") + " Z";
}

function starPath(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI / 6) * i - Math.PI / 6;
    const radius = i % 2 === 0 ? r : r * 0.45;
    pts.push(
      `${i === 0 ? "M" : "L"}${(radius * Math.cos(angle)).toFixed(2)},${(radius * Math.sin(angle)).toFixed(2)}`
    );
  }
  return pts.join(" ") + " Z";
}

function circlePath(r: number): string {
  return `M${r.toFixed(2)},0 A${r.toFixed(2)},${r.toFixed(2)} 0 1,1 ${(-r).toFixed(2)},0 A${r.toFixed(2)},${r.toFixed(2)} 0 1,1 ${r.toFixed(2)},0 Z`;
}

function gemPath(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const midAngle = angle + Math.PI / 6;
    pts.push(
      `${i === 0 ? "M" : "L"}${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`
    );
    pts.push(
      `L${(r * 0.55 * Math.cos(midAngle)).toFixed(2)},${(r * 0.55 * Math.sin(midAngle)).toFixed(2)}`
    );
  }
  return pts.join(" ") + " Z";
}

export function generateGeometry(
  params: SnowflakeParams,
  maxRadius: number
): SnowflakeGeometry {
  const primaryArm = generatePrimaryArm(params, maxRadius);
  const secondaryBranches = generateSecondaryBranches(params, primaryArm);
  const tertiaryBranches = generateTertiaryBranches(params, secondaryBranches);
  const sidePlates = generateSidePlates(params, primaryArm);
  const tipDecorations = generateTipDecorations(params, primaryArm, secondaryBranches);
  const centerPattern = generateCenterPattern(params, maxRadius);

  return {
    primaryArm,
    secondaryBranches,
    tertiaryBranches: [...tertiaryBranches, ...sidePlates],
    tipDecorations,
    centerPattern,
  };
}
