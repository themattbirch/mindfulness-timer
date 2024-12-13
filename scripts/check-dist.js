// scripts/check-dist.js

import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Define __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkDist() {
  const buildPath = resolve(__dirname, "../mindfulness-build");
  console.log("\nChecking mindfulness-build folder contents:");

  if (!fs.existsSync(buildPath)) {
    console.log("❌ mindfulness-build folder does not exist!");
    return;
  }

  // Check manifest
  const manifestPath = resolve(buildPath, "manifest.json");
  console.log("\nManifest:", fs.existsSync(manifestPath) ? "✅" : "❌");
  if (fs.existsSync(manifestPath)) {
    console.log(
      "Manifest contents:",
      JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, "utf8")), null, 2)
    );
  }

  // Check icons
  const iconsPath = resolve(buildPath, "icons");
  console.log("\nIcons folder:", fs.existsSync(iconsPath) ? "✅" : "❌");
  if (fs.existsSync(iconsPath)) {
    console.log("Icons directory contents:");
    fs.readdirSync(iconsPath).forEach((file) => {
      console.log(`- ${file}`);
    });
  }

  // Check sounds
  const soundsPath = resolve(buildPath, "sounds");
  console.log("\nSounds folder:", fs.existsSync(soundsPath) ? "✅" : "❌");
  if (fs.existsSync(soundsPath)) {
    console.log("Sounds directory contents:");
    fs.readdirSync(soundsPath).forEach((file) => {
      console.log(`- ${file}`);
    });
  }

  // Check _locales/en/messages.json
  const localesPath = resolve(buildPath, "_locales", "en", "messages.json");
  console.log(
    "\n_locales/en/messages.json:",
    fs.existsSync(localesPath) ? "✅" : "❌"
  );
  if (fs.existsSync(localesPath)) {
    console.log(
      "messages.json contents:",
      JSON.stringify(JSON.parse(fs.readFileSync(localesPath, "utf8")), null, 2)
    );
  }

  // Check key files
  console.log("\nKey files:");
  ["index.html", "popup.js", "background.js"].forEach((file) => {
    const exists = fs.existsSync(resolve(buildPath, file));
    console.log(`${file}: ${exists ? "✅" : "❌"}`);
  });
}

checkDist();
