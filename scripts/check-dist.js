// scripts/check-dist.js

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkDist() {
  const distPath = resolve(__dirname, "../dist");
  console.log("\nChecking dist folder contents:");

  if (!fs.existsSync(distPath)) {
    console.log("❌ dist folder does not exist!");
    return;
  }

  // Check manifest
  const manifestPath = resolve(distPath, "manifest.json");
  console.log("\nManifest:", fs.existsSync(manifestPath) ? "✅" : "❌");
  if (fs.existsSync(manifestPath)) {
    console.log(
      "Manifest contents:",
      JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    );
  }

  // Check icons
  const iconsPath = resolve(distPath, "icons");
  console.log("\nIcons folder:", fs.existsSync(iconsPath) ? "✅" : "❌");
  if (fs.existsSync(iconsPath)) {
    console.log("Icons directory contents:");
    fs.readdirSync(iconsPath).forEach((file) => {
      console.log(`- ${file}`);
    });
  }

  // Check key files
  console.log("\nKey files:");
  ["index.html", "main.js", "background.js"].forEach((file) => {
    const exists = fs.existsSync(resolve(distPath, file));
    console.log(`${file}: ${exists ? "✅" : "❌"}`);
  });
}

checkDist();
