# jaeivan.com

A hub of small, independent web apps. Plain static HTML/CSS/JS, served by GitHub Pages.

## Layout

```
index.html       Hub home page (grid of app tiles)
404.html         "Page not found" page with the logo glitching out (404.gif)
hub/             App registry (apps.js), tile rendering and hub styles
shared/          hub-nav.css ("← All apps" button) and theme.js/.css (light/dark mode, used by every page)
_template/       Starter files for a new app (ignored by GitHub Pages)
_tools/          Build helpers, e.g. the pixel-art GIF encoder (ignored by GitHub Pages)
<slug>/          One self-contained folder per app: marker-picker/, pokopia-doku/
```

Apps share no globals or styles. Everything in `shared/` is namespaced (`.hub-nav`, `.site-theme-toggle`, the `site-theme` storage key). `hub` and `shared` are reserved and can't be app slugs.

## Light and dark mode

The top-right button cycles **Auto → Light → Dark**. Auto follows the device setting; Light or Dark is remembered site-wide. `shared/theme.js` runs in `<head>` and sets `<html data-theme="light|dark">`, so each page defines its colors as CSS variables:

```css
:root { /* light tokens */ }
:root[data-theme="dark"] { /* dark tokens */ }
```

`_template/` is already set up this way.

## Adding an app

1. Copy `_template/` to `<slug>/` and build there, using relative paths only.
2. Add an entry with the same `slug` to `hub/apps.js`, including `created` and `updated` dates. Bump `updated` whenever you change the app; tiles show a "New" or "Updated" badge for a week, and "Old" after a year without updates.

It goes live at `jaeivan.com/<slug>/`.

## App maintenance

- **Pokopia Doku:** see [`pokopia-doku/_tools/README.md`](pokopia-doku/_tools/README.md) for updating data, themed days and difficulty.

## Logo, favicon and link previews

`node _tools/logo.mjs` redraws the hub logo (`hub/logo.gif` waves and spins on hover or click, `hub/logo-still.gif` at rest; keep `LOGO_LOOP_MS` in `hub/hub.js` in sync with the loop length it prints), `favicon.gif`, the link-preview card `og.png` and the glitching 404 logo `404.gif`. The `og:` tags in `index.html` use full `https://jaeivan.com/...` URLs because link-preview crawlers need them.

## Running locally

The `../` back links need a server:

```bash
npx http-server -p 8765 -c-1
```
