// Draws the spinning WordArt-style "jaeivan" logo in vaporwave colors. Not served (underscore folder).
//
//   node _tools/logo.mjs
//
// Writes hub/logo.gif (hub header: a Game Boy-style wave, then a spin), hub/logo-still.gif (at rest),
// favicon.gif (a spinning "J"), og.png (link-preview card, 1200×630) and 404.gif (the logo
// glitching out, Spider-Verse style, for the "page not found" page).
// The GIF/PNG encoders are shared: _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePixelGif, writePixelPng } from "./pixel-gif.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
    o: "#1a0b2e", // outline
    c: "#01cdfe", // face gradient, top to bottom: cyan → periwinkle → purple → hot pink
    l: "#5fb4ff",
    v: "#8f8cff",
    p: "#b967ff",
    m: "#e46ee6",
    k: "#ff71ce",
    S: "#5b2a86", // extruded sides, lit
    s: "#34185a", // extruded sides, shaded
    M: "#ff2bd6", // glitch: magenta split, noise
    X: "#00f0ff", // glitch: cyan split, noise
    Y: "#fffb96", // glitch: scanline flash
};
const GRADIENT = ["c", "l", "v", "p", "m", "k"];

// 5-wide lowercase glyphs on a 10-row grid: dots on row 0, x-height rows 2–7, descender rows 8–9.
const GLYPHS = {
    j: ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
    a: [".....", ".....", ".###.", "....#", ".####", "#...#", "#..##", ".##.#", ".....", "....."],
    e: [".....", ".....", ".###.", "#...#", "#####", "#....", "#...#", ".###.", ".....", "....."],
    i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", "..#..", ".###.", ".....", "....."],
    v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", ".#.#.", "..#..", ".....", "....."],
    n: [".....", ".....", "#.##.", "##..#", "#...#", "#...#", "#...#", "#...#", ".....", "....."],
    J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
};

// Lay glyphs side by side (1 column apart) into one font-pixel bitmap.
function bitmap(text) {
    const rows = GLYPHS[text[0]].length;
    return Array.from({ length: rows }, (_, y) => [...text].map((ch) => GLYPHS[ch][y]).join("."));
}

// Render one frame of `font` extruded `depth` art pixels deep, spun `angle` radians around its
// vertical axis, with each letter raised `lift[letter]` art pixels (for the wave). Each font pixel is `cell` art pixels. A z-buffer per art pixel picks whatever
// is nearest the viewer: the gradient front/back faces or the shaded sides.
function spinFrame(font, { cell, depth, width, height, angle, top, lift = [] }) {
    const grid = Array.from({ length: height }, () => Array(width).fill("."));
    const zbuf = Array.from({ length: height }, () => Array(width).fill(-Infinity));
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const fw = font[0].length * cell, fh = font.length * cell;
    const oy = top ?? Math.floor((height - fh) / 2);
    const half = depth / 2, step = 0.25;
    const side = sin > 0 ? "S" : "s";

    font.forEach((row, fy) => {
        const face = GRADIENT[Math.floor((fy / font.length) * GRADIENT.length)];
        [...row].forEach((c, fx) => {
            if (c !== "#") return;
            for (let u = 0; u < cell; u += step) {
                const x = fx * cell + u - fw / 2; // relative to the spin axis
                for (let z = -half; z <= half; z += step) {
                    const col = Math.floor(width / 2 + x * cos + z * sin);
                    const near = -x * sin + z * cos;
                    if (col < 0 || col >= width) continue;
                    const ch = Math.abs(z) === half ? face : side;
                    for (let v = 0; v < cell; v++) {
                        const r = oy + fy * cell + v - (lift[Math.floor(fx / 6)] ?? 0);
                        if (near > zbuf[r][col]) {
                            zbuf[r][col] = near;
                            grid[r][col] = ch;
                        }
                    }
                }
            }
        });
    });
    return ring(grid);
}

// Outline drawn around the letters (not over them), so thin strokes keep their color.
function ring(grid) {
    const filled = (y, x) => grid[y]?.[x] !== undefined && grid[y][x] !== ".";
    return grid.map((row, y) =>
        row.map((c, x) => (c === "." && (filled(y - 1, x) || filled(y + 1, x) || filled(y, x - 1) || filled(y, x + 1)) ? "o" : c)),
    );
}

// A full turn, holding face-on for a beat (frame 0 is also what non-animating favicons show).
function spin(font, opts, { frames = 24, hold = 1600, ms = 50 } = {}) {
    return Array.from({ length: frames }, (_, i) => ({
        grid: spinFrame(font, { ...opts, angle: (2 * Math.PI * i) / frames }),
        ms: i === 0 ? hold : ms,
    }));
}

// Like the Game Boy Color boot screen: the letters hop up one after another, left to right.
function wave(font, opts, { letters, hop = 7, stagger = 2, length = 8, ms = 45 } = {}) {
    const frames = (letters - 1) * stagger + length + 1;
    return Array.from({ length: frames }, (_, f) => ({
        grid: spinFrame(font, {
            ...opts,
            angle: 0,
            lift: Array.from({ length: letters }, (_, i) => {
                const t = (f - i * stagger) / length;
                return t > 0 && t < 1 ? Math.round(hop * Math.sin(Math.PI * t)) : 0;
            }),
        }),
        ms,
    }));
}

const word = bitmap("jaeivan");
// Extra headroom on top so the letters can hop; the still frame keeps it too, so swapping doesn't jump.
const LOGO = { cell: 3, depth: 6, width: 128, height: 40, top: 9 };
const rest = spinFrame(word, { ...LOGO, angle: 0 });
// One loop: wave, full spin, then a beat face-on. It starts and ends on the still pose, so the hub
// can stop it at a loop boundary without a jump (see hub/hub.js).
const logoFrames = [
    ...wave(word, LOGO, { letters: 7 }),
    ...spin(word, LOGO, { hold: 0 }).slice(1),
    { grid: rest, ms: 400 },
];
const canvas = { width: LOGO.width, height: LOGO.height, dx: 0, dy: 0 };
console.log("hub/logo.gif", writePixelGif(path.join(ROOT, "hub/logo.gif"), { frames: logoFrames, colors: COLORS, canvas, scale: 2 }));
console.log("  loop ms:", logoFrames.reduce((t, f) => t + Math.round(f.ms / 10) * 10, 0));
console.log("hub/logo-still.gif", writePixelGif(path.join(ROOT, "hub/logo-still.gif"), { frames: [{ grid: rest, ms: 0 }], colors: COLORS, canvas, scale: 2 }));

const ICON = { cell: 2, depth: 3, width: 16, height: 16 };
console.log("favicon.gif", writePixelGif(path.join(ROOT, "favicon.gif"), {
    frames: spin(bitmap("J"), ICON),
    colors: COLORS,
    canvas: { width: 16, height: 16, dx: 0, dy: 0 },
    scale: 2,
}));

// 404: the face-on logo glitching like Miles in Into the Spider-Verse. Magenta/cyan copies split off
// either side, horizontal slices tear sideways, a band flashes yellow and noise bars flicker, in
// short bursts between calmer frames that keep a faint color fringe.
function glitch(base, rand, { split = 1, slices = 0, shift = 0, flash = false, bars = 0 }) {
    const H = base.length, W = base[0].length;
    const pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
    let g = base.map((row) => row.map((_, x) => row[x - shift] ?? "."));
    for (let i = 0; i < slices; i++) {
        const y0 = pick(0, H - 3), h = pick(2, 6), dx = pick(-9, 9);
        for (let y = y0; y < Math.min(H, y0 + h); y++) {
            const row = g[y];
            g[y] = row.map((_, x) => row[x - dx] ?? ".");
        }
    }
    if (flash) {
        const y0 = pick(4, H - 8);
        for (let y = y0; y < y0 + pick(2, 4); y++) g[y] = g[y].map((c) => (c === "." || c === "o" ? c : "Y"));
    }
    const out = Array.from({ length: H }, () => Array(W).fill("."));
    const stamp = (dx, dy, color) => g.forEach((row, y) => row.forEach((c, x) => {
        if (c !== "." && out[y + dy]?.[x + dx] === ".") out[y + dy][x + dx] = color ?? c;
    }));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] !== ".") out[y][x] = g[y][x];
    stamp(-split, split > 2 ? -1 : 0, "X");
    stamp(split, split > 2 ? 1 : 0, "M");
    for (let i = 0; i < bars; i++) {
        const y = pick(0, H - 1), x0 = pick(0, W - 20), len = pick(4, 18), c = rand() < 0.5 ? "M" : "X";
        for (let x = x0; x < x0 + len; x++) out[y][x] = c;
    }
    return out;
}

const GLITCH = { cell: 3, depth: 6, width: 144, height: 36 };
const still = spinFrame(word, { ...GLITCH, angle: 0 });
let glitchSeed = 3;
const glitchRand = () => ((glitchSeed = (glitchSeed * 16807) % 2147483647) / 2147483647);
const glitchFrames = [
    [{ split: 1 }, 900],
    [{ split: 3, slices: 2 }, 60],
    [{ split: 6, slices: 3, flash: true }, 50],
    [{ split: 2, shift: 4, bars: 4 }, 60],
    [{ split: 8, slices: 4, bars: 2 }, 40],
    [{ split: 3, shift: -3, slices: 1 }, 70],
    [{ split: 1 }, 600],
    [{ split: 4, slices: 3, bars: 3 }, 50],
    [{ split: 2, flash: true, shift: -5 }, 60],
    [{ split: 1 }, 1200],
    [{ split: 5, slices: 5, bars: 5, flash: true }, 40],
    [{ split: 2, slices: 2 }, 60],
].map(([opts, ms]) => ({ grid: glitch(still, glitchRand, opts), ms }));
console.log("404.gif", writePixelGif(path.join(ROOT, "404.gif"), {
    frames: glitchFrames,
    colors: COLORS,
    canvas: { width: GLITCH.width, height: GLITCH.height, dx: 0, dy: 0 },
    scale: 2,
}));

// Link-preview card: the face-on logo over a starry sky and a neon grid floor running off to the
// horizon. 200×105 art px at 6× = 1200×630.
const OG_W = 200, OG_H = 105, HORIZON = 80;
const card = Array.from({ length: OG_H }, () => Array(OG_W).fill("."));
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 110; i++) card[Math.floor(rand() * HORIZON)][Math.floor(rand() * OG_W)] = rand() < 0.5 ? "*" : "+";
for (let x = 0; x < OG_W; x++) card[HORIZON][x] = "#";
for (let i = 1; i < 8; i++) { // floor lines, bunching up toward the horizon
    const y = HORIZON + Math.round(((OG_H - HORIZON) * i * i) / 49);
    if (y < OG_H) for (let x = 0; x < OG_W; x++) card[y][x] = "=";
}
for (let k = -5; k <= 5; k++) { // rails converging on the vanishing point
    for (let t = 0; t <= 1; t += 0.002) {
        const x = Math.round(OG_W / 2 + k * 26 * t), y = Math.round(HORIZON + (OG_H - 1 - HORIZON) * t);
        if (x >= 0 && x < OG_W && y > HORIZON) card[y][x] = "=";
    }
}
const big = spinFrame(word, { cell: 4, depth: 8, width: 170, height: 44, angle: 0 });
const lx = (OG_W - 170) / 2, ly = Math.floor((OG_H - 44) / 2);
big.forEach((row, y) => row.forEach((c, x) => {
    if (c !== ".") card[ly + y][lx + x] = c;
}));
console.log("og.png", writePixelPng(path.join(ROOT, "og.png"), {
    grid: card,
    colors: { ...COLORS, "*": "#01cdfe", "+": "#ff71ce", "#": "#ff71ce", "=": "#9b3fb5" },
    background: "#1b0b33",
    scale: 6,
}));
