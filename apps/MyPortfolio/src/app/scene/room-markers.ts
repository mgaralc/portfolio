import * as THREE from 'three/webgpu';
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/addons/renderers/CSS2DRenderer.js';
import type { Room } from '../rooms/room.model';

/** Injects the hover/transition rules for marker pills once per document. */
function ensureMarkerStyles(): void {
  if (document.getElementById('planet-marker-styles')) return;
  const style = document.createElement('style');
  style.id = 'planet-marker-styles';
  style.textContent = `
    .planet-marker {
      transition: transform 0.18s ease, background 0.18s ease,
        border-color 0.18s ease, box-shadow 0.18s ease;
    }
    .planet-marker:hover {
      transform: scale(1.08);
      background: rgba(16, 22, 44, 0.92) !important;
      border-color: rgba(255, 255, 255, 0.55) !important;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
    }
  `;
  document.head.appendChild(style);
}

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
    ensureMarkerStyles();
    for (const room of this.rooms) {
      const element = this.createMarkerCard(room);
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

  /**
   * Hides a single room's marker card (used while that zone is open, so its
   * label doesn't float over the focused structure) and shows the rest. Pass
   * null to show every marker again. Toggling `CSS2DObject.visible` is enough:
   * CSS2DRenderer re-applies each marker's `display` from its visibility every
   * frame, and the back-face culling in `render()` still works on top of it.
   */
  setHiddenRoom(roomId: string | null): void {
    for (const [id, marker] of this.markers) {
      marker.visible = id !== roomId;
    }
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

  private createMarkerCard(room: Room): HTMLDivElement {
    // Compact pill: just the icon + title so it doesn't cover the zone. The
    // full details show in the overlay once the zone is opened.
    const accent = '#' + room.color.toString(16).padStart(6, '0');

    // Outer wrapper is the element CSS2DRenderer drives: it rewrites this node's
    // `transform: translate(x, y)` every frame to keep the label glued to its
    // zone. It must carry NO transition, or the browser animates each per-frame
    // reposition and the label visibly trails the planet as it rotates (obvious
    // at high frame rates, hidden at low ones). The hover/scale animation lives
    // on the inner button instead, so positioning and styling never fight over
    // the same `transform`.
    const wrapper = document.createElement('div');
    wrapper.style.pointerEvents = 'none';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'planet-marker';
    button.setAttribute('aria-label', room.title);
    Object.assign(button.style, {
      pointerEvents: 'auto',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      whiteSpace: 'nowrap',
      padding: '0.28rem 0.7rem 0.28rem 0.3rem',
      borderRadius: '999px',
      border: '1px solid rgba(255, 255, 255, 0.22)',
      background: 'rgba(10, 14, 30, 0.72)',
      color: '#fff',
      font: '600 0.8rem system-ui, sans-serif',
      backdropFilter: 'blur(6px)',
    });

    // Icon sits in an accent-colored disc so each zone is recognisable at a
    // glance and the markers feel like part of the themed UI.
    const icon = document.createElement('span');
    icon.textContent = room.icon;
    Object.assign(icon.style, {
      flexShrink: '0',
      width: '1.5rem',
      height: '1.5rem',
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      fontSize: '0.9rem',
      background: accent + '33',
      border: `1px solid ${accent}aa`,
      boxShadow: `0 0 10px ${accent}66`,
    });

    const title = document.createElement('span');
    title.textContent = room.title;

    button.append(icon, title);
    wrapper.appendChild(button);
    return wrapper;
  }

  dispose(): void {
    for (const marker of this.markers.values()) {
      marker.removeFromParent();
    }
    this.markers.clear();
    this.domElement.remove();
  }
}
