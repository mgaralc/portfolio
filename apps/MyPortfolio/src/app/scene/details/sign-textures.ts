import * as THREE from 'three/webgpu';

// Canvas-drawn textures for the in-world signs. We draw our own labels (tech
// names, company names, contact info, greetings) instead of using copyrighted
// logo images - keeps it license-clean and on-style.

const W = 320;
const H = 180;

function finalize(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

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

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  weight = '700'
): number {
  let size = startPx;
  do {
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 12);
  return size;
}

/** A label sign: bold title and an optional smaller subtitle, on a color. */
export function makeLabelTexture(
  title: string,
  subtitle = '',
  bg = '#1b294a',
  fg = '#ffffff'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  roundRect(ctx, 6, 6, W - 12, H - 12, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleSize = fitFont(ctx, title, W - 48, 56);
  ctx.font = `800 ${titleSize}px system-ui, sans-serif`;
  ctx.fillText(title, W / 2, subtitle ? H / 2 - 22 : H / 2);

  if (subtitle) {
    const subSize = fitFont(ctx, subtitle, W - 48, 30, '500');
    ctx.font = `500 ${subSize}px system-ui, sans-serif`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(subtitle, W / 2, H / 2 + 28);
    ctx.globalAlpha = 1;
  }

  return finalize(canvas);
}
