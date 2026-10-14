<!-- Title: "<App or area>: <what changes>", e.g. "Time Gap: fix wrong dates" or "Hub: remove the footer link". One app or feature per PR. -->

## What

<!-- One or two sentences: what changes for someone using the site, and why. -->

## Changes

<!-- The notable changes, one bullet each, with the files they're in. -->
-

## Testing

<!-- Tick only what you actually checked on the `site` preview (port 8765). Delete lines and groups that don't apply. -->
- [ ] The hub tile opens the app
- [ ] The app's main flows work
- [ ] The back link returns to the hub
- [ ] The layout holds at desktop and phone (375px) widths, with no horizontal scroll
- [ ] It looks right in both light and dark mode
- [ ] New controls work with a keyboard (Tab, Enter, Space)

App changed:
- [ ] `updated` bumped in `hub/apps.js`, and `<lastmod>` in `sitemap.xml`

New app:
- [ ] Entry in `hub/apps.js` with `created` and `updated`
- [ ] Meta description and canonical URL set; added to `sitemap.xml` and the `<noscript>` list in `index.html`

## Notes

<!-- Anything to know before merging: side effects (e.g. a data change reshuffles today's daily puzzle), follow-ups, or "None". -->
