import * as THREE from 'three/webgpu';

// The "universe" the planet floats in: a deep-space gradient backdrop, a layered
// starfield, soft nebula clouds and an atmospheric rim glow. All of it sits far
// out (radius ~60-95) inside the camera's far plane and never moves, so the
// planet reads as a small world adrift in space.

function context2d(size: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

/** Vertical deep-space gradient used as the scene background. */
export function createSpaceGradientTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0c0c24'); // top: deep indigo
  gradient.addColorStop(0.5, '#08060f'); // mid: near-black violet
  gradient.addColorStop(1, '#01030a'); // bottom: black with a teal hint
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const DIM_STAR_PALETTE = [0xffffff, 0xcdd9ff, 0xb7c9ff, 0xffe9c7, 0xd7e3ff];
const BRIGHT_STAR_PALETTE = [0xffffff, 0xbcd2ff, 0xffd9a0, 0x9fb8ff, 0xfff2d6];

function makeStarLayer(
  count: number,
  size: number,
  brightness: number,
  palette: number[]
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Uniformly distributed direction on a sphere, scattered over a shell.
    const u = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const ring = Math.sqrt(1 - u * u);
    const radius = 60 + Math.random() * 35;
    positions[i * 3] = Math.cos(phi) * ring * radius;
    positions[i * 3 + 1] = u * radius;
    positions[i * 3 + 2] = Math.sin(phi) * ring * radius;

    color.set(palette[Math.floor(Math.random() * palette.length)]);
    const b = brightness * (0.45 + Math.random() * 0.55);
    colors[i * 3] = color.r * b;
    colors[i * 3 + 1] = color.g * b;
    colors[i * 3 + 2] = color.b * b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

/** Two-layer starfield: many faint stars plus fewer bright, larger ones. */
export function createStarfield(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'starfield';
  group.add(makeStarLayer(2400, 0.42, 0.6, DIM_STAR_PALETTE));
  group.add(makeStarLayer(450, 0.9, 1.0, BRIGHT_STAR_PALETTE));
  return group;
}

function makeRadialGlowTexture(stops: [number, string][]): THREE.Texture {
  const { canvas, ctx } = context2d(256);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface NebulaSpec {
  color: string;
  position: [number, number, number];
  scale: number;
}

const NEBULAE: NebulaSpec[] = [
  { color: '120, 90, 220', position: [-55, 25, -45], scale: 70 }, // violet
  { color: '40, 150, 200', position: [60, -20, -35], scale: 60 }, // teal
  { color: '90, 70, 200', position: [10, -45, 55], scale: 55 }, // indigo
];

/** A few large, very soft colored clouds far out, for depth and color. */
export function createNebulae(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'nebulae';

  for (const spec of NEBULAE) {
    const texture = makeRadialGlowTexture([
      [0, `rgba(${spec.color}, 0.5)`],
      [0.4, `rgba(${spec.color}, 0.18)`],
      [1, `rgba(${spec.color}, 0)`],
    ]);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(...spec.position);
    sprite.scale.setScalar(spec.scale);
    group.add(sprite);
  }

  return group;
}

/**
 * A camera-facing atmospheric rim glow. The radial gradient is transparent in
 * the middle (where the planet sits) and brightest at the planet's edge, so with
 * depth-testing on it shows only as a soft halo around the silhouette - giving
 * the planet a breathable, alive-world feel without any custom shader.
 */
export function createAtmosphereGlow(planetRadius: number): THREE.Sprite {
  const texture = makeRadialGlowTexture([
    [0, 'rgba(120, 195, 255, 0)'],
    [0.34, 'rgba(120, 195, 255, 0)'],
    [0.44, 'rgba(130, 200, 255, 0.45)'], // rim peak, aligned to the planet edge
    [0.6, 'rgba(80, 150, 255, 0.16)'],
    [1, 'rgba(60, 110, 220, 0)'],
  ]);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.95,
  });
  const sprite = new THREE.Sprite(material);
  // Sized so the gradient's rim (~0.44) lands just outside the planet radius.
  sprite.scale.setScalar(planetRadius * 2.4);
  return sprite;
}
