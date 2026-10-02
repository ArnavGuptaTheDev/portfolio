import { getMoonIllumination } from 'suncalc';

/*
 * The lit part of the moon as an SVG path, for a disc of radius r at 0,0.
 * SunCalc gives the phase as 0→1 (new → full at 0.5 → new). The lit region is
 * bounded by one semicircular limb (right side while waxing, left while waning)
 * and the terminator, a half-ellipse whose horizontal radius is r·|cos(2π·phase)|.
 * The terminator bulges toward the lit limb for a crescent and away from it
 * for a gibbous moon, which is what the sweep flag selects. In the southern
 * hemisphere the whole thing is mirrored.
 */
export function moonPath(r: number, date = new Date(), southern = false): string {
  const { phase } = getMoonIllumination(date);
  const waxing = phase < 0.5;
  const rx = Math.abs(Math.cos(phase * 2 * Math.PI)) * r;
  const crescent = phase < 0.25 || phase > 0.75;
  let litRight = waxing;
  if (southern) litRight = !litRight;
  const limbSweep = litRight ? 1 : 0;
  // Terminator runs bottom → top; it passes through the lit side for a crescent.
  const termSweep = crescent === litRight ? 0 : 1;
  return `M0,${-r}A${r},${r} 0 0,${limbSweep} 0,${r}A${rx.toFixed(2)},${r} 0 0,${termSweep} 0,${-r}Z`;
}
