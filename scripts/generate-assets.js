/**
 * generate-assets.js
 * Genera los PNGs mínimos válidos requeridos por Expo Build
 * usando solo módulos nativos de Node.js (zlib + fs).
 * No requiere dependencias externas.
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

function writeSolidPNG(filePath, width, height, r, g, b) {
  const PNG_SIG = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (const byte of buf) {
      c ^= byte;
      for (let i = 0; i < 8; i++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // RGB color type
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw pixel data (filter byte 0 per scanline)
  const scanline = width * 3;
  const raw = Buffer.allocUnsafe(height * (1 + scanline));
  for (let y = 0; y < height; y++) {
    const off = y * (1 + scanline);
    raw[off] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      raw[off + 1 + x * 3]     = r;
      raw[off + 1 + x * 3 + 1] = g;
      raw[off + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 1 });
  const png = Buffer.concat([
    PNG_SIG,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
  console.log(`  OK  ${path.basename(filePath).padEnd(24)} ${width}x${height}px`);
}

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

console.log('\nGenerando assets de Expo...\n');

// Teal oscuro: rgb(15, 118, 110) — coincide con backgroundColor en app.json
writeSolidPNG(path.join(assetsDir, 'icon.png'),          1024, 1024, 15, 118, 110);
writeSolidPNG(path.join(assetsDir, 'splash.png'),        1284, 2778, 15, 118, 110);
writeSolidPNG(path.join(assetsDir, 'adaptive-icon.png'), 1024, 1024, 15, 118, 110);
writeSolidPNG(path.join(assetsDir, 'favicon.png'),          48,   48, 15, 118, 110);

console.log('\nListo. Archivos en: assets/');
