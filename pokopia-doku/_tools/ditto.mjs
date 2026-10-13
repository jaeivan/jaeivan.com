// Draws the pixel-art Ditto and writes its dancing GIFs. Not served (underscore folder).
//
//   node pokopia-doku/_tools/ditto.mjs
//
// Writes pokopia-doku/ditto.gif (title, tight), ditto-still.gif (title at rest, shown until
// hovered or tapped), tile.gif (hub tile, 4:3 with padding) and tile-still.gif (hub tile at
// rest, animated on hover), favicon.gif (browser tab, square) and icon.png (180×180 home-screen
// icon on the tile color).
// Edit MAP / DANCE below to change the art or the moves. The GIF encoder is shared: _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { outline, place, writePixelGif, writePixelPng } from "../../_tools/pixel-gif.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// o = outline, b = body, h = highlight, s = shade, e = eye/mouth, . = empty
const MAP = [
    ".......oooooo.......",
    ".....oobbbbbboo.....",
    "....obhhbbbbbbbbo...",
    "...obhbbbbbbbbbbbo..",
    "..obbbbbbbbbbbbbbbo.",
    "..obbbbebbbbebbbbbo.",
    ".obbbbbebbbbebbbbbbo",
    "obbbbbbbbbbbbbbbbbbo",
    "obbbbbebbbbbbebbbbso",
    ".obbbbbeeeeeebbbbso.",
    ".obbbbbbbbbbbbbbbso.",
    ".obsbbbbbbbbbbbbsso.",
    ".oooooooooooooooooo.",
];
const EYE_TOPS = [[5, 7], [5, 12]]; // [row, col] cleared for the blink

const COLORS = { o: "#5e3f7d", b: "#c39ae0", h: "#ecdcf7", s: "#a47cc4", e: "#2a1b3a" };

// One loop of the dance. lean = how far the top sways (px), sx/sy = squash & stretch,
// hop = lift off the ground (px), blink = eyes closed, ms = frame time.
const DANCE = [
    { lean: 0 }, { lean: 1 }, { lean: 2 }, { lean: 1 },
    { sx: 1.12, sy: 0.85 }, { sx: 0.92, sy: 1.12, hop: 2 }, { sx: 0.95, sy: 1.06, hop: 3 }, { sx: 1.12, sy: 0.85 },
    { lean: 0 }, { lean: -1, blink: true }, { lean: -2 }, { lean: -1 },
    { sx: 1.12, sy: 0.85 }, { sx: 0.92, sy: 1.12, hop: 2 }, { sx: 0.95, sy: 1.06, hop: 3 }, { sx: 1.12, sy: 0.85 },
].map((f) => ({ lean: 0, sx: 1, sy: 1, hop: 0, blink: false, ms: 90, ...f }));

const W = 20, H = 13; // MAP size
const CW = 28, CH = 20; // dance canvas: room to sway, stretch and hop

// Render one pose into a CW×CH grid of map characters.
function frame({ lean, sx, sy, hop, blink }) {
    const src = MAP.map((row) => [...row]);
    if (blink) for (const [r, c] of EYE_TOPS) src[r][c] = "b";
    const cx = (W - 1) / 2, ox = (CW - W) / 2;
    const bottom = CH - 1 - hop; // feet row on the canvas
    const shiftFor = (row) => Math.round((lean * (H - 1 - row)) / (H - 1)); // top sways most
    const grid = Array.from({ length: CH }, () => Array(CW).fill("."));
    // Body: sample the source map backwards from the bottom row (feet stay planted).
    // Face pixels are drawn separately below so squashing can't drop them.
    for (let y = 0; y < CH; y++) {
        const sy0 = Math.round((H - 1) - (bottom - y) / sy);
        if (sy0 < 0 || sy0 >= H) continue;
        for (let x = 0; x < CW; x++) {
            const sx0 = Math.round((x - ox - shiftFor(sy0) - cx) / sx + cx);
            if (sx0 >= 0 && sx0 < W) grid[y][x] = src[sy0][sx0] === "e" ? "b" : src[sy0][sx0];
        }
    }
    // Re-draw the outline on the new silhouette so stretching never leaves gaps.
    const out = outline(grid, "o", "b");
    // Face: map each eye/mouth pixel forward onto the reshaped body.
    src.forEach((row, r) =>
        row.forEach((c, col) => {
            if (c !== "e") return;
            const y = bottom - Math.round((H - 1 - r) * sy);
            const x = Math.round((col - cx) * sx + cx) + ox + shiftFor(r);
            if (out[y]?.[x] && out[y][x] !== "o" && out[y][x] !== ".") out[y][x] = "e";
        }),
    );
    return out;
}

const frames = DANCE.map((f) => ({ grid: frame(f), ms: f.ms }));
for (const [file, canvas] of [
    ["ditto.gif", { width: CW, height: CH, dx: 0, dy: 0 }],
    ["tile.gif", { width: 40, height: 30, dx: 6, dy: 3 }], // hub tile: 4:3, Ditto centered
    ["favicon.gif", { width: CW, height: CW, dx: 0, dy: (CW - CH) / 2 }], // browser tab: square
]) {
    const info = writePixelGif(path.join(OUT, file), { frames, colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, ${info.frames} frames, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
// Still versions: the dance's first (neutral) pose on the same canvases, so swapping images doesn't shift Ditto.
for (const [file, canvas] of [
    ["ditto-still.gif", { width: CW, height: CH, dx: 0, dy: 0 }],
    ["tile-still.gif", { width: 40, height: 30, dx: 6, dy: 3 }],
]) {
    const info = writePixelGif(path.join(OUT, file), { frames: frames.slice(0, 1), colors: COLORS, canvas });
    console.log(`wrote ${file} (${info.width}×${info.height}, 1 frame, ${(info.bytes / 1024).toFixed(1)} KB)`);
}
// Home-screen icon: the neutral pose on the hub tile color, padded so rounded corners don't clip it.
const icon = writePixelPng(path.join(OUT, "icon.png"), {
    grid: place(frames[0].grid, { width: 36, height: 36, dx: 4, dy: 4 }),
    colors: COLORS,
    background: "#EBE1F6",
    scale: 5,
});
console.log(`wrote icon.png (${icon.width}×${icon.height}, ${(icon.bytes / 1024).toFixed(1)} KB)`);
