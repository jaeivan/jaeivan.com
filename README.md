# jaeivan.com

A hub of small web apps, in the spirit of neal.fun. Plain static HTML/CSS/JS — no build step — served by GitHub Pages.

## Layout

```
index.html            Hub home page (grid of app tiles)
hub/
  apps.js             App registry — one entry per app
  hub.js              Renders the tiles from the registry
  hub.css             Hub-only styles
shared/
  hub-nav.css         Optional "← All apps" button apps can include
  theme.js/.css       Site-wide light/dark mode + Auto/Light/Dark toggle (every page includes these)
marker-picker/        Each app is a self-contained top-level folder
pokopia-doku/
_template/            Starter files for a new app (ignored by GitHub Pages)
_tools/               Build helpers, e.g. the pixel-art GIF encoder (ignored by GitHub Pages)
```

Each app is its own page with its own `index.html`, CSS, and JS, so apps never share globals or styles. The only shared files are in `shared/`, and they're fully namespaced (`.hub-nav`, `.site-theme-toggle`, the `site-theme` storage key).

## Light and dark mode

A small button in the top-right corner cycles **Auto → Light → Dark**. Auto (the default) follows the device's light/dark setting live, with no refresh needed. Light or Dark is remembered across the whole site and survives refreshes until you cycle back to Auto. `shared/theme.js` always sets `<html data-theme="light|dark">` to the theme in effect (Auto is resolved from the device; it runs in `<head>`, so there's no flash on load), and each page defines its own colors as CSS variables with the dark values in one block:

```css
:root { /* light tokens */ }
:root[data-theme="dark"] { /* dark tokens */ }
```

`_template/` is already set up this way.

`hub/` and `shared/` are reserved folder names — don't use them as app slugs.

## Adding an app

1. Copy `_template/` to `<slug>/` and build the app there. Keep all paths relative.
2. Add an entry to `hub/apps.js` with the same `slug`.

The app will be live at `jaeivan.com/<slug>/`.

## App maintenance

- **Pokopia Doku**: see [`pokopia-doku/_tools/README.md`](pokopia-doku/_tools/README.md) for updating data, adding themed days, and tuning difficulty.
  - When a Pokopia DLC, event, or patch adds Pokémon, regenerate its data:

    ```bash
    node pokopia-doku/_tools/build-data.mjs
    ```

  - Themed days (dated, weekly, or random pool) are set in `pokopia-doku/themes.js`.

## Running locally

Serve the folder (the `../` back links need a server to resolve to `index.html`):

```bash
npx http-server -p 8765 -c-1
```
