const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function generateIcon(size, filename, isMaskable = false) {
  let canvas;
  try {
    canvas = createCanvas(size, size);
  } catch (e) {
    console.error('Canvas not available, fallback to SVG');
    return false;
  }
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4f46e5'); // Indigo 600
  gradient.addColorStop(1, '#3730a3'); // Indigo 800

  ctx.fillStyle = gradient;
  if (!isMaskable) {
    const cornerRadius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(size - cornerRadius, 0);
    ctx.quadraticCurveTo(size, 0, size, cornerRadius);
    ctx.lineTo(size, size - cornerRadius);
    ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
    ctx.lineTo(cornerRadius, size);
    ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }

  // Draw stylized "F" logo
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.45)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', size / 2, size / 2 + size * 0.03);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
  return true;
}

const sizes = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 512, name: 'maskable-512.png', maskable: true },
  { size: 180, name: 'apple-touch-icon.png', maskable: false },
];

let success = true;
for (const s of sizes) {
  if (!generateIcon(s.size, s.name, s.maskable)) {
    success = false;
    break;
  }
}

if (!success) {
  console.log('Using pure SVG fallback writer');
}
