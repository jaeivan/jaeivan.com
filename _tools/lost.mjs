// Draws the little lost ghost on the 404 page. Not served (underscore folder).
//
//   node _tools/lost.mjs
//
// Writes 404.gif: the ghost bobs and looks around, with a "?" popping up now and then.
// The GIF encoder is shared: _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { outline, writePixelGif } from "./pixel-gif.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
    o: "#2a1446", // outline, "?"
    w: "#fdf0ff", // body
    s: "#e3c6ff", // body shade
    W: "#ffffff", // eye whites
    p: "#14141c", // pupils
    k: "#ff71ce", // blush
};

const W = 24, H = 26; // canvas
const BODY = [
    ".....######.....",
    "...##########...",
    "..############..",
    ".##############.",
    ".##############.",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "################",
    "##..###..###..##",
];
const QUESTION = [".ooo.", "o...o", "...o.", "..o..", ".....", "..o.."];

// look: -1 left, 0 center, 1 right. bob: 0 or 1 px down. ask: show the "?".
function frame({ look, bob, ask }) {
    const g = Array.from({ length: H }, () => Array(W).fill("."));
    const top = 8 + bob, left = 4;
    BODY.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === "#") g[top + y][left + x] = x >= 12 || y >= 13 ? "s" : "w";
    }));
    // Eyes: 3×4 whites with a 2×2 pupil that slides with `look`.
    for (const ex of [3, 9]) {
        for (let y = 5; y < 9; y++) for (let x = ex; x < ex + 3; x++) g[top + y][left + x] = "W";
        const px = ex + (look < 0 ? 0 : look > 0 ? 1 : 0.5);
        for (let y = 6; y < 8; y++) for (const x of [Math.floor(px), Math.floor(px) + 1]) g[top + y][left + x] = "p";
    }
    for (const bx of [1, 13]) g[top + 10][left + bx] = g[top + 10][left + bx + 1] = "k";
    const out = outline(g, "o", "w");
    if (ask) QUESTION.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === "o") out[y][17 + x] = "o";
    }));
    return out;
}

const frames = [
    { look: 0, bob: 0, ask: false, ms: 700 },
    { look: -1, bob: 1, ask: false, ms: 600 },
    { look: -1, bob: 0, ask: false, ms: 400 },
    { look: 1, bob: 1, ask: false, ms: 600 },
    { look: 1, bob: 0, ask: true, ms: 500 },
    { look: 0, bob: 1, ask: true, ms: 900 },
].map(({ ms, ...f }) => ({ grid: frame(f), ms }));

console.log("404.gif", writePixelGif(path.join(ROOT, "404.gif"), {
    frames,
    colors: COLORS,
    canvas: { width: W, height: H, dx: 0, dy: 0 },
    scale: 6,
}));
