// scripts/package.mjs

import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    "permissions",
    "background",
    "icons",
    "description",
    // Add other required fields as per your manifest version
  ];

  requiredFields.forEach((field) => {
    if (!manifest.hasOwnProperty(field)) {
      throw new Error(`manifest.json is missing required field: ${field}`);
    }
  });

  console.log("manifest.json validation passed.");
}

// Function to list files in a directory
function listFiles(directoryPath) {
  const files = fs.readdirSync(directoryPath);
  console.log(`\nFiles in ${directoryPath}:`);
  files.forEach((file) => {
    console.log(`- ${file}`);
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

    // Step 4: Update version in manifest.json
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("Updated manifest.json version.");

    // Step 5: Define output folder name
    const buildFolderName = "mindfulness-build";
    const buildFolderPath = path.join(process.cwd(), buildFolderName);

    // Remove existing build folder if it exists
    if (fs.existsSync(buildFolderPath)) {
      fs.removeSync(buildFolderPath);
      console.log(`Removed existing ${buildFolderName} folder.`);
    }

    // List files in dist/ before copying
    listFiles(path.join(process.cwd(), "dist"));

    // Step 6: Copy dist directory to build folder using fs-extra (synchronously)
    console.log(`\nCopying files to ${buildFolderName} folder...`);
    fs.copySync(path.join(process.cwd(), "dist"), buildFolderPath, {
      filter: (src) => !src.includes(".DS_Store"),
    });
    console.log(`Files copied to ${buildFolderName} successfully.`);

    // List files in mindfulness-build/ after copying
    listFiles(buildFolderPath);

    // Step 7: Run check-dist.js
    console.log("\nRunning check-dist.js...");
    await runCommand(`node ${path.join(__dirname, "check-dist.js")}`);

    console.log("Packaging completed successfully!");
  } catch (err) {
    console.error("Error during packaging:", err.error || err);
    process.exit(1);
  }
}

packageExtension();
