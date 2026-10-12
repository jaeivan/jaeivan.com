/*
 * App registry — the only file the hub needs to know about each app.
 *
 * To add an app:
 *   1. Copy _template/ to <slug>/ (top level) and build it there.
 *   2. Add an entry below. `slug` must match the folder name.
 *
 * Fields:
 *   slug         top-level folder name (also the URL: /<slug>/)
 *   title        tile heading
 *   description  one short line under the title
 *   emoji        tile artwork (or set `thumbnail` to an image path relative to the app folder)
 *   color        tile background
 */
window.HUB_APPS = [
  {
    slug: "marker-picker",
    title: "Marker Picker",
    description: "Can't decide which markers to use? Let fate pick four.",
    emoji: "🎨",
    color: "#FDE7D9",
  },
];
