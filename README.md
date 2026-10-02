# Arnav Gupta — portfolio

A static Astro site with a living SVG sky that follows the visitor's local time of day.

## Editing content

All copy lives in **`src/content.ts`**: hero text, about, case studies, experience, projects, skills and contact links. Components only read from it.

- **Add a project:** append one object to the `projects` array. The Projects section renders whatever is in the list.
- **Resume:** replace `public/resume.pdf`. It's linked from the hero and the contact section, opens in a new tab, and downloads as `Arnav_Gupta_Resume.pdf` (set by `resumeFilename` in `content.ts`).
- **New characters in the copy?** The fonts are subset to ASCII plus common typographic punctuation. If you add something else (accented letters, symbols), add it to `scripts/subset-fonts.ts` and run `npm run fonts`.

## Local development

```bash
npm install
npx playwright install chromium   # only needed for screenshots / OG / Lighthouse scripts
npm run dev                        # http://localhost:4321
```

In dev, press <kbd>`</kbd> (backtick) or open `/?debug` for the phase debug panel: the current phase and progress, the window source (SunCalc or fixed), every blended palette swatch, and a time slider.

URL parameters for testing and sharing:

- `?phase=dawn|morning|day|dusk|night|midnight` jumps to that phase's most characteristic moment.
- `?t=18:45` pins the scene to a clock time.

## Build and checks

```bash
npm run build        # runs the contrast check first, then astro build → dist/
npm run check        # astro / TypeScript diagnostics
npm run shots        # Playwright: hero at all six phases, desktop + mobile → shots/
npm run shots -- --phase dusk --full   # one phase, full page
npm run lighthouse   # Lighthouse mobile against dist/ → lighthouse/
npm run og           # re-render public/og.png (dusk) after visual changes
```

`npm run check:contrast` walks the entire 24-hour blend in 5-minute steps under six sun schedules (fixed windows, Lucknow, London and New York across seasons). It fails if any text pairing drops below WCAG AA (4.5:1). The build won't pass without it.

## Deploy (Cloudflare Pages)

1. Push the repo to GitHub and create a Pages project from it.
2. Build command `npm run build`, output directory `dist`, Node 20 or newer.
3. Set the real domain in `astro.config.mjs` (`site`), `src/content.ts` (`site.url`) and `public/robots.txt`, so the canonical URL, OG tags and sitemap point to it.

`public/_headers` gives hashed assets and fonts a one-year immutable cache.

## How it works

- **Phase engine** (`src/engine/`):
  - Keyframes in `phases.ts` hold a full palette plus scene parameters, pinned to positions inside each phase (dusk has four).
  - `engine.ts` eases between the two keyframes around the current time in OKLab. It then pushes text tokens only as far as needed to keep AA.
  - `sun.ts` stretches the six windows around today's sunrise and sunset using SunCalc. Coordinates are guessed from the timezone, so there is no geolocation prompt.
- **No flash of the wrong theme:** `boot.ts` is bundled at build time and inlined into `<head>`. It sets every CSS variable before first paint.
- **Scene:**
  - `src/components/Scene.astro` is static SVG, with geometry generated at build time from a seeded RNG.
  - Stars, constellations and shooting stars are drawn on the one canvas.
  - `src/scene/runtime.ts` animates everything from a single shared rAF loop (`src/runtime/loop.ts`). The loop pauses when the tab is hidden or the hero is off-screen.
- **Interactions** live in `src/interactions/`. The custom cursor, tilt, magnetic links and scramble only run on fine pointers without reduced motion.
