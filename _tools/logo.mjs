// Draws the spinning WordArt-style "jaeivan" logo, early-internet style. Not served (underscore folder).
//
//   node _tools/logo.mjs
//
// Writes hub/logo.gif (hub header, spinning), hub/logo-still.gif (reduced motion),
// favicon.gif (a spinning "J") and og.png (link-preview card, 1200×630).
// The GIF/PNG encoders are shared: _tools/pixel-gif.mjs.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePixelGif, writePixelPng } from "./pixel-gif.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
    o: "#1a1b26", // outline
    r: "#ff4d6d", // rainbow face, top to bottom
    n: "#ff9e3d",
    y: "#ffe14d",
    g: "#4ddc7a",
    b: "#4dabff",
    p: "#b07cff",
    S: "#6b6f9e", // extruded sides, lit
    s: "#3f4270", // extruded sides, shaded
};
const RAINBOW = ["r", "n", "y", "g", "b", "p"];

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
// vertical axis. Each font pixel is `cell` art pixels. A z-buffer per art pixel picks whatever
// is nearest the viewer: the rainbow front/back faces or the shaded sides.
function spinFrame(font, { cell, depth, width, height, angle }) {
    const grid = Array.from({ length: height }, () => Array(width).fill("."));
    const zbuf = Array.from({ length: height }, () => Array(width).fill(-Infinity));
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const fw = font[0].length * cell, fh = font.length * cell;
    const oy = Math.floor((height - fh) / 2);
    const half = depth / 2, step = 0.25;
    const side = sin > 0 ? "S" : "s";

    font.forEach((row, fy) => {
        const face = RAINBOW[Math.floor((fy / font.length) * RAINBOW.length)];
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
                        const r = oy + fy * cell + v;
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

const word = bitmap("jaeivan");
const LOGO = { cell: 3, depth: 6, width: 128, height: 34 };
const logoFrames = spin(word, LOGO);
const canvas = { width: LOGO.width, height: LOGO.height, dx: 0, dy: 0 };
console.log("hub/logo.gif", writePixelGif(path.join(ROOT, "hub/logo.gif"), { frames: logoFrames, colors: COLORS, canvas, scale: 2 }));
console.log("hub/logo-still.gif", writePixelGif(path.join(ROOT, "hub/logo-still.gif"), { frames: [logoFrames[0]], colors: COLORS, canvas, scale: 2 }));

const ICON = { cell: 2, depth: 3, width: 16, height: 16 };
console.log("favicon.gif", writePixelGif(path.join(ROOT, "favicon.gif"), {
    frames: spin(bitmap("J"), ICON),
    colors: COLORS,
    canvas: { width: 16, height: 16, dx: 0, dy: 0 },
    scale: 2,
}));

// Link-preview card: the face-on logo over a pixel starfield, 200×105 art px at 6× = 1200×630.
const OG_W = 200, OG_H = 105;
const card = Array.from({ length: OG_H }, () => Array(OG_W).fill("."));
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 140; i++) card[Math.floor(rand() * OG_H)][Math.floor(rand() * OG_W)] = rand() < 0.3 ? "*" : "+";
const big = spinFrame(word, { cell: 4, depth: 8, width: 170, height: 44, angle: 0 });
const lx = (OG_W - 170) / 2, ly = Math.floor((OG_H - 44) / 2);
big.forEach((row, y) => row.forEach((c, x) => {
    if (c !== ".") card[ly + y][lx + x] = c;
}));
console.log("og.png", writePixelPng(path.join(ROOT, "og.png"), {
    grid: card,
    colors: { ...COLORS, "*": "#ffffff", "+": "#5a5e78" },
    background: "#15161a",
    scale: 6,
}));
