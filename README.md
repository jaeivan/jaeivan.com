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
marker-picker/        Each app is a self-contained top-level folder
_template/            Starter files for a new app (ignored by GitHub Pages)
```

Each app is its own page with its own `index.html`, CSS, and JS, so apps never share globals or styles. The only shared file is `shared/hub-nav.css`, which is fully namespaced under `.hub-nav`.

`hub/` and `shared/` are reserved folder names — don't use them as app slugs.

## Adding an app

1. Copy `_template/` to `<slug>/` and build the app there. Keep all paths relative.
2. Add an entry to `hub/apps.js` with the same `slug`.

The app will be live at `jaeivan.com/<slug>/`.

## Running locally

Serve the folder (the `../` back links need a server to resolve to `index.html`):

```bash
npx http-server -p 8765 -c-1
```
