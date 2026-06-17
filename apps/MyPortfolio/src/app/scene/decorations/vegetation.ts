import * as THREE from 'three/webgpu';

// A scattered "ground cover" layer: grass tufts, small bushes and the odd
// flower, in varied green tones for dynamism. All instances share a small pool
// of geometries/materials so we can sprinkle a hundred-plus of them cheaply.

const GREEN_TONES = [0x4f8f52, 0x5fa85f, 0x3f7a43, 0x6fb86a, 0x77c06d, 0x468a4e];
const FLOWER_COLORS = [0xe45c5c, 0xe8c547, 0xf2f2f2, 0xe07bb4, 0x9b6cd6];
const ROCK_TONES = [0x8b8d91, 0x76787c, 0x9a948a, 0x6f6b66];
const MUSHROOM_CAPS = [0xc0443a, 0xb98850, 0xd9a23a];

const bladeGeometry = new THREE.ConeGeometry(0.045, 0.26, 4);
const bushGeometry = new THREE.IcosahedronGeometry(0.15, 0);
const stemGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5);
const headGeometry = new THREE.IcosahedronGeometry(0.055, 0);
const rockGeometry = new THREE.IcosahedronGeometry(0.16, 0);
const mushroomStemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.14, 6);
const mushroomCapGeometry = new THREE.IcosahedronGeometry(0.09, 0);
const logGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
const stemMaterial = new THREE.MeshStandardMaterial({
  color: 0x4f8f52,
  roughness: 0.85,
  flatShading: true,
});
const mushroomStemMaterial = new THREE.MeshStandardMaterial({
  color: 0xeae2d0,
  roughness: 0.8,
  flatShading: true,
});
const logMaterial = new THREE.MeshStandardMaterial({
  color: 0x6b4a2f,
  roughness: 0.9,
  flatShading: true,
});

const materialCache = new Map<number, THREE.MeshStandardMaterial>();
function material(color: number): THREE.MeshStandardMaterial {
  let mat = materialCache.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      flatShading: true,
    });
    materialCache.set(color, mat);
  }
  return mat;
}

function pick<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

function createGrassTuft(rand: () => number): THREE.Group {
  const group = new THREE.Group();
  const mat = material(pick(GREEN_TONES, rand));
  const bladeCount = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < bladeCount; i++) {
    const blade = new THREE.Mesh(bladeGeometry, mat);
    const angle = rand() * Math.PI * 2;
    const spread = 0.06 + rand() * 0.05;
    blade.position.set(Math.cos(angle) * spread, 0.13, Math.sin(angle) * spread);
    // Splay blades outward a bit so the tuft looks natural, not a bundle.
    blade.rotation.set((rand() - 0.5) * 0.5, angle, (rand() - 0.5) * 0.5);
    const s = 0.7 + rand() * 0.6;
    blade.scale.set(s, s, s);
    group.add(blade);
  }
  return group;
}

function createSmallBush(rand: () => number): THREE.Group {
  const group = new THREE.Group();
  const mat = material(pick(GREEN_TONES, rand));
  const blobs = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < blobs; i++) {
    const blob = new THREE.Mesh(bushGeometry, mat);
    const s = 0.7 + rand() * 0.7;
    blob.scale.setScalar(s);
    blob.position.set((rand() - 0.5) * 0.16, 0.15 * s, (rand() - 0.5) * 0.16);
    blob.rotation.y = rand() * Math.PI;
    group.add(blob);
  }
  return group;
}

function createFlower(rand: () => number): THREE.Group {
  const group = new THREE.Group();

  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.1;
  group.add(stem);

  const head = new THREE.Mesh(headGeometry, material(pick(FLOWER_COLORS, rand)));
  head.position.y = 0.21;
  group.add(head);

  return group;
}

function createRock(rand: () => number): THREE.Group {
  const group = new THREE.Group();
  const mat = material(pick(ROCK_TONES, rand));
  const count = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < count; i++) {
    const rock = new THREE.Mesh(rockGeometry, mat);
    const s = 0.55 + rand() * 0.8;
    rock.scale.setScalar(s);
    rock.position.set((rand() - 0.5) * 0.18, 0.12 * s, (rand() - 0.5) * 0.18);
    rock.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    group.add(rock);
  }
  return group;
}

function createMushroom(rand: () => number): THREE.Group {
  const group = new THREE.Group();

  const stem = new THREE.Mesh(mushroomStemGeometry, mushroomStemMaterial);
  stem.position.y = 0.07;
  group.add(stem);

  const cap = new THREE.Mesh(mushroomCapGeometry, material(pick(MUSHROOM_CAPS, rand)));
  cap.position.y = 0.15;
  cap.scale.set(1.1, 0.6, 1.1);
  group.add(cap);

  return group;
}

function createLog(rand: () => number): THREE.Group {
  const group = new THREE.Group();
  const log = new THREE.Mesh(logGeometry, logMaterial);
  // Lay the cylinder on its side so it reads as a fallen trunk.
  log.rotation.z = Math.PI / 2;
  log.position.y = 0.06;
  log.scale.x = 0.7 + rand() * 0.6;
  group.add(log);
  group.rotation.y = rand() * Math.PI;
  return group;
}

/** Builds one random nature ground-cover item (weighted toward grass). */
export function createVegetationItem(rand: () => number): THREE.Group {
  const r = rand();
  if (r < 0.46) return createGrassTuft(rand);
  if (r < 0.62) return createSmallBush(rand);
  if (r < 0.72) return createFlower(rand);
  if (r < 0.86) return createRock(rand);
  if (r < 0.94) return createMushroom(rand);
  return createLog(rand);
}
