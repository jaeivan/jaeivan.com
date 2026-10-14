// Data builder for Pokopia Doku. Not served (underscore folder).
// See README.md in this folder for when and how to run it.
//
//   node pokopia-doku/_tools/build-data.mjs [--keep-cache]
//
// Scrapes Serebii's Pokopia dex pages for Pokopia attributes and PokeAPI for
// mainline attributes, then writes pokopia-doku/data.js. Raw responses are
// cached in _tools/.cache (gitignored). The cache is cleared at the start of
// each run so new Pokémon are picked up; pass --keep-cache to reuse it (e.g.
// to resume after a network error).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(TOOLS, ".cache");
if (!process.argv.includes("--keep-cache")) fs.rmSync(CACHE, { recursive: true, force: true });
fs.mkdirSync(CACHE, { recursive: true });
const OUT = path.join(TOOLS, "..", "data.js");

const SEREBII = "https://serebii.net/pokemonpokopia/";
const POKEAPI = "https://pokeapi.co/api/v2/";

// Serebii's Pokopia dex pages. Each restarts numbering at #001.
// New DLC or event dex? Add its page here (find it in Serebii's Pokopia sidebar).
const DEX_PAGES = [
    { dex: "main", page: "availablepokemon.shtml" },
    { dex: "basin", page: "basinpokedex.shtml" }, // Expansion Pass Part 1: Bubbly Basin
    { dex: "event", page: "eventpokedex.shtml" },
];

// Story NPCs that can't be befriended.
const EXCLUDE = new Set(["kyogre"]);

// Serebii form pages merged into one guessable entry.
const MERGE = {
    shelloseastsea: "shellos",
    gastrodoneastsea: "gastrodon",
    tatsugiricurlyform: "tatsugiri",
    tatsugiridroopyform: "tatsugiri",
    tatsugiristretchyform: "tatsugiri",
    toxtricityampedform: "toxtricity",
    toxtricitylowkeyform: "toxtricity",
    frillishfemaleform: "frillish",
    frillishmaleform: "frillish",
    jellicentfemaleform: "jellicent",
    jellicentmaleform: "jellicent",
};
const MERGED_NAMES = { tatsugiri: "Tatsugiri", toxtricity: "Toxtricity", frillish: "Frillish", jellicent: "Jellicent" };

// Fixes for blanks on Serebii.
const OVERRIDES = { paldeanwooper: { types: ["Poison", "Ground"] } };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cached(url, file) {
    const p = path.join(CACHE, file);
    if (fs.existsSync(p)) return fs.readFileSync(p, "latin1");
    let text;
    for (let attempt = 1; ; attempt++) {
        await sleep(800 * attempt);
        try {
            const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (pokopia-doku data builder)" } });
            if (!res.ok) throw new Error(`${res.status} ${url}`);
            text = Buffer.from(await res.arrayBuffer()).toString("latin1");
            break;
        } catch (err) {
            if (attempt >= 4) throw err;
            console.log(`  retry ${attempt}: ${url} (${err.message})`);
        }
    }
    fs.writeFileSync(p, text, "latin1");
    return text;
}

const cachedJson = async (url, file) => JSON.parse(await cached(url, file));

const decode = (s) =>
    s.replace(/&eacute;/g, "é").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();

function parseList(html) {
    const rows = [];
    const re = /<td class="cen">#(\d+)<\/td>\s*<td class="cen"><a href="\/pokemonpokopia\/pokedex\/([a-z0-9-]+)\.shtml"><img src="\/pokemonpokopia\/pokemon\/small\/(\d+)[^"]*"[\s\S]*?<u>([^<]+)<\/u>/g;
    let m;
    while ((m = re.exec(html))) {
        rows.push({ pokopiaNo: +m[1], slug: m[2], natDex: +m[3], name: decode(m[4]) });
    }
    return rows;
}

function parsePage(html) {
    // Types: icons in the first "Type" cell of the general table.
    const typeCell = html.match(/<td class="foo">Type<\/td>[\s\S]*?<td class="cen">([\s\S]*?)<\/td>/);
    const types = typeCell ? [...typeCell[1].matchAll(/type\/icon\/[a-z]+\.png"\s+alt="([A-Za-z]+)"/g)].map((m) => m[1]) : [];

    // Stats table: from its header row to the next section heading.
    const block = (html.split('<td class="foo">Ideal Habitat</td>')[1] || "").split("<br /><br />")[0];
    const specialties = [...new Set([...block.matchAll(/specialty\/[a-z0-9]+\.shtml"><u>([^<]+)<\/u>/g)].map((m) => decode(m[1])))];
    const habitat = (block.match(/idealhabitat\/[a-z0-9]+\.shtml"><u>([^<]+)<\/u>/) || [])[1];
    // Sentence case ("Slender Objects" also appears as "Slender objects"); Ditto lists "None".
    const favorites = [...block.matchAll(/favorites\/[a-z0-9]+\.shtml"><u>([^<]+)<\/u>/g)]
        .map((m) => decode(m[1]))
        .map((f) => f[0].toUpperCase() + f.slice(1).toLowerCase())
        .filter((f) => f !== "None");
    const flavorRaw = (block.match(/flavors\.shtml"><u>([^<]+)<\/u>/) || [])[1];
    const flavor = flavorRaw ? decode(flavorRaw).replace(/ flavors?$/i, "") : undefined;

    // "Go Underwater?" is the stats table's last cell: Yes or No.
    const underwater = /<td class="cen" valign="top">\s*Yes\s*<\/td>\s*<\/tr>/.test(block);

    // "Habitats & Locations": one column per spawn habitat, each with its locations,
    // rarity, times and weather. Kept as unions across all of a Pokémon's habitats.
    const spawn = (html.split("<h2>Habitats & Locations</h2>")[1] || "").split("</main>")[0];
    const locations = [...new Set([...spawn.matchAll(/locations\/[a-z0-9]+\.shtml"><u>([^<]+)<\/u>/g)].map((m) => decode(m[1])))];
    const rarity = [...new Set([...spawn.matchAll(/<b>Rarity<\/b>:<br \/>\s*([^<]+?)\s*<\/td>/g)].map((m) => decode(m[1])))];
    const timeWeather = [...spawn.matchAll(/<tr><td valign="top">\s*([\s\S]*?)<\/td><td valign="top">\s*([\s\S]*?)<\/tr>/g)];
    const split = (s) => s.split(/<br \/>/).map((t) => decode(t.replace(/<[^>]*>/g, ""))).filter(Boolean);
    const times = [...new Set(timeWeather.flatMap((m) => split(m[1])))];
    const weather = [...new Set(timeWeather.flatMap((m) => split(m[2])))];

    return { types, specialties, habitat: habitat && decode(habitat), favorites, flavor, underwater, locations, rarity, times, weather };
}

async function mainline(natDex) {
    const sp = await cachedJson(`${POKEAPI}pokemon-species/${natDex}/`, `species-${natDex}.json`);
    const chainId = sp.evolution_chain.url.match(/(\d+)\/$/)[1];
    const chain = await cachedJson(sp.evolution_chain.url, `chain-${chainId}.json`);
    const target = sp.name;
    let stage = 1, fullyEvolved = true, evolves = false;
    (function walk(node, depth) {
        if (node.species.name === target) {
            stage = depth;
            fullyEvolved = node.evolves_to.length === 0;
        }
        node.evolves_to.forEach((n) => walk(n, depth + 1));
    })(chain.chain, 1);
    evolves = chain.chain.evolves_to.length > 0;
    return {
        gen: +sp.generation.url.match(/(\d+)\/$/)[1],
        legendary: sp.is_legendary,
        mythical: sp.is_mythical,
        baby: sp.is_baby,
        stage,
        fullyEvolved,
        inLine: evolves,
    };
}

const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];

const rows = [];
for (const { dex, page } of DEX_PAGES) {
    const pageRows = parseList(await cached(SEREBII + page, `list-${dex}.html`));
    console.log(`${dex} dex rows: ${pageRows.length}`);
    if (!pageRows.length) throw new Error(`No rows parsed from ${page}; has Serebii's layout changed?`);
    pageRows.forEach((r) => rows.push({ ...r, dex }));
}

const byId = new Map();
for (const row of rows) {
    if (EXCLUDE.has(row.slug)) continue;
    const page = parsePage(await cached(`${SEREBII}pokedex/${row.slug}.shtml`, `${row.slug}.html`));
    const id = MERGE[row.slug] || row.slug;
    const existing = byId.get(id);
    if (existing) {
        for (const k of ["types", "specialties", "favorites", "locations", "rarity", "times", "weather"]) existing[k] = union(existing[k], page[k]);
        existing.habitat ||= page.habitat;
        existing.flavor ||= page.flavor;
        existing.underwater ||= page.underwater;
        continue;
    }
    const name = MERGED_NAMES[id] || row.name;
    byId.set(id, { id, name, dex: row.dex, pokopiaNo: row.pokopiaNo, natDex: row.natDex, ...page, ...OVERRIDES[row.slug] });
}

const dex = [];
for (const p of byId.values()) {
    Object.assign(p, await mainline(p.natDex));
    dex.push(p);
}
const dexOrder = (p) => DEX_PAGES.findIndex((d) => d.dex === p.dex);
dex.sort((a, b) => dexOrder(a) - dexOrder(b) || a.pokopiaNo - b.pokopiaNo || a.name.localeCompare(b.name));

// Report gaps so they can be fixed by hand.
let gaps = 0;
for (const p of dex) {
    const missing = ["types", "specialties", "favorites"].filter((k) => !p[k].length);
    if (!p.habitat) missing.push("habitat");
    if (!p.flavor) missing.push("flavor");
    if (missing.length) {
        gaps++;
        console.log(`  ${p.name}: missing ${missing.join(", ")}`);
    }
}
console.log(`entries: ${dex.length}, with gaps: ${gaps}`);
for (const { dex: d } of DEX_PAGES) console.log(`  ${d}: ${dex.filter((p) => p.dex === d).length}`);

// Typos in Serebii's specialty text.
const fixTypos = (s) =>
    s
        .replace(/\b(spceialty|speicalty|speciality)\b/g, "specialty")
        .replace(/\belectricty\b/g, "electricity")
        .replace(/searching fo$/, "searching for");

// Specialty descriptions for the in-game "what does this category mean" popover.
const specialtyNames = [...new Set(dex.flatMap((p) => p.specialties))].sort();
const specialties = {};
for (const name of specialtyNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    try {
        const html = await cached(`${SEREBII}pokedex/specialty/${slug}.shtml`, `specialty-${slug}.html`);
        const text = (html.split("<h2>Flavor Text</h2>")[1] || "").match(/<td class="fooinfo"\s*>([\s\S]*?)<\/td>/);
        const description = text && fixTypos(decode(text[1].replace(/<[^>]*>/g, "")));
        if (description) specialties[name] = description;
        else console.log(`  specialty ${name}: no description found`);
    } catch (err) {
        console.log(`  specialty ${name}: ${err.message}`);
    }
}
console.log(`specialty descriptions: ${Object.keys(specialties).length}/${specialtyNames.length}`);

const keep = ["id", "name", "dex", "pokopiaNo", "natDex", "types", "specialties", "habitat", "flavor", "favorites", "locations", "rarity", "times", "weather", "underwater", "gen", "legendary", "mythical", "baby", "stage", "fullyEvolved", "inLine"];
const lines = dex.map((p) => "    " + JSON.stringify(Object.fromEntries(keep.map((k) => [k, p[k] ?? null]))));
fs.writeFileSync(
    OUT,
    `// Generated by _tools/build-data.mjs from Serebii's Pokopia dex + PokeAPI. Do not edit by hand.\nwindow.POKOPIA_DEX = [\n${lines.join(",\n")}\n];\n\nwindow.POKOPIA_SPECIALTIES = ${JSON.stringify(specialties, null, 4)};\n`,
    "utf8",
);
console.log(`wrote ${OUT}`);
