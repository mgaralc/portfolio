// Hand-drawn (canvas) tech logos for the Technologies zone tiles. We draw our
// own simplified, on-style renditions with the Canvas 2D API instead of using
// the official logo image files - that keeps the project license-clean while
// each tech still reads at a glance. Anything we don't have art for falls back
// to a text chip (see tech-board.ts).
//
// Every drawer paints inside a square tile centered at (cx, cy); `s` is roughly
// half the drawable content size, so the logo spans about 2*s on each axis.

type Ctx = CanvasRenderingContext2D;

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Brand-colored rounded square with a 1-2 char monogram (bottom-right). */
function monogram(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  s: number,
  bg: string,
  fg: string,
  corner = true
): void {
  roundRect(ctx, cx - s, cy - s, 2 * s, 2 * s, s * 0.3);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = `800 ${s * (corner ? 0.95 : 1.25)}px system-ui, sans-serif`;
  if (corner) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, cx + s * 0.82, cy + s * 0.78);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + s * 0.04);
  }
}

function python(ctx: Ctx, cx: number, cy: number, s: number): void {
  // Two interlocking two-tone blocks + the signature eye dots.
  roundRect(ctx, cx - s, cy - s, 1.3 * s, 1.3 * s, s * 0.4);
  ctx.fillStyle = '#3776ab';
  ctx.fill();
  roundRect(ctx, cx - 0.3 * s, cy - 0.3 * s, 1.3 * s, 1.3 * s, s * 0.4);
  ctx.fillStyle = '#ffd13b';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circle(ctx, cx - 0.55 * s, cy - 0.55 * s, s * 0.11);
  circle(ctx, cx + 0.55 * s, cy + 0.55 * s, s * 0.11);
}

function react(ctx: Ctx, cx: number, cy: number, s: number): void {
  ctx.strokeStyle = '#61dafb';
  ctx.lineWidth = s * 0.11;
  for (const rot of [0, Math.PI / 3, -Math.PI / 3]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.98, s * 0.37, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#61dafb';
  circle(ctx, cx, cy, s * 0.18);
}

function angular(ctx: Ctx, cx: number, cy: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + 0.86 * s, cy - 0.66 * s);
  ctx.lineTo(cx + 0.66 * s, cy + 0.72 * s);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - 0.66 * s, cy + 0.72 * s);
  ctx.lineTo(cx - 0.86 * s, cy - 0.66 * s);
  ctx.closePath();
  ctx.fillStyle = '#dd0031';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${s * 1.1}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', cx, cy + s * 0.06);
}

function java(ctx: Ctx, cx: number, cy: number, s: number): void {
  // Orange steam wisps rising over a blue coffee cup.
  ctx.strokeStyle = '#e76f00';
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = 'round';
  for (const dx of [-0.28, 0.05, 0.36]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * s, cy - 0.35 * s);
    ctx.bezierCurveTo(
      cx + (dx + 0.18) * s,
      cy - 0.6 * s,
      cx + (dx - 0.18) * s,
      cy - 0.78 * s,
      cx + dx * s,
      cy - s
    );
    ctx.stroke();
  }
  ctx.fillStyle = '#5382a1';
  roundRect(ctx, cx - 0.5 * s, cy - 0.15 * s, s, 0.75 * s, s * 0.12);
  ctx.fill();
  ctx.strokeStyle = '#5382a1';
  ctx.lineWidth = s * 0.13;
  ctx.beginPath();
  ctx.arc(cx + 0.5 * s, cy + 0.18 * s, 0.22 * s, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = '#5382a1';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 0.66 * s, 0.6 * s, 0.12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function database(ctx: Ctx, cx: number, cy: number, s: number): void {
  // Generic DB cylinder for SQL/MySQL.
  const rx = 0.62 * s;
  const ry = 0.2 * s;
  const top = cy - 0.62 * s;
  const bottom = cy + 0.62 * s;
  ctx.fillStyle = '#00758f';
  ctx.beginPath();
  ctx.moveTo(cx - rx, top);
  ctx.lineTo(cx - rx, bottom);
  ctx.ellipse(cx, bottom, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#33a0b8';
  for (const yy of [top, cy - 0.1 * s, cy + 0.42 * s]) {
    ctx.beginPath();
    ctx.ellipse(cx, yy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function windows(ctx: Ctx, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#1aa0f0';
  const gap = s * 0.14;
  const half = s * 0.86;
  const cell = (half - gap / 2) ;
  const x0 = cx - half;
  const y0 = cy - half;
  for (const [r, c] of [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]) {
    const x = x0 + c * (cell + gap);
    const y = y0 + r * (cell + gap);
    roundRect(ctx, x, y, cell, cell, s * 0.08);
    ctx.fill();
  }
}

function linux(ctx: Ctx, cx: number, cy: number, s: number): void {
  // Simplified Tux penguin.
  ctx.fillStyle = '#f5a623'; // feet
  for (const dx of [-0.32, 0.32]) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * s, cy + 0.92 * s, 0.26 * s, 0.12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#1c1c1c'; // body
  ctx.beginPath();
  ctx.ellipse(cx, cy + 0.2 * s, 0.62 * s, 0.78 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath(); // head
  ctx.ellipse(cx, cy - 0.55 * s, 0.44 * s, 0.46 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff'; // belly
  ctx.beginPath();
  ctx.ellipse(cx, cy + 0.34 * s, 0.4 * s, 0.56 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath(); // face patch
  ctx.ellipse(cx, cy - 0.45 * s, 0.3 * s, 0.32 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c'; // eyes
  circle(ctx, cx - 0.13 * s, cy - 0.58 * s, 0.06 * s);
  circle(ctx, cx + 0.13 * s, cy - 0.58 * s, 0.06 * s);
  ctx.fillStyle = '#f5a623'; // beak
  ctx.beginPath();
  ctx.moveTo(cx - 0.1 * s, cy - 0.36 * s);
  ctx.lineTo(cx + 0.1 * s, cy - 0.36 * s);
  ctx.lineTo(cx, cy - 0.24 * s);
  ctx.closePath();
  ctx.fill();
}

function git(ctx: Ctx, cx: number, cy: number, s: number): void {
  const color = '#f05133';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.13;
  ctx.lineCap = 'round';
  const ax = cx - 0.35 * s;
  // Main branch line (two commits).
  ctx.beginPath();
  ctx.moveTo(ax, cy - 0.7 * s);
  ctx.lineTo(ax, cy + 0.7 * s);
  ctx.stroke();
  // Side branch curving off to a third commit.
  ctx.beginPath();
  ctx.moveTo(ax, cy + 0.1 * s);
  ctx.quadraticCurveTo(ax, cy - 0.4 * s, cx + 0.45 * s, cy - 0.4 * s);
  ctx.stroke();
  for (const [x, y] of [
    [ax, cy - 0.7 * s],
    [ax, cy + 0.7 * s],
    [cx + 0.45 * s, cy - 0.4 * s],
  ]) {
    circle(ctx, x, y, s * 0.18);
  }
}

/** Map of logo drawers keyed by a normalized tech name. */
const LOGOS: Record<string, (ctx: Ctx, cx: number, cy: number, s: number) => void> = {
  python,
  react,
  angular,
  java,
  mysql: database,
  sql: database,
  windows,
  linux,
  git,
  github: git,
  javascript: (ctx, cx, cy, s) => monogram(ctx, 'JS', cx, cy, s, '#f7df1e', '#1a1a1a'),
  typescript: (ctx, cx, cy, s) => monogram(ctx, 'TS', cx, cy, s, '#3178c6', '#ffffff'),
  c: (ctx, cx, cy, s) => monogram(ctx, 'C', cx, cy, s, '#00599c', '#ffffff', false),
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Draws the logo for `name` centered at (cx, cy) if we have art for it and
 * returns true; returns false when there's no logo (caller draws a text chip).
 */
export function drawTechLogo(
  ctx: Ctx,
  name: string,
  cx: number,
  cy: number,
  s: number
): boolean {
  const key = normalize(name);
  const draw = LOGOS[key] ?? (key.includes('git') ? git : undefined);
  if (!draw) return false;
  ctx.save();
  draw(ctx, cx, cy, s);
  ctx.restore();
  return true;
}
