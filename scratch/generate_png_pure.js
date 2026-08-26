const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let curr = n;
    for (let k = 0; k < 8; k++) {
      curr = (curr & 1) ? (0xedb88320 ^ (curr >>> 1)) : (curr >>> 1);
    }
    table[n] = curr;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(width, height, isMaskable = false) {
  // Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT - Pixel Data
  const rawRows = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if inside icon area
      const isInside = isMaskable || dist <= radius;
      
      if (isInside) {
        // Indigo gradient #4f46e5 (79, 70, 229) to #3730a3 (55, 48, 163)
        const factor = (y / height);
        const r = Math.round(79 - factor * 24);
        const g = Math.round(70 - factor * 22);
        const b = Math.round(229 - factor * 66);

        // Simple 'F' character drawing logic
        const nx = (x - cx) / (width * 0.3); // Normalized -1 to 1 inside logo
        const ny = (y - cy) / (height * 0.3);

        const isStem = (nx >= -0.4 && nx <= -0.15 && ny >= -0.6 && ny <= 0.6);
        const isTopBar = (nx >= -0.4 && nx <= 0.4 && ny >= -0.6 && ny <= -0.35);
        const isMidBar = (nx >= -0.4 && nx <= 0.25 && ny >= -0.1 && ny <= 0.15);

        if (isStem || isTopBar || isMidBar) {
          // White #ffffff
          row[idx] = 255;
          row[idx + 1] = 255;
          row[idx + 2] = 255;
          row[idx + 3] = 255;
        } else {
          row[idx] = r;
          row[idx + 1] = g;
          row[idx + 2] = b;
          row[idx + 3] = 255;
        }
      } else {
        // Transparent outside radius for non-maskable
        row[idx] = 0;
        row[idx + 1] = 0;
        row[idx + 2] = 0;
        row[idx + 3] = 0;
      }
    }
    rawRows.push(row);
  }

  const rawBuffer = Buffer.concat(rawRows);
  const compressedData = zlib.deflateSync(rawBuffer);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const files = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
];

for (const file of files) {
  const pngBuf = createPng(file.size, file.size, file.maskable);
  const filePath = path.join(iconsDir, file.name);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Successfully generated ${file.name} (${file.size}x${file.size}, ${pngBuf.length} bytes)`);
}

// Also write favicon.ico/apple-touch-icon to public root for maximum device compatibility
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), createPng(180, 180, true));
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon.png'), createPng(192, 192, false));
