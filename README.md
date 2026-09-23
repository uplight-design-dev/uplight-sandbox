# Uplight Sandbox

Prototypes and experiments for the Uplight website, deployed as a static site on Vercel.

| Path | What it is |
| --- | --- |
| `/` | Index page linking to each prototype |
| `/homepage-hero` | Homepage hero built from the *Homepage 2024* Figma file |

## Homepage hero

A single, self-contained HTML file (`homepage-hero/index.html`) with fonts, images and JavaScript inlined, so it can also be dropped straight into Framer or any other host.

**What's in it**

- Pixel-matched to the Figma frame at 1440px, responsive down to mobile (hamburger menu below 860px)
- Load-in sequence, Utility / Residential toggle (copy, card photos, hover labels and links all switch)
- Card hover: lift, slow photo pan, shimmer outline, green gradient overlay with a call to action
- "Get in Touch" button: travelling blue edge light, drifting background sheen, breathing glow
- Background: gentle mouse drift; on scroll it moves slower than the page and fades out as the cards rise over it; content layers move faster for depth
- Respects `prefers-reduced-motion` (animations off, layout unchanged)

**Files**

```
homepage-hero/
├── index.html          ← built output (this is what Vercel serves)
├── build.mjs           ← inlines fonts, images and the JS bundle into index.html
├── package.json
└── src/
    ├── template.html   ← markup + CSS (edit this)
    ├── hero.js         ← all interactions and motion (anime.js v4)
    └── assets/         ← images (WebP), logo (SVG), Mark OT subsets (WOFF2)
```

**Editing and rebuilding**

```bash
cd homepage-hero
npm install
npm run build      # regenerates index.html
```

Commit the rebuilt `index.html` — Vercel serves the files as they are, with no build step.

**Before going live**

- Card links and the Utility card labels are placeholders — see the comment above the cards in `src/template.html` (`data-href-utility` / `data-href-residential`).
- The Residential panel copy is placeholder text.
- The dark "Next section (demo spacer)" block after the hero only exists so the scroll effect can be previewed; remove it when placing the hero on a real page.
- Mark OT is a licensed font and is embedded in the page. Confirm Uplight's licence covers web embedding, and keep this repository private.

## Deploying on Vercel

1. In Vercel, choose **Add New → Project** and import `uplight-design-dev/uplight-sandbox`.
2. Framework preset: **Other**. Leave the build command and output directory empty (the repo is served as static files).
3. Deploy. Every push to `main` redeploys automatically.

`vercel.json` turns on clean URLs, so `/homepage-hero` works without `/index.html`.

## Adding another prototype

Create a new folder at the root (e.g. `pricing-calculator/index.html`) and add a link to it in the root `index.html`.
