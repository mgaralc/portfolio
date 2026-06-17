import * as THREE from 'three/webgpu';
import { boxAdder, createBase } from '../mesh-builders';

// Local z grows toward the planet's core - the camera approaches from
// negative z, so anything that should read as "front facing" needs z <= 0.
//
// A communications station: a small office with a glowing signal beacon tower,
// a satellite dish, an antenna mast and warm-lit windows.
export function createContactStructure(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'structure-contact';

  const wall = new THREE.MeshStandardMaterial({
    color: 0xe8e4da,
    roughness: 0.75,
    flatShading: true,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xb9c0c9,
    roughness: 0.45,
    metalness: 0.45,
    flatShading: true,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.8,
    roughness: 0.4,
    flatShading: true,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffe9a8,
    emissive: 0xffcf6b,
    emissiveIntensity: 0.5,
    roughness: 0.4,
  });

  group.add(createBase(1.05));

  const addBox = boxAdder(group);

  // Station office + flat roof + warm windows + door.
  addBox(1.0, 0.6, 0.75, -0.15, 0.45, -0.1, wall);
  addBox(1.06, 0.08, 0.81, -0.15, 0.79, -0.1, metal);
  for (const wx of [-0.42, 0.12]) {
    addBox(0.18, 0.16, 0.02, wx, 0.5, -0.48, windowMat);
  }
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x5c5650, roughness: 0.7 })
  );
  door.position.set(-0.15, 0.31, -0.48);
  door.rotation.y = Math.PI;
  group.add(door);

  // Signal beacon tower on the right.
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.28, 1.2, 12),
    wall
  );
  tower.position.set(0.55, 0.75, -0.05);
  group.add(tower);
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.25, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0xc1543a, roughness: 0.7, flatShading: true })
  );
  stripe.position.set(0.55, 0.6, -0.05);
  group.add(stripe);
  const lampRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.26, 12),
    glow
  );
  lampRoom.position.set(0.55, 1.48, -0.05);
  group.add(lampRoom);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.24, 12),
    new THREE.MeshStandardMaterial({ color: 0xc1543a, roughness: 0.6, flatShading: true })
  );
  roof.position.set(0.55, 1.73, -0.05);
  group.add(roof);

  // Satellite dish on the office roof.
  const dishStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.2, 6),
    metal
  );
  dishStand.position.set(-0.45, 0.93, -0.1);
  group.add(dishStand);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    metal
  );
  dish.position.set(-0.45, 1.05, -0.1);
  dish.rotation.set(Math.PI * 0.62, 0, 0.4);
  group.add(dish);

  // Antenna mast with signal rings.
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5),
    metal
  );
  mast.position.set(0.05, 1.05, -0.1);
  group.add(mast);
  [0.18, 0.13, 0.08].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 12), glow);
    ring.position.set(0.05, 1.2 + i * 0.12, -0.1);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  });

  return group;
}
