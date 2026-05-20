# `public/`

Static assets served as-is from the site root. A file at `public/foo.png` is reachable at `/foo.png` (no import needed). This is where brand assets, the PWA manifest, app icons, and the iOS launch screens live.

## Structure

```
public/
├── site.webmanifest            # PWA manifest (name, colors, icons, display)
│
├── strive-app-dark.svg         # Brand mark — tan "S" on #272526 (latest, enlarged S)
├── strive-app-light.svg        # Brand mark — dark "S" on #cab695 (light variant)
├── strive-app.svg              # Base mark (neutral)
├── strive-logo.jpeg            # Full brand mockup (reference only, not used in the app)
│
├── apple-touch-icon.png        # iOS home-screen icon (180×180)
├── favicon.ico                 # Legacy favicon
├── favicon-96x96.png           # Hi-DPI favicon
├── web-app-manifest-192x192.png  # Manifest icon (any + maskable)
├── web-app-manifest-512x512.png  # Manifest icon (any + maskable)
│
├── splash/                     # iOS PWA launch screens (apple-touch-startup-image)
├── wireframes/                 # Rendered wireframe mockups served for preview
│
└── file.svg, globe.svg, next.svg, vercel.svg, window.svg  # create-next-app scaffolding
```

## Brand assets

The mark comes in three SVGs. The app uses `strive-app-dark.svg` / `strive-app-light.svg` (chosen by `prefers-color-scheme`) for the favicon set in `app/layout.tsx` and on the landing hero. `strive-app-dark.svg` is the canonical, latest mark (the version with the enlarged "S"). `strive-logo.jpeg` is a full branding mockup kept for reference and is not referenced by any component.

Brand colors used by these assets: tan `#cab695` (the mark), dark `#272526` (the icon tile), app dark background `#1d2122`. Keep these in sync with the design tokens in `app/globals.css` and `lib/theme-colors.ts`.

## PWA manifest — `site.webmanifest`

Linked via `metadata.manifest` in `app/layout.tsx`. Drives the **Android** install experience and splash (Chrome builds the splash from `name` + `background_color` + the 512 icon). `theme_color` and `background_color` are both `#1d2122`. Icons are declared in both `purpose: "any"` and `purpose: "maskable"` so the mark is not over-cropped.

> iOS ignores the manifest for the launch screen — see `splash/` below.

## `splash/` — iOS launch screens

iOS does not generate a splash from the manifest. A PWA added to the home screen shows a blank (black) screen on cold launch unless explicit `<link rel="apple-touch-startup-image">` tags point to one image **per device resolution and orientation**. This folder holds those 40 PNGs (portrait + landscape, every current iPhone/iPad size).

Each image bakes in the layout: the rounded logo tile + the "Strive" wordmark, centered on `#1d2122` — matching the landing hero.

**Wiring:** the `{ url, media }` pairs live in `lib/apple-splash-screens.ts` and are passed to `metadata.appleWebApp.startupImage` in `app/layout.tsx`, which emits the `<link>` tags.

**Regenerating** (after a brand or layout change): the images are produced from a temporary source HTML with [`pwa-asset-generator`](https://github.com/elegantapp/pwa-asset-generator):

```bash
# 1. Create a source HTML (logo tile + "Strive" wordmark, centered on #1d2122)
# 2. Generate the 40 PNGs + meta tags:
npx pwa-asset-generator ./splash-source.html ./public/splash \
  --splash-only --background "#1d2122" --type png --path "/splash"
# 3. Rebuild lib/apple-splash-screens.ts from the printed tags
#    (fix the doubled "/splash/public/splash/" prefix to "/splash/")
```

The filenames are stable across regenerations, so `lib/apple-splash-screens.ts` and `app/layout.tsx` only need updating if the device matrix itself changes.

> Testing on iOS: after deploying, **remove and re-add** the home-screen shortcut — iOS caches the previous startup images until the shortcut is reinstalled.

## `wireframes/`

Rendered wireframe mockups (dark/light PNGs + `rhythm.html`) served as static files for in-browser preview. These are exports; the canonical, editable design wireframes live in [`docs/wireframes/`](../docs/wireframes/).

## Conventions

- Files are lowercase, kebab-case.
- The `create-next-app` SVGs (`file`, `globe`, `next`, `vercel`, `window`) are scaffolding and can be removed once confirmed unused.
- No secrets here — everything in `public/` is world-readable.
