/*
 * Themed days for the Daily puzzle.
 *
 * On a themed day, one row or column header is the theme itself (e.g. "J's favorite
 * Pokémon"), so the 3 cells in that line must be filled with theme Pokémon.
 * Difficulty still follows the weekday rotation.
 *
 * How a day's theme is picked (first match wins):
 *   1. `dated`  — a theme with that exact date
 *   2. `weekly` — a theme for that weekday
 *   3. `pool`   — on some other days (see `poolChance`), a theme from the pool. Everyone
 *                 gets the same one, and a pool theme won't repeat within 7 days.
 *   4. otherwise a normal grid
 *
 * Each theme needs a `name` and either:
 *   pokemon: ["eevee", "umbreon", ...]   ids as they appear in data.js ("id":"...")
 *   match: (p) => ...                    a test on a Pokémon record from data.js,
 *                                        plus p.starter and p.fossil (set in script.js)
 * Optional `description` is shown when the player taps the theme header.
 *
 * Aim for 8+ Pokémon so a grid can be built. If no valid grid can be made with a
 * theme, that day quietly falls back to a normal grid (with a console warning).
 * Test a date while running locally with: /pokopia-doku/?date=2026-10-31 (ignored on the live site)
 */

window.POKOPIA_THEMES = {
    // One-off themes on specific dates (YYYY-MM-DD). These win over weekly themes.
    dated: [
        // {
        //     date: "2026-10-31",
        //     name: "Halloween haunts",
        //     description: "Ghost-type Pokémon, plus anything that loves spooky stuff.",
        //     match: (p) => p.types.includes("Ghost") || p.favorites.includes("Spooky stuff"),
        // },
        // { date: "2026-11-02", name: "J's favorite Pokémon", pokemon: ["eevee", "umbreon", "mimikyu", ...] },
    ],

    // Recurring themes. weekday: 0 = Sunday, 1 = Monday … 6 = Saturday
    weekly: [
        // { weekday: 5, name: "Fossil Friday", match: (p) => p.fossil || p.types.includes("Rock") },
    ],

    // Undated themes that some ordinary days pull from.
    pool: [
        {
            name: "Eevee & its evolutions",
            pokemon: ["eevee", "vaporeon", "jolteon", "flareon", "espeon", "umbreon", "leafeon", "glaceon", "sylveon"],
        },
    ],

    // Share of days with no dated/weekly theme that get a pool theme (0–1).
    poolChance: 0.25,
};
