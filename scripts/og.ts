/**
 * Renders the static Open Graph image (a dusk hero) to public/og.png.
 * Usage: npm run build && npm run og
 */
import { chromium } from 'playwright';
import { serveDist } from './serve';

const PORT = 4350;
const server = await serveDist(PORT);
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${PORT}/?phase=dusk`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.dial, .topbar nav, .cursor { display: none !important; }' });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'public/og.png' });
  await browser.close();
  console.log('✓ public/og.png');
} finally {
  server.close();
}
