// scripts/package.mjs

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createRequire } from "module";
import archiver from "archiver"; // This line will be adjusted below

// Create a CommonJS require function
const require = createRequire(import.meta.url);
const archiverModule = require("archiver");

// Function to run shell commands and return a promise
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const proc = exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
        return;
      }
      resolve(stdout);
    });

    // Pipe stdout and stderr to the main process
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  });
}

// Function to validate manifest.json
function validateManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  // Basic validation: Check for required fields
  const requiredFields = [
    "manifest_version",
    "name",
    "version",
    "action",
    "permissions",
  ];
  requiredFields.forEach((field) => {
    if (!manifest.hasOwnProperty(field)) {
      throw new Error(`manifest.json is missing required field: ${field}`);
    }
  });

  console.log("manifest.json validation passed.");
}

// Function to zip the extension
function zipDirectory(source, out) {
  const archive = archiverModule("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

// Main packaging function
async function packageExtension() {
  try {
    console.log("Starting build process...");
    // Step 1: Run the build command
    await runCommand("npm run build");
    console.log("Build completed.");

    // Step 2: Validate manifest.json
    const manifestPath = path.join(process.cwd(), "dist", "manifest.json");
    validateManifest(manifestPath);

    // Step 3: Read version from package.json
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
    );
    const version = packageJson.version || "1.0.0";

    // Step 4: Define output zip file name
    const zipFileName = `mindfulness-timer-v${version}.zip`;
    const zipFilePath = path.join(process.cwd(), "build", zipFileName);

    // Ensure the build directory exists
    const buildDir = path.join(process.cwd(), "build");
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir);
    }

    // Step 5: Zip the dist directory
    console.log("Zipping the extension...");
    await zipDirectory(path.join(process.cwd(), "dist"), zipFilePath);
    console.log(`Extension zipped successfully at ${zipFilePath}`);

    console.log("Packaging completed successfully!");
  } catch (err) {
    console.error("Error during packaging:", err.error || err);
    process.exit(1);
  }
}

packageExtension();
