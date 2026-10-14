# jaeivan.com

@README.md

No build step, no framework and no npm dependencies. Keep it that way. The only Node code is the dev scripts in `_tools/` folders, and they use built-in modules only.

## Deploying

GitHub Pages publishes `main` to jaeivan.com, so anything merged into `main` goes live right away. IMPORTANT: never commit or push to `main` directly. Every change goes through a PR from its own branch:

- Start each branch from the latest `main`, with one app or feature per branch. Name it `<slug>-<change>` or `<area>-<change>`, e.g. `time-gap-fix-dates` or `hub-footer-links`.
- Once a branch's PR is merged, don't add to it. Start a new branch from `main` for follow-up work.
- Pushing a branch and opening a PR need the owner's OK (`.claude/settings.json` asks first), and merging is their call: open the PR and stop there unless asked to merge.

Don't mention Claude, Claude Code or AI anywhere in commits, branch names, PR titles, PR descriptions or GitHub comments: no `Co-Authored-By` or `Claude-Session` lines, no "Generated with Claude Code" footers, no `claude/` branch prefix. `.claude/settings.json` turns the automatic attribution off and, at session start, sets the git author to jaeivan (GitHub noreply email). This rule covers everything else.

`.claude/hooks/guard.mjs` blocks the common slips (committing on or pushing to `main`, `claude/` branches, attribution lines). If it blocks a command, fix the command; never work around the hook.

Write every PR description from `.github/pull_request_template.md`: keep its headings, fill each section, tick only the checks you actually did, delete lines that don't apply, and delete the HTML comments.

Everything committed outside `_`-prefixed folders is published. Keep screenshots, test pages and other scratch files out of the repo.

## Adding an app

1. Copy `_template/` to `<slug>/` (lowercase, hyphenated), then replace the template's placeholder `<title>`, `<h1>`, meta description and canonical URL.
2. Add an entry to `hub/apps.js` with `slug`, `title`, `emoji` (or `thumbnail`, plus an optional `thumbnailStill`), `color`, and `created`/`updated` dates (`YYYY-MM-DD`, today's date for both).
3. Give the page a `<meta name="description">` and a `<link rel="canonical">` with its full `https://jaeivan.com/<slug>/` URL, add a `<url>` for it to `sitemap.xml`, and a one-line link to it in the `<noscript>` list in `index.html`.
4. Keep the back link (`<a class="hub-nav" href="../">`) and leave about 64px of top padding so it doesn't cover the app's content.
5. Define colors as CSS variables with light and dark tokens (see "Light and dark mode" in the README).

## Changing an app

Whenever you change an existing app, in the same PR:
- bump its `updated` date in `hub/apps.js` (the hub shows an "Updated" badge for a week, next to "New" if the app is also new, and an "Old" badge once it goes a year without one)
- bump its `<lastmod>` in `sitemap.xml` to the same date

## Generated files

Edit the generator and rerun it (from the repo root) instead of editing these by hand:
- `pokopia-doku/data.js`: `pokopia-doku/_tools/build-data.mjs` (see `pokopia-doku/_tools/README.md`)
- `hub/logo*.gif`, `favicon.gif`, `og.png`, `404.gif`: `node _tools/logo.mjs`
- An app's pixel art (`tile*.gif`, `favicon.gif`, `icon.png` and its own GIFs): the script in `<slug>/_tools/`, built on `_tools/pixel-gif.mjs`

## Rules

- Apps must stay fully independent: never import another app's files, and never change `hub/` or `shared/` for one app's needs.
- Use relative paths only (`../shared/...`, `script.js`). Never use root-absolute `/...` paths. The exceptions are `sitemap.xml`, `robots.txt`, canonical and `og:` tags, which need full `https://jaeivan.com/...` URLs, and `404.html` (plus its `404.gif`): GitHub Pages serves it at any missing path, so it links to `/` and `/shared/...`.
- Anything added to `shared/` must use a class prefix so its styles can't leak into apps.
- Every app must work at phone width (375px) with no horizontal scroll.
- Interactive elements must work with a keyboard: use real buttons, or add `tabindex`, `role` and Enter/Space handling.

## Testing

The `../` back links need a server, not `file://`. Use the `site` preview in `.claude/launch.json` (port 8765). Before opening a PR, check in the browser:
- the hub tile opens the app
- the app's main flows work
- the back link returns to the hub
- the layout holds at desktop and phone (375px) widths
- it looks right in light and dark mode (the top-right toggle)
- new controls work with a keyboard

Then run `node --check` on any JS file you changed, and `git status` to make sure no screenshots or scratch files are staged.
