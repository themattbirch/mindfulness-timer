import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 48, 128];

function generateSVGIcon(size) {
  const strokeWidth = Math.max(1, size / 16);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}px" height="${size}px" viewBox="0 0 ${size} ${size}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <title>Mindfulness Timer Icon</title>
  <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <circle fill="#3B82F6" cx="${size/2}" cy="${size/2}" r="${size/2}"/>
    <circle stroke="#FFFFFF" stroke-width="${strokeWidth}" cx="${size/2}" cy="${size/2}" r="${size/3}"/>
  </g>
</svg>`;
}

function generateIcons() {
  console.log('Starting icon generation...');
  
  const iconDir = resolve(__dirname, '../public/icons');
  if (!fs.existsSync(iconDir)) {
    console.log('Creating public/icons directory...');
    fs.mkdirSync(iconDir, { recursive: true });
  }

  sizes.forEach(size => {
    const filepath = resolve(iconDir, `icon${size}.svg`);
    fs.writeFileSync(filepath, generateSVGIcon(size));
    console.log(`Generated ${filepath}`);
  });
  
  console.log('Icon generation complete!');
}

generateIcons(); 