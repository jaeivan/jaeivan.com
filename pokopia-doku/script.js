const DEX = window.POKOPIA_DEX;
const BY_ID = new Map(DEX.map((p) => [p.id, p]));

// Hand-kept lists for categories PokeAPI doesn't flag. Each Pokémon record gets
// p.starter / p.fossil (p.baby comes from PokeAPI), usable in themes.js `match` too.
const STARTER_IDS = [
    "bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard",
    "squirtle", "wartortle", "blastoise", "chikorita", "bayleef", "meganium",
    "cyndaquil", "quilava", "typhlosion", "totodile", "croconaw", "feraligatr",
    "treecko", "grovyle", "sceptile", "torchic", "combusken", "blaziken",
    "mudkip", "marshtomp", "swampert", "turtwig", "grotle", "torterra",
    "chimchar", "monferno", "infernape", "piplup", "prinplup", "empoleon",
    "snivy", "servine", "serperior", "tepig", "pignite", "emboar",
    "oshawott", "dewott", "samurott", "chespin", "quilladin", "chesnaught",
    "fennekin", "braixen", "delphox", "froakie", "frogadier", "greninja",
    "rowlet", "dartrix", "decidueye", "litten", "torracat", "incineroar",
    "popplio", "brionne", "primarina", "grookey", "thwackey", "rillaboom",
    "scorbunny", "raboot", "cinderace", "sobble", "drizzile", "inteleon",
    "sprigatito", "floragato", "meowscarada", "fuecoco", "crocalor", "skeledirge",
    "quaxly", "quaxwell", "quaquaval",
];
const FOSSIL_IDS = [
    "omanyte", "omastar", "kabuto", "kabutops", "aerodactyl", "lileep", "cradily", "anorith", "armaldo",
    "cranidos", "rampardos", "shieldon", "bastiodon", "tirtouga", "carracosta", "archen", "archeops",
    "tyrunt", "tyrantrum", "amaura", "aurorus", "dracozolt", "arctozolt", "dracovish", "arctovish",
];
for (const p of DEX) {
    p.starter = STARTER_IDS.includes(p.id);
    p.fossil = FOSSIL_IDS.includes(p.id);
}
const SPECIALTY_TEXT = window.POKOPIA_SPECIALTIES || {};
const THEMES = window.POKOPIA_THEMES || {};
const LAUNCH_DATE = "2026-10-12";
const STORAGE_PREFIX = "pokopia-doku:v2:daily:";
const DIFFICULTY_PREF_KEY = "pokopia-doku:difficulty";

// ---------- Difficulty ----------
// `ratings(rng)` returns the difficulty rating (1 easy – 3 hard) for each of the 6 headers.
// Cells must have between minCell and maxCell valid answers.
// guesses: null = unlimited. hints: how many per grid (Infinity = free). hintCostsGuess: Hard.
// browse: listing a header's Pokémon in the picker, which uses a hint. "button" = its own option,
// "hint" = offered as a kind of hint, false = not available.

const DIFFICULTIES = {
    easy: {
        label: "Easy",
        ratings: (rng) => [1, 1, 1, 1, 1, rng() < 0.5 ? 2 : 1],
        minCell: 6,
        maxCell: Infinity,
        guesses: null,
        showCounts: true,
        hints: Infinity,
        hintCostsGuess: false,
        browse: "button",
    },
    medium: {
        label: "Medium",
        ratings: (rng) => [1, 2, 2, 2, rng() < 0.5 ? 1 : 2, rng() < 0.5 ? 3 : 2],
        minCell: 4,
        maxCell: Infinity,
        guesses: 9,
        showCounts: false,
        hints: 3,
        hintCostsGuess: false,
        browse: "hint",
    },
    hard: {
        label: "Hard",
        ratings: (rng) => [3, 3, 3, rng() < 0.5 ? 3 : 2, 2, rng() < 0.3 ? 1 : 2],
        minCell: 2,
        maxCell: 10,
        guesses: 9,
        showCounts: false,
        hints: Infinity,
        hintCostsGuess: true,
        browse: false,
    },
};

// Daily difficulty by weekday (0 = Sunday): Mon–Tue Easy, Wed–Thu Medium, Fri–Sun Hard.
const WEEKDAY_DIFFICULTY = ["hard", "easy", "easy", "medium", "medium", "hard", "hard"];

// ---------- Categories ----------
// Each category: { key, group, tag, label, rating, description, answers, test(p) }.
// Rating = how hard it is to think of answers: by group, then per-category overrides,
// then +1 for very small categories. Retune here after playtesting.

const MIN_ANSWERS = 8;
const SINGLE_GROUPS = new Set(["habitat", "flavor", "gen"]);

const GROUP_RATINGS = {
    type: 1, dual: 1, evo: 1, status: 1,
    gen: 2, specialty: 2, habitat: 2, multi: 2, location: 2, spawn: 2, rarity: 2, time: 2,
    flavor: 3, favorite: 3,
};
const RATING_OVERRIDES = {
    "gen:1": 1,
    "status:baby": 2,
    "specialty:Water": 1,
    "specialty:Burn": 1,
    "specialty:Fly": 1,
    "specialty:Grow": 1,
    "specialty:Generate": 1,
    "favorite:Lots of fire": 2,
    "favorite:Lots of water": 2,
    "favorite:Lots of nature": 2,
    "status:underwater": 2,
};
const SMALL_CATEGORY = 12;
const SMALL_CATEGORY_CELLS = 15; // categories smaller than this get a lower per-square minimum

function valuesOf(field) {
    const set = new Set();
    for (const p of DEX) [].concat(p[field] ?? []).forEach((v) => set.add(v));
    return [...set].sort();
}

const GENERATIONS = {
    1: { region: "Kanto", games: "Red, Blue & Yellow" },
    2: { region: "Johto", games: "Gold, Silver & Crystal" },
    3: { region: "Hoenn", games: "Ruby, Sapphire & Emerald" },
    4: { region: "Sinnoh", games: "Diamond, Pearl & Platinum" },
    5: { region: "Unova", games: "Black & White" },
    6: { region: "Kalos", games: "X & Y" },
    7: { region: "Alola", games: "Sun & Moon" },
    8: { region: "Galar", games: "Sword & Shield" },
    9: { region: "Paldea", games: "Scarlet & Violet" },
};
const genRegion = (gen) => GENERATIONS[gen]?.region ?? `Gen ${gen}`;
const genDetail = (gen) => (GENERATIONS[gen] ? `Gen ${gen} (${GENERATIONS[gen].games})` : `Gen ${gen}`);

const listOf = (values) => values.slice(0, -1).join(", ") + " or " + values.at(-1);

function buildCategories() {
    const cats = [];
    const add = (group, tag, value, label, description, test) =>
        cats.push({ key: `${group}:${value}`, group, tag, label, description, test });

    const habitats = valuesOf("habitat");
    const flavors = valuesOf("flavor");

    valuesOf("specialties").forEach((v) =>
        add("specialty", "Specialty", v, v, SPECIALTY_TEXT[v] || `Pokémon with the ${v} specialty.`, (p) => p.specialties.includes(v)),
    );
    habitats.forEach((v) =>
        add("habitat", "Ideal habitat", v, v, `Pokémon whose ideal habitat is ${v}. Every Pokémon has exactly one: ${listOf(habitats)}.`, (p) => p.habitat === v),
    );
    flavors.forEach((v) =>
        add("flavor", "Favorite flavor", v, v, `Pokémon whose favorite food flavor is ${v}. Every Pokémon has one: ${listOf(flavors)}.`, (p) => p.flavor === v),
    );
    valuesOf("favorites").forEach((v) =>
        add("favorite", "Favorite", v, v, `Pokémon that list "${v}" among their favorite things.`, (p) => p.favorites.includes(v)),
    );
    add("multi", "Specialty", "2plus", "2+ Specialties", "Pokémon with two or more specialties.", (p) => p.specialties.length >= 2);

    valuesOf("types").forEach((v) =>
        add("type", "Type", v, v, `${v}-type Pokémon (either of their types counts).`, (p) => p.types.includes(v)),
    );
    valuesOf("gen").forEach((v) =>
        add("gen", "Region", v, genRegion(v), `Pokémon first introduced in ${genRegion(v)}, the region of the main series' ${genDetail(v)}.`, (p) => p.gen === v),
    );
    add("evo", "Evolution", "final", "Fully Evolved", "The final stage of an evolution line in the main series (e.g. Charizard). Pokémon that don't evolve at all aren't included.", (p) => p.fullyEvolved && p.inLine);
    add("evo", "Evolution", "unevolved", "Not Fully Evolved", "\"NFE\": Pokémon that can still evolve in the main series (e.g. Charmander or Charmeleon).", (p) => !p.fullyEvolved);
    add("evo", "Evolution", "none", "Single-Stage", "Pokémon that don't evolve and don't evolve from anything (e.g. Lapras).", (p) => !p.inLine);
    add("status", "Status", "legend", "Legendary or Mythical", "Legendary or Mythical Pokémon in the main series (e.g. Mewtwo or Mew).", (p) => p.legendary || p.mythical);
    add("status", "Status", "starter", "Starter", "Any stage of a main-series starter Pokémon's evolution line (e.g. Bulbasaur, Ivysaur or Venusaur).", (p) => p.starter);
    add("status", "Status", "fossil", "Fossil", "Pokémon revived from fossils in the main series (e.g. Aerodactyl).", (p) => p.fossil);
    add("status", "Status", "baby", "Baby", "Pokémon officially classed as baby Pokémon in the main series (e.g. Pichu).", (p) => p.baby);

    // Where and when they spawn, from Serebii's "Habitats & Locations". Areas every Pokémon
    // shares get dropped by the 75% rule below, which leaves the DLC areas.
    valuesOf("locations").forEach((v) =>
        add("location", "Found in", v, v, `Pokémon that can spawn in ${v}.`, (p) => p.locations.includes(v)),
    );
    const spawnsIn = (p, word) => p.spawnHabitats.some((h) => h.toLowerCase().includes(word));
    add("spawn", "Spawns in", "tallgrass", "Tall Grass", "Pokémon that spawn in a habitat made with tall grass (any color, e.g. Hydrated tall grass).", (p) => spawnsIn(p, "tall grass"));
    add("spawn", "Spawns in", "flowers", "Flower Beds", "Pokémon that spawn in a habitat made with flowers (e.g. Pretty flower bed or Field of flowers).", (p) => spawnsIn(p, "flower"));
    add("time", "Time of day", "night", "Night Only", "Pokémon that only spawn at night, never in the morning, day or evening.", (p) => p.times.length === 1 && p.times[0] === "Night");
    add("rarity", "Rarity", "rare", "Rare Spawn", "Pokémon that are Rare or Very Rare in at least one of the habitats they spawn in.", (p) => p.rarity.includes("Rare") || p.rarity.includes("Very Rare"));
    add("rarity", "Rarity", "veryrare", "Very Rare Spawn", "Pokémon that are Very Rare in at least one of the habitats they spawn in.", (p) => p.rarity.includes("Very Rare"));
    add("status", "Status", "underwater", "Can Go Underwater", "Pokémon marked as underwater capable in the Pokopia dex.", (p) => p.underwater);

    add("dual", "Type", "dual", "Dual-Type", "Pokémon with two types (e.g. Charizard, Fire/Flying).", (p) => p.types.length >= 2);
    add("dual", "Type", "mono", "Monotype", "Pokémon with only one type (e.g. Pikachu, Electric).", (p) => p.types.length === 1);

    for (const c of cats) {
        c.answers = DEX.filter(c.test).map((p) => p.id);
        const base = RATING_OVERRIDES[c.key] ?? GROUP_RATINGS[c.group] ?? 2;
        c.rating = Math.min(3, base + (c.answers.length < SMALL_CATEGORY ? 1 : 0));
    }
    return cats.filter((c) => c.answers.length >= MIN_ANSWERS && c.answers.length < DEX.length * 0.75);
}

const CATEGORIES = buildCategories();

// ---------- Themes ----------

// Built (and checked for unknown ids) once per theme object, then reused.
const themeCategoryCache = new WeakMap();
function themeCategory(theme) {
    if (!themeCategoryCache.has(theme)) themeCategoryCache.set(theme, buildThemeCategory(theme));
    return themeCategoryCache.get(theme);
}

function buildThemeCategory(theme) {
    let answers;
    if (theme.pokemon) {
        const unknown = theme.pokemon.filter((id) => !BY_ID.has(id));
        if (unknown.length) console.warn(`Theme "${theme.name}": unknown Pokémon ids`, unknown);
        answers = theme.pokemon.filter((id) => BY_ID.has(id));
    } else {
        answers = DEX.filter(theme.match).map((p) => p.id);
    }
    const set = new Set(answers);
    return {
        key: `theme:${theme.name}`,
        group: "theme",
        tag: "★ Theme",
        label: theme.name,
        description: theme.description || "Pokémon picked for today's theme.",
        isTheme: true,
        answers,
        test: (p) => set.has(p.id),
    };
}

const weekdayOf = (date) => new Date(date + "T00:00:00Z").getUTCDay();

function addDays(date, n) {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

function fixedThemeFor(date) {
    return (THEMES.dated || []).find((t) => t.date === date) || (THEMES.weekly || []).find((t) => t.weekday === weekdayOf(date)) || null;
}

// Pool themes are picked by walking forward from launch so a theme never repeats within 7 days.
const poolPicks = new Map();
function poolThemeFor(date) {
    const pool = THEMES.pool || [];
    if (!pool.length || date < LAUNCH_DATE) return null;
    if (poolPicks.has(date)) return poolPicks.get(date);
    const recent = [];
    let pick = null;
    for (let d = LAUNCH_DATE; d <= date; d = addDays(d, 1)) {
        if (poolPicks.has(d)) {
            pick = poolPicks.get(d);
        } else {
            pick = null;
            const rng = mulberry32(hashString("pool:" + d));
            if (!fixedThemeFor(d) && rng() < (THEMES.poolChance ?? 0.25)) {
                const candidates = pool.filter((t) => !recent.slice(-6).some((r) => r?.name === t.name));
                if (candidates.length) pick = candidates[Math.floor(rng() * candidates.length)];
            }
            poolPicks.set(d, pick);
        }
        recent.push(pick);
    }
    return pick;
}

const themeForDate = (date) => fixedThemeFor(date) || poolThemeFor(date);

// ---------- Seeded randomness ----------

function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function shuffle(rng, arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ---------- Grid generation ----------

function intersect(a, b) {
    const set = new Set(b.answers);
    return a.answers.filter((id) => set.has(id));
}

// Assign a distinct Pokémon to every cell (bipartite matching), or null if impossible.
// `exclude` holds ids that can't be used.
function findMatching(cellAnswers, exclude = new Set()) {
    const owner = new Map();
    function tryCell(i, seen) {
        for (const id of cellAnswers[i]) {
            if (seen.has(id) || exclude.has(id)) continue;
            seen.add(id);
            if (!owner.has(id) || tryCell(owner.get(id), seen)) {
                owner.set(id, i);
                return true;
            }
        }
        return false;
    }
    if (!cellAnswers.every((answers, i) => !answers.length || tryCell(i, new Set()))) return null;
    const result = cellAnswers.map(() => null);
    owner.forEach((i, id) => (result[i] = id));
    return result;
}

const hasPerfectMatching = (cellAnswers) => findMatching(cellAnswers) !== null;

// Pick a group first so groups with many values (e.g. favorites) don't dominate,
// and keep one-off categories (dual-type, legendary…) as occasional spice.
const GROUP_WEIGHTS = {
    specialty: 3, favorite: 3, type: 3, habitat: 2, flavor: 2, gen: 2, evo: 1, multi: 0.5, dual: 0.5, status: 1.5,
    location: 0.5, spawn: 1, time: 0.5, rarity: 0.4,
};

// Categories bucketed by rating, then by group, once up front (pickCategory runs thousands of times per grid).
const BY_RATING = {};
for (const c of CATEGORIES) {
    const bucket = (BY_RATING[c.rating] ??= { groups: new Map(), totalWeight: 0 });
    if (!bucket.groups.has(c.group)) {
        bucket.groups.set(c.group, []);
        bucket.totalWeight += GROUP_WEIGHTS[c.group] ?? 1;
    }
    bucket.groups.get(c.group).push(c);
}

function pickCategory(rng, rating) {
    const { groups, totalWeight } = BY_RATING[rating];
    let r = rng() * totalWeight;
    for (const [group, cats] of groups) {
        r -= GROUP_WEIGHTS[group] ?? 1;
        if (r < 0) return pick(rng, cats);
    }
    return pick(rng, groups.values().next().value);
}

function generateGrid(seedString, difficulty, theme = null) {
    const cfg = DIFFICULTIES[difficulty];
    const rng = mulberry32(hashString(seedString));
    const themeCat = theme && themeCategory(theme);
    for (let attempt = 0; attempt < 20000; attempt++) {
        const ratings = shuffle(rng, cfg.ratings(rng)).slice(0, themeCat ? 5 : 6);
        const chosen = ratings.map((r) => pickCategory(rng, r));
        if (new Set(chosen.map((c) => c.key)).size < chosen.length) continue;
        // Don't pair a theme with a category that has the same members (e.g. a starters theme + Starter).
        if (themeCat && chosen.some((c) => c.answers.length === themeCat.answers.length && c.answers.every((id) => themeCat.test(BY_ID.get(id))))) continue;
        if (themeCat) chosen.splice(Math.floor(rng() * 6), 0, themeCat);

        const rows = chosen.slice(0, 3);
        const cols = chosen.slice(3);
        // Same single-valued group on both axes would leave empty cells.
        if (rows.some((r) => SINGLE_GROUPS.has(r.group) && cols.some((c) => c.group === r.group))) continue;
        // Keep each axis varied.
        if (new Set(rows.map((c) => c.group)).size < 2 || new Set(cols.map((c) => c.group)).size < 2) continue;

        const cellAnswers = [];
        let ok = true;
        for (const r of rows) {
            for (const c of cols) {
                const answers = intersect(r, c);
                const themed = r.isTheme || c.isTheme;
                // Small categories (Fossil, Baby, Legendary…) can't reach the usual per-square
                // minimum, so they get a lower one, like themes.
                const small = r.answers.length < SMALL_CATEGORY_CELLS || c.answers.length < SMALL_CATEGORY_CELLS;
                const min = themed ? 2 : small ? Math.min(cfg.minCell, 3) : cfg.minCell;
                const max = themed ? Infinity : cfg.maxCell;
                if (answers.length < min || answers.length > max) ok = false;
                cellAnswers.push(answers);
            }
        }
        if (!ok || !hasPerfectMatching(cellAnswers)) continue;
        return { rows, cols, cellAnswers, theme: themeCat ? theme : null };
    }
    return null;
}

// ---------- Dates ----------

// `?date=YYYY-MM-DD` previews another day's daily when testing locally (ignored on the live site,
// so nobody can play future puzzles early).
const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(location.hostname);

function todayString() {
    const override = IS_LOCAL && new URLSearchParams(location.search).get("date");
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "October 12, 2026" (UTC so the date string never shifts by a day)
const formatDate = (dateString) =>
    new Date(dateString + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// ---------- Storage (best effort) ----------

function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {}
}

function loadDaily(date) {
    try {
        return JSON.parse(storageGet(STORAGE_PREFIX + date)) || null;
    } catch {
        return null;
    }
}

const SAVED_FIELDS = ["cells", "missed", "guessesLeft", "gaveUp", "hintsUsed", "hintTiers", "hintTargets", "browseUnlocked"];

// Identifies a grid by its six headers. Saved progress only applies to the exact grid it was
// played on, so a data/theme update that changes the day's grid can't misplace old answers.
const gridKey = (grid) => [...grid.rows, ...grid.cols].map((c) => c.key).join("|");

function saveDaily() {
    if (state.mode !== "daily") return;
    const saved = Object.fromEntries(SAVED_FIELDS.map((k) => [k, state[k]]));
    saved.grid = gridKey(state.grid);
    storageSet(STORAGE_PREFIX + state.date, JSON.stringify(saved));
}

// ---------- Sprites & search ----------

const spriteUrl = (p) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.natDex}.png`;
const fallbackSprite = (p) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${p.natDex}.png`;

function spriteImg(p) {
    const img = document.createElement("img");
    img.src = spriteUrl(p);
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => {
        img.onerror = null;
        img.src = fallbackSprite(p);
    };
    return img;
}

const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const SEARCH_INDEX = DEX.map((p) => ({ p, key: normalize(p.name) })).sort((a, b) => a.key.localeCompare(b.key));

// With a `filter` category, lists every match (narrowed by the query); otherwise the top 12 name matches.
function search(query, filter = null) {
    const q = normalize(query);
    const entries = filter ? SEARCH_INDEX.filter((e) => filter.test(e.p)) : SEARCH_INDEX;
    if (!q) return filter ? entries.map((e) => e.p) : [];
    const prefix = entries.filter((e) => e.key.startsWith(q));
    const inner = entries.filter((e) => !e.key.startsWith(q) && e.key.includes(q));
    const results = [...prefix, ...inner].map((e) => e.p);
    return filter ? results : results.slice(0, 12);
}

// ---------- Game state ----------

const state = {
    mode: "daily",
    date: todayString(),
    difficulty: "medium",
    grid: null,
    cells: Array(9).fill(null),
    missed: Array(9).fill(false), // squares with a wrong guess (shared as 🟥 unless later solved)
    guessesLeft: null,
    gaveUp: false,
    hintsUsed: 0,
    hintTiers: Array(9).fill(0),
    hintTargets: Array(9).fill(null),
    browseUnlocked: Array(9).fill(false),
    activeCell: null,
    browseFilter: null, // "row" | "col" | null
};

const $ = (id) => document.getElementById(id);
const cfg = () => DIFFICULTIES[state.difficulty];

function resetProgress(saved = {}) {
    state.cells = saved.cells ?? Array(9).fill(null);
    state.missed = saved.missed ?? Array(9).fill(false);
    state.guessesLeft = saved.guessesLeft !== undefined ? saved.guessesLeft : cfg().guesses;
    state.gaveUp = saved.gaveUp ?? false;
    state.hintsUsed = saved.hintsUsed ?? 0;
    state.hintTiers = saved.hintTiers ?? Array(9).fill(0);
    state.hintTargets = saved.hintTargets ?? Array(9).fill(null);
    state.browseUnlocked = saved.browseUnlocked ?? Array(9).fill(false);
}

function startDaily() {
    state.mode = "daily";
    state.date = todayString();
    state.difficulty = WEEKDAY_DIFFICULTY[weekdayOf(state.date)];
    state.grid = dailyGrid(state.date, state.difficulty);
    const saved = loadDaily(state.date);
    resetProgress(saved && saved.grid === gridKey(state.grid) ? saved : {});
    render();
}

// The day's grid: the theme (if any) first, then a normal grid. Each tries a few extra
// deterministic seeds, so everyone still gets the same grid and a hard day never fails to load.
function dailyGrid(date, difficulty) {
    const seeds = Array.from({ length: 10 }, (_, n) => (n ? `daily:${date}:${n}` : `daily:${date}`));
    const theme = themeForDate(date);
    if (theme) {
        for (const seed of seeds) {
            const grid = generateGrid(seed, difficulty, theme);
            if (grid) return grid;
        }
        console.warn(`Theme "${theme.name}" couldn't make a valid grid; using a normal grid.`);
    }
    for (const seed of seeds) {
        const grid = generateGrid(seed, difficulty);
        if (grid) return grid;
    }
    throw new Error(`No valid ${difficulty} grid for ${date}`);
}

function startUnlimited(difficulty = state.unlimitedDifficulty) {
    state.mode = "unlimited";
    state.difficulty = state.unlimitedDifficulty = difficulty;
    storageSet(DIFFICULTY_PREF_KEY, difficulty);
    let grid = null;
    // With themes on, try every theme in random order until one makes a valid grid.
    const themes = themePrefs.enabled ? ALL_THEMES : [];
    for (const theme of shuffle(Math.random, themes)) {
        grid = generateGrid("unlimited:" + Math.random(), difficulty, theme);
        if (grid) break;
    }
    if (themes.length && !grid) toast(`No theme fits a ${DIFFICULTIES[difficulty].label} grid`);
    while (!grid) grid = generateGrid("unlimited:" + Math.random(), difficulty);
    state.grid = grid;
    resetProgress();
    render();
}

state.unlimitedDifficulty = DIFFICULTIES[storageGet(DIFFICULTY_PREF_KEY)] ? storageGet(DIFFICULTY_PREF_KEY) : "medium";

// ---------- Unlimited theme options ----------

const THEME_PREFS_KEY = "pokopia-doku:unlimited-themes";
// Every theme from themes.js once (dated, weekly and pool), by name.
const ALL_THEMES = [...(THEMES.dated || []), ...(THEMES.weekly || []), ...(THEMES.pool || [])].filter(
    (t, i, all) => all.findIndex((x) => x.name === t.name) === i,
);

const themePrefs = (() => {
    try {
        return { enabled: !!JSON.parse(storageGet(THEME_PREFS_KEY))?.enabled };
    } catch {
        return { enabled: false };
    }
})();

const saveThemePrefs = () => storageSet(THEME_PREFS_KEY, JSON.stringify(themePrefs));

function renderThemeOptions() {
    $("themeOptions").hidden = state.mode !== "unlimited" || !ALL_THEMES.length;
    $("themesToggle").checked = themePrefs.enabled;
}

const filledCount = () => state.cells.filter(Boolean).length;
const isOver = () => state.gaveUp || filledCount() === 9 || state.guessesLeft === 0;
const rowOf = (i) => state.grid.rows[Math.floor(i / 3)];
const colOf = (i) => state.grid.cols[i % 3];
const isThemeCell = (i) => rowOf(i).isTheme || colOf(i).isTheme;

// One valid, unused answer per empty cell (for the end-of-game reveal).
function revealAnswers() {
    const used = new Set(state.cells.filter(Boolean));
    const open = state.grid.cellAnswers.map((answers, i) => (state.cells[i] ? [] : answers));
    const matching = findMatching(open, used);
    return state.grid.cellAnswers.map((answers, i) => {
        if (state.cells[i]) return null;
        return matching?.[i] ?? answers.find((a) => !used.has(a)) ?? answers[0];
    });
}

// ---------- Hints ----------

const HINT_TIERS = 4; // count, first letter, types + gen, silhouette

function hintsLeft() {
    const c = cfg();
    if (c.hintCostsGuess) return Math.max(0, state.guessesLeft - 1); // a hint can't use your last guess
    return c.hints === Infinity ? Infinity : Math.max(0, c.hints - state.hintsUsed);
}

function spendHint() {
    if (isOver() || hintsLeft() <= 0) return false;
    state.hintsUsed++;
    if (cfg().hintCostsGuess) state.guessesLeft--;
    return true;
}

// The Pokémon a square's hints describe. Chosen once (a valid answer not already on the board
// or targeted by another square's hints) and then kept, so clues the player paid for never
// silently switch to a different Pokémon.
function hintTarget(i) {
    if (state.hintTargets[i]) return state.hintTargets[i];
    const taken = new Set([...state.cells, ...state.hintTargets].filter(Boolean));
    const open = state.grid.cellAnswers.map((answers, j) => (state.cells[j] || (j !== i && state.hintTargets[j]) ? [] : answers));
    const matching = findMatching(open, taken);
    const target = matching?.[i] ?? state.grid.cellAnswers[i].find((a) => !taken.has(a)) ?? state.grid.cellAnswers[i][0];
    state.hintTargets[i] = target;
    return target;
}

// True when the hinted Pokémon has since been placed in another square (so it can't go here).
const hintTargetUsedElsewhere = (i) => state.hintTargets[i] && state.cells.some((id, j) => j !== i && id === state.hintTargets[i]);

function nextHintTier(i) {
    // Easy already shows the answer count on the board, so its first hint skips that tier.
    return Math.max(state.hintTiers[i], cfg().showCounts ? 1 : 0);
}

function useHint() {
    const i = state.activeCell;
    if (nextHintTier(i) >= HINT_TIERS || !spendHint()) return;
    hintTarget(i);
    state.hintTiers[i] = nextHintTier(i) + 1;
    saveDaily();
    render();
    renderPicker();
}

function unlockBrowse() {
    const i = state.activeCell;
    if (!cfg().browse || state.browseUnlocked[i] || !spendHint()) return;
    state.browseUnlocked[i] = true;
    state.browseFilter = "row";
    saveDaily();
    render();
    renderPicker();
}

function hintClues(i) {
    const clues = [];
    const tier = state.hintTiers[i];
    if (tier >= 1 || cfg().showCounts) clues.push(`${state.grid.cellAnswers[i].length} Pokémon fit this square.`);
    if (tier < 2) return clues; // the answer count doesn't need a target Pokémon
    const p = BY_ID.get(hintTarget(i));
    clues.push(`One answer: ${p.name[0]}${" _".repeat(p.name.length - 1)} (${p.name.length} letters)`);
    if (tier >= 3) clues.push(`It's ${p.types.join("/")} type, from ${genDetail(p.gen)}.`);
    if (tier >= 4) clues.push({ silhouette: p });
    if (hintTargetUsedElsewhere(i)) clues.push({ note: `You've used ${p.name} in another square, so it can't go here too.` });
    return clues;
}

function hintCostText() {
    const c = cfg();
    if (c.hintCostsGuess) return "Each hint costs 1 PP";
    if (c.hints === Infinity) return "Hints are free";
    return `${hintsLeft()} hint${hintsLeft() === 1 ? "" : "s"} left`;
}

// ---------- Rendering ----------

// Header badges: types look like in-game type badges,
// flavors and habitats get their own colors, everything else is a plain chip.
const TYPE_COLORS = {
    Normal: "#9fa19f", Fire: "#e62829", Water: "#2980ef", Electric: "#fac000", Grass: "#3fa129", Ice: "#3dcef3",
    Fighting: "#ff8000", Poison: "#9141cb", Ground: "#915121", Flying: "#81b9ef", Psychic: "#ef4179", Bug: "#91a119",
    Rock: "#afa981", Ghost: "#704170", Dragon: "#5060e1", Dark: "#624d4e", Steel: "#60a1b8", Fairy: "#ef70ef",
};
const FLAVOR_COLORS = { Sweet: "#f7a8c8", Sour: "#f2d65c", Spicy: "#f28b6b", Bitter: "#9fd08a", Dry: "#8fc1ec" };
const HABITAT_COLORS = { Bright: "#f9dc6b", Dark: "#7f6aa8", Humid: "#6cc7c0", Warm: "#f4a259", Dry: "#d8b98a", Cool: "#9fd3f2" };
// Specialties: solid chips colored by what the job does. Unlisted (new DLC) ones fall back to a plain chip.
const SPECIALTY_COLORS = {
    Grow: "#4caf50", Burn: "#e8572a", Water: "#2f8fe0", Fly: "#7fb8ec", Search: "#c9a46a", Trade: "#e0b030",
    Litter: "#a07850", Generate: "#f5c518", Hype: "#ef6fa8", Crush: "#8a8f99", Chop: "#8b5a2b", Build: "#f08c2e",
    Gather: "#9cae4a", Bulldoze: "#d4a017", Teleport: "#9b59d0", Recycle: "#3fb59a", Storage: "#6b7a8f",
    Explode: "#d63a3a", Collect: "#c99a2e", Yawn: "#b7a6e0", Appraise: "#c08a3e", Transform: "#c47ad8",
    "Gather Honey": "#f2b134", "Dream Island": "#c9a2e8", Illuminate: "#ffd84d", Eat: "#6aa84f", Paint: "#e04f9e",
    DJ: "#7b4fd6", Party: "#ff8fab", Rarify: "#9aa7d6", Engineer: "#5d7f99", Scrub: "#5cc8d6",
};
// Favorite things: tinted chips with a colored outline.
const FAVORITE_COLORS = {
    "Lots of nature": "#4caf50", "Soft stuff": "#e9a7c4", "Cute stuff": "#ff8fb8", "Pretty flowers": "#e86a9a",
    "Luxury": "#d4a72c", "Lots of fire": "#e8572a", "Nice breezes": "#7fc4ec", "Wooden stuff": "#a0703d",
    "Exercise": "#f08c2e", "Watching stuff": "#6b7a8f", "Play spaces": "#8bc34a", "Group activities": "#ff7f6b",
    "Stone stuff": "#8a8f99", "Lots of water": "#2f8fe0", "Strange stuff": "#9b59d0", "Shiny stuff": "#e6c229",
    "Hard stuff": "#5f6670", "Cleanliness": "#5cc8d6", "Containers": "#b8935a", "Electronics": "#f5c518",
    "Metal stuff": "#7a8ea3", "Round stuff": "#f4a582", "Healing": "#5fd3a0", "Fabric": "#b39ddb",
    "Rides": "#26a69a", "Slender objects": "#b5a26b", "Glass stuff": "#8fd3ea", "Lots of dirt": "#8b5a2b",
    "Spooky stuff": "#5b3f8c", "Complicated stuff": "#3f51b5", "Colorful stuff": "#e04f9e", "Construction": "#e6a117",
    "Garbage": "#7d8a3a", "Ocean vibes": "#1c8fb0", "Gatherings": "#ff8a80", "Wobbly stuff": "#f48fb1",
    "Noisy stuff": "#ff7043", "Looks like food": "#f6a65a", "Symbols": "#5c6bc0", "Letters and words": "#a1887f",
    "Sharp stuff": "#90a4ae", "Spinning stuff": "#4db6ac", "Blocky stuff": "#ef5350",
};
const MULTI_COLOR = "#3fb59a";
// Spawn categories and one-offs, by category key.
const KEY_COLORS = {
    "location:Bubbly Basin": "#3cc6d8", "spawn:tallgrass": "#5aa832", "spawn:flowers": "#f08cbc",
    "time:night": "#2f3a6b", "rarity:rare": "#e6b422", "rarity:veryrare": "#9b59d0", "status:underwater": "#1c7fc4",
};

function badgeEl(cat) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = cat.label;
    const value = cat.key.slice(cat.group.length + 1);
    const color =
        (cat.group === "type" && TYPE_COLORS[value]) ||
        (cat.group === "flavor" && FLAVOR_COLORS[value]) ||
        (cat.group === "habitat" && HABITAT_COLORS[value]) ||
        (cat.group === "specialty" && SPECIALTY_COLORS[value]) ||
        (cat.group === "multi" && MULTI_COLOR) ||
        (cat.group === "favorite" && FAVORITE_COLORS[value]) ||
        KEY_COLORS[cat.key];
    if (cat.group === "type") badge.classList.add("type");
    if (cat.group === "favorite" && color) {
        // Tinted chip: the text sits on a light background, so no white-text check.
        badge.classList.add("tint");
        badge.style.setProperty("--c", color);
        return badge;
    }
    if (cat.isTheme) badge.classList.add("theme");
    if (color) {
        badge.classList.add("colored");
        badge.style.setProperty("--c", color);
        // Light text on dark chips (e.g. the Dark habitat).
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
        if (cat.group !== "type" && 0.299 * r + 0.587 * g + 0.114 * b < 140) badge.style.color = "white";
    }
    return badge;
}

// Shrink any badge whose longest word is wider than its header (narrow phones).
function fitBadges() {
    document.querySelectorAll("#board .badge").forEach((badge) => {
        badge.style.fontSize = "";
        let size = parseFloat(getComputedStyle(badge).fontSize);
        while (badge.scrollWidth > badge.clientWidth && size > 7) {
            size -= 0.5;
            badge.style.fontSize = `${size}px`;
        }
    });
}
window.addEventListener("resize", fitBadges);

function headerEl(cat) {
    const btn = document.createElement("button");
    btn.className = "header" + (cat.isTheme ? " theme" : "");
    btn.setAttribute("aria-label", `${cat.tag}: ${cat.label}. Tap for details`);
    const tag = document.createElement("small");
    tag.textContent = cat.tag;
    btn.append(tag, badgeEl(cat));
    btn.addEventListener("click", () => openExplain(cat));
    return btn;
}

// Guesses shown as PP. Like in the games, PP turns yellow at half, orange when low, red when out.
function renderPP() {
    const pp = $("ppValue");
    const max = cfg().guesses;
    if (max === null) {
        // Easy: unlimited guesses, shown against the 9 squares.
        // The pixel font has no ∞, so it gets its own font.
        const inf = document.createElement("span");
        inf.className = "infinity";
        inf.textContent = "∞";
        pp.replaceChildren(inf, "/9");
        pp.className = "";
        return;
    }
    const left = state.guessesLeft;
    pp.textContent = `${left}/${max}`;
    pp.className = left === 0 ? "pp-out" : left <= max / 4 ? "pp-low" : left <= max / 2 ? "pp-half" : "";
}

function render() {
    const { rows, cols } = state.grid;
    const c = cfg();
    const over = isOver();
    const reveal = over ? revealAnswers() : [];

    $("dailyTab").classList.toggle("active", state.mode === "daily");
    $("unlimitedTab").classList.toggle("active", state.mode === "unlimited");
    $("unlimitedControls").hidden = state.mode !== "unlimited";
    $("themeOptions").hidden = state.mode !== "unlimited" || !ALL_THEMES.length;
    document.querySelectorAll("#difficultyTabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.difficulty === state.difficulty));

    $("puzzleLabel").textContent = state.mode === "daily" ? formatDate(state.date) : "Unlimited";
    const pill = $("difficultyPill");
    pill.textContent = c.label;
    pill.className = `pill ${state.difficulty}`;
    renderPP();
    $("hintsLabel").textContent = c.hints === Infinity && !c.hintCostsGuess ? "💡 Free hints" : `💡 ${hintCostText()}`;

    const board = $("board");
    board.replaceChildren();
    board.append(document.createElement("div"));
    cols.forEach((col) => board.append(headerEl(col)));

    rows.forEach((row, r) => {
        board.append(headerEl(row));
        cols.forEach((col, ci) => {
            const i = r * 3 + ci;
            const btn = document.createElement("button");
            btn.className = "cell";
            btn.dataset.index = i;
            btn.setAttribute("aria-label", `${row.label} and ${col.label}`);
            const id = state.cells[i] || reveal[i];
            if (id) {
                const p = BY_ID.get(id);
                const name = document.createElement("span");
                name.className = "name";
                name.textContent = p.name;
                btn.append(spriteImg(p), name);
                btn.classList.add(state.cells[i] ? "correct" : "revealed");
                if (state.cells[i] && isThemeCell(i)) {
                    const star = document.createElement("span");
                    star.className = "star";
                    star.textContent = "⭐";
                    btn.append(star);
                }
            } else {
                // Clues already revealed by hints stay visible on the empty square.
                if (state.hintTiers[i] >= 4 && !over && !hintTargetUsedElsewhere(i)) {
                    const img = spriteImg(BY_ID.get(hintTarget(i)));
                    img.classList.add("silhouette");
                    btn.append(img);
                }
                if (c.showCounts || state.hintTiers[i] >= 1) {
                    const count = document.createElement("span");
                    count.className = "count";
                    count.textContent = `${state.grid.cellAnswers[i].length} fit`;
                    btn.append(count);
                }
                if (state.hintTiers[i] || state.browseUnlocked[i]) {
                    const bulb = document.createElement("span");
                    bulb.className = "bulb";
                    bulb.textContent = "💡";
                    btn.append(bulb);
                }
            }
            // After the game, every square opens its list of possible answers.
            btn.disabled = !over && Boolean(state.cells[i]);
            if (over) btn.setAttribute("aria-label", `${row.label} and ${col.label}: see all answers`);
            board.append(btn);
        });
    });

    fitBadges();
    document.fonts?.ready.then(fitBadges);

    $("giveUpBtn").hidden = over;
    $("shareBtn").hidden = !over;
    const summary = $("summary");
    summary.hidden = !over;
    if (over) {
        summary.textContent = `You got ${filledCount()}/9${filledCount() === 9 ? " — perfect grid! 🎉" : ""}`;
    }
}

let toastTimer;
function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 1800);
}

// ---------- Category explainer ----------

function openExplain(cat) {
    $("explainTag").textContent = cat.tag;
    $("explainTitle").textContent = cat.label;
    $("explainText").textContent = cat.description;
    $("explainCount").textContent = cat.isTheme
        ? `${cat.answers.length} Pokémon are part of this theme.`
        : `${cat.answers.length} Pokémon in Pokopia match this.`;
    $("explain").hidden = false;
    $("explainClose").focus();
}

const closeExplain = () => ($("explain").hidden = true);

// ---------- Possible answers (after the game) ----------

function openAnswers(index) {
    const picked = state.cells[index];
    const answers = state.grid.cellAnswers[index]
        .map((id) => BY_ID.get(id))
        .sort((a, b) => (a.id === picked ? -1 : b.id === picked ? 1 : a.name.localeCompare(b.name)));
    $("answersTitle").textContent = `${rowOf(index).label} × ${colOf(index).label}`;
    $("answersCount").textContent = `${answers.length} possible ${answers.length === 1 ? "answer" : "answers"}`;
    const list = $("answersList");
    list.replaceChildren();
    answers.forEach((p) => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = p.id === picked ? `${p.name} ✓ your answer` : p.name;
        li.classList.toggle("picked", p.id === picked);
        li.append(spriteImg(p), name);
        list.append(li);
    });
    list.scrollTop = 0;
    $("answers").hidden = false;
    $("answersClose").focus();
}

const closeAnswers = () => ($("answers").hidden = true);

// ---------- Picker ----------

let results = [];
let activeResult = 0;

function openPicker(index) {
    state.activeCell = index;
    state.browseFilter = state.browseUnlocked[index] ? state.browseFilter || "row" : null;
    $("pickerTitle").textContent = `${rowOf(index).label} × ${colOf(index).label}`;
    $("pickerInput").value = "";
    renderPicker();
    $("picker").hidden = false;
    $("pickerInput").focus();
}

function closePicker() {
    $("picker").hidden = true;
    state.activeCell = null;
}

function renderPicker() {
    const i = state.activeCell;
    if (i === null) return;
    const over = isOver();

    const tier = nextHintTier(i);
    const hintBtn = $("hintBtn");
    hintBtn.disabled = over || tier >= HINT_TIERS || hintsLeft() <= 0;
    hintBtn.textContent = tier >= HINT_TIERS ? "💡 No more hints" : `💡 Hint (${tier + 1}/${HINT_TIERS})`;
    const browseBtn = $("browseBtn");
    browseBtn.hidden = !cfg().browse || state.browseUnlocked[i];
    browseBtn.textContent = cfg().browse === "hint" ? "💡 Hint: browse options" : "🔍 Browse options";
    browseBtn.disabled = over || hintsLeft() <= 0;
    $("hintCost").textContent = hintCostText();

    const clues = $("hintClues");
    clues.replaceChildren();
    hintClues(i).forEach((clue) => {
        const li = document.createElement("li");
        if (clue.silhouette) {
            li.className = "silhouette";
            li.append(spriteImg(clue.silhouette), document.createTextNode("Here's its silhouette."));
        } else if (clue.note) {
            li.className = "note";
            li.textContent = clue.note;
        } else {
            li.textContent = clue;
        }
        clues.append(li);
    });

    const tabs = $("browseTabs");
    tabs.hidden = !state.browseUnlocked[i];
    if (state.browseUnlocked[i]) {
        $("browseRow").textContent = `Browse: ${rowOf(i).label}`;
        $("browseCol").textContent = `Browse: ${colOf(i).label}`;
        $("browseRow").classList.toggle("active", state.browseFilter === "row");
        $("browseCol").classList.toggle("active", state.browseFilter === "col");
    }
    renderResults();
}

function currentFilter() {
    const i = state.activeCell;
    if (i === null || !state.browseUnlocked[i] || !state.browseFilter) return null;
    return state.browseFilter === "row" ? rowOf(i) : colOf(i);
}

function renderResults() {
    const filter = currentFilter();
    results = search($("pickerInput").value, filter);
    activeResult = results.findIndex((p) => !state.cells.includes(p.id));
    const list = $("pickerList");
    list.replaceChildren();
    if (($("pickerInput").value || filter) && !results.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No Pokopia Pokémon by that name";
        list.append(li);
    }
    results.forEach((p, i) => {
        const li = document.createElement("li");
        const used = state.cells.includes(p.id);
        li.classList.toggle("used", used);
        li.classList.toggle("active", i === activeResult);
        const name = document.createElement("span");
        name.textContent = used ? `${p.name} (used)` : p.name;
        li.append(spriteImg(p), name);
        if (!used) li.addEventListener("click", () => guess(p));
        list.append(li);
    });
}

function moveActive(delta) {
    if (!results.length) return;
    let i = activeResult;
    for (let n = 0; n < results.length; n++) {
        i = (i + delta + results.length) % results.length;
        if (!state.cells.includes(results[i].id)) break;
    }
    activeResult = i;
    [...$("pickerList").children].forEach((li, j) => li.classList.toggle("active", j === i));
    $("pickerList").children[i]?.scrollIntoView({ block: "nearest" });
}

function guess(p) {
    const i = state.activeCell;
    if (i === null || isOver() || state.cells.includes(p.id)) return;
    closePicker();
    const correct = state.grid.cellAnswers[i].includes(p.id);
    if (state.guessesLeft !== null) state.guessesLeft--;
    if (correct) state.cells[i] = p.id;
    else state.missed[i] = true;
    saveDaily();
    render();
    if (!correct) {
        const cell = $("board").querySelector(`[data-index="${i}"]`);
        cell?.classList.add("shake");
        toast(`${p.name} doesn't fit`);
    }
}

// ---------- Share ----------

function shareText() {
    const c = cfg();
    const title = state.mode === "daily" ? `Pokopia Doku · ${formatDate(state.date)}` : "Pokopia Doku · Unlimited";
    const hints = state.hintsUsed ? ` 💡${state.hintsUsed}` : "";
    const theme = state.grid.theme ? `\nTheme: ${state.grid.theme.name}` : "";
    // 🟩 solved, 🟥 guessed wrong and never solved, ⬜ never tried.
    const emoji = (i) => (state.cells[i] ? "🟩" : state.missed[i] ? "🟥" : "⬜");
    const lines = [0, 1, 2].map((r) => [0, 1, 2].map((col) => emoji(r * 3 + col)).join(""));
    return `${title} (${c.label}) — ${filledCount()}/9${hints}${theme}\n${lines.join("\n")}\n${location.origin}${location.pathname}`;
}

// ---------- Events ----------

$("board").addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell || cell.disabled) return;
    if (isOver()) openAnswers(+cell.dataset.index);
    else openPicker(+cell.dataset.index);
});
$("pickerInput").addEventListener("input", renderResults);
$("pickerInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") moveActive(1);
    else if (e.key === "ArrowUp") moveActive(-1);
    else if (e.key === "Enter") {
        const p = results[activeResult];
        if (p && !state.cells.includes(p.id)) guess(p);
    } else if (e.key === "Escape") closePicker();
    else return;
    e.preventDefault();
});
$("pickerClose").addEventListener("click", closePicker);
$("picker").addEventListener("click", (e) => {
    if (e.target === $("picker")) closePicker();
});
$("hintBtn").addEventListener("click", useHint);
$("browseBtn").addEventListener("click", unlockBrowse);
$("browseRow").addEventListener("click", () => {
    state.browseFilter = state.browseFilter === "row" ? null : "row";
    renderPicker();
});
$("browseCol").addEventListener("click", () => {
    state.browseFilter = state.browseFilter === "col" ? null : "col";
    renderPicker();
});
$("explainClose").addEventListener("click", closeExplain);
$("explain").addEventListener("click", (e) => {
    if (e.target === $("explain")) closeExplain();
});
$("answersClose").addEventListener("click", closeAnswers);
$("answers").addEventListener("click", (e) => {
    if (e.target === $("answers")) closeAnswers();
});
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("explain").hidden) closeExplain();
    if (!$("answers").hidden) closeAnswers();
});
$("dailyTab").addEventListener("click", startDaily);
$("unlimitedTab").addEventListener("click", () => state.mode !== "unlimited" && startUnlimited());
$("newGridBtn").addEventListener("click", () => startUnlimited());
document.querySelectorAll("#difficultyTabs .tab").forEach((b) =>
    b.addEventListener("click", () => startUnlimited(b.dataset.difficulty)),
);
$("themesToggle").addEventListener("change", (e) => {
    themePrefs.enabled = e.target.checked;
    saveThemePrefs();
    renderThemeOptions(); // takes effect on the next grid (difficulty switch or New grid)
});
$("giveUpBtn").addEventListener("click", () => {
    if (!confirm("Give up and reveal answers?")) return;
    closePicker();
    state.gaveUp = true;
    saveDaily();
    render();
});
// Phones get the system share sheet; desktops (and phones where sharing fails) copy instead.
const USE_SHARE_SHEET = !!navigator.share && matchMedia("(pointer: coarse)").matches;
if (USE_SHARE_SHEET) $("shareBtn").textContent = "Share result";

$("shareBtn").addEventListener("click", async () => {
    const text = shareText();
    if (USE_SHARE_SHEET) {
        try {
            await navigator.share({ text });
            return;
        } catch (err) {
            if (err.name === "AbortError") return; // closed the share sheet
        }
    }
    try {
        await navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
    } catch {
        toast("Couldn't copy");
    }
});

// Title Ditto (decorative): dances while hovered with a mouse; a tap or click toggles it on
// so it keeps dancing, and another tap or click stops it (even mid-hover).
// Swapping the image restarts the GIF, so it's only swapped when dancing really starts or
// stops, and a stop waits for the current loop to end: the loop ends on the same neutral
// pose as ditto-still.gif, so there's no jump, and hovering back in before then just
// carries on dancing.
const DITTO_LOOP_MS = 16 * 90; // DANCE in _tools/ditto.mjs: 16 frames × 90ms
const ditto = $("ditto");
const dittoImg = ditto.querySelector("img");
let dittoHover = false, dittoToggled = false, dittoDancing = false, dittoStart = 0, dittoStopTimer;
function updateDitto() {
    clearTimeout(dittoStopTimer);
    if (dittoHover || dittoToggled) {
        if (dittoDancing) return; // already dancing (maybe winding down): keep going
        dittoDancing = true;
        dittoStart = performance.now();
        dittoImg.src = "ditto.gif";
    } else if (dittoDancing) {
        const untilLoopEnd = DITTO_LOOP_MS - ((performance.now() - dittoStart) % DITTO_LOOP_MS);
        dittoStopTimer = setTimeout(() => {
            dittoDancing = false;
            dittoImg.src = "ditto-still.gif";
        }, untilLoopEnd);
    }
}
ditto.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") (dittoHover = true), updateDitto();
});
ditto.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") (dittoHover = false), updateDitto();
});
ditto.addEventListener("pointerup", (e) => {
    if (e.button !== 0) return; // primary button / touch only
    dittoToggled = !dittoToggled;
    if (!dittoToggled) dittoHover = false; // stop even mid-hover; hover resumes on the next mouse-over
    updateDitto();
});
new Image().src = "ditto.gif"; // preload so the first hover starts dancing right away

renderThemeOptions();
startDaily();
