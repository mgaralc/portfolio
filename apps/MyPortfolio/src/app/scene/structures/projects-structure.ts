import * as THREE from 'three/webgpu';
import { boxAdder, createBase } from '../mesh-builders';

// Local z grows toward the planet's core - the camera approaches from
// negative z, so anything that should read as "front facing" needs z <= 0.
//
// A maker's workshop: a building with a big glowing screen, spinning-look gears
// on the wall, a side launch gantry and a rooftop dish - ideas turning into
// things that ship.
export function createProjectsStructure(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'structure-projects';

  const wall = new THREE.MeshStandardMaterial({
    color: 0xd7d2c8,
    roughness: 0.75,
    flatShading: true,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x9aa1aa,
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });

  group.add(createBase(1.15));

  const addBox = boxAdder(group);

  // A toothed gear (disc + teeth) standing in the X/Y plane.
  const addGear = (cx: number, cy: number, r: number): void => {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 0.06, 12),
      metal
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.set(cx, cy, -0.5);
    group.add(disc);
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.06),
        metal
      );
      tooth.position.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, -0.5);
      tooth.rotation.z = a;
      group.add(tooth);
    }
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.08, 8),
      screenMat
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(cx, cy, -0.5);
    group.add(hub);
  };

  // Workshop building + roof.
  addBox(1.1, 1.0, 0.85, 0, 0.65, -0.1, wall);
  addBox(1.18, 0.1, 0.92, 0, 1.18, -0.1, metal);

  // Big screen on the front and gears beside it.
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.42), screenMat);
  screen.position.set(-0.18, 0.75, -0.53);
  screen.rotation.y = Math.PI;
  group.add(screen);
  addGear(0.32, 0.85, 0.13);
  addGear(0.32, 0.55, 0.09);

  // Door.
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x5c5650, roughness: 0.7 })
  );
  door.position.set(-0.18, 0.32, -0.53);
  door.rotation.y = Math.PI;
  group.add(door);

  // Side launch gantry: a thin tower frame with cross-braces.
  for (const gx of [0.78, 1.02]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.5, 5),
      metal
    );
    leg.position.set(gx, 0.9, -0.05);
    group.add(leg);
  }
  for (const gy of [0.5, 0.9, 1.3]) {
    addBox(0.26, 0.03, 0.03, 0.9, gy, -0.05, metal);
  }

  // Rooftop dish.
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    metal
  );
  dish.position.set(-0.25, 1.35, -0.1);
  dish.rotation.set(Math.PI * 0.6, 0, -0.3);
  group.add(dish);

  return group;
}
