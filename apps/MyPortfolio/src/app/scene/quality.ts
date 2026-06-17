// Device-aware quality tiers. The scene is meant to ship and run smoothly on
// phones, so we detect roughly how capable the device is and dial the heavy
// effects (bloom post-processing, particle counts, pixel ratio) up or down.
// Everything degrades gracefully: the "low" tier still shows the full world,
// just without the most GPU-hungry extras.

export type QualityTier = 'low' | 'high';

export interface QualitySettings {
  tier: QualityTier;
  /** Upper bound for renderer.setPixelRatio (retina phones can be 3+). */
  pixelRatioCap: number;
  antialias: boolean;
  bloom: boolean;
  fireflies: number;
  shootingStars: number;
  ringParticles: number;
}

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

/** Best-effort "is this a phone/tablet or a weak machine" check. */
function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  const nav = navigator as ExtendedNavigator;
  const ua = nav.userAgent ?? '';
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const touchSmall =
    nav.maxTouchPoints > 0 &&
    Math.min(window.innerWidth, window.innerHeight) < 820;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;

  return mobileUA || touchSmall || (fewCores && lowMemory);
}

export function detectQuality(): QualitySettings {
  if (isLowEndDevice()) {
    return {
      tier: 'low',
      pixelRatioCap: 1.5,
      antialias: false,
      bloom: false,
      fireflies: 28,
      shootingStars: 1,
      ringParticles: 90,
    };
  }
  return {
    tier: 'high',
    pixelRatioCap: 2,
    antialias: true,
    bloom: true,
    fireflies: 80,
    shootingStars: 3,
    ringParticles: 320,
  };
}
