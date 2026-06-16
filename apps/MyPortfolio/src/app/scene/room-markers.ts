import * as THREE from 'three/webgpu';
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/addons/renderers/CSS2DRenderer.js';
import type { Room } from '../rooms/room.model';

/**
 * Renders one clickable HTML marker per room on top of the WebGPU/WebGL canvas,
 * using CSS2DRenderer (real DOM nodes -> reliable clicks + free accessibility).
 */
export class RoomMarkerLayer {
  readonly domElement: HTMLElement;
  private readonly renderer = new CSS2DRenderer();
  private readonly markers = new Map<string, CSS2DObject>();
  private readonly toCamera = new THREE.Vector3();

  constructor(
    private readonly rooms: Room[],
    private readonly onSelect: (room: Room) => void
  ) {
    this.domElement = this.renderer.domElement;
    Object.assign(this.domElement.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '1',
      pointerEvents: 'none',
    });
  }

  mountInto(scene: THREE.Scene): void {
    for (const room of this.rooms) {
      const element = document.createElement('button');
      element.type = 'button';
      element.textContent = room.shortLabel;
      element.setAttribute('aria-label', room.title);
      Object.assign(element.style, {
        pointerEvents: 'auto',
        cursor: 'pointer',
        padding: '0.4rem 0.9rem',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        background: 'rgba(10, 14, 30, 0.65)',
        color: '#fff',
        font: '500 0.8rem system-ui, sans-serif',
        whiteSpace: 'nowrap',
      });
      element.addEventListener('click', () => this.onSelect(room));

      const marker = new CSS2DObject(element);
      marker.position.set(
        room.markerPosition.x,
        room.markerPosition.y,
        room.markerPosition.z
      );
      this.markers.set(room.id, marker);
      scene.add(marker);
    }
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /** Must be called after the main renderer's `render()` for the same frame. */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);

    for (const marker of this.markers.values()) {
      if (marker.element.style.display === 'none') continue;

      this.toCamera.copy(camera.position).sub(marker.position);
      const facingCamera = marker.position.dot(this.toCamera) > 0;
      if (!facingCamera) {
        marker.element.style.display = 'none';
      }
    }
  }

  dispose(): void {
    for (const marker of this.markers.values()) {
      marker.removeFromParent();
    }
    this.markers.clear();
    this.domElement.remove();
  }
}
