import * as THREE from 'three/webgpu';
import { boxAdder, createBase } from '../mesh-builders';

// Local z grows toward the planet's core - the camera approaches from
// negative z, so anything that should read as "front facing" needs z <= 0.
//
// A proper little school campus: a two-storey main building flanked by two
// lower wings, a central clock tower with a flag, window grids, and an entrance
// with steps - so the zone reads clearly as a real school, not a single house.
export function createEducationStructure(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'structure-education';

  const wall = new THREE.MeshStandardMaterial({
    color: 0xf0e6d2,
    roughness: 0.8,
    flatShading: true,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.7,
    flatShading: true,
  });
  const window = new THREE.MeshStandardMaterial({
    color: 0x9fd8ff,
    emissive: 0x6fb6e0,
    emissiveIntensity: 0.5,
    roughness: 0.4,
    flatShading: true,
  });

  group.add(createBase(1.55));

  const addBox = boxAdder(group);

  // Rows x cols of lit windows on a front (-Z) facade.
  const addWindows = (
    cols: number,
    rows: number,
    spanX: number,
    baseY: number,
    stepY: number,
    z: number
  ): void => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = cols === 1 ? 0 : -spanX / 2 + (spanX / (cols - 1)) * c;
        addBox(0.16, 0.2, 0.02, x, baseY + r * stepY, z, window);
      }
    }
  };

  // Main two-storey building.
  addBox(1.6, 1.05, 0.95, 0, 0.625, -0.1, wall);
  addBox(1.7, 0.12, 1.05, 0, 1.2, -0.1, trim); // flat roof slab / cornice
  addWindows(4, 2, 1.1, 0.55, 0.4, -0.59);

  // Two lower side wings.
  for (const sx of [-1.15, 1.15]) {
    addBox(0.8, 0.7, 0.8, sx, 0.5, -0.05, wall);
    addBox(0.88, 0.1, 0.88, sx, 0.9, -0.05, trim);
    // windows on each wing's own front face
    for (const wc of [-0.18, 0.18]) {
      addBox(0.14, 0.18, 0.02, sx + wc, 0.52, -0.46, window);
    }
  }

  // Central clock tower.
  addBox(0.5, 1.7, 0.5, 0, 0.85, -0.18, wall);
  const towerRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.4, 4),
    trim
  );
  towerRoof.position.set(0, 1.9, -0.18);
  towerRoof.rotation.y = Math.PI / 4;
  group.add(towerRoof);

  const clock = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  clock.position.set(0, 1.5, -0.44);
  clock.rotation.y = Math.PI;
  group.add(clock);

  // Flag on top of the tower.
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xcfd3da, roughness: 0.6 })
  );
  pole.position.set(0, 2.35, -0.18);
  group.add(pole);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.18),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.6,
      side: THREE.DoubleSide,
    })
  );
  flag.position.set(0.15, 2.5, -0.18);
  group.add(flag);

  // Entrance: door + steps at the foot of the tower.
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.7 })
  );
  door.position.set(0, 0.34, -0.44);
  door.rotation.y = Math.PI;
  group.add(door);
  addBox(0.6, 0.08, 0.12, 0, 0.11, -0.5, wall);
  addBox(0.45, 0.08, 0.1, 0, 0.18, -0.46, wall);

  return group;
}
