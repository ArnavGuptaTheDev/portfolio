const mq = (q: string) => window.matchMedia(q).matches;
const nav = navigator as Navigator & { deviceMemory?: number };

export const reducedMotion = mq('(prefers-reduced-motion: reduce)');
export const finePointer = mq('(hover: hover) and (pointer: fine)');
export const mobile = mq('(max-width: 700px)') || !finePointer;
export const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;

/** 1 on a capable desktop, smaller on phones and weak hardware. */
export const quality = (mobile ? 0.5 : 1) * (lowEnd ? 0.6 : 1);
