// Draws the app icon (a yellow bumper plate on the gym-floor background) as PNGs. Run: node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [0x14, 0x16, 0x1b], PLATE = [0xf3, 0xc2, 0x33], RIM = [0xb8, 0x90, 0x1f], HOLE = [0x14, 0x16, 0x1b];

function draw(size, scale) {
  const px = Buffer.alloc(size * size * 4);
  const c = size / 2, R = size * 0.36 * scale;
  // rings from the outside in: [outer radius, colour]
  const rings = [[R, PLATE], [R * 0.93, RIM], [R * 0.88, PLATE], [R * 0.34, RIM], [R * 0.27, PLATE], [R * 0.2, HOLE]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
    let col = BG;
    for (const [r, rc] of rings) {
      const cover = Math.min(1, Math.max(0, r - d + 0.5));   // 1px anti-aliased edge
      if (cover > 0) col = col.map((v, k) => Math.round(v + (rc[k] - v) * cover));
    }
    const o = (y * size + x) * 4;
    px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255;
  }
  return png(size, px);
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), draw(192, 1.15));
fs.writeFileSync(path.join(out, 'icon-512.png'), draw(512, 1.15));
fs.writeFileSync(path.join(out, 'icon-maskable-512.png'), draw(512, 0.95));   // stays inside Android's safe zone
fs.writeFileSync(path.join(out, 'icon-android-1024.png'), draw(1024, 0.8));   // Android app launcher icon: plate inside the adaptive-icon safe zone
console.log('icons written to', out);
