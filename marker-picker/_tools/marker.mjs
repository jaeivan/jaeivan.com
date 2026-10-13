// Draws the Clippy-style pixel marker. Not served (underscore folder).
//
//   node marker-picker/_tools/marker.mjs
//
// Writes marker-picker/marker.gif (app title, tight) and marker-picker/tile.gif (hub tile, 4:3).
// The GIF encoder is shared: _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { outline, writePixelGif } from "../../_tools/pixel-gif.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
    o: "#2d2d3a", // outline, eyebrows
    c: "#e5484d", // cap, band, tip
    C: "#f59a9d", // cap highlight
    d: "#b8323a", // cap shade
    w: "#f7f6f0", // barrel
    g: "#d6d4ca", // barrel shade, grip
    W: "#ffffff", // eye whites
    p: "#14141c", // pupils
};

const SW = 20, SH = 27; // sprite size

// Marker body (outline added automatically around it).
function body() {
    const g = Array.from({ length: SH }, () => Array(SW).fill("."));
    const fill = (r0, r1, c0, c1, ch) => {
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch;
    };
    fill(1, 4, 7, 12, "c"); // cap
    fill(1, 3, 8, 8, "C"); // cap highlight
    fill(1, 4, 12, 12, "d"); // cap shade
    fill(5, 5, 6, 13, "d"); // cap lip
    fill(6, 21, 7, 12, "w"); // barrel
    fill(6, 21, 12, 12, "g"); // barrel shade
    fill(18, 19, 7, 12, "c"); // color band
    fill(22, 22, 7, 12, "g"); // grip
    fill(23, 23, 8, 11, "g");
    fill(24, 24, 9, 10, "c"); // tip
    return outline(g, "o", "w");
}

// Big googly eyes stuck on the barrel, Clippy style, plus arched eyebrows.
// look = pupil offset (-1 left, 0 center, 1 right), brows = 0 normal / 1 raised, blink = eyes shut.
const EYE_TOP = 9;
const EYE = [
    "..ooo..",
    ".oWWWo.",
    "oWWWWWo",
    "oWWWWWo",
    "oWWWWWo",
    ".oWWWo.",
    "..ooo..",
];
function face(g, { look = 0, brows = 0, blink = false }) {
    const eye = (left, inward) => {
        if (blink) {
            // Closed: just a line across the middle
            for (let c = 1; c <= 5; c++) g[EYE_TOP + 3][left + c] = "o";
            return;
        }
        EYE.forEach((row, r) => [...row].forEach((ch, c) => ch !== "." && (g[EYE_TOP + r][left + c] = ch)));
        // 2×2 pupils, crossed slightly inward so it looks at you, shifted by `look`
        const px = left + (inward > 0 ? 3 : 2) + look;
        for (const [dy, dx] of [[3, 0], [3, 1], [4, 0], [4, 1]]) g[EYE_TOP + dy][px + dx] = "p";
    };
    eye(2, 1); // left eye, pupils lean right
    eye(11, -1); // right eye, pupils lean left
    // Eyebrows: short arcs a row above each eye; raised moves them up a row.
    const by = EYE_TOP - 3 - brows;
    for (const [r, c] of [[1, 3], [0, 4], [0, 5], [0, 6], [1, 7]]) g[by + r][c] = "o";
    for (const [r, c] of [[1, 12], [0, 13], [0, 14], [0, 15], [1, 16]]) g[by + r][c] = "o";
    return g;
}

// A spare blank row above the sprite gives the bounce room without clipping the cap.
const pose = (opts = {}) => {
    const g = face(body(), opts);
    const blank = () => Array(SW).fill(".");
    return opts.bounce ? [...g, blank()] : [blank(), ...g];
};

// Clippy-style idle: eyebrow wiggle with a hop, glance around, blink.
const IDLE = [
    { ms: 900 },
    { brows: 1, ms: 110 },
    { brows: 1, bounce: 1, ms: 110 },
    { brows: 0, ms: 110 },
    { brows: 1, bounce: 1, ms: 110 },
    { brows: 0, ms: 600 },
    { look: -1, ms: 500 },
    { look: 1, ms: 500 },
    { ms: 400 },
    { blink: true, ms: 110 },
    { ms: 700 },
];

const frames = IDLE.map((f) => ({ grid: pose(f), ms: f.ms }));
for (const [file, canvas] of [
    ["marker.gif", { width: SW, height: SH + 1, dx: 0, dy: 0 }], // app title, tight
    ["tile.gif", { width: 40, height: 30, dx: 10, dy: 1 }], // hub tile: 4:3, marker centered
]) {
    const info = writePixelGif(path.join(OUT, file), { frames, colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, ${info.frames} frames, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
