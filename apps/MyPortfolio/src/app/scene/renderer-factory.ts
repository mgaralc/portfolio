import * as THREE from 'three/webgpu';

export interface CreateRendererOptions {
  forceWebGL?: boolean;
  /** Cap for setPixelRatio - lowered on phones to save fill-rate. */
  pixelRatioCap?: number;
  antialias?: boolean;
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  options: CreateRendererOptions = {}
): Promise<THREE.WebGPURenderer> {
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: options.antialias ?? true,
    forceWebGL: options.forceWebGL ?? false,
    // Hint the browser to pick the discrete GPU on hybrid-graphics laptops -
    // otherwise the scene can be left running on weak integrated graphics and
    // stutters even though a capable dGPU is present.
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.pixelRatioCap ?? 2));
  await renderer.init();
  return renderer;
}
