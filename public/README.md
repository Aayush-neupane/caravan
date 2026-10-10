# `public/` — required assets

Static files served from the site root. The following assets are referenced by
the app but are **not** in version control yet — drop them in here before
launching (binary artwork is kept out of the repo on purpose):

| File | Size | Used by |
| --- | --- | --- |
| `icon.png` | 512 × 512 PNG | `src/app/manifest.ts`, `icons.icon` in `src/app/layout.tsx` |
| `apple-touch-icon.png` | 180 × 180 PNG | `src/app/manifest.ts`, `icons.apple` in `src/app/layout.tsx` |
| `og.jpg` | 1200 × 630 JPG | `openGraph.images` in `src/app/layout.tsx` |
| `sw.js` | — | service worker, registered by `src/components/brand/SwRegister.tsx` (present) |

Notes:

- `og.jpg` should be a flat, uncluttered still life — no text baked in beyond
  the brand mark; social cards crop the edges.
- `icon.png` must be a square with no transparency for Android masks;
  `apple-touch-icon.png` must be opaque (iOS composites it over black).
- If an asset is missing the browser falls back to a default icon and the OG
  card renders without an image — worth checking in `npm run build` output
  warnings before deploy.
