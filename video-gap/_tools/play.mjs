// Draws the pixel play button with googly eyes. Not served (underscore folder).
//
//   node video-gap/_tools/play.mjs
//
// Writes video-gap/play.gif (app title), play-still.gif (title at rest, shown until hovered or
// tapped), tile.gif (hub tile, 4:3) and tile-still.gif (hub tile at rest, animated on hover),
// favicon.gif (browser tab, square) and icon.png (180×180 home-screen icon on the tile color).
// Edit the shapes or LOOP below to change the art or the moves. The GIF encoder is shared:
// _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { outline, place, writePixelGif, writePixelPng } from "../../_tools/pixel-gif.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
    o: "#2a1414", // outline, legs
    r: "#e62117", // screen
    h: "#ff6a5f", // screen highlight
    W: "#ffffff", // play triangle, eye whites
    s: "#f1d4d2", // triangle shade
    p: "#1b1b24", // pupils
};

const SW = 28, SH = 20; // screen size (legs hang below it)
const C = 28; // every frame sits on a C×C square

// The red screen: a rounded rectangle with an outline and a highlight along the top.
function screen() {
    const g = Array.from({ length: SH }, (_, r) =>
        Array.from({ length: SW }, (_, c) => {
            const fromEdge = Math.min(r, SH - 1 - r) + Math.min(c, SW - 1 - c);
            return fromEdge < 2 ? "." : "r";
        }),
    );
    const out = outline(g, "o", "r");
    for (let c = 4; c < 10; c++) out[1][c] = "h";
    out[2][2] = out[3][2] = "h";
    return out;
}

// The play triangle, pointing right, below the eyes.
const TRI_TOP = 10, TRI_LEFT = 11;
function triangle(g) {
    for (let r = 0; r < 9; r++) {
        const w = 2 * (4 - Math.abs(r - 4)) + 1;
        for (let c = 0; c < w; c++) g[TRI_TOP + r][TRI_LEFT + c] = r > 5 ? "s" : "W";
    }
    return g;
}

// Googly eyes. look = [dx, dy] pupil offset, blink = eyes shut.
const EYE = [
    ".ooo.",
    "oWWWo",
    "oWWWo",
    "oWWWo",
    "oWWWo",
    ".ooo.",
];
const EYE_TOP = 3, EYES = [7, 16]; // left columns of each eye
function face(g, { look = [0, 0], blink = false }) {
    for (const left of EYES) {
        if (blink) {
            for (let c = 0; c < 5; c++) g[EYE_TOP + 3][left + c] = "o";
            continue;
        }
        EYE.forEach((row, r) => [...row].forEach((ch, c) => ch !== "." && (g[EYE_TOP + r][left + c] = ch)));
        // 2×2 pupils, leaning inward a little so it looks at you, shifted by `look`
        const px = left + (left === EYES[0] ? 2 : 1) + look[0], py = EYE_TOP + 2 + look[1];
        for (const [dy, dx] of [[0, 0], [0, 1], [1, 0], [1, 1]]) g[py + dy][px + dx] = "p";
    }
    return g;
}

// legs: "stand" (feet out), "dangle" (in the air, toes down) or "tuck" (crouched, hidden)
function legs(g, kind) {
    if (kind === "tuck") return g;
    const rows = kind === "stand" ? ["oo...", "ooo.."] : ["oo...", "oo..."];
    const out = [...g.map((row) => [...row]), ...rows.map(() => Array(SW).fill("."))];
    for (const [left, flip] of [[8, false], [18, true]]) {
        rows.forEach((row, r) => [...row].forEach((ch, c) => {
            if (ch === "o") out[SH + r][flip ? left + 1 - c : left + c] = "o";
        }));
    }
    return out;
}

// A pose on the C×C square; `lift` raises it off the ground (the bottom row of the square).
function pose({ look, blink, leg = "stand", lift = 0 } = {}) {
    const g = legs(face(triangle(screen()), { look, blink }), leg);
    return place(g, { width: C, height: C, dx: (C - SW) / 2, dy: C - g.length - lift });
}

// One loop: look around, blink, crouch, hop, land. It ends on the opening pose.
const LOOP = [
    { grid: pose(), ms: 900 },
    { grid: pose({ look: [-1, 0] }), ms: 380 },
    { grid: pose({ look: [1, 0] }), ms: 380 },
    { grid: pose(), ms: 200 },
    { grid: pose({ blink: true }), ms: 110 },
    { grid: pose(), ms: 200 },
    { grid: pose({ leg: "tuck", look: [0, 1] }), ms: 140 },
    { grid: pose({ leg: "dangle", lift: 3, look: [0, -1] }), ms: 100 },
    { grid: pose({ leg: "dangle", lift: 6, look: [0, -1] }), ms: 160 },
    { grid: pose({ leg: "dangle", lift: 3 }), ms: 100 },
    { grid: pose({ leg: "tuck", look: [0, 1] }), ms: 130 },
];

const TILE = { width: 52, height: 39, dx: 12, dy: 6 }; // hub tile: 4:3, centered below the badges
const SQUARE = { width: C, height: C, dx: 0, dy: 0 };
for (const [file, canvas] of [
    ["play.gif", SQUARE],
    ["tile.gif", TILE],
    ["favicon.gif", SQUARE],
]) {
    const info = writePixelGif(path.join(OUT, file), { frames: LOOP, colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, ${info.frames} frames, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
// Still versions: the opening pose on the same canvases, so swapping images doesn't shift it.
for (const [file, canvas] of [
    ["play-still.gif", SQUARE],
    ["tile-still.gif", TILE],
]) {
    const info = writePixelGif(path.join(OUT, file), { frames: LOOP.slice(0, 1), colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, 1 frame, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
// Home-screen icon: the opening pose on the hub tile color, padded so rounded corners don't clip it.
const icon = writePixelPng(path.join(OUT, "icon.png"), {
    grid: place(LOOP[0].grid, { width: 36, height: 36, dx: 4, dy: 4 }),
    colors: COLORS,
    background: "#FBE0E0",
    scale: 5,
});
console.log(`wrote icon.png (${icon.width}×${icon.height}, ${(icon.bytes / 1024).toFixed(1)} KB)`);
console.log(`loop: ${LOOP.reduce((ms, f) => ms + f.ms, 0)}ms (PLAY_LOOP_MS in video-gap/script.js)`);
