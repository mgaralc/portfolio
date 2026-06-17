import * as THREE from 'three/webgpu';
import { createSurfaceRibbon } from './surface-ribbon';

// A meandering river snaking down a relatively empty lon band (~20-40°, clear
// of the structures at lon 0/90/180/270), draped onto the faceted terrain.
const WAYPOINTS = [
  { lat: 78, lon: 30 },
  { lat: 60, lon: 40 },
  { lat: 42, lon: 26 },
  { lat: 22, lon: 38 },
  { lat: 2, lon: 24 },
  { lat: -18, lon: 38 },
  { lat: -40, lon: 26 },
  { lat: -60, lon: 40 },
  { lat: -78, lon: 30 },
];

export function createRiver(island: THREE.Mesh): THREE.Mesh {
  const river = createSurfaceRibbon(island, WAYPOINTS, {
    halfWidth: 0.22,
    lift: 0.04,
    color: 0x3aa6d8,
    roughness: 0.3,
    metalness: 0.15,
    samples: 160,
  });
  river.name = 'river';
  return river;
}
