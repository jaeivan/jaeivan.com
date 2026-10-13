/*
 * Site-wide light/dark mode. Load it in <head>, before the page paints:
 *
 *   <link rel="stylesheet" href="../shared/theme.css">
 *   <script src="../shared/theme.js"></script>
 *
 * A small button (top-right) cycles Auto → Light → Dark. Auto follows the device setting
 * live; Light/Dark are remembered across the whole site and survive refreshes. This script
 * always sets <html data-theme="light|dark"> to the theme in effect (Auto resolved from the
 * device), so each page defines its dark colors once:
 *
 *   :root[data-theme="dark"] { --bg: …; }
 *
 * Everything here is namespaced (site-theme / .site-theme-toggle) so it can't collide with apps.
 */
(function () {
    var KEY = "site-theme";
    var MODES = ["auto", "light", "dark"];
    var root = document.documentElement;
    var media = window.matchMedia("(prefers-color-scheme: dark)");

    // Line icons (24×24, drawn in the button's text color).
    var ICONS = {
        // Half-filled circle: follows the device
        auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
        // Sun
        light: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
        // Crescent moon
        dark: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    };
    var LABELS = { auto: "Theme: auto (matches your device)", light: "Theme: light", dark: "Theme: dark" };

    function saved() {
        try {
            var v = localStorage.getItem(KEY);
            return v === "light" || v === "dark" ? v : "auto";
        } catch (e) {
            return "auto";
        }
    }

    // Set the theme in effect: the chosen one, or the device's in Auto.
    function paint() {
        root.setAttribute("data-theme", mode === "auto" ? (media.matches ? "dark" : "light") : mode);
    }

    function save() {
        try {
            if (mode === "auto") localStorage.removeItem(KEY);
            else localStorage.setItem(KEY, mode);
        } catch (e) {}
    }

    // Before first paint, so the page never flashes the wrong theme.
    var mode = saved();
    paint();
    // In Auto, follow the device live (e.g. scheduled dark mode at sunset). The change event
    // covers the normal case; re-checking when the page is shown again or regains focus is a
    // backstop for browsers/emulators that don't fire it.
    function follow() {
        if (mode === "auto") paint();
    }
    media.addEventListener("change", follow);
    document.addEventListener("visibilitychange", follow);
    window.addEventListener("focus", follow);
    window.addEventListener("pageshow", follow);

    function addToggle() {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "site-theme-toggle";

        function update() {
            var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
            btn.innerHTML =
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                ICONS[mode] +
                "</svg>";
            btn.setAttribute("aria-label", LABELS[mode] + ". Switch to " + next + ".");
            btn.title = LABELS[mode];
            btn.setAttribute("data-mode", mode);
        }

        btn.addEventListener("click", function () {
            mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
            save();
            paint();
            update();
        });
        update();
        document.body.appendChild(btn);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addToggle);
    else addToggle();
})();
