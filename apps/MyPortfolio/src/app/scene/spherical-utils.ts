import type { Vector3Like } from '../rooms/room.model';

// Where the viewer sits relative to the planet by default (matches the
// elevated 3/4 view in DEFAULT_CAMERA_TARGET). Single source of truth shared
// by `orientation.ts` (which way structures face) and the focus-camera math
// below (which side we view them from), so the two never disagree.
export const VIEWER_DIRECTION: Vector3Like = { x: 0, y: 0.5, z: 0.866 };

function length(v: Vector3Like): number {
  return Math.hypot(v.x, v.y, v.z);
}

function normalize(v: Vector3Like): Vector3Like {
  const l = length(v) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

function dot(a: Vector3Like, b: Vector3Like): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * The surface-tangent direction a structure standing at `position` faces -
 * the tangential component of {@link VIEWER_DIRECTION}. Falls back to an
 * arbitrary tangent at the poles, where the hint is parallel to the normal.
 */
export function surfaceFront(position: Vector3Like): Vector3Like {
  const n = normalize(position);
  const d = dot(VIEWER_DIRECTION, n);
  let f: Vector3Like = {
    x: VIEWER_DIRECTION.x - d * n.x,
    y: VIEWER_DIRECTION.y - d * n.y,
    z: VIEWER_DIRECTION.z - d * n.z,
  };
  if (length(f) < 1e-3) {
    f = { x: 1 - n.x * n.x, y: -n.x * n.y, z: -n.x * n.z };
  }
  return normalize(f);
}

export function sphericalToCartesian(
  radius: number,
  latitudeDeg: number,
  longitudeDeg: number
): Vector3Like {
  const lat = (latitudeDeg * Math.PI) / 180;
  const lon = (longitudeDeg * Math.PI) / 180;
  return {
    x: radius * Math.cos(lat) * Math.cos(lon),
    y: radius * Math.sin(lat),
    z: radius * Math.cos(lat) * Math.sin(lon),
  };
}

/** Moves a point that lies on a sphere of `fromRadius` to the sphere of `toRadius`, keeping its direction from the origin. */
export function scaleAlongDirection(
  point: Vector3Like,
  fromRadius: number,
  toRadius: number
): Vector3Like {
  const scale = toRadius / fromRadius;
  return { x: point.x * scale, y: point.y * scale, z: point.z * scale };
}
