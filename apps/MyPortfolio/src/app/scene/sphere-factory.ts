import * as THREE from 'three/webgpu';
import { SPHERE_RADIUS } from './constants';

export function createPortfolioSphere(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2b4570,
    roughness: 0.6,
    metalness: 0.1,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.name = 'portfolio-sphere';
  return sphere;
}
