import * as THREE from 'three/webgpu';
import { boxAdder, createBase } from '../mesh-builders';

// Local z grows toward the planet's core - the camera approaches from
// negative z, so anything that should read as "front facing" needs z <= 0.
//
// A cyber/tech lab: a dark control building with a wall of code screens, a
// server tower, a rooftop antenna array and a glowing security "shield".
export function createTechMuseumStructure(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'structure-tech-museum';

  const shell = new THREE.MeshStandardMaterial({
    color: 0x2a3038,
    roughness: 0.6,
    metalness: 0.3,
    flatShading: true,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xb9c0c9,
    roughness: 0.4,
    metalness: 0.5,
    flatShading: true,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x35e08a,
    emissive: 0x22c46e,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  group.add(createBase(1.15, 0x44484f));

  const addBox = boxAdder(group);

  // Control building + accent cornice.
  addBox(1.35, 1.0, 0.9, 0, 0.65, -0.1, shell);
  addBox(1.45, 0.1, 1.0, 0, 1.18, -0.1, new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.6,
    flatShading: true,
  }));

  // Big code screen + a grid of small monitors on the front (-Z) wall.
  const bigScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), screenMat);
  bigScreen.position.set(-0.3, 0.75, -0.56);
  bigScreen.rotation.y = Math.PI;
  group.add(bigScreen);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.13), screenMat);
      m.position.set(0.25 + c * 0.24, 0.55 + r * 0.22, -0.56);
      m.rotation.y = Math.PI;
      group.add(m);
    }
  }

  // Glowing security shield above the entrance.
  const shield = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.16, 0),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.7,
      roughness: 0.4,
      flatShading: true,
    })
  );
  shield.position.set(0, 1.05, -0.5);
  shield.scale.set(1, 1.2, 0.4);
  group.add(shield);

  // Server tower beside the building, with lit rack stripes.
  addBox(0.34, 1.3, 0.34, 0.85, 0.8, -0.05, shell);
  for (let i = 0; i < 4; i++) {
    addBox(0.3, 0.04, 0.01, 0.85, 0.45 + i * 0.18, -0.23, screenMat);
  }

  // Rooftop antenna array + a small dish.
  for (const ax of [-0.4, 0, 0.35]) {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.4 + Math.abs(ax), 5),
      metal
    );
    mast.position.set(ax, 1.4 + (0.4 + Math.abs(ax)) / 2, -0.1);
    group.add(mast);
  }
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    metal
  );
  dish.position.set(-0.45, 1.45, -0.1);
  dish.rotation.set(Math.PI * 0.62, 0, 0.3);
  group.add(dish);

  return group;
}
