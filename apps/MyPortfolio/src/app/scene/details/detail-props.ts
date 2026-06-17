import * as THREE from 'three/webgpu';
import { boxAdder } from '../mesh-builders';

// Reveal-on-enter detail props. They sit on the surface like everything else
// (built with +Y up, front facing local -Z toward the focus camera) and are
// toggled visible only while a zone is open.

const postMat = new THREE.MeshStandardMaterial({
  color: 0x6b6f76,
  roughness: 0.6,
  metalness: 0.3,
  flatShading: true,
});
const frameMat = new THREE.MeshStandardMaterial({
  color: 0x262b36,
  roughness: 0.7,
  flatShading: true,
});

/** A billboard sign on a post, showing `texture` on its camera-facing side. */
export function createSign(
  texture: THREE.Texture,
  width = 0.6,
  height = 0.34
): THREE.Group {
  const group = new THREE.Group();

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.42, 6),
    postMat
  );
  post.position.y = 0.21;
  group.add(post);

  const cy = 0.42 + height / 2;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.05, height + 0.05, 0.05),
    frameMat
  );
  board.position.set(0, cy, 0);
  group.add(board);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  face.position.set(0, cy, -0.031);
  face.rotation.y = Math.PI;
  group.add(face);

  return group;
}

/**
 * A friendly blocky avatar standing and waving - "me" greeting the visitor in
 * the About zone. Faces -Z (toward the focus camera); the right arm is raised
 * and bent in a wave to match the zone's 👋 icon.
 */
export function createWavingPerson(accent = 0x3b6fd6): THREE.Group {
  const group = new THREE.Group();
  group.name = 'waving-me';

  const skin = new THREE.MeshStandardMaterial({ color: 0xe0a878, roughness: 0.7, flatShading: true });
  const shirt = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.7, flatShading: true });
  const pants = new THREE.MeshStandardMaterial({ color: 0x33384a, roughness: 0.8, flatShading: true });
  const hair = new THREE.MeshStandardMaterial({ color: 0x241712, roughness: 0.9, flatShading: true });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.8, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6, flatShading: true });

  const box = boxAdder(group);

  // Legs + shoes (standing, feet on the ground).
  for (const lx of [-0.1, 0.1]) {
    box(0.13, 0.42, 0.16, lx, 0.26, 0, pants);
    box(0.15, 0.08, 0.22, lx, 0.05, -0.03, shoes);
  }

  // Torso + head.
  box(0.36, 0.42, 0.22, 0, 0.68, 0, shirt);
  box(0.26, 0.25, 0.24, 0, 1.04, 0, skin); // head
  box(0.28, 0.11, 0.26, 0, 1.18, 0.01, hair); // hair on top
  // Eyes (on the -Z face).
  for (const ex of [-0.06, 0.06]) box(0.03, 0.04, 0.02, ex, 1.06, -0.122, dark);

  // Left arm resting down at the side.
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.1), shirt);
  leftArm.position.set(-0.24, 0.66, 0);
  leftArm.rotation.z = 0.12;
  group.add(leftArm);
  box(0.07, 0.08, 0.09, -0.27, 0.46, 0, skin); // left hand

  // Right arm raised in a wave: upper arm out-and-up, forearm up, open hand.
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.1), shirt);
  upper.position.set(0.27, 0.78, 0);
  upper.rotation.z = -0.95;
  group.add(upper);
  const fore = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.26, 0.09), skin);
  fore.position.set(0.42, 0.98, 0);
  fore.rotation.z = -0.2;
  group.add(fore);
  box(0.12, 0.12, 0.08, 0.47, 1.12, 0, skin); // waving hand

  return group;
}
