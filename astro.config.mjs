import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: replace with the real domain once Cloudflare Pages is set up.
export default defineConfig({
  site: 'https://arnavgupta.pages.dev',
  output: 'static',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'always' },
});
