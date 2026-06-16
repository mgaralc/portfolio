import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRenderer } from './renderer-factory';
import { createPortfolioSphere } from './sphere-factory';
import { CameraController } from './camera-controller';
import { RoomMarkerLayer } from './room-markers';
import { DEFAULT_CAMERA_TARGET } from './constants';
import type { Room } from '../rooms/room.model';

export interface SceneEngineCallbacks {
  onRoomSelected: (room: Room) => void;
  onOrbitRestored: () => void;
}

export class SceneEngine {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  private readonly cameraController = new CameraController();
  private readonly markerLayer: RoomMarkerLayer;
  private readonly handleResize = () => this.resize();
  private renderer: THREE.WebGPURenderer | null = null;
  private controls: OrbitControls | null = null;
  private lastTimestamp = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    rooms: Room[],
    private readonly callbacks: SceneEngineCallbacks
  ) {
    this.markerLayer = new RoomMarkerLayer(rooms, (room) =>
      this.focusRoom(room)
    );
  }

  async init(forceWebGL = false): Promise<void> {
    this.scene.background = new THREE.Color(0x05070f);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(5, 10, 7);
    this.scene.add(ambient, directional);
    this.scene.add(createPortfolioSphere());
    this.markerLayer.mountInto(this.scene);

    const { position, lookAt } = DEFAULT_CAMERA_TARGET;
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    this.renderer = await createRenderer(this.canvas, { forceWebGL });

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 18;
    this.controls.target.set(lookAt.x, lookAt.y, lookAt.z);
    this.controls.update();

    this.canvas.parentElement?.appendChild(this.markerLayer.domElement);

    window.addEventListener('resize', this.handleResize);
    this.resize();

    void this.renderer.setAnimationLoop((timestamp) =>
      this.renderFrame(timestamp)
    );
  }

  returnToOrbit(): void {
    if (!this.controls) return;
    this.cameraController.flyTo(
      this.camera,
      this.controls,
      DEFAULT_CAMERA_TARGET,
      () => this.callbacks.onOrbitRestored(),
      true
    );
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.renderer?.setAnimationLoop(null);
    this.controls?.dispose();
    this.markerLayer.dispose();

    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    });

    this.renderer?.dispose();
  }

  private focusRoom(room: Room): void {
    if (!this.controls) return;
    this.cameraController.flyTo(this.camera, this.controls, room.cameraTarget, () =>
      this.callbacks.onRoomSelected(room)
    );
  }

  private resize(): void {
    if (!this.renderer) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.markerLayer.setSize(width, height);
  }

  private renderFrame(timestamp: number): void {
    if (!this.renderer || !this.controls) return;

    const deltaSeconds = this.lastTimestamp
      ? (timestamp - this.lastTimestamp) / 1000
      : 0;
    this.lastTimestamp = timestamp;

    this.cameraController.update(deltaSeconds, this.camera, this.controls);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
    this.markerLayer.render(this.scene, this.camera);
  }
}
