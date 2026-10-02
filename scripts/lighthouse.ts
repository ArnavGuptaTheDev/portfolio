/**
 * Runs Lighthouse (mobile preset) against the built site.
 * Usage: npm run build && npm run lighthouse [-- "?phase=night"]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { serveDist } from './serve';

const PORT = 4340;
const query = process.argv[2] ?? '';
mkdirSync('lighthouse', { recursive: true });
const server = await serveDist(PORT);
// Lighthouse drives a Chromium we launch ourselves; its own launcher crashes in some sandboxed shells.
const browser = await chromium.launch({ args: ['--remote-debugging-port=9333'] });
try {
  // Async on purpose: a sync spawn would block this process's static server.
  const lh = spawn(
    process.execPath,
    [
      'node_modules/lighthouse/cli/index.js',
      `http://localhost:${PORT}/${query}`,
      '--output=json',
      '--output=html',
      '--output-path=lighthouse/report',
      '--quiet',
      '--port=9333',
    ],
    { stdio: 'inherit' },
  );
  const code = await new Promise<number | null>((r) => lh.on('exit', r));
  if (code !== 0) throw new Error(`lighthouse exited with ${code}`);
  const report = JSON.parse(readFileSync('lighthouse/report.report.json', 'utf8'));
  for (const [id, cat] of Object.entries<{ score: number }>(report.categories)) {
    console.log(`${id.padEnd(16)} ${Math.round(cat.score * 100)}`);
  }
  const a = report.audits;
  console.log(`LCP ${a['largest-contentful-paint'].displayValue} · CLS ${a['cumulative-layout-shift'].displayValue} · TBT ${a['total-blocking-time'].displayValue} · FCP ${a['first-contentful-paint'].displayValue}`);
  for (const audit of Object.values<{ score: number | null; title: string; scoreDisplayMode: string }>(a)) {
    if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative') console.log(`  ✗ ${audit.title} (${audit.score})`);
  }
} finally {
  await browser.close();
  server.close();
}
