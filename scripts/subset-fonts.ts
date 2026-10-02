/**
 * Subsets the two variable fonts down to printable ASCII plus the typographic
 * punctuation the copy uses, keeping the weight axis. Run after adding copy
 * that needs new characters: npm run fonts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import subsetFont from 'subset-font';

const chars =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') + '’‘“”–—→←·…©×é';

const fonts = [
  ['node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2', 'public/fonts/fraunces.woff2'],
  ['node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2', 'public/fonts/inter-tight.woff2'],
];

for (const [src, out] of fonts) {
  const input = readFileSync(src);
  const subset = await subsetFont(input, chars, { targetFormat: 'woff2' });
  writeFileSync(out, subset);
  console.log(`${out}: ${(input.length / 1024).toFixed(1)} KB → ${(subset.length / 1024).toFixed(1)} KB`);
}
