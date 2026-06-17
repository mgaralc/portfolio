import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { easeInOutCubic } from './easing';
import type { RoomCameraTarget } from '../rooms/room.model';

const FLIGHT_DURATION_SECONDS = 1.2;

/**
 * Animates the camera position/target between the free orbit view and a room's
 * focused viewpoint. `controls.target` is kept in sync on every step (not just
 * at the end) so OrbitControls doesn't "snap" when it's re-enabled.
 */
export class CameraController {
  private animating = false;
  private elapsed = 0;
  private restoreControlsOnDone = false;
  private onDone: (() => void) | null = null;
  private readonly fromPosition = new THREE.Vector3();
  private readonly toPosition = new THREE.Vector3();
  private readonly fromTarget = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly fromUp = new THREE.Vector3();
  private readonly toUp = new THREE.Vector3();

  get isAnimating(): boolean {
    return this.animating;
  }

  flyTo(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    target: RoomCameraTarget,
    onDone?: () => void,
    restoreControlsOnDone = false
  ): void {
    controls.enabled = false;
    this.fromPosition.copy(camera.position);
    this.toPosition.set(
      target.position.x,
      target.position.y,
      target.position.z
    );
    this.fromTarget.copy(controls.target);
    this.toTarget.set(target.lookAt.x, target.lookAt.y, target.lookAt.z);
    this.fromUp.copy(camera.up);
    if (target.up) {
      this.toUp.set(target.up.x, target.up.y, target.up.z).normalize();
    } else {
      this.toUp.set(0, 1, 0);
    }
    this.elapsed = 0;
    this.animating = true;
    this.onDone = onDone ?? null;
    this.restoreControlsOnDone = restoreControlsOnDone;
  }

  /** Advances the in-flight tween, if any. Does not call `controls.update()` itself. */
  update(
    deltaSeconds: number,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls
  ): void {
    if (!this.animating) return;

    this.elapsed += deltaSeconds;
    const t = Math.min(this.elapsed / FLIGHT_DURATION_SECONDS, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(this.fromPosition, this.toPosition, eased);
    controls.target.lerpVectors(this.fromTarget, this.toTarget, eased);
    // Roll the camera so its up tracks the focused zone's surface normal,
    // keeping the structure upright on screen (and back to world up on return).
    camera.up.lerpVectors(this.fromUp, this.toUp, eased).normalize();

    if (t >= 1) {
      this.animating = false;
      if (this.restoreControlsOnDone) {
        controls.enabled = true;
      }
      const onDone = this.onDone;
      this.onDone = null;
      onDone?.();
    }
  }
}
