import * as THREE from 'three/webgpu';

// A "living cosmos" layer: things that move every frame to make the world feel
// alive and show off the renderer - an orbiting moon, a satellite with a
// blinking beacon, drifting fireflies, and the odd shooting star. Each factory
// returns the object(s) to add plus an `update(elapsed, dt)` the engine ticks.

export interface Animated {
  object: THREE.Object3D;
  update: (elapsed: number, dt: number) => void;
}

/** Soft round glow sprite texture (white core fading to transparent). */
function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Horizontal comet streak: bright head on the right fading to a tail. */
function makeStreakTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.85, 'rgba(220,235,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 6, 128, 4);
  // Brighter head.
  const hg = ctx.createRadialGradient(120, 8, 0, 120, 8, 8);
  hg.addColorStop(0, 'rgba(255,255,255,1)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(108, 0, 20, 16);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A low-poly moon on a slow tilted orbit, plus a satellite on a faster one. */
export function createOrbiters(planetRadius: number): Animated {
  const group = new THREE.Group();
  group.name = 'orbiters';

  // --- Moon -----------------------------------------------------------------
  const moonOrbit = new THREE.Group();
  moonOrbit.rotation.x = 0.35; // tilt the orbital plane
  const moon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(planetRadius * 0.22, 1),
    new THREE.MeshStandardMaterial({ color: 0xc2c8d4, roughness: 1, flatShading: true })
  );
  moon.position.x = planetRadius * 2.3;
  // A couple of darker craters for character.
  const crater = new THREE.MeshStandardMaterial({ color: 0x9aa0ad, roughness: 1, flatShading: true });
  [
    [0.5, 0.3, 0.6, 0.18],
    [-0.4, 0.5, 0.5, 0.13],
    [0.2, -0.6, 0.5, 0.1],
  ].forEach(([x, y, z, s]) => {
    const r = planetRadius * 0.22;
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), crater);
    c.position.set(x, y, z).multiplyScalar(r * 0.95).add(moon.position);
    moonOrbit.add(c);
  });
  const moonGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: 0x9fb6ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  moonGlow.scale.setScalar(planetRadius * 1.1);
  moonGlow.position.copy(moon.position);
  moonOrbit.add(moon, moonGlow);
  group.add(moonOrbit);

  // --- Satellite ------------------------------------------------------------
  const satOrbit = new THREE.Group();
  satOrbit.rotation.set(0.9, 0, 0.5); // steeper, different plane
  const sat = new THREE.Group();
  sat.position.x = planetRadius * 1.65;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.4, metalness: 0.6, flatShading: true });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1b3a6b, roughness: 0.3, metalness: 0.5, emissive: 0x12407a, emissiveIntensity: 0.3, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.32), bodyMat);
  sat.add(body);
  for (const sx of [-0.5, 0.5]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.26), panelMat);
    panel.position.set(sx, 0, 0);
    sat.add(panel);
  }
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    bodyMat
  );
  dish.rotation.x = -Math.PI / 2;
  dish.position.set(0, 0, -0.22);
  sat.add(dish);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff5a5a, emissive: 0xff2a2a, emissiveIntensity: 1.5 })
  );
  beacon.position.set(0, 0.16, 0);
  sat.add(beacon);
  satOrbit.add(sat);
  group.add(satOrbit);

  return {
    object: group,
    update: (t) => {
      moonOrbit.rotation.y = t * 0.045;
      moon.rotation.y = t * 0.12;
      satOrbit.rotation.y = -t * 0.32;
      sat.rotation.y = t * 0.6;
      const blink = (Math.sin(t * 6) + 1) * 0.5;
      (beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + blink * 2;
    },
  };
}

/** Warm motes of light drifting and twinkling around the planet. */
export function createFireflies(planetRadius: number, count = 80): Animated {
  const COUNT = count;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = planetRadius * (1.08 + Math.random() * 0.5);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: planetRadius * 0.09,
    map: makeGlowTexture(),
    color: 0xffdf8c,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'fireflies';

  return {
    object: points,
    update: (t) => {
      points.rotation.y = t * 0.04;
      points.rotation.x = Math.sin(t * 0.1) * 0.05;
      material.opacity = 0.7 + Math.sin(t * 1.6) * 0.25;
    },
  };
}

interface Streak {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
  duration: number;
  wait: number;
}

/** Occasional shooting stars crossing the far background. */
export function createShootingStars(count = 3): Animated {
  const group = new THREE.Group();
  group.name = 'shooting-stars';
  const tex = makeStreakTexture();
  const COUNT = count;
  const streaks: Streak[] = [];

  const spawn = (s: Streak) => {
    // Start somewhere up and to one side, far behind the planet.
    const startX = 30 + Math.random() * 30;
    const startY = 18 + Math.random() * 22;
    const z = -40 - Math.random() * 30;
    s.sprite.position.set(startX, startY, z);
    const speed = 38 + Math.random() * 26;
    // Travel down-and-left across the sky.
    s.vel.set(-1, -0.45 - Math.random() * 0.3, 0).normalize().multiplyScalar(speed);
    s.sprite.material.rotation = Math.atan2(s.vel.y, s.vel.x);
    s.duration = 0.8 + Math.random() * 0.5;
    s.life = 0;
    s.sprite.scale.set(9, 1.1, 1);
    s.sprite.visible = true;
  };

  for (let i = 0; i < COUNT; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sprite.visible = false;
    group.add(sprite);
    streaks.push({ sprite, vel: new THREE.Vector3(), life: 0, duration: 1, wait: 1 + Math.random() * 7 });
  }

  return {
    object: group,
    update: (_t, dt) => {
      for (const s of streaks) {
        if (!s.sprite.visible) {
          s.wait -= dt;
          if (s.wait <= 0) spawn(s);
          continue;
        }
        s.life += dt;
        const k = s.life / s.duration;
        if (k >= 1) {
          s.sprite.visible = false;
          s.sprite.material.opacity = 0;
          s.wait = 3 + Math.random() * 9;
          continue;
        }
        s.sprite.position.addScaledVector(s.vel, dt);
        // Fade in then out across the flight.
        s.sprite.material.opacity = Math.sin(k * Math.PI);
      }
    },
  };
}

/** A tilted Saturn-like ring of fine particles slowly circling the planet. */
export function createPlanetRing(planetRadius: number, count = 320): Animated {
  const inner = planetRadius * 1.5;
  const outer = planetRadius * 2.1;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cold = new THREE.Color(0x8fb4ff);
  const warm = new THREE.Color(0xffe0a8);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(inner * inner + Math.random() * (outer * outer - inner * inner));
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * planetRadius * 0.06;
    positions[i * 3 + 2] = Math.sin(a) * r;
    const c = cold.clone().lerp(warm, Math.random());
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: planetRadius * 0.04,
    map: makeGlowTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const spin = new THREE.Points(geometry, material);
  const tilt = new THREE.Group();
  tilt.name = 'planet-ring';
  tilt.rotation.set(1.15, 0, 0.32); // lay the ring on a tilted plane
  tilt.add(spin);

  return {
    object: tilt,
    update: (t) => {
      spin.rotation.y = t * 0.08;
    },
  };
}

// --- Animated water -------------------------------------------------------

let _waterNormal: THREE.CanvasTexture | null = null;

/** A small tileable ripple normal map (shared, generated once). */
function waterNormalTexture(): THREE.CanvasTexture {
  if (_waterNormal) return _waterNormal;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  const img = ctx.createImageData(size, size);
  const TWO_PI = Math.PI * 2;
  const scale = 0.06;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Tileable height field (integer frequencies) and its analytic gradient.
      const dhdu =
        TWO_PI * 3 * Math.cos(TWO_PI * 3 * u) * 0.5 +
        TWO_PI * 2 * Math.cos(TWO_PI * (2 * u + 2 * v)) * 0.3;
      const dhdv =
        TWO_PI * 2 * Math.cos(TWO_PI * 2 * v) * 0.5 +
        TWO_PI * 2 * Math.cos(TWO_PI * (2 * u + 2 * v)) * 0.3;
      const nx = -dhdu * scale;
      const ny = -dhdv * scale;
      const nz = 1;
      const inv = 1 / Math.hypot(nx, ny, nz);
      const idx = (y * size + x) * 4;
      img.data[idx] = (nx * inv * 0.5 + 0.5) * 255;
      img.data[idx + 1] = (ny * inv * 0.5 + 0.5) * 255;
      img.data[idx + 2] = (nz * inv * 0.5 + 0.5) * 255;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _waterNormal = tex;
  return tex;
}

/**
 * Turns a still water mesh (river/lake - needs UVs) into flowing water: scrolls
 * a ripple normal map and adds a faint shimmer. GPU-side and cheap, so it runs
 * on every tier. Returns the per-frame updater.
 */
export function makeWaterAnimated(
  mesh: THREE.Mesh,
  flowU = 0.0,
  flowV = 0.05,
  repeatU = 3,
  repeatV = 18
): Animated {
  const material = mesh.material as THREE.MeshStandardMaterial;
  const normal = waterNormalTexture().clone();
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.needsUpdate = true;
  normal.repeat.set(repeatU, repeatV);
  material.normalMap = normal;
  material.normalScale = new THREE.Vector2(0.45, 0.45);
  material.emissive = new THREE.Color(material.color).multiplyScalar(0.25);
  material.needsUpdate = true;

  return {
    object: mesh,
    update: (t, dt) => {
      normal.offset.x += flowU * dt;
      normal.offset.y += flowV * dt;
      material.emissiveIntensity = 0.5 + Math.sin(t * 1.2) * 0.25;
    },
  };
}
