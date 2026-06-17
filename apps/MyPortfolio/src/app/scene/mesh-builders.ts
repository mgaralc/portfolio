import * as THREE from 'three/webgpu';

/**
 * Returns an `addBox(w, h, d, x, y, z, material)` that builds a positioned box
 * mesh and adds it to `group`. The zone structures and the detail props are all
 * assembled from positioned boxes, so they share this one builder instead of
 * each re-declaring the same closure.
 */
export function boxAdder(
  group: THREE.Group
): (
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material
) => void {
  return (width, height, depth, x, y, z, material) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
}

/**
 * The dark plinth disc each zone structure stands on (radius varies per zone;
 * a couple of zones use a slightly darker `color`). Returns the mesh ready to
 * add to the structure group.
 */
export function createBase(radius: number, color = 0x4a4f5c): THREE.Mesh {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.15, 18),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true })
  );
  base.position.set(0, 0.075, 0);
  return base;
}
