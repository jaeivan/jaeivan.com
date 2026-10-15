/*
 * App registry — the only file the hub needs to know about each app.
 *
 * To add an app:
 *   1. Copy _template/ to <slug>/ (top level) and build it there.
 *   2. Add an entry below. `slug` must match the folder name. The hub lists apps newest first
 *      by `created`, whatever their order here.
 *
 * When you change an app, bump its `updated` date.
 *
 * Fields:
 *   slug         top-level folder name (also the URL: /<slug>/)
 *   title        tile name
 *   emoji        tile artwork (or set `thumbnail` to an image path relative to the app folder)
 *   thumbnailStill  optional still image shown until the tile is hovered, when `thumbnail`
 *                (e.g. an animated GIF) takes over
 *   color        tile background
 *   created      "YYYY-MM-DD" the app went live; the tile shows a "New" badge for 7 days
 *   updated      "YYYY-MM-DD" the app last changed; the tile shows an "Updated" badge for 7 days
 *                (alongside "New" if both apply), or an "Old" badge once it's over a year since it last
 *                changed. Both dates are shown under the tile name, as "3 days ago",
 *                "2 weeks ago" etc. for the first 2 months, then as the date.
 */
window.HUB_APPS = [
  {
    slug: "marker-picker",
    title: "Marker Picker",
    thumbnail: "tile.gif",
    thumbnailStill: "tile-still.gif",
    color: "#FDE7D9",
    created: "2026-08-02",
    updated: "2026-10-13",
  },
  {
    slug: "pokopia-doku",
    title: "Pokopia Doku",
    thumbnail: "tile.gif",
    thumbnailStill: "tile-still.gif",
    color: "#EBE1F6",
    created: "2026-10-12",
    updated: "2026-10-14",
  },
  {
    slug: "time-gap",
    title: "Time Gap",
    description: "Which two moments in history are closer together?",
    thumbnail: "tile.gif",
    thumbnailStill: "tile-still.gif",
    color: "#DDF0E4",
    created: "2026-10-13",
    updated: "2026-10-14",
  },
  {
    slug: "video-gap",
    title: "Video Gap",
    thumbnail: "tile.gif",
    thumbnailStill: "tile-still.gif",
    color: "#FBE0E0",
    created: "2026-10-14",
    updated: "2026-10-14",
  },
];
