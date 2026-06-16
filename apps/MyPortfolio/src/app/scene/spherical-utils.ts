import type { Vector3Like } from '../rooms/room.model';

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
