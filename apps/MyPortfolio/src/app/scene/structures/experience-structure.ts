import * as THREE from 'three/webgpu';
import { boxAdder, createBase } from '../mesh-builders';

// Local z grows toward the planet's core - the camera approaches from
// negative z, so anything that should read as "front facing" needs z <= 0.
//
// A small corporate HQ: a glass office tower with window grids, two flanking
// office blocks, an entrance canopy and a rooftop antenna with a lit logo.
export function createExperienceStructure(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'structure-experience';

  const glass = new THREE.MeshStandardMaterial({
    color: 0x7d93a8,
    roughness: 0.35,
    metalness: 0.4,
    flatShading: true,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xc3ccd6,
    roughness: 0.8,
    flatShading: true,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xbfe6ff,
    emissive: 0x7fb4e0,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    flatShading: true,
  });

  group.add(createBase(1.35, 0x44484f));

  const addBox = boxAdder(group);

  // Rows of lit windows down a building's -Z facade.
  const addWindows = (
    cx: number,
    cols: number,
    rows: number,
    spanX: number,
    baseY: number,
    topY: number,
    z: number
  ): void => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = cols === 1 ? cx : cx - spanX / 2 + (spanX / (cols - 1)) * c;
        const y = rows === 1 ? baseY : baseY + ((topY - baseY) / (rows - 1)) * r;
        addBox(0.12, 0.16, 0.02, x, y, z, windowMat);
      }
    }
  };

  // Main glass tower.
  addBox(0.95, 2.0, 0.8, 0, 1.15, -0.15, glass);
  addWindows(0, 3, 6, 0.6, 0.45, 1.95, -0.56);
  // Lit accent logo near the top.
  addBox(0.4, 0.18, 0.02, 0, 1.9, -0.56, new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.8,
    roughness: 0.4,
  }));

  // Flanking office blocks.
  addBox(0.7, 1.15, 0.7, 0.85, 0.725, -0.05, concrete);
  addWindows(0.85, 2, 3, 0.4, 0.5, 1.1, -0.41);
  addBox(0.6, 0.85, 0.6, -0.8, 0.575, -0.1, concrete);
  addWindows(-0.8, 2, 2, 0.34, 0.5, 0.85, -0.41);

  // Entrance canopy + doors at the tower foot.
  addBox(0.7, 0.06, 0.3, 0, 0.55, -0.62, concrete);
  const doors = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.4),
    new THREE.MeshStandardMaterial({
      color: 0x2c3440,
      roughness: 0.3,
      metalness: 0.3,
    })
  );
  doors.position.set(0, 0.35, -0.56);
  doors.rotation.y = Math.PI;
  group.add(doors);

  // Rooftop antenna.
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5),
    concrete
  );
  antenna.position.set(0.25, 2.4, -0.15);
  group.add(antenna);
  const beacon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.05, 0),
    new THREE.MeshStandardMaterial({
      color: 0xff5a5a,
      emissive: 0xff3a3a,
      emissiveIntensity: 0.9,
    })
  );
  beacon.position.set(0.25, 2.66, -0.15);
  group.add(beacon);

  return group;
}
