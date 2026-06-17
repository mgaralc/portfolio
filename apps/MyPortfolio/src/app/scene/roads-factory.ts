import * as THREE from 'three/webgpu';
import { createSurfaceRibbon } from './surface-ribbon';

// Two routes that visually connect zones and add life:
//  - an asphalt road up the lon ~270 meridian, linking Experiencia and
//    Tecnologías;
//  - a dirt path up the lon ~90 meridian, linking Estudios and Sobre mí.
// Both stop a little short of each structure so they read as leading up to it.
const ROAD = [
  { lat: 40, lon: 268 },
  { lat: 22, lon: 274 },
  { lat: 2, lon: 267 },
  { lat: -18, lon: 274 },
  { lat: -40, lon: 268 },
];

const PATH = [
  { lat: 40, lon: 92 },
  { lat: 20, lon: 86 },
  { lat: 0, lon: 93 },
  { lat: -20, lon: 86 },
  { lat: -40, lon: 92 },
];

export function createRoads(island: THREE.Mesh): THREE.Group {
  const group = new THREE.Group();
  group.name = 'roads';

  const road = createSurfaceRibbon(island, ROAD, {
    halfWidth: 0.2,
    lift: 0.045,
    color: 0x4c5056,
    roughness: 0.8,
    samples: 120,
  });
  road.name = 'road';
  group.add(road);

  const path = createSurfaceRibbon(island, PATH, {
    halfWidth: 0.15,
    lift: 0.04,
    color: 0x9c7a4d,
    roughness: 0.95,
    samples: 120,
  });
  path.name = 'path';
  group.add(path);

  return group;
}
