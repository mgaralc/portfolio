import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createRenderer } from './renderer-factory';
import { createIsland } from './island-factory';
import {
  createAtmosphereGlow,
  createNebulae,
  createSpaceGradientTexture,
  createStarfield,
} from './space';
import {
  Animated,
  createFireflies,
  createOrbiters,
  createPlanetRing,
  createShootingStars,
  makeWaterAnimated,
} from './animated';
import { detectQuality } from './quality';
import { createRiver } from './river-factory';
import { createRoads } from './roads-factory';
import { createLake } from './surface-ribbon';
import { disposeModelTemplates, loadModel } from './model-loader';
import { createVegetationItem } from './decorations/vegetation';
import { CameraController } from './camera-controller';
import { RoomMarkerLayer } from './room-markers';
import {
  DEFAULT_CAMERA_TARGET,
  FOCUS_BACK_MOBILE,
  FOCUS_MIN_DISTANCE,
  FOCUS_UP_MOBILE,
  MOBILE_MAX_WIDTH,
  ORBIT_MIN_DISTANCE,
  ROOM_FOCUS_DISTANCE,
  SPHERE_RADIUS,
  STRUCTURE_LOOKAT_LIFT,
  STRUCTURE_SURFACE_OFFSET,
} from './constants';
import {
  scaleAlongDirection,
  sphericalToCartesian,
  surfaceFront,
} from './spherical-utils';
import { orientToFaceCamera, orientToSurface } from './orientation';
import { STRUCTURE_FACTORIES } from './structures';
import { buildZoneDetails } from './details/zone-details';
import { ZONE_DECORATIONS } from './decorations/zone-decorations';
import {
  MODELS_PATH,
  TREE_MODELS,
  ZONE_MODELS,
} from './decorations/zone-models';
import type { Room, RoomCameraTarget } from '../rooms/room.model';

export interface SceneEngineCallbacks {
  onRoomSelected: (room: Room) => void;
  onOrbitRestored: () => void;
}

/** Tiny deterministic PRNG so the scattered vegetation layout is stable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type GeometryBuckets = Map<THREE.Material, THREE.BufferGeometry[]>;

// Day/night key-light colors (a gentle warm<->cool drift; ambient + hemisphere
// fill stay constant so the scene never actually goes dark and unreadable).
const DAY_LIGHT = new THREE.Color(0xfff4e0);
const DUSK_LIGHT = new THREE.Color(0xffcaa0);

/**
 * Adds `mesh`'s geometry - with its current world transform baked in - to the
 * per-material bucket map, so many meshes sharing a material can later be merged
 * into a single draw call. Clones first (the source geometry may be a shared
 * pooled constant) and skips multi-material meshes (which can't be merged this
 * way). Caller must have updated the mesh's world matrix.
 */
function bakeMeshInto(mesh: THREE.Mesh, buckets: GeometryBuckets): void {
  if (Array.isArray(mesh.material)) return;
  const clone = mesh.geometry.clone();
  clone.applyMatrix4(mesh.matrixWorld);
  // Normalize every geometry to the same layout before bucketing: expand to
  // non-indexed and keep only position + normal. Otherwise unlike primitives
  // (differing in indexing or uv presence) make mergeGeometries fail and the
  // meshes get silently dropped. These materials are flat-shaded with no maps,
  // so uv/index aren't needed.
  const baked = clone.toNonIndexed();
  clone.dispose();
  for (const name of Object.keys(baked.attributes)) {
    if (name !== 'position' && name !== 'normal') baked.deleteAttribute(name);
  }
  const bucket = buckets.get(mesh.material);
  if (bucket) bucket.push(baked);
  else buckets.set(mesh.material, [baked]);
}

/** Collapses per-material geometry buckets into one merged mesh each. */
function mergeBuckets(buckets: GeometryBuckets): THREE.Group {
  const group = new THREE.Group();
  for (const [material, geometries] of buckets) {
    const merged = mergeGeometries(geometries);
    geometries.forEach((geometry) => geometry.dispose());
    if (merged) group.add(new THREE.Mesh(merged, material));
  }
  return group;
}

/**
 * Bakes every (single-material) mesh under a fully positioned `root` into one
 * merged mesh per material. Turns a ~20-box structure or decoration into a few
 * draw calls with no visual change. `root` must contain only meshes (no
 * points/lines/sprites), which all the structure and decoration factories do.
 */
function bakeMerged(root: THREE.Object3D): THREE.Group {
  root.updateMatrixWorld(true);
  const buckets: GeometryBuckets = new Map();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) bakeMeshInto(object, buckets);
  });
  return mergeBuckets(buckets);
}

export class SceneEngine {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 250);
  private readonly cameraController = new CameraController();
  private readonly markerLayer: RoomMarkerLayer;
  private readonly detailGroups = new Map<string, THREE.Group>();
  private readonly animated: Animated[] = [];
  private readonly quality = detectQuality();
  private readonly handleResize = () => this.resize();
  private renderer: THREE.WebGPURenderer | null = null;
  private controls: OrbitControls | null = null;
  private postProcessing: THREE.PostProcessing | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private lastTimestamp = 0;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly rooms: Room[],
    private readonly callbacks: SceneEngineCallbacks
  ) {
    this.markerLayer = new RoomMarkerLayer(rooms, (room) =>
      this.focusRoom(room)
    );
  }

  async init(forceWebGL = false): Promise<void> {
    // Deep-space backdrop: gradient sky + layered starfield + soft nebulae, with
    // an atmospheric rim glow hugging the planet's silhouette.
    this.scene.background = createSpaceGradientTexture();
    this.scene.add(createStarfield());
    this.scene.add(createNebulae());
    this.scene.add(createAtmosphereGlow(SPHERE_RADIUS));

    // Living cosmos: orbiting moon + satellite, a tilted particle ring, drifting
    // fireflies and the odd shooting star. Particle counts scale with the device
    // tier so phones stay smooth. Each registers an updater ticked every frame.
    for (const system of [
      createOrbiters(SPHERE_RADIUS),
      createPlanetRing(SPHERE_RADIUS, this.quality.ringParticles),
      createFireflies(SPHERE_RADIUS, this.quality.fireflies),
      createShootingStars(this.quality.shootingStars),
    ]) {
      this.scene.add(system.object);
      this.animated.push(system);
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    // Sky/ground hemisphere fill lifts the imported GLB models (which read
    // darker than the flat-shaded primitives) and gives the whole planet a
    // brighter, cheerier tone.
    const hemisphere = new THREE.HemisphereLight(0xbfe0ff, 0x8a7a55, 0.65);
    const directional = new THREE.DirectionalLight(0xffffff, 1.15);
    directional.position.set(5, 10, 7);
    this.directionalLight = directional;
    this.scene.add(ambient, hemisphere, directional);
    const island = createIsland();
    this.scene.add(island);
    this.scene.add(createRoads(island));

    // River + lake flow: a scrolling ripple normal map (GPU-side, cheap).
    const river = createRiver(island);
    const lake = createLake(island, -25, 205, { radiusDeg: 13, lift: 0.04, color: 0x3aa6d8 });
    this.scene.add(river, lake);
    this.animated.push(makeWaterAnimated(river, 0, 0.06, 2, 24));
    this.animated.push(makeWaterAnimated(lake, 0.015, 0.015, 3, 3));
    this.markerLayer.mountInto(this.scene);
    this.buildStructureAnchors();
    this.buildVegetation(island);
    this.buildZoneDecorations();
    this.buildZoneDetailLayer();
    // Imported GLB models load asynchronously; they pop in once ready without
    // blocking the first paint of the planet and its primitive decorations.
    void this.buildModels();

    const { position, lookAt } = DEFAULT_CAMERA_TARGET;
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    this.renderer = await createRenderer(this.canvas, {
      forceWebGL,
      pixelRatioCap: this.quality.pixelRatioCap,
      antialias: this.quality.antialias,
    });

    // Bloom post-processing only on the high tier (it's a full-screen pass);
    // guarded so any setup hiccup just falls back to a plain render.
    if (this.quality.bloom) this.setupPostProcessing();

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    // Gently spin the world while it sits idle in the orbit view, so it feels
    // alive; switched off whenever a zone is focused (see setFocusClamp callers).
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.minDistance = ORBIT_MIN_DISTANCE;
    this.controls.maxDistance = 24;
    // Wide enough to head-on view every room (rooms sit at lat ±45° and 0°,
    // which need polar angles of ~45°, ~90° and ~135° to face them directly)
    // while still stopping short of the poles, where azimuth becomes
    // meaningless and the view gets disorienting.
    this.controls.minPolarAngle = (20 * Math.PI) / 180;
    this.controls.maxPolarAngle = (160 * Math.PI) / 180;
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
    this.showZoneDetails(null);
    this.cameraController.flyTo(
      this.camera,
      this.controls,
      DEFAULT_CAMERA_TARGET,
      () => {
        // Re-tighten only once the camera is back out at orbit range.
        this.setFocusClamp(false);
        // Bring the zone's label back now that we've returned to the map.
        this.markerLayer.setHiddenRoom(null);
        this.callbacks.onOrbitRestored();
      },
      true
    );
  }

  /**
   * Single source of truth for the OrbitControls distance floor. While a zone is
   * focused the camera sits closer than ORBIT_MIN_DISTANCE, and OrbitControls
   * re-clamps the camera-to-target distance every frame (even with input
   * disabled), so the floor must be loosened for the whole focused interval -
   * see FOCUS_MIN_DISTANCE's comment in constants.ts.
   */
  private setFocusClamp(focused: boolean): void {
    if (!this.controls) return;
    this.controls.minDistance = focused ? FOCUS_MIN_DISTANCE : ORBIT_MIN_DISTANCE;
    // Only let the world idle-spin while in the free orbit view.
    this.controls.autoRotate = !focused;
  }

  dispose(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.renderer?.setAnimationLoop(null);
    this.postProcessing?.dispose();
    this.controls?.dispose();
    this.markerLayer.dispose();

    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => {
        (material as { map?: THREE.Texture | null }).map?.dispose();
        material.dispose();
      });
    });

    // Clones added above share their geometry/materials with the cached GLB
    // templates, so they're now freed; clear the cache so a future engine
    // reloads fresh instead of cloning disposed resources.
    disposeModelTemplates();

    this.renderer?.dispose();
  }

  /**
   * Sets up bloom post-processing (a soft glow on the brightest/emissive bits:
   * windows, screens, the satellite beacon, fireflies, stars). Wrapped in
   * try/catch so an unsupported backend or API mismatch never breaks rendering -
   * we just fall back to the plain renderer path in renderFrame.
   */
  private setupPostProcessing(): void {
    if (!this.renderer) return;
    try {
      const post = new THREE.PostProcessing(this.renderer);
      const scenePass = pass(this.scene, this.camera);
      // strength, radius, threshold - high threshold so only bright things bloom.
      const bloomPass = bloom(scenePass, 0.6, 0.5, 0.6);
      post.outputNode = scenePass.add(bloomPass);
      this.postProcessing = post;
    } catch (err) {
      console.warn('Bloom unavailable; rendering without post-processing.', err);
      this.postProcessing = null;
    }
  }

  private focusRoom(room: Room): void {
    if (!this.controls) return;
    // Loosen the floor before the flight starts, not just once it lands -
    // otherwise OrbitControls.update() clamps the camera back out to
    // ORBIT_MIN_DISTANCE on every frame the lerp is already below it.
    this.setFocusClamp(true);
    this.showZoneDetails(room.id);
    // Hide this zone's own floating label while we're inside it - it would
    // otherwise sit in the middle of the focused view over the structure.
    this.markerLayer.setHiddenRoom(room.id);
    this.cameraController.flyTo(
      this.camera,
      this.controls,
      this.focusTargetFor(room),
      () => this.callbacks.onRoomSelected(room)
    );
  }

  private isMobileLayout(): boolean {
    return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
  }

  /**
   * The viewpoint to fly to when a zone is opened. Desktop uses the room's
   * pre-computed target (side-panned to clear the right-hand panel). On phones
   * the overlay is a bottom sheet, so we instead frame the zone centered, pulled
   * further back (to fit the narrow portrait view) and pushed UP the surface
   * normal so the structure sits in the visible top half above the sheet.
   */
  private focusTargetFor(room: Room): RoomCameraTarget {
    if (!this.isMobileLayout()) return room.cameraTarget;

    const m = room.markerPosition;
    const len = Math.hypot(m.x, m.y, m.z) || 1;
    const n = { x: m.x / len, y: m.y / len, z: m.z / len };
    const f = surfaceFront(m);
    const back = FOCUS_BACK_MOBILE;
    const up = FOCUS_UP_MOBILE;
    return {
      position: {
        x: m.x + n.x * ROOM_FOCUS_DISTANCE + f.x * back - n.x * up,
        y: m.y + n.y * ROOM_FOCUS_DISTANCE + f.y * back - n.y * up,
        z: m.z + n.z * ROOM_FOCUS_DISTANCE + f.z * back - n.z * up,
      },
      lookAt: {
        x: m.x + n.x * STRUCTURE_LOOKAT_LIFT - n.x * up,
        y: m.y + n.y * STRUCTURE_LOOKAT_LIFT - n.y * up,
        z: m.z + n.z * STRUCTURE_LOOKAT_LIFT - n.z * up,
      },
      up: n,
    };
  }

  /** Shows only the given zone's reveal-on-enter detail props (null = hide all). */
  private showZoneDetails(roomId: string | null): void {
    for (const [id, group] of this.detailGroups) {
      group.visible = id === roomId;
    }
  }

  /**
   * Builds the per-zone detail props that appear only when a zone is opened.
   * Each prop is laid out in the zone's tangent frame (sideways + toward the
   * focus camera) so it sits in the foreground facing the viewer.
   */
  private buildZoneDetailLayer(): void {
    const n = new THREE.Vector3();
    const f = new THREE.Vector3();
    const r = new THREE.Vector3();
    const pos = new THREE.Vector3();

    for (const room of this.rooms) {
      const group = new THREE.Group();
      group.name = `details-${room.id}`;
      group.visible = false;

      const m = room.markerPosition;
      n.set(m.x, m.y, m.z).normalize();
      const front = surfaceFront(m);
      f.set(front.x, front.y, front.z);
      r.crossVectors(n, f).normalize();

      for (const detail of buildZoneDetails(room.kind)) {
        pos
          .copy(n)
          .multiplyScalar(SPHERE_RADIUS)
          .addScaledVector(r, detail.lateral)
          .addScaledVector(f, detail.front)
          .normalize()
          .multiplyScalar(SPHERE_RADIUS);
        if (detail.faceCamera) {
          orientToFaceCamera(detail.object, pos, room.cameraTarget.position, n);
        } else {
          orientToSurface(detail.object, pos);
        }
        group.add(detail.object);
      }

      this.detailGroups.set(room.id, group);
      this.scene.add(group);
    }
  }

  /** Each room's structure is a permanent landmark on the island, visible
   * from the default orbit view - not something that only appears on focus. */
  private buildStructureAnchors(): void {
    for (const room of this.rooms) {
      const anchorPosition = scaleAlongDirection(
        room.markerPosition,
        SPHERE_RADIUS,
        SPHERE_RADIUS + STRUCTURE_SURFACE_OFFSET
      );

      const anchor = new THREE.Object3D();
      orientToSurface(anchor, anchorPosition);
      anchor.add(STRUCTURE_FACTORIES[room.kind](room.color));

      // Static landmark - bake its ~20 boxes down to a few merged draw calls.
      this.scene.add(bakeMerged(anchor));
    }
  }

  /** Loads and plants the imported CC0 trees and per-zone hero models. */
  private async buildModels(): Promise<void> {
    const placements = [
      ...TREE_MODELS.map((p) => ({ ...p, sway: true })),
      ...ZONE_MODELS.map((p) => ({ ...p, sway: false })),
    ];
    await Promise.all(
      placements.map(async ({ file, size, lat, lon, sway }) => {
        const model = await loadModel(MODELS_PATH + file, size);
        if (this.disposed) return;
        const pos = sphericalToCartesian(SPHERE_RADIUS, lat, lon);
        if (!sway) {
          orientToSurface(model, pos);
          this.scene.add(model);
          return;
        }
        // Trees sway in the "wind": orient an upright wrapper to the surface and
        // rock the model inside it, so the tilt reads as a gentle breeze.
        const wrapper = new THREE.Group();
        wrapper.add(model);
        orientToSurface(wrapper, pos);
        this.scene.add(wrapper);
        const phase = Math.random() * Math.PI * 2;
        const amp = 0.03 + Math.random() * 0.025;
        this.animated.push({
          object: wrapper,
          update: (t) => {
            model.rotation.z = Math.sin(t * 1.1 + phase) * amp;
            model.rotation.x = Math.cos(t * 0.9 + phase) * amp * 0.6;
          },
        });
      })
    );
  }

  /**
   * Sprinkles a ground-cover layer (grass tufts, bushes, flowers) across the
   * whole planet using a deterministic Fibonacci-sphere spread, draped onto the
   * faceted terrain and kept clear of the zone structures.
   *
   * Every item is built, oriented, then its meshes are baked (world transform
   * applied) into one merged geometry per material, so the ~200 scattered items
   * - which would otherwise be ~600 individual draw calls - render as just a
   * handful. This is the single biggest frame-cost win and is purely internal:
   * the result looks pixel-identical to adding each item separately.
   */
  private buildVegetation(island: THREE.Mesh): void {
    const rand = mulberry32(0x5eed1e);
    const count = 220;
    const minCos = Math.cos((15 * Math.PI) / 180);
    const golden = Math.PI * (3 - Math.sqrt(5));

    const dir = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3(0, 0, 0);

    // Collect baked geometries grouped by the material they should render with.
    const buckets: GeometryBuckets = new Map();

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ringRadius = Math.sqrt(Math.max(1 - y * y, 0));
      const theta = golden * i;
      dir.set(
        Math.cos(theta) * ringRadius + (rand() - 0.5) * 0.08,
        y + (rand() - 0.5) * 0.08,
        Math.sin(theta) * ringRadius + (rand() - 0.5) * 0.08
      );
      dir.normalize();

      // Skip anything sitting too close to a zone's structure/marker.
      let tooClose = false;
      for (const room of this.rooms) {
        const m = room.markerPosition;
        const mLen = Math.hypot(m.x, m.y, m.z) || 1;
        if ((dir.x * m.x + dir.y * m.y + dir.z * m.z) / mLen > minCos) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Drop the item onto the actual terrain so it doesn't float or sink.
      raycaster.set(origin, dir);
      const hit = raycaster.intersectObject(island, false)[0];
      const point = hit
        ? hit.point
        : {
            x: dir.x * SPHERE_RADIUS,
            y: dir.y * SPHERE_RADIUS,
            z: dir.z * SPHERE_RADIUS,
          };

      const item = createVegetationItem(rand);
      orientToSurface(item, point);
      item.updateMatrixWorld(true);

      // Bucket every blade/blob/rock by material across all items, so the whole
      // ground cover merges into ~20 draw calls instead of ~600.
      item.traverse((object) => {
        if (object instanceof THREE.Mesh) bakeMeshInto(object, buckets);
      });
    }

    this.scene.add(mergeBuckets(buckets));
  }

  private buildZoneDecorations(): void {
    for (const placement of ZONE_DECORATIONS) {
      const room = this.rooms.find((r) => r.id === placement.roomId);
      if (!room) continue;

      const position = sphericalToCartesian(
        SPHERE_RADIUS,
        placement.lat,
        placement.lon
      );

      const decoration = placement.factory(room.color);
      orientToSurface(decoration, position);
      this.scene.add(bakeMerged(decoration));
    }
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

    const elapsed = timestamp / 1000;
    for (const system of this.animated) system.update(elapsed, deltaSeconds);

    // Subtle day/night drift of the key light (kept in a comfortable range).
    const light = this.directionalLight;
    if (light) {
      const a = elapsed * 0.05;
      light.position.set(Math.cos(a) * 8, 6 + Math.sin(a) * 5, Math.sin(a) * 8);
      const warmth = (Math.sin(a) + 1) * 0.5;
      light.intensity = 0.95 + warmth * 0.4;
      light.color.copy(DAY_LIGHT).lerp(DUSK_LIGHT, warmth * 0.7);
    }

    if (this.postProcessing) this.postProcessing.render();
    else this.renderer.render(this.scene, this.camera);
    this.markerLayer.render(this.scene, this.camera);
  }
}
