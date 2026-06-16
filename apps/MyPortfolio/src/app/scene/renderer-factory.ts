import * as THREE from 'three/webgpu';

export interface CreateRendererOptions {
  forceWebGL?: boolean;
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  options: CreateRendererOptions = {}
): Promise<THREE.WebGPURenderer> {
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    forceWebGL: options.forceWebGL ?? false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  await renderer.init();
  return renderer;
}
