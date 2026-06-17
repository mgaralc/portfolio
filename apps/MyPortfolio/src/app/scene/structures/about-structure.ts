import * as THREE from 'three/webgpu';
import { boxAdder, createBase } from '../mesh-builders';

// Local z grows toward the planet's core - the camera approaches from
// negative z, so anything that should read as "front facing" needs z <= 0.
//
// A warm little cottage with a timber-framed facade, a gabled roof, a smoking
// chimney, flower boxes, a porch, and a small front garden (stepping-stone
// path, mailbox, lamppost and a tree) - a lived-in "home" for the About zone.
export function createAboutStructure(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'structure-about';
  const addBox = boxAdder(group);

  const wall = new THREE.MeshStandardMaterial({ color: 0xf0e2c4, roughness: 0.85, flatShading: true });
  const timber = new THREE.MeshStandardMaterial({ color: 0x6b4429, roughness: 0.9, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xa4474a, roughness: 0.8, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.85, flatShading: true });
  const brick = new THREE.MeshStandardMaterial({ color: 0xb0623e, roughness: 0.9, flatShading: true });
  const stone = new THREE.MeshStandardMaterial({ color: 0xb7b1a3, roughness: 0.95, flatShading: true });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x4f9d52, roughness: 0.9, flatShading: true });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffe9a8,
    emissive: 0xffcf6b,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });
  const lampGlow = new THREE.MeshStandardMaterial({
    color: 0xffe9a8,
    emissive: 0xffd27a,
    emissiveIntensity: 1.2,
    roughness: 0.4,
  });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, flatShading: true });

  group.add(createBase(1.2, 0x4f5a3e)); // grassy-toned plinth

  const FRONT = -0.525; // outer face of the front wall (toward the camera)

  // --- House body + timber framing -----------------------------------------
  addBox(1.1, 0.7, 0.95, 0, 0.5, -0.05, wall);
  // Tudor-style beams, slightly proud of the front wall.
  const beamZ = FRONT - 0.012;
  addBox(1.1, 0.06, 0.02, 0, 0.5, beamZ, timber); // mid rail
  for (const bx of [-0.52, 0.52]) addBox(0.06, 0.7, 0.02, bx, 0.5, beamZ, timber); // corner posts
  addBox(1.1, 0.06, 0.02, 0, 0.83, beamZ, timber); // top plate
  // Two short diagonals for the half-timbered look.
  for (const sx of [-0.34, 0.34]) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.02), timber);
    d.position.set(sx, 0.66, beamZ);
    d.rotation.z = (sx < 0 ? 1 : -1) * 0.7;
    group.add(d);
  }

  // --- Gabled roof (triangular prism, ridge running front-to-back) ----------
  const shape = new THREE.Shape();
  shape.moveTo(-0.66, 0);
  shape.lineTo(0.66, 0);
  shape.lineTo(0, 0.5);
  shape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.06, bevelEnabled: false });
  roofGeo.translate(0, 0, -1.06 / 2);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 0.85, -0.05);
  group.add(roof);
  addBox(0.07, 0.07, 1.08, 0, 1.33, -0.05, woodMat); // ridge beam

  // --- Chimney + smoke ------------------------------------------------------
  addBox(0.17, 0.5, 0.17, 0.34, 1.12, 0.08, brick);
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xdfe3e8,
    roughness: 1,
    transparent: true,
    opacity: 0.8,
    flatShading: true,
  });
  [
    { y: 1.45, s: 0.07 },
    { y: 1.58, s: 0.09 },
    { y: 1.73, s: 0.11 },
  ].forEach((p) => {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(p.s, 0), smokeMat);
    puff.position.set(0.34 + (p.y - 1.45) * 0.18, p.y, 0.08);
    group.add(puff);
  });

  // --- Door, knob and step --------------------------------------------------
  addBox(0.28, 0.46, 0.05, 0, 0.38, FRONT - 0.02, woodMat);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), accent);
  knob.position.set(0.09, 0.37, FRONT - 0.05);
  group.add(knob);
  addBox(0.42, 0.07, 0.16, 0, 0.185, FRONT - 0.11, stone); // doorstep

  // --- Windows with cross frames + flower boxes -----------------------------
  for (const wx of [-0.34, 0.34]) {
    addBox(0.26, 0.26, 0.02, wx, 0.57, FRONT - 0.004, windowMat); // pane
    addBox(0.03, 0.28, 0.03, wx, 0.57, FRONT - 0.02, woodMat); // mullion v
    addBox(0.28, 0.03, 0.03, wx, 0.57, FRONT - 0.02, woodMat); // mullion h
    addBox(0.3, 0.07, 0.1, wx, 0.41, FRONT - 0.06, woodMat); // flower box
    for (let i = -1; i <= 1; i++) {
      const f = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.04, 0),
        new THREE.MeshStandardMaterial({
          color: [0xe8556d, 0xf2c14e, 0xffffff][i + 1],
          roughness: 0.7,
          flatShading: true,
        })
      );
      f.position.set(wx + i * 0.09, 0.47, FRONT - 0.06);
      group.add(f);
    }
  }

  // --- Porch: roof slab on two posts ---------------------------------------
  addBox(0.66, 0.05, 0.28, 0, 0.78, FRONT - 0.16, woodMat);
  for (const px of [-0.28, 0.28]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.6, 6), woodMat);
    post.position.set(px, 0.46, FRONT - 0.28);
    group.add(post);
  }

  // --- Front garden ---------------------------------------------------------
  // Stepping-stone path leading out from the door toward the viewer (-Z).
  for (const sz of [-0.78, -0.93, -1.06]) {
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 8), stone);
    slab.position.set(0, 0.165, sz);
    group.add(slab);
  }

  // Mailbox on a post.
  const mailPost = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 6), woodMat);
  mailPost.position.set(0.62, 0.34, -0.78);
  group.add(mailPost);
  addBox(0.16, 0.11, 0.1, 0.62, 0.56, -0.78, accent);

  // Lamppost with a warm glowing head.
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.6, 6), timber);
  lampPole.position.set(-0.66, 0.44, -0.72);
  group.add(lampPole);
  const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), lampGlow);
  lamp.position.set(-0.66, 0.77, -0.72);
  group.add(lamp);

  // A small tree to one side.
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 6), woodMat);
  trunk.position.set(0.86, 0.36, 0.2);
  group.add(trunk);
  [
    { x: 0.86, y: 0.66, z: 0.2, s: 0.26 },
    { x: 0.74, y: 0.58, z: 0.16, s: 0.18 },
    { x: 0.95, y: 0.6, z: 0.26, s: 0.18 },
  ].forEach((b) => {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(b.s, 0), leaf);
    blob.position.set(b.x, b.y, b.z);
    group.add(blob);
  });

  // A couple of low bushes flanking the path.
  for (const bx of [-0.34, 0.34]) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), leaf);
    bush.position.set(bx, 0.2, -0.95);
    group.add(bush);
  }

  return group;
}
