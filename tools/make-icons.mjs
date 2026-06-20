/* Generates icon-192.png and icon-512.png (app icon: brand orb on navy).
   Pure Node (built-in zlib) — no dependencies. Run: node tools/make-icons.mjs */
import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function png(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const orbR = size * 0.30, ringR = size * 0.43, ringW = size * 0.012;
  const hlx = cx - size * 0.09, hly = cy - size * 0.09; // highlight center (top-left)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    let r = 10, g = 14, b = 26; // bg #0a0e1a
    const d = Math.hypot(x - cx, y - cy);
    const ringA = Math.max(0, 1 - Math.abs(d - ringR) / ringW);
    if (ringA > 0) { r = mix(r, 255, 0.10 * ringA); g = mix(g, 255, 0.10 * ringA); b = mix(b, 255, 0.12 * ringA); }
    const edge = Math.max(1.5, size * 0.004);
    if (d < orbR + edge) {
      const a = Math.min(1, (orbR + edge - d) / edge);
      const hd = Math.hypot(x - hlx, y - hly) / orbR;
      const light = Math.max(0, 0.35 * (1 - Math.min(1, hd)));
      r = mix(r, mix(79, 255, light), a); g = mix(g, mix(140, 255, light), a); b = mix(b, mix(255, 255, light), a);
    }
    buf[i] = clamp(r); buf[i + 1] = clamp(g); buf[i + 2] = clamp(b); buf[i + 3] = 255;
  }
  return buf;
}

for (const size of [192, 512]) {
  const out = new URL(`../icon-${size}.png`, import.meta.url);
  writeFileSync(out, png(size, render(size)));
  console.log("wrote", fileURLToPath(out));
}
