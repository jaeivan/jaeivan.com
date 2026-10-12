# jaeivan.com

@README.md

No build step, no framework and no npm dependencies. Keep it that way.

## Deploying

GitHub Pages publishes `main` to jaeivan.com, so anything merged into `main` goes live right away. IMPORTANT: never push to `main` directly. Every change goes through a PR from its own branch, with one app or feature per branch.

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

## Testing

The `../` back links need a server, not `file://`. Use the `site` preview in `.claude/launch.json` (port 8765). Before opening a PR, check in the browser:
- the hub tile opens the app
- the app's main flows work
- the back link returns to the hub
- the layout holds at desktop and phone widths
