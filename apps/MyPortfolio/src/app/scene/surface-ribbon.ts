import * as THREE from 'three/webgpu';
import { SPHERE_RADIUS } from './constants';
import { sphericalToCartesian } from './spherical-utils';

export interface RibbonOptions {
  halfWidth: number;
  lift: number;
  color: number;
  roughness?: number;
  metalness?: number;
  samples?: number;
}

const _ray = new THREE.Raycaster();
const _origin = new THREE.Vector3(0, 0, 0);

// Drop a unit direction onto the actual faceted terrain (raycast from the core
// outward), returning the world point lifted slightly above the surface.
function onSurface(island: THREE.Mesh, dir: THREE.Vector3, lift: number): THREE.Vector3 {
  _ray.set(_origin, dir);
  const hit = _ray.intersectObject(island, false)[0];
  const r = (hit ? hit.distance : SPHERE_RADIUS) + lift;
  return dir.clone().multiplyScalar(r);
}

/**
 * A flat low-poly ribbon (river, road, path...) draped along a list of lat/lon
 * waypoints and conformed to the terrain. Shared by the river and the roads.
 */
export function createSurfaceRibbon(
  island: THREE.Mesh,
  waypoints: { lat: number; lon: number }[],
  opts: RibbonOptions
): THREE.Mesh {
  const samples = opts.samples ?? 140;
  const controls = waypoints.map(({ lat, lon }) => {
    const p = sphericalToCartesian(SPHERE_RADIUS, lat, lon);
    return new THREE.Vector3(p.x, p.y, p.z);
  });
  const points = new THREE.CatmullRomCurve3(controls).getPoints(samples);

  const normal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const positions: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < points.length; i++) {
    normal.copy(points[i]).normalize();
    const prev = points[Math.max(i - 1, 0)];
    const next = points[Math.min(i + 1, points.length - 1)];
    tangent.copy(next).sub(prev).normalize();
    binormal.copy(normal).cross(tangent).normalize();

    const center = onSurface(island, normal, opts.lift);
    const left = center.clone().addScaledVector(binormal, opts.halfWidth);
    const right = center.clone().addScaledVector(binormal, -opts.halfWidth);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    // u across the ribbon (0|1), v along its length - lets water scroll flow.
    const v = i / (points.length - 1);
    uvs.push(0, v, 1, v);
  }

  const indices: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: opts.color,
      roughness: opts.roughness ?? 0.6,
      metalness: opts.metalness ?? 0.05,
      flatShading: true,
      side: THREE.DoubleSide,
    })
  );
  return mesh;
}

export interface LakeOptions {
  /** Angular radius of the lake, in degrees. */
  radiusDeg: number;
  lift: number;
  color: number;
  segments?: number;
}

/**
 * A low-poly lake: an irregular water disc draped onto the terrain around a
 * lat/lon center.
 */
export function createLake(
  island: THREE.Mesh,
  lat: number,
  lon: number,
  opts: LakeOptions
): THREE.Mesh {
  const segments = opts.segments ?? 14;
  const c = sphericalToCartesian(SPHERE_RADIUS, lat, lon);
  const center = new THREE.Vector3(c.x, c.y, c.z).normalize();

  // Build a tangent basis around the center direction.
  const ref = Math.abs(center.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const t1 = new THREE.Vector3().crossVectors(center, ref).normalize();
  const t2 = new THREE.Vector3().crossVectors(center, t1).normalize();

  const positions: number[] = [];
  const uvs: number[] = [];
  const centerPt = onSurface(island, center, opts.lift);
  positions.push(centerPt.x, centerPt.y, centerPt.z);
  uvs.push(0.5, 0.5);

  const dir = new THREE.Vector3();
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    // Slight per-vertex radius jitter for an organic, low-poly shoreline.
    const rad = ((opts.radiusDeg * (0.8 + 0.2 * Math.sin(a * 3))) * Math.PI) / 180;
    dir
      .copy(center)
      .multiplyScalar(Math.cos(rad))
      .addScaledVector(t1, Math.sin(rad) * Math.cos(a))
      .addScaledVector(t2, Math.sin(rad) * Math.sin(a))
      .normalize();
    const p = onSurface(island, dir, opts.lift);
    positions.push(p.x, p.y, p.z);
    uvs.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
  }

  const indices: number[] = [];
  for (let i = 1; i <= segments; i++) {
    const next = i === segments ? 1 : i + 1;
    indices.push(0, i, next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: opts.color,
      roughness: 0.25,
      metalness: 0.2,
      flatShading: true,
      side: THREE.DoubleSide,
    })
  );
  mesh.name = 'lake';
  return mesh;
}
