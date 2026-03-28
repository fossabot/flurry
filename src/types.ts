export interface FlurryOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
  strokeOnly?: boolean;
}

export interface GlobalParams {
  sizeScale: number; // 0-1, controls overall radius
  branchWidth: number; // 0-1, base width of primary arm
  detailLevel: number; // 0-3, how many levels of branching
  centerType: number; // 0-4, center pattern variant
}

export interface PrimaryArmParams {
  length: number; // 0-1, normalized arm length
  curvature: number; // -1 to 1, how much the arm curves
  taperRate: number; // 0-1, how quickly width narrows
  segments: number; // 2-5, number of line segments in arm
  baseWidth: number; // 0-1, width at the arm's root
  tipStyle: number; // 0-3, decoration at the tip
  curveDirection: number; // 0 or 1, curve left or right
  sidePlates: number; // 0-1, size of side plate decorations
}

export interface SecondaryBranchParams {
  count: number; // 1-4, number of secondary branches per side
  positions: number[]; // 0-1 each, where along primary arm they sprout
  angles: number[]; // 0-1 each, branch angle (mapped to ~30-80 degrees)
  lengths: number[]; // 0-1 each, branch length relative to remaining arm
  taper: number; // 0-1, taper rate for secondary branches
  width: number; // 0-1, width relative to primary
}

export interface TertiaryParams {
  density: number; // 0-1, how many tertiary branches
  angle: number; // 0-1, angle of tertiary branches
  length: number; // 0-1, length of tertiary branches
  plateShape: number; // 0-3, crystal plate shape at tips
  plateSize: number; // 0-1, size of crystal plates
  subBranchAngle: number; // 0-1, angle variation
  subBranchLength: number; // 0-1, length variation
  complexity: number; // 0-1, additional detail
}

export interface CenterParams {
  type: number; // 0-4, pattern type
  size: number; // 0-1, relative size
  innerDetail: number; // 0-1, inner pattern complexity
  rotation: number; // 0-1, rotation offset
}

export interface SnowflakeParams {
  global: GlobalParams;
  primaryArm: PrimaryArmParams;
  secondary: SecondaryBranchParams;
  tertiary: TertiaryParams;
  center: CenterParams;
}

export interface Point {
  x: number;
  y: number;
}

export interface Branch {
  points: Point[];
  width: number;
  taperRate: number;
}

export interface SnowflakeGeometry {
  primaryArm: Branch;
  secondaryBranches: Branch[];
  tertiaryBranches: Branch[];
  tipDecorations: TipDecoration[];
  centerPattern: string; // SVG path data for center
}

export interface TipDecoration {
  position: Point;
  shape: number; // 0-3: diamond, hexagon, arrow, dot
  size: number;
  rotation: number;
}
