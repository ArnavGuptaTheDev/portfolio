type Tilt = { x: number; y: number } | null;
type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * Gentle tilt parallax on phones. iOS only grants orientation after a user
 * gesture, so we ask on the first tap; until then (or if refused) the scene
 * keeps its slow automatic drift.
 */
export function startDeviceTilt(set: (t: Tilt) => void) {
  if (typeof DeviceOrientationEvent === 'undefined') return;
  let base: { b: number; g: number } | null = null;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const listen = () =>
    addEventListener('deviceorientation', (e) => {
      if (e.beta === null || e.gamma === null) return;
      base ??= { b: e.beta, g: e.gamma };
      set({ x: clamp((e.gamma - base.g) / 25), y: clamp((e.beta - base.b) / 25) });
    });

  const Ctor = DeviceOrientationEvent as OrientationCtor;
  if (typeof Ctor.requestPermission === 'function') {
    addEventListener(
      'touchend',
      () => {
        Ctor.requestPermission!()
          .then((r) => r === 'granted' && listen())
          .catch(() => {});
      },
      { once: true },
    );
  } else {
    listen();
  }
}
