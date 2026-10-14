# jaeivan.com

@README.md

No build step, no framework and no npm dependencies. Keep it that way.

## Deploying

GitHub Pages publishes `main` to jaeivan.com, so anything merged into `main` goes live right away. IMPORTANT: never push to `main` directly. Every change goes through a PR from its own branch, with one app or feature per branch.

Don't mention Claude, Claude Code or AI anywhere in commits, branch names, PR titles, PR descriptions or GitHub comments: no `Co-Authored-By` or `Claude-Session` lines, no "Generated with Claude Code" footers, no `claude/` branch prefix. `.claude/settings.json` turns the automatic attribution off and, at session start, sets the git author to jaeivan (GitHub noreply email); this rule covers the rest.

## Adding an app

1. Copy `_template/` to `<slug>/` (lowercase, hyphenated).
2. Add an entry to `hub/apps.js` with `slug`, `title`, `description`, `emoji` (or `thumbnail`), `color`, and `created`/`updated` dates (`YYYY-MM-DD`).
   Whenever you change an existing app, bump its `updated` date (the hub shows an "Updated" badge for a week, next to "New" if the app is also new, and an "Old" badge once it goes a year without one).
3. Give the page a `<meta name="description">` and a `<link rel="canonical">` with its full `https://jaeivan.com/<slug>/` URL, add a `<url>` for it to `sitemap.xml`, and a link to it in the `<noscript>` list in `index.html`.
   Whenever you bump `updated`, bump the app's `<lastmod>` in `sitemap.xml` too.
4. Keep the back link (`<a class="hub-nav" href="../">`) and leave about 64px of top padding so it doesn't cover the app's content.

## Rules

- Apps must stay fully independent: never import another app's files, and never change `hub/` or `shared/` for one app's needs.
- Use relative paths only (`../shared/...`, `script.js`). Never use root-absolute `/...` paths. The exceptions are `sitemap.xml`, `robots.txt`, canonical and `og:` tags, which need full `https://jaeivan.com/...` URLs, and `404.html` (plus its `404.gif`, drawn by `_tools/logo.mjs`): GitHub Pages serves it at any missing path, so it links to `/` and `/shared/...`.
- Anything added to `shared/` must use a class prefix so its styles can't leak into apps.
- Every app must work at phone width (375px) with no horizontal scroll.
- Interactive elements must work with a keyboard: use real buttons, or add `tabindex`, `role` and Enter/Space handling.

## Testing

The `../` back links need a server, not `file://`. Use the `site` preview in `.claude/launch.json` (port 8765). Before opening a PR, check in the browser:
- the hub tile opens the app
- the app's main flows work
- the back link returns to the hub
- the layout holds at desktop and phone widths
