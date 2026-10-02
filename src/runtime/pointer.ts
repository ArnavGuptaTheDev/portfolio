// One shared pointer position for the cursor, parallax and constellations.
export const pointer = {
  x: innerWidth / 2,
  y: innerHeight / 2,
  /** -1..1 from the viewport centre. */
  nx: 0,
  ny: 0,
  active: false,
};

addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / innerHeight) * 2 - 1;
    pointer.active = true;
  },
  { passive: true },
);
document.documentElement.addEventListener('pointerleave', () => (pointer.active = false));
