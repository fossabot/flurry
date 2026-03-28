import type {
  SnowflakeGeometry,
  Branch,
  TipDecoration,
  Point,
} from "./types.js";

interface RenderOptions {
  size: number;
  color: string;
  backgroundColor: string;
  strokeOnly: boolean;
}

// Render a tapered branch as a filled path
function renderBranch(branch: Branch, color: string, strokeOnly: boolean): string {
  const { points, width, taperRate } = branch;
  if (points.length < 2) return "";

  if (strokeOnly) {
    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${(width * 2).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // Build tapered outline: go forward along left side, back along right side
  const leftPoints: Point[] = [];
  const rightPoints: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    const currentWidth = width * (1 - taperRate * t) * 2;

    // Get perpendicular direction
    let dx: number, dy: number;
    if (i === 0) {
      dx = points[1]!.x - points[0]!.x;
      dy = points[1]!.y - points[0]!.y;
    } else if (i === points.length - 1) {
      dx = points[i]!.x - points[i - 1]!.x;
      dy = points[i]!.y - points[i - 1]!.y;
    } else {
      dx = points[i + 1]!.x - points[i - 1]!.x;
      dy = points[i + 1]!.y - points[i - 1]!.y;
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    leftPoints.push({
      x: points[i]!.x + nx * currentWidth,
      y: points[i]!.y + ny * currentWidth,
    });
    rightPoints.push({
      x: points[i]!.x - nx * currentWidth,
      y: points[i]!.y - ny * currentWidth,
    });
  }

  // Build path: forward along left, tip, back along right
  const pathParts: string[] = [];
  pathParts.push(
    `M${leftPoints[0]!.x.toFixed(2)},${leftPoints[0]!.y.toFixed(2)}`
  );

  for (let i = 1; i < leftPoints.length; i++) {
    pathParts.push(
      `L${leftPoints[i]!.x.toFixed(2)},${leftPoints[i]!.y.toFixed(2)}`
    );
  }

  // Connect to right side (tip)
  const lastRight = rightPoints[rightPoints.length - 1]!;
  pathParts.push(`L${lastRight.x.toFixed(2)},${lastRight.y.toFixed(2)}`);

  // Go back along right side
  for (let i = rightPoints.length - 2; i >= 0; i--) {
    pathParts.push(
      `L${rightPoints[i]!.x.toFixed(2)},${rightPoints[i]!.y.toFixed(2)}`
    );
  }

  pathParts.push("Z");

  return `<path d="${pathParts.join(" ")}" fill="${color}" stroke="none"/>`;
}

// Render a tip decoration
function renderTipDecoration(dec: TipDecoration, color: string, strokeOnly: boolean): string {
  const { position, shape, size, rotation } = dec;
  if (size < 0.5) return "";

  const transform = `translate(${position.x.toFixed(2)},${position.y.toFixed(2)}) rotate(${((rotation * 180) / Math.PI).toFixed(1)})`;
  const fill = strokeOnly ? "none" : color;
  const stroke = strokeOnly ? color : "none";
  const sw = strokeOnly ? ' stroke-width="0.8"' : "";

  let path: string;
  switch (shape) {
    case 0: // Diamond
      path = `M0,${-size} L${size * 0.6},0 L0,${size} L${-size * 0.6},0 Z`;
      break;
    case 1: // Hexagon
      path = hexTipPath(size * 0.5);
      break;
    case 2: // Arrow
      path = `M${size},0 L${-size * 0.3},${size * 0.5} L0,0 L${-size * 0.3},${-size * 0.5} Z`;
      break;
    case 3: // Dot (circle)
      return `<circle cx="${position.x.toFixed(2)}" cy="${position.y.toFixed(2)}" r="${(size * 0.4).toFixed(2)}" fill="${fill}" stroke="${stroke}"${sw}/>`;
    default:
      path = `M0,${-size} L${size * 0.6},0 L0,${size} L${-size * 0.6},0 Z`;
  }

  return `<path d="${path}" fill="${fill}" stroke="${stroke}"${sw} transform="${transform}"/>`;
}

function hexTipPath(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ") + " Z";
}

export function renderSvg(
  geometry: SnowflakeGeometry,
  options: RenderOptions,
  hash: Uint8Array
): string {
  const { size, color, backgroundColor, strokeOnly } = options;
  const half = size / 2;
  // Derive a stable unique ID from the first 4 hash bytes
  const uid = `f${Array.from(hash.slice(0, 4)).map(b => b.toString(16).padStart(2, "0")).join("")}`;

  // Build the half-sector content (upper half of one 60-degree wedge)
  const sectorParts: string[] = [];

  // Primary arm
  sectorParts.push(renderBranch(geometry.primaryArm, color, strokeOnly));

  // Secondary branches
  for (const branch of geometry.secondaryBranches) {
    sectorParts.push(renderBranch(branch, color, strokeOnly));
  }

  // Tertiary branches
  for (const branch of geometry.tertiaryBranches) {
    sectorParts.push(renderBranch(branch, color, strokeOnly));
  }

  // Tip decorations
  for (const dec of geometry.tipDecorations) {
    sectorParts.push(renderTipDecoration(dec, color, strokeOnly));
  }

  const sectorContent = sectorParts.filter(Boolean).join("\n      ");

  // Build center pattern
  const centerFill = strokeOnly ? "none" : color;
  const centerStroke = strokeOnly ? color : "none";
  const centerSw = strokeOnly ? ' stroke-width="1"' : "";
  const centerSvg = `<path d="${geometry.centerPattern}" fill="${centerFill}" stroke="${centerStroke}"${centerSw} opacity="0.7"/>`;

  // Background
  const bgRect =
    backgroundColor === "transparent"
      ? ""
      : `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bgRect}
  <defs>
    <g id="${uid}-hs">
      ${sectorContent}
    </g>
    <g id="${uid}-s">
      <use href="#${uid}-hs"/>
      <use href="#${uid}-hs" transform="scale(1,-1)"/>
    </g>
  </defs>
  <g transform="translate(${half},${half})">
    <use href="#${uid}-s" transform="rotate(0)"/>
    <use href="#${uid}-s" transform="rotate(60)"/>
    <use href="#${uid}-s" transform="rotate(120)"/>
    <use href="#${uid}-s" transform="rotate(180)"/>
    <use href="#${uid}-s" transform="rotate(240)"/>
    <use href="#${uid}-s" transform="rotate(300)"/>
    ${centerSvg}
  </g>
</svg>`;
}
