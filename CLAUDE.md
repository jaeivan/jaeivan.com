# jaeivan.com

A neal.fun-style hub of small, independent web apps. Plain static HTML/CSS/JS with no build step, no framework and no npm dependencies. Deployed by GitHub Pages from `main` (custom domain in `CNAME`).

## Structure

- `index.html` + `hub/`: the hub home page. `hub/apps.js` is the app registry; `hub/hub.js` builds the tiles from it.
- `<slug>/`: each app is a self-contained top-level folder, served at `jaeivan.com/<slug>/`.
- `_template/`: starter files for new apps. GitHub Pages doesn't publish it (underscore prefix).
- `shared/hub-nav.css`: optional "← All apps" back button. It's the only shared code.

`hub/` and `shared/` are reserved and can't be used as app slugs.

## Adding an app

1. Copy `_template/` to `<slug>/` (lowercase, hyphenated).
2. Add an entry to `hub/apps.js` with `slug`, `title`, `description`, `emoji` (or `thumbnail`), and `color`.
3. Keep the back link (`<a class="hub-nav" href="../">`) and leave about 64px of top padding so it doesn't cover the app's content.

## Rules

- Apps must stay fully independent: never import another app's files, and never change `hub/` or `shared/` for one app's needs.
- Use relative paths only (`../shared/...`, `script.js`). Never use root-absolute `/...` paths.
- Anything added to `shared/` must use a class prefix so its styles can't leak into apps.
- Every app must work at phone width (375px) with no horizontal scroll.
- Interactive elements must work with a keyboard: use real buttons, or add `tabindex`, `role` and Enter/Space handling.
- One app or feature per branch/PR.

## Testing

The `../` back links need a server, not `file://`. `.claude/launch.json` defines a `site` preview (`npx http-server` on port 8765). Before opening a PR, check in the browser:
- the hub tile opens the app
- the app's main flows work
- the back link returns to the hub
- the layout holds at desktop and phone widths

## Known issues

- Marker Picker: Peach and Beige share `#F5CBA7`; the real Beige value is unknown.
