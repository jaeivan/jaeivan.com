// Draws the pixel hourglass with googly eyes. Not served (underscore folder).
//
//   node time-gap/_tools/hourglass.mjs
//
// Writes time-gap/hourglass.gif (app title), hourglass-still.gif (title at rest, shown until
// hovered or tapped), tile.gif (hub tile, 4:3) and tile-still.gif (hub tile at rest, animated
// on hover), favicon.gif (browser tab, square) and icon.png (180×180 home-screen icon on the
// tile color).
// Edit the shapes or LOOP below to change the art or the moves. The GIF encoder is shared:
// _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { outline, place, writePixelGif, writePixelPng } from "../../_tools/pixel-gif.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
    o: "#3b2a1e", // outline, eyebrows
    w: "#a8703f", // wood
    h: "#d29a62", // wood highlight
    g: "#e3f4fa", // glass
    G: "#ffffff", // glass glint
    s: "#f2c14e", // sand
    S: "#d99a2b", // sand shade
    W: "#ffffff", // eye whites
    p: "#1b1b24", // pupils
};

const SW = 24, SH = 28; // sprite size
const C = 28; // every frame sits on a C×C square, so the sideways flip frame fits too

// Glass half-widths per row (inside the outline), top bulb; the bottom bulb mirrors it.
// Rows 4..13 are the top bulb (13 is the neck), 14..23 the bottom.
const HALF = [6, 7, 7, 7, 7, 6, 5, 4, 3, 1];
const halfAt = (r) => (r <= 13 ? HALF[r - 4] : HALF[23 - r]);
const inGlass = (r, c) => r >= 4 && r <= 23 && c >= 12 - halfAt(r) && c <= 11 + halfAt(r);

// Interior cells of each bulb, in the order sand piles up: top bulb from the neck upwards,
// bottom bulb from the base upwards, each row filled from the middle out.
const middleOut = (r) => {
    const cells = [];
    for (let d = 0; d < halfAt(r); d++) cells.push([r, 11 - d], [r, 12 + d]);
    return cells;
};
const TOP = [12, 11, 10, 9, 8, 7, 6, 5, 4].flatMap(middleOut);
const BOTTOM = [23, 22, 21, 20, 19, 18, 17, 16, 15].flatMap(middleOut);
const SAND = 84; // grains, all in one bulb at the start of the loop

// The hourglass with `fallen` grains in the bottom bulb (and the rest on top).
function body(fallen) {
    const g = Array.from({ length: SH }, () => Array(SW).fill("."));
    // Glass (plus a one-pixel ring the outline pass turns into the edge)
    for (let r = 3; r <= 24; r++) {
        const hw = r === 3 || r === 24 ? 7 : halfAt(r) + 1;
        for (let c = 12 - hw; c <= 11 + hw; c++) g[r][c] = "g";
    }
    const out = outline(g, "o", "g");
    // Sand. The top drains from the middle of its surface (a dip), the bottom piles up in a mound.
    const top = TOP.slice(0, SAND - fallen);
    const dip = top.length % (2 * halfAt(top.at(-1)?.[0] ?? 12));
    top.forEach(([r, c], i) => {
        if (i < top.length - dip) out[r][c] = "s";
    });
    // Partly-drained top row: keep the outer grains so the surface dips in the middle.
    if (dip) {
        const r = top.at(-1)[0], hw = halfAt(r);
        for (let d = 0; d < dip / 2; d++) (out[r][12 - hw + d] = "s"), (out[r][11 + hw - d] = "s");
    }
    BOTTOM.slice(0, fallen).forEach(([r, c]) => (out[r][c] = "s"));
    // Shade the sand along the glass walls
    for (let r = 4; r <= 23; r++) {
        for (const c of [12 - halfAt(r), 11 + halfAt(r)]) if (out[r][c] === "s" && halfAt(r) > 1) out[r][c] = "S";
    }
    // Falling stream from the neck to the pile while there's sand left on top
    if (fallen > 0 && fallen < SAND) {
        const pileTop = BOTTOM[fallen - 1][0];
        out[13][11] = out[13][12] = "s"; // neck
        for (let r = 14; r < pileTop; r++) if ((r + fallen) % 3) out[r][11] = "s";
    }
    // Glints on the glass
    for (const [r, c] of [[5, 7], [6, 7], [17, 16], [18, 16]]) if (out[r][c] === "g") out[r][c] = "G";
    // Wooden caps and posts
    for (const r0 of [0, 24]) {
        for (let r = r0; r < r0 + 4; r++) for (let c = 0; c < SW; c++) {
            const edge = r === r0 || r === r0 + 3 || c === 0 || c === SW - 1;
            out[r][c] = edge ? "o" : r === r0 + 1 && c > 1 && c < SW - 2 ? "h" : "w";
        }
    }
    for (let r = 4; r <= 23; r++) for (const c of [2, 21]) out[r][c] = "o";
    return out;
}

// Googly eyes on the top bulb. look = [dx, dy] pupil offset, blink = eyes shut.
const EYE = [
    ".ooo.",
    "oWWWo",
    "oWWWo",
    "oWWWo",
    "oWWWo",
    ".ooo.",
];
const EYE_TOP = 5, EYES = [6, 13]; // left columns of each eye
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

// Upright pose on the C×C square
const pose = (fallen, opts = {}) => place(face(body(fallen), opts), { width: C, height: C, dx: (C - SW) / 2, dy: 0 });

// Mid-flip: the full bottom bulb turned on its side, eyes squeezed shut ("> <") in the bulb
// that's about to end up on top.
function sideways() {
    const g = body(SAND);
    const rot = Array.from({ length: SW }, (_, r) => Array.from({ length: SH }, (_, c) => g[SH - 1 - c][r]));
    const shut = [
        ["oo..", "..oo", "oo.."],
        ["..oo", "oo..", "..oo"],
    ];
    shut.forEach((rows, i) => rows.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === "o") rot[9 + r][4 + i * 5 + c] = "o";
    })));
    return place(rot, { width: C, height: C, dx: 0, dy: (C - SW) / 2 });
}

// One loop: look around, blink, watch the sand run out, look up, flip over.
// The flip lands on the opening pose (sand back on top), so the loop ends where it starts.
const DRAIN = 12;
const LOOP = [
    { grid: pose(0), ms: 900 },
    { grid: pose(0, { look: [-1, 0] }), ms: 400 },
    { grid: pose(0, { look: [1, 0] }), ms: 400 },
    { grid: pose(0), ms: 250 },
    { grid: pose(0, { blink: true }), ms: 110 },
    { grid: pose(0), ms: 250 },
    ...Array.from({ length: DRAIN }, (_, i) => ({
        grid: pose(Math.round((SAND * (i + 1)) / (DRAIN + 1)), { look: [0, 1] }),
        ms: 140,
    })),
    { grid: pose(SAND, { look: [0, -1] }), ms: 600 },
    { grid: sideways(), ms: 130 },
];

const TILE = { width: 52, height: 39, dx: 12, dy: 6 }; // hub tile: 4:3, hourglass centered below the badges
for (const [file, canvas] of [
    ["hourglass.gif", { width: C, height: C, dx: 0, dy: 0 }],
    ["tile.gif", TILE],
    ["favicon.gif", { width: C, height: C, dx: 0, dy: 0 }],
]) {
    const info = writePixelGif(path.join(OUT, file), { frames: LOOP, colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, ${info.frames} frames, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
// Still versions: the opening pose on the same canvases, so swapping images doesn't shift it.
for (const [file, canvas] of [
    ["hourglass-still.gif", { width: C, height: C, dx: 0, dy: 0 }],
    ["tile-still.gif", TILE],
]) {
    const info = writePixelGif(path.join(OUT, file), { frames: LOOP.slice(0, 1), colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, 1 frame, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
// Home-screen icon: the opening pose on the hub tile color, padded so rounded corners don't clip it.
const icon = writePixelPng(path.join(OUT, "icon.png"), {
    grid: place(LOOP[0].grid, { width: 36, height: 36, dx: 4, dy: 4 }),
    colors: COLORS,
    background: "#DDF0E4",
    scale: 5,
});
console.log(`wrote icon.png (${icon.width}×${icon.height}, ${(icon.bytes / 1024).toFixed(1)} KB)`);
console.log(`loop: ${LOOP.reduce((ms, f) => ms + f.ms, 0)}ms (HOURGLASS_LOOP_MS in time-gap/script.js)`);
