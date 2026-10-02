Build my personal portfolio website. It must feel premium and immersive: a living, animated SVG sky and landscape that changes with the visitor's local time of day, with rich cursor interactions. It also has to stay fast, accessible, and readable by a recruiter in 30 seconds. Atmosphere supports the content; it never buries it.

Before writing code, read this whole brief, propose a short plan (stack, file structure, the phase engine design, and the scene layer list), and wait for my OK.

## Who I am (site content)

- Name: Arnav Gupta (Ashu)
- Positioning: Backend & Data Engineer. I build data-heavy backend systems: pipelines, system-to-system syncs, APIs.
- Location: Lakhimpur, UP, India. Open to relocating to Delhi NCR / Lucknow and to remote work.
- Current: Data Analyst at OrionTCS (Jun 2025 – present). Backend and data engineering for a US pharmacy chain. Never name the client.
- Before: Freelance Full Stack Developer (Apr 2019 – Jan 2025), 200+ client projects in Node.js, Python and Java (bots, automation, auth/verification tools, dashboards, API integrations).
- Education: Master of Computer Applications (MCA), Amity University, expected 2027; Bachelor of Business Administration (BBA), Jain University, 2025.
- Links: email clusterwithgigs@gmail.com, LinkedIn linkedin.com/in/the-arnavgupta, GitHub https://github.com/ArnavGuptaTheDev, resume PDF at /resume.pdf. Do NOT show my phone number.

Work case studies (write each as a short card: problem → what I built → outcome; no client names, no internal table names):
1. CRM sync engine: warehouse → Zoho CRM. Each run diffs live CRM state against an expected-state table and queues create/update/reparent/archive/merge actions through an outbox, with human approval for destructive changes. Fuzzy matching (name + territory + ZIP) recovered 5,000+ accounts that would have been duplicated.
2. Incremental delta feed to a partner platform: Azure Data Factory → SFTP. Insert/update/sync timestamps for change detection, and group-level replace semantics so re-sends are idempotent. Found that upstream payment IDs change when claims are re-adjudicated and redefined the record grain to stop false deletes.
3. Pharmacy field app: Node.js backend + React frontend on Azure App Service, reaching a private data warehouse through VNet integration.
4. Clinical adherence metrics: PDC, MPR, persistency curves, and a Months-on-Therapy year-over-year analysis using RMST.
5. Serverless reporting pipelines on Azure Functions that replaced manual reports.

Personal projects: drive these from a data file. Right now there is one, "Home Lab": a self-hosted Proxmox server running LXC containers and VMs (NAS, media, Home Assistant, Docker services, CUPS print server), including GPU passthrough and recovering data from a failing disk. Two more are coming (a public drug-lookup REST API and an incremental public-data sync pipeline). Make adding a project a matter of adding one entry to `content.ts`. Do not show "coming soon" placeholders.

Skills: Node.js, TypeScript, Python, SQL/T-SQL, Azure (App Service, Functions, Data Factory), SQL Server, MySQL, MongoDB, Docker, Linux, React, Power BI.

All copy lives in one typed `src/content.ts` so I can edit text without touching components. Write the copy plainly and confidently: no buzzwords like "passionate", "cutting-edge", "leveraging" or "synergy".

## Stack

- Astro + TypeScript, static output. Use a small number of interactive islands in vanilla TS, or Preact if needed. No heavy framework runtime for the whole page.
- GSAP (free core) for timelines; plain CSS custom properties for theming. No Three.js / WebGL. All scenery is SVG, plus at most one `<canvas>` if particles truly need it.
- Fonts: one distinctive display face and one clean text face (e.g. via Fontsource), self-hosted, subset, `font-display: swap`.
- Deploy target: static hosting (Cloudflare Pages). Include a README covering local dev, build, and deploy, and where to edit content.

## The time-of-day engine (core feature)

Six phases, based on the visitor's local time (`new Date()`):

| Phase | Default window | Mood |
|---|---|---|
| Dawn | 05:00–07:00 | cold blues warming to peach, mist, first light |
| Morning | 07:00–11:00 | fresh, bright, soft gold |
| Daytime | 11:00–16:00 | clear high-contrast sky, crisp |
| Dusk | 16:00–19:30 | golden hour → orange/magenta sunset → violet |
| Night | 19:30–23:30 | deep navy, moon, stars |
| Midnight | 23:30–05:00 | near-black indigo, densest stars, quiet and still |

Requirements:
- Don't switch abruptly. Interpolate continuously: compute a 0–1 progress inside the current phase and blend the palette and the scene parameters (sun/moon position, sky gradient stops, star opacity, fog density, light direction) toward the next phase. A visitor who stays on the page watches it slowly change. Recompute every 60s and on tab visibility change.
- Better if cheap: shift the windows using approximate sunrise/sunset from the visitor's timezone with SunCalc (no geolocation prompt; derive a rough lat/long from `Intl.DateTimeFormat().resolvedOptions().timeZone` via a small lookup table, and fall back to the fixed windows).
- A small **sun/moon dial** in the corner shows the current phase and time. Dragging it scrubs through all 24 hours with smooth transitions, so a recruiter at 2pm can still see dusk and midnight. A "back to now" button resets it.
- `?phase=dusk` (etc.) and `?t=18:45` URL params for testing and sharing.
- The theme drives everything through CSS custom properties: background, surface, text, muted text, accent, accent-2, glow, borders. Text contrast must pass WCAG AA in every phase, including mid-blend. Add a dev-only check that samples the blend at 5-minute steps and fails if contrast drops below 4.5:1.

## The SVG scene (each phase must feel different, not recolored)

A full-viewport layered SVG landscape behind the hero that thins out as you scroll (other sections get a subtle continuation, like a horizon line or drifting particles, not the full scene).

Layers, back to front: sky gradient → celestial layer (sun/moon/stars) → far mountains → mid hills → a subtle city skyline silhouette → near foreground (grass/trees) → atmospheric layer (mist/fog/particles).

Phase-specific animation:
- **Dawn:** the sun rises from behind the far mountains along an arc, mist layers drift and lift, a few bird flocks (simple animated SVG paths) cross occasionally, and the last stars fade out.
- **Morning:** soft volumetric light rays (masked gradients) sweep slowly, clouds drift, dew-like sparkles on the foreground grass.
- **Daytime:** high sun with a gentle bloom, slow parallax clouds, a faint heat shimmer on the horizon (SVG feTurbulence, animated sparingly), occasional bird.
- **Dusk:** the sun sinks with a growing glow, the sky gradient rolls through gold → orange → magenta → violet, silhouettes sharpen, city windows start lighting up one by one, and the first stars appear.
- **Night:** moon with a soft halo and visible phase (compute the real lunar phase), twinkling stars at varied rates, fireflies drifting in the foreground, city windows randomly turning on and off.
- **Midnight:** the darkest sky, a milky-way band, occasional shooting stars (rare and random, at most one every ~20s), a faint aurora-like ribbon, almost all windows dark, very slow motion everywhere.

Elements must enter and exit with the blend (stars fade in, fireflies spawn gradually), never pop.

## Cursor & interaction

- **Parallax:** scene layers shift with cursor position at different depths (back slow, front fast), with smoothing (lerp ~0.08) and a capped amplitude so it never feels seasick.
- **Custom cursor:** a small dot plus a trailing ring, changing per phase. Daytime: a crisp ring. Dusk: a warm glow. Night/midnight: it becomes a soft lantern that slightly brightens nearby stars, and **stars within ~120px connect into faint constellation lines** to the cursor. It grows when hovering anything interactive. Hide it on touch devices and keep the native cursor available for text.
- **Magnetic buttons/links** (small pull, spring back).
- **Case-study cards:** 3D tilt toward the cursor plus a specular highlight that follows the pointer, tinted by the current phase's light direction (dawn light comes from the left/east, dusk from the right/west).
- **Headings:** a subtle letter-by-letter reveal on scroll; an optional short text-scramble on hover for the name only.
- **Experience section:** render it as a vertical "data pipeline": nodes connected by an SVG path that draws itself as you scroll, with small pulses travelling along the path. It fits who I am.
- **Easter egg:** clicking the sun or moon cycles to the next phase with a smooth transition.
- **Mobile:** replace cursor parallax with gentle device-tilt parallax (only after a user gesture where iOS requires permission; otherwise a slow automatic drift). Hover effects become tap states.

## Sections

1. Hero: name, one-line positioning, two CTAs (View work / Download resume), the phase dial, and the full scene.
2. About: 3–4 sentences, plus a small "currently" line (what I'm building or learning).
3. Work: case studies 1–5 as tilt cards.
4. Experience: the pipeline timeline.
5. Projects: data-driven from `content.ts`.
6. Skills: grouped and quiet. No progress bars and no percentages.
7. Contact: email, LinkedIn, GitHub, resume. A footer line shows the current phase name and local time, e.g. "It's dusk where you are, 18:42".

## Non-negotiables

- **Performance:** Lighthouse ≥ 90 on mobile for Performance, Accessibility, Best Practices and SEO. Under 150 KB of JS gzipped, excluding fonts. LCP < 2.5s. All animation via transform/opacity or SVG attributes on `requestAnimationFrame`, with one shared rAF loop. Pause everything when the tab is hidden or the scene is off-screen (IntersectionObserver). Reduce particle counts on low-end devices (`navigator.hardwareConcurrency`, `deviceMemory`) and on mobile.
- **`prefers-reduced-motion`:** keep the phase colors and a static scene for the right time of day, and disable parallax, drifting, shooting stars, tilt and the custom cursor.
- **Accessibility:** semantic HTML, keyboard-navigable (the dial is operable with arrow keys), visible focus styles in every phase, the decorative SVG `aria-hidden`, and the content readable with JS disabled (the server-rendered default is the daytime theme).
- **SEO:** title, description, Open Graph/Twitter tags, a static OG image (a nice dusk render), sitemap, and robots.txt.
- **No layout shift** when the theme or scene initializes. Set the phase in a tiny inline script in `<head>` before first paint so there's no flash of the wrong theme.

## How to work

1. Build the phase engine first, with a dev debug panel (current phase, progress, the blended palette swatches, and a time slider).
2. Then the scene layers, one phase at a time.
3. Then interactions, then the content sections.
4. After each phase scene is done, use Playwright to screenshot the hero at `?phase=` for all six phases, desktop and mobile widths, and look at them yourself. Fix anything that looks flat, cluttered or low-contrast before moving on.
5. At the end, run Lighthouse (mobile), fix what's below target, and give me the six phase screenshots plus the scores.

Keep the code clean, with comments only where something is non-obvious (the blend math, the lunar phase calculation). No obvious "this function does X" comments.