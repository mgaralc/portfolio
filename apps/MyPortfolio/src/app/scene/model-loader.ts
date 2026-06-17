import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Imported GLB models come in wildly different scales and pivots. We load each
// one once, cache the raw scene as a template, then hand out normalized clones
// (see `loadModel`) so a single download can decorate several spots cheaply.
const templates = new Map<string, Promise<THREE.Object3D>>();

function loadTemplate(url: string): Promise<THREE.Object3D> {
  let template = templates.get(url);
  if (!template) {
    template = new Promise<THREE.Object3D>((resolve, reject) => {
      loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
    });
    templates.set(url, template);
  }
  return template;
}

/**
 * Loads a GLB and returns a clone wrapped in a group whose local origin sits at
 * the model's base, centered in X/Z, scaled so its largest dimension is `size`
 * world units. (Normalizing by the largest extent rather than height keeps flat
 * models like an open book from blowing up their footprint.) The wrapper can
 * then be planted on the planet with {@link orientToSurface} exactly like the
 * primitive props.
 */
export async function loadModel(
  url: string,
  size: number
): Promise<THREE.Group> {
  const template = await loadTemplate(url);
  const model = template.clone(true);

  // Scale uniformly so the largest bounding-box dimension equals `size`.
  const extent = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const maxExtent = Math.max(extent.x, extent.y, extent.z) || 1;
  model.scale.setScalar(size / maxExtent);

  // Recenter so the base rests on y = 0 and the footprint is centered.
  const box = new THREE.Box3().setFromObject(model);
  model.position.set(
    -(box.min.x + box.max.x) / 2,
    -box.min.y,
    -(box.min.z + box.max.z) / 2
  );

  const wrapper = new THREE.Group();
  wrapper.add(model);
  return wrapper;
}

/**
 * Disposes the cached GLB templates and clears the cache. Must be called from
 * SceneEngine.dispose(): clones handed out by {@link loadModel} share their
 * geometry/materials with the template, so the engine's own dispose() (which
 * frees those shared resources via the in-scene clones) leaves the cached
 * templates pointing at disposed GPU buffers. Without clearing, a re-created
 * SceneEngine would clone templates backed by freed resources and render empty.
 */
export function disposeModelTemplates(): void {
  for (const template of templates.values()) {
    template
      .then((scene) =>
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            (material as { map?: THREE.Texture | null }).map?.dispose();
            material.dispose();
          });
        })
      )
      .catch(() => undefined);
  }
  templates.clear();
}
