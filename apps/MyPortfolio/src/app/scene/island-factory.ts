import * as THREE from 'three/webgpu';
import { SPHERE_RADIUS } from './constants';

// Two coherent low-frequency "fields" sampled from each face's direction give
// broad, natural patches; a per-face hash adds fine grain. Together they make
// the whole planet read as one continuous low-poly grass/earth ground rather
// than flat color-coded zones.
const GRASS_LIGHT = new THREE.Color(0x7bb03f); // sunlit yellow-green
const GRASS_DARK = new THREE.Color(0x3c8a45); // shaded deep green
const EARTH = new THREE.Color(0x9c7a4d); // bare dirt patches

const tmpColor = new THREE.Color();
const hsl = { h: 0, s: 0, l: 0 };

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function grassColor(dir: THREE.Vector3, faceIndex: number): THREE.Color {
  // Broad grass-tone field.
  const f1 =
    Math.sin(dir.x * 2.3 + dir.y * 1.7) +
    Math.sin(dir.y * 2.1 - dir.z * 2.6) +
    Math.sin(dir.z * 1.9 + dir.x * 1.4);
  const grassField = clamp01((f1 / 3 + 1) / 2);
  tmpColor.copy(GRASS_LIGHT).lerp(GRASS_DARK, grassField);

  // Occasional bare-earth patches via a second, higher-frequency field.
  const f2 =
    Math.sin(dir.x * 3.7 - dir.z * 3.1) + Math.sin(dir.y * 4.2 + dir.x * 2.8);
  const earthField = (f2 / 2 + 1) / 2;
  if (earthField > 0.84) {
    tmpColor.lerp(EARTH, ((earthField - 0.84) / 0.16) * 0.75);
  }

  // Fine per-face lightness grain so adjacent facets never match exactly.
  const noise = Math.sin(faceIndex * 12.9898) * 43758.5453;
  const jitter = (noise - Math.floor(noise) - 0.5) * 0.12;
  tmpColor.getHSL(hsl);
  tmpColor.setHSL(hsl.h, hsl.s, clamp01(hsl.l + jitter));

  return tmpColor;
}

/**
 * Builds the low-poly "planet": a faceted icosphere whose every face is tinted
 * a slightly different grass/earth tone, so the entire surface looks like one
 * natural grassy planet ground. All structures, models, vegetation and the
 * river sit on top of this.
 */
export function createIsland(): THREE.Mesh {
  // Higher subdivision than before so the per-face color variation reads as a
  // fine grass texture (still flat-shaded and clearly low-poly).
  const geometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 3);
  const position = geometry.getAttribute('position');
  const colorArray = new Float32Array(position.count * 3);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    centroid.copy(a).add(b).add(c).divideScalar(3).normalize();

    const color = grassColor(centroid, i);
    for (let v = 0; v < 3; v++) {
      colorArray[(i + v) * 3] = color.r;
      colorArray[(i + v) * 3 + 1] = color.g;
      colorArray[(i + v) * 3 + 2] = color.b;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.0,
  });

  const island = new THREE.Mesh(geometry, material);
  island.name = 'portfolio-island';
  return island;
}
