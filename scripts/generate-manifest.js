import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifest = {
  "manifest_version": 3,
  "name": "Mindfulness Timer",
  "version": "1.0.0",
  "description": "A mindful browsing companion that provides periodic reminders with inspirational quotes",
  "permissions": ["notifications", "storage", "alarms"],
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.svg",
      "48": "icons/icon48.svg",
      "128": "icons/icon128.svg"
    }
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "icons": {
    "16": "icons/icon16.svg",
    "48": "icons/icon48.svg",
    "128": "icons/icon128.svg"
  }
};

const manifestPath = resolve(__dirname, '../public/manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest.json'); 