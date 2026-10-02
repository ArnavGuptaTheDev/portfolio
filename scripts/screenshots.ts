/**
 * Screenshots the hero at every phase, desktop and mobile, against the built
 * site. Usage: npm run build && npm run shots [-- --phase dusk] [-- --full]
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { PHASES } from '../src/engine/phases';
import { serveDist } from './serve';

const PORT = 4329;
const BASE = `http://localhost:${PORT}`;
const args = process.argv.slice(2);
const only = args.includes('--phase') ? [args[args.indexOf('--phase') + 1]] : [...PHASES];
const full = args.includes('--full');
const out = 'shots';
mkdirSync(out, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

const server = await serveDist(PORT);
try {
  const browser = await chromium.launch();
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      timezoneId: 'Asia/Kolkata',
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`[${vp.name}] page error:`, e.message));
    for (const phase of only) {
      await page.goto(`${BASE}/?phase=${phase}`, { waitUntil: 'networkidle' });
      // Let the first-paint refinement ease finish and fireflies/stars settle in.
      await page.waitForTimeout(2600);
      if (full) {
        // Scroll through so on-scroll reveals and the pipeline draw actually run.
        for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 400) {
          await page.evaluate((v) => scrollTo(0, v), y);
          await page.waitForTimeout(120);
        }
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(900);
      }
      const file = `${out}/${phase}-${vp.name}${full ? '-full' : ''}.png`;
      await page.screenshot({ path: file, fullPage: full });
      console.log('✓', file);
    }
    await ctx.close();
  }
  await browser.close();
} finally {
  server.close();
}
