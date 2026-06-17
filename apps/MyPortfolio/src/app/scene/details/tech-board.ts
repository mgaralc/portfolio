import * as THREE from 'three/webgpu';
import { drawTechLogo } from './tech-logos';

// A "museum plaque" for the Technologies zone: one board per category, with a
// header and a grid of tiles. Each tile is either a hand-drawn logo (see
// tech-logos.ts) or, when we have no art, a text chip with the tech's name.

const TILE = 120;
const GAP = 20;
const PAD = 26;
const HEADER = 78;

function roundRect(
  ctx: CanvasRenderingContext2D,
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

/** Draws a tech name as a fitted, possibly two-line, text chip. */
function drawTextChip(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  cy: number,
  maxWidth: number
): void {
  ctx.fillStyle = '#dfe6f5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 30;
  do {
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    if (ctx.measureText(name).width <= maxWidth) break;
    size -= 2;
  } while (size > 14);
  ctx.fillText(name, cx, cy);
}

export interface TechBoard {
  texture: THREE.CanvasTexture;
  /** canvas height / width, so the caller can keep the board undistorted. */
  aspect: number;
}

/**
 * Renders a category board texture. `accent` (CSS hex) tints the frame and
 * header so each board matches the zone color. Returns the texture plus its
 * aspect ratio for sizing the in-world plane.
 */
export function makeTechBoardTexture(
  category: string,
  items: string[],
  accent: string
): TechBoard {
  const cols = items.length <= 4 ? 2 : 3;
  const rows = Math.ceil(items.length / cols);

  const W = PAD * 2 + cols * TILE + (cols - 1) * GAP;
  const H = PAD * 2 + HEADER + rows * TILE + (rows - 1) * GAP;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  // Board background + accent frame.
  ctx.fillStyle = '#10182b';
  roundRect(ctx, 6, 6, W - 12, H - 12, 26);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Header.
  ctx.fillStyle = accent;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category, W / 2, PAD + HEADER / 2 - 4);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + HEADER);
  ctx.lineTo(W - PAD, PAD + HEADER);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Tiles.
  const gridTop = PAD + HEADER + GAP;
  items.forEach((name, i) => {
    const r = Math.floor(i / cols);
    const colInRow = i % cols;
    // Last row may be short; center it.
    const itemsInRow = Math.min(cols, items.length - r * cols);
    const rowWidth = itemsInRow * TILE + (itemsInRow - 1) * GAP;
    const rowX0 = (W - rowWidth) / 2;
    const x = rowX0 + colInRow * (TILE + GAP);
    const y = gridTop + r * (TILE + GAP);
    const cx = x + TILE / 2;
    const cy = y + TILE / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, y, TILE, TILE, 16);
    ctx.fill();

    if (!drawTechLogo(ctx, name, cx, cy, TILE * 0.34)) {
      drawTextChip(ctx, name, cx, cy, TILE - 16);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { texture, aspect: H / W };
}
