/*
 * App registry — the only file the hub needs to know about each app.
 *
 * To add an app:
 *   1. Copy _template/ to <slug>/ (top level) and build it there.
 *   2. Add an entry below. `slug` must match the folder name.
 *
 * Fields:
 *   slug         top-level folder name (also the URL: /<slug>/)
 *   title        tile name
 *   emoji        tile artwork (or set `thumbnail` to an image path relative to the app folder)
 *   thumbnailStill  optional still image shown until the tile is hovered, when `thumbnail`
 *                (e.g. an animated GIF) takes over
 *   color        tile background
 *   added        optional "YYYY-MM-DD" the app went live; the tile shows a "New" badge for 30 days
 */
window.HUB_APPS = [
  {
    slug: "marker-picker",
    title: "Marker Picker",
    thumbnail: "tile.gif",
    thumbnailStill: "tile-still.gif",
    color: "#FDE7D9",
  },
  {
    slug: "pokopia-doku",
    title: "Pokopia Doku",
    thumbnail: "tile.gif",
    thumbnailStill: "tile-still.gif",
    color: "#EBE1F6",
    added: "2026-10-12",
  },
];
