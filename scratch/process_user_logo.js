const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Source uploaded image path
const userUploadedLogo = '/Users/ashok/.gemini/antigravity/brain/7801f4f9-13a4-43d4-a148-42ad2457c45a/.user_uploaded/media_1787725357545.png';

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Copy original high-res logo to public/logo.png & public/icons/logo.png
fs.copyFileSync(userUploadedLogo, path.join(publicDir, 'logo.png'));
fs.copyFileSync(userUploadedLogo, path.join(iconsDir, 'logo.png'));
console.log('Saved original logo to public/logo.png');

// Helper to decode PNG chunk and resize or pad to square
function readPngPixels(pngBuffer) {
  // Simple check for valid PNG header
  if (pngBuffer[0] !== 0x89 || pngBuffer[1] !== 0x50) {
    throw new Error('Invalid PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let idatChunks = [];

  while (offset < pngBuffer.length) {
    const length = pngBuffer.readUInt32BE(offset);
    const type = pngBuffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = pngBuffer.readUInt32BE(offset + 8);
      height = pngBuffer.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(pngBuffer.slice(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);
  return { width, height, data: decompressed };
}

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

function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter 0
    const start = y * width * 4;
    rgbaBuffer.copy(row, 1, start, start + width * 4);
    rawRows.push(row);
  }

  const compressedData = zlib.deflateSync(Buffer.concat(rawRows));
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function resizeImage({ width: srcW, height: srcH, data: srcData }, targetW, targetH) {
  const targetBuf = Buffer.alloc(targetW * targetH * 4);
  const bpp = 4; // assuming RGBA or RGB
  const srcRowSize = srcW * 4 + 1;

  for (let ty = 0; ty < targetH; ty++) {
    const sy = Math.floor((ty / targetH) * srcH);
    for (let tx = 0; tx < targetW; tx++) {
      const sx = Math.floor((tx / targetW) * srcW);

      const srcIdx = sy * srcRowSize + 1 + sx * 4;
      const targetIdx = (ty * targetW + tx) * 4;

      targetBuf[targetIdx] = srcData[srcIdx];       // R
      targetBuf[targetIdx + 1] = srcData[srcIdx + 1]; // G
      targetBuf[targetIdx + 2] = srcData[srcIdx + 2]; // B
      targetBuf[targetIdx + 3] = srcData[srcIdx + 3] !== undefined ? srcData[srcIdx + 3] : 255; // A
    }
  }

  return targetBuf;
}

try {
  const logoBuf = fs.readFileSync(userUploadedLogo);
  const src = readPngPixels(logoBuf);

  const sizes = [
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-192.png', size: 192 },
    { name: 'maskable-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const s of sizes) {
    const resizedRgba = resizeImage(src, s.size, s.size);
    const pngOutput = encodePng(s.size, s.size, resizedRgba);
    fs.writeFileSync(path.join(iconsDir, s.name), pngOutput);
    console.log(`Successfully generated icons/${s.name} (${s.size}x${s.size})`);
  }

  // Root fallbacks
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), encodePng(180, 180, resizeImage(src, 180, 180)));
  fs.writeFileSync(path.join(publicDir, 'icon.png'), encodePng(192, 192, resizeImage(src, 192, 192)));

} catch (e) {
  console.error('Error processing user logo:', e);
}
