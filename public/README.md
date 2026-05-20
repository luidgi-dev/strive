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
│   ├── dark/                   #   dark variant (logo tile on #0f1213)
│   └── light/                  #   light variant (tan tile on #f5f9f9)
├── wireframes/                 # Rendered wireframe mockups served for preview
│
└── file.svg, globe.svg, next.svg, vercel.svg, window.svg  # create-next-app scaffolding
```

## Brand assets

The mark comes in three SVGs. The app uses `strive-app-dark.svg` / `strive-app-light.svg` (chosen by `prefers-color-scheme`) for the favicon set in `app/layout.tsx` and on the landing hero. `strive-app-dark.svg` is the canonical, latest mark (the version with the enlarged "S"). `strive-logo.jpeg` is a full branding mockup kept for reference and is not referenced by any component.

Brand colors used by these assets: tan `#cab695` (the mark), dark `#272526` (the icon tile), app dark `--background` `#0f1213`, status-bar / `theme_color` `#1d2122`. Keep these in sync with the design tokens in `app/globals.css` and `lib/theme-colors.ts`.

## PWA manifest — `site.webmanifest`

Linked via `metadata.manifest` in `app/layout.tsx`. Drives the **Android** install experience and splash (Chrome builds the splash from `name` + `background_color` + the 512 icon). `theme_color` is `#1d2122` (status bar) and `background_color` is `#0f1213` (the app dark `--background`, so the Android splash matches the app shell). Android has no light/dark splash, so it always uses this dark color. Icons are declared in both `purpose: "any"` and `purpose: "maskable"` so the mark is not over-cropped.

> iOS ignores the manifest for the launch screen — see `splash/` below.

## `splash/` — iOS launch screens

iOS does not generate a splash from the manifest. A PWA added to the home screen shows a blank (black) screen on cold launch unless explicit `<link rel="apple-touch-startup-image">` tags point to one image **per device resolution and orientation**. This folder holds **two sets** (40 PNGs each, portrait + landscape, every current iPhone/iPad size):

- `dark/` — rounded logo tile (tan "S" on `#272526`) on `#0f1213`, "Strive" wordmark light grey.
- `light/` — tan tile (dark "S") on `#f5f9f9`, "Strive" wordmark dark.

Both layouts: logo centered, wordmark anchored near the bottom. iOS picks the right set per system appearance via `(prefers-color-scheme: dark|light)` appended to each media query — no JS, since the OS knows the theme before the web view loads. (Android has no equivalent; its single manifest splash stays dark.)

**Wiring:** the `{ url, media }` pairs (80 total) live in `lib/apple-splash-screens.ts` and are passed to `metadata.appleWebApp.startupImage` in `app/layout.tsx`, which emits the `<link>` tags.

**Regenerating** (after a brand or layout change): each set is produced from a temporary source HTML with [`pwa-asset-generator`](https://github.com/elegantapp/pwa-asset-generator):

```bash
# 1. Create two source HTMLs (logo centered + "Strive" anchored at the bottom):
#    dark  -> bg #0f1213, dark tile, light wordmark
#    light -> bg #f5f9f9, tan tile, dark wordmark
# 2. Generate each set into its own subfolder:
npx pwa-asset-generator ./splash-dark.html  ./public/splash/dark \
  --splash-only --background "#0f1213" --type png --path "/splash/dark"
npx pwa-asset-generator ./splash-light.html ./public/splash/light \
  --splash-only --background "#f5f9f9" --type png --path "/splash/light"
# 3. Rebuild lib/apple-splash-screens.ts from the printed tags, fixing the
#    href to "/splash/<dark|light>/<file>" and appending
#    " and (prefers-color-scheme: dark|light)" to each media query.
```

The filenames are stable across regenerations, so `app/layout.tsx` never changes; only `lib/apple-splash-screens.ts` and the PNGs do.

> Testing on iOS: after deploying, **remove and re-add** the home-screen shortcut — iOS caches the previous startup images until the shortcut is reinstalled.

## `wireframes/`

Rendered wireframe mockups (dark/light PNGs + `rhythm.html`) served as static files for in-browser preview. These are exports; the canonical, editable design wireframes live in [`docs/wireframes/`](../docs/wireframes/).

## Conventions

- Files are lowercase, kebab-case.
- The `create-next-app` SVGs (`file`, `globe`, `next`, `vercel`, `window`) are scaffolding and can be removed once confirmed unused.
- No secrets here — everything in `public/` is world-readable.
