import * as THREE from 'three/webgpu';
import type { Vector3Like } from '../rooms/room.model';
import { VIEWER_DIRECTION } from './spherical-utils';

const _up = new THREE.Vector3();
const _front = new THREE.Vector3();
const _x = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();

// Where the viewer sits relative to the planet by default (matches the
// elevated 3/4 view in DEFAULT_CAMERA_TARGET). Structures present their front
// (local -Z) toward this direction so doors/flags/screens face the camera
// instead of a random tangent.
const VIEWER_DIR = new THREE.Vector3(
  VIEWER_DIRECTION.x,
  VIEWER_DIRECTION.y,
  VIEWER_DIRECTION.z
);

/**
 * Orients `object` so its local +Y is `up` and its front (local -Z) points as
 * close to `frontHint` as the up axis allows (the hint is projected onto the
 * plane perpendicular to `up`), then places it at `position`. Shared core of
 * {@link orientToSurface} and {@link orientToFaceCamera}; `up` and `frontHint`
 * need not be unit length or orthogonal.
 */
function orientWithBasis(
  object: THREE.Object3D,
  position: Vector3Like,
  up: Vector3Like,
  frontHint: Vector3Like
): void {
  _up.set(up.x, up.y, up.z).normalize();

  // Tangential component of the facing hint; fall back to an arbitrary tangent
  // when the hint is (anti)parallel to the up axis (e.g. the poles).
  _front
    .set(frontHint.x, frontHint.y, frontHint.z)
    .addScaledVector(_up, -(_front.x * _up.x + _front.y * _up.y + _front.z * _up.z));
  if (_front.lengthSq() < 1e-6) {
    _front.set(0, 1, 0).addScaledVector(_up, -_up.y);
    if (_front.lengthSq() < 1e-6) _front.set(1, 0, 0);
  }
  _front.normalize();

  // Front is local -Z, so local +Z points opposite it. Build an orthonormal
  // right-handed basis (x = up × z, then re-derive z to stay orthogonal).
  _z.copy(_front).multiplyScalar(-1);
  _x.crossVectors(_up, _z).normalize();
  _z.crossVectors(_x, _up).normalize();

  _m.makeBasis(_x, _up, _z);
  object.quaternion.setFromRotationMatrix(_m);
  object.position.set(position.x, position.y, position.z);
}

/**
 * Plants `object` on the planet's surface as if gravity pulled it down: its
 * local +Y axis points radially outward (away from the core) so it stands
 * upright on the curved ground, and its front (local -Z) faces, as much as
 * the surface allows, toward the viewer.
 *
 * Replaces the previous `Object3D.lookAt(0,0,0)` approach, which made local
 * +Y tangent to the surface (so anything growing along +Y tipped over toward
 * the pole). Use this for every object that should "stand" on the planet.
 */
export function orientToSurface(
  object: THREE.Object3D,
  position: Vector3Like,
  faceHint: THREE.Vector3 = VIEWER_DIR
): void {
  // Up is the surface normal (radially outward), so the object stands upright.
  orientWithBasis(object, position, position, faceHint);
}

/**
 * Plants `object` on the surface like {@link orientToSurface}, but instead of
 * facing a fixed tangent it turns its front (local -Z) toward `cameraPos` while
 * keeping its up axis aligned with `up` (the focus camera's up = the zone's
 * normal). This keeps foreground signs reading head-on and upright on screen in
 * every zone - including the equatorial ones, where a purely radial "up" would
 * lay a sign down flat relative to the elevated focus camera.
 */
export function orientToFaceCamera(
  object: THREE.Object3D,
  position: Vector3Like,
  cameraPos: Vector3Like,
  up: Vector3Like
): void {
  const frontHint = {
    x: cameraPos.x - position.x,
    y: cameraPos.y - position.y,
    z: cameraPos.z - position.z,
  };
  orientWithBasis(object, position, up, frontHint);
}
