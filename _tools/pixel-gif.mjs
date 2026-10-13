// Shared helper for the pixel-art GIFs on hub tiles and in apps. Not served (underscore folder).
// Tiny dependency-free GIF89a encoder (and a still-PNG writer) plus helpers to turn character
// grids into frames.
//
// A sprite frame is an array of strings (or arrays of characters); each character is a
// palette key, and "." is transparent.

import fs from "node:fs";
import zlib from "node:zlib";

// Write an animated, looping GIF.
//   frames:  [{ grid, ms }]   grid = sprite rows (strings or char arrays)
//   colors:  { char: "#rrggbb" }
//   canvas:  { width, height, dx, dy } in art pixels; sprite drawn at (dx, dy)
//   scale:   output pixels per art pixel (keeps it crisp without CSS tricks)
export function writePixelGif(file, { frames, colors, canvas, scale = 8 }) {
    const keys = Object.keys(colors);
    const palette = ["#000000", ...keys.map((k) => colors[k])]; // index 0 = transparent
    const index = Object.fromEntries(keys.map((k, i) => [k, i + 1]));
    const w = canvas.width * scale, h = canvas.height * scale;
    const encoded = frames.map(({ grid, ms }) => {
        const pixels = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const gy = Math.floor(y / scale) - canvas.dy, gx = Math.floor(x / scale) - canvas.dx;
                pixels[y * w + x] = index[grid[gy]?.[gx]] ?? 0;
            }
        }
        return { pixels, ms };
    });
    const gif = encodeGif(w, h, palette, encoded);
    fs.writeFileSync(file, gif);
    return { width: w, height: h, frames: frames.length, bytes: gif.length };
}

// Copy a sprite onto a blank width×height grid at (dx, dy), e.g. to pad it for a PNG icon.
export function place(grid, { width, height, dx = 0, dy = 0 }) {
    return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => grid[y - dy]?.[x - dx] ?? "."));
}

// Redraw an outline ring: any filled cell touching empty space (4-neighbors) becomes `edge`.
// Cells that were `edge` but are now interior become `fill`.
export function outline(grid, edge = "o", fill = "b") {
    const filled = (y, x) => grid[y]?.[x] !== undefined && grid[y][x] !== ".";
    return grid.map((row, y) =>
        [...row].map((c, x) => {
            if (c === ".") return c;
            if (!filled(y - 1, x) || !filled(y + 1, x) || !filled(y, x - 1) || !filled(y, x + 1)) return edge;
            return c === edge ? fill : c;
        }),
    );
}

// ---------- GIF89a encoder ----------

function lzw(minCodeSize, pixels) {
    const clear = 1 << minCodeSize, eoi = clear + 1;
    let codeSize = minCodeSize + 1, next = eoi + 1, dict = new Map();
    const bytes = [];
    let acc = 0, bits = 0;
    const emit = (code) => {
        acc |= code << bits;
        bits += codeSize;
        while (bits >= 8) {
            bytes.push(acc & 0xff);
            acc >>= 8;
            bits -= 8;
        }
    };
    emit(clear);
    let prefix = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
        const k = pixels[i], key = (prefix << 8) | k;
        if (dict.has(key)) {
            prefix = dict.get(key);
            continue;
        }
        emit(prefix);
        if (next === 4096) {
            emit(clear);
            dict = new Map();
            next = eoi + 1;
            codeSize = minCodeSize + 1;
        } else {
            if (next >= 1 << codeSize) codeSize++;
            dict.set(key, next++);
        }
        prefix = k;
    }
    emit(prefix);
    emit(eoi);
    if (bits > 0) bytes.push(acc & 0xff);
    return bytes;
}

export function encodeGif(width, height, palette, frames) {
    const out = [];
    const u16 = (n) => out.push(n & 0xff, (n >> 8) & 0xff);
    const ascii = (s) => out.push(...[...s].map((c) => c.charCodeAt(0)));
    const tableBits = Math.max(2, Math.ceil(Math.log2(palette.length)));
    ascii("GIF89a");
    u16(width);
    u16(height);
    out.push(0x80 | ((tableBits - 1) << 4) | (tableBits - 1), 0, 0);
    for (let i = 0; i < 1 << tableBits; i++) {
        const hex = palette[i] || "#000000";
        out.push(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
    }
    // Loop forever
    out.push(0x21, 0xff, 0x0b);
    ascii("NETSCAPE2.0");
    out.push(0x03, 0x01, 0x00, 0x00, 0x00);
    for (const { pixels, ms } of frames) {
        // Graphic control: restore to background between frames, delay, transparent index 0
        out.push(0x21, 0xf9, 0x04, (2 << 2) | 1);
        u16(Math.round(ms / 10));
        out.push(0, 0);
        out.push(0x2c);
        u16(0);
        u16(0);
        u16(width);
        u16(height);
        out.push(0);
        out.push(tableBits);
        const data = lzw(tableBits, pixels);
        for (let i = 0; i < data.length; i += 255) {
            const chunk = data.slice(i, i + 255);
            out.push(chunk.length, ...chunk);
        }
        out.push(0);
    }
    out.push(0x3b);
    return Buffer.from(out);
}

// ---------- PNG (still images, e.g. link-preview cards) ----------

// Write a still PNG from a single grid. Every "." cell gets `background`.
export function writePixelPng(file, { grid, colors, background, scale = 8 }) {
    const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const lookup = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, rgb(v)]));
    const bg = rgb(background);
    const w = grid[0].length * scale, h = grid.length * scale;
    const raw = Buffer.alloc((w * 3 + 1) * h);
    for (let y = 0; y < h; y++) {
        const row = grid[Math.floor(y / scale)];
        raw[y * (w * 3 + 1)] = 0; // filter: none
        for (let x = 0; x < w; x++) {
            const [r, g, b] = lookup[row[Math.floor(x / scale)]] ?? bg;
            raw.set([r, g, b], y * (w * 3 + 1) + 1 + x * 3);
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
    const png = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
    fs.writeFileSync(file, png);
    return { width: w, height: h, bytes: png.length };
}

function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}

function crc32(buf) {
    let c = ~0;
    for (const byte of buf) {
        c ^= byte;
        for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
}
