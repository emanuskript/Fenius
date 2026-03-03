import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

function expandHomeDir(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/")) return path.join(os.homedir(), inputPath.slice(2));
  return inputPath;
}

function normalizePlusKey(key) {
  return key.replace(/\s*\+\s*/g, "+").trim();
}

function sanitizeFilenameStem(rawStem) {
  const ascii = rawStem
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();

  const normalized = ascii
    .replace(/\s+/g, "_")
    .replace(/\+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");

  return normalized || "asset";
}

function deriveKeys(rawStem) {
  const keys = new Set();
  const trimmed = rawStem.trim();
  if (trimmed) keys.add(trimmed);

  const plusNormalized = normalizePlusKey(trimmed);
  if (plusNormalized) keys.add(plusNormalized);

  const hyphenPair = plusNormalized.match(/^(\d+)-(\d+[A-Za-z]?)$/);
  if (hyphenPair) {
    keys.add(`${hyphenPair[1]}+${hyphenPair[2]}`);
  }

  const plusPair = plusNormalized.match(/^(\d+)\+(\d+[A-Za-z]?)$/);
  if (plusPair) {
    keys.add(`${plusPair[1]}+${plusPair[2]}`);
  }

  const leadingId = trimmed.match(/^0*(\d+)([A-Za-z])?(?:$|\b|[_\-\s])/);
  if (leadingId) {
    const number = String(Number(leadingId[1]));
    const variant = (leadingId[2] || "").toUpperCase();
    keys.add(variant ? `${number}${variant}` : number);

    if (!variant) {
      const trailingVariant = trimmed.match(/(?:[_\-\s])([A-Za-z])$/);
      if (trailingVariant) {
        keys.add(`${number}${trailingVariant[1].toUpperCase()}`);
      }
    }
  }

  const embeddedPlusKeys = trimmed.match(/\b\d+\s*\+\s*\d+[A-Za-z]?\b/g) || [];
  for (const value of embeddedPlusKeys) {
    keys.add(normalizePlusKey(value));
  }

  return Array.from(keys).filter(Boolean);
}

function toPublicPath(fileName) {
  return `/book-paths/${fileName}`;
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function loadRequiredKeys() {
  try {
    const modulePath = pathToFileURL(path.resolve("src", "bookPaths", "requiredAssets.js")).href;
    const mod = await import(modulePath);
    if (Array.isArray(mod.REQUIRED_BOOK_PATHS_ASSET_KEYS)) {
      return mod.REQUIRED_BOOK_PATHS_ASSET_KEYS;
    }
  } catch (error) {
    console.warn(`[sync-book-paths-assets] Could not load required keys: ${error.message}`);
  }
  return [];
}

async function clearDestination(destDir) {
  const entries = await fs.readdir(destDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;
    await fs.unlink(path.join(destDir, entry.name));
  }
}

async function run() {
  const defaultSourceDir = path.join(os.homedir(), "Desktop", "drawings", "Drawings");
  const sourceDir = path.resolve(expandHomeDir(process.env.BOOK_PATHS_DRAWINGS_DIR || defaultSourceDir));
  const destinationDir = path.resolve("public", "book-paths");
  const generatedModulePath = path.resolve("src", "bookPaths", "assets.generated.js");

  await ensureDirectory(destinationDir);
  await ensureDirectory(path.dirname(generatedModulePath));

  const sourceStats = await fs.stat(sourceDir).catch(() => null);
  if (!sourceStats || !sourceStats.isDirectory()) {
    throw new Error(`Source drawings directory does not exist: ${sourceDir}`);
  }

  await clearDestination(destinationDir);

  const sourceEntries = await fs.readdir(sourceDir, { withFileTypes: true });
  const sourceFiles = sourceEntries
    .filter((entry) => entry.isFile())
    .filter((entry) => SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()));

  const keyToAsset = {};
  const usedFileNames = new Set();
  let copied = 0;

  for (const fileEntry of sourceFiles) {
    const extension = path.extname(fileEntry.name).toLowerCase();
    const sourceFilePath = path.join(sourceDir, fileEntry.name);
    const rawStem = path.basename(fileEntry.name, path.extname(fileEntry.name));

    const safeStem = sanitizeFilenameStem(rawStem);
    let targetFileName = `${safeStem}${extension}`;
    let dedupeIndex = 2;

    while (usedFileNames.has(targetFileName)) {
      targetFileName = `${safeStem}_${dedupeIndex}${extension}`;
      dedupeIndex += 1;
    }

    usedFileNames.add(targetFileName);
    await fs.copyFile(sourceFilePath, path.join(destinationDir, targetFileName));
    copied += 1;

    const keys = deriveKeys(rawStem);
    const publicPath = toPublicPath(targetFileName);

    for (const key of keys) {
      if (!keyToAsset[key]) {
        keyToAsset[key] = publicPath;
      }
    }

    // When source key is 21-22 style, also expose 21+22 for flow references.
    const plusAlias = safeStem.match(/^(\d+)-(\d+[A-Za-z]?)$/)
      ? `${safeStem.split("-")[0]}+${safeStem.split("-")[1]}`
      : null;
    if (plusAlias && !keyToAsset[plusAlias]) {
      keyToAsset[plusAlias] = publicPath;
    }
  }

  const sortedKeys = Object.keys(keyToAsset).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

  const generatedLines = sortedKeys.map(
    (key) => `  ${JSON.stringify(key)}: ${JSON.stringify(keyToAsset[key])},`
  );

  const generatedFile = `// AUTO-GENERATED. DO NOT EDIT.\n// Generated by scripts/sync-book-paths-assets.mjs\n\nexport const BOOK_PATHS_ASSETS = {\n${generatedLines.join("\n")}\n};\n\nexport function resolveBookPathAsset(key) {\n  return BOOK_PATHS_ASSETS[key] || null;\n}\n`;

  await fs.writeFile(generatedModulePath, generatedFile, "utf8");

  const requiredKeys = await loadRequiredKeys();
  const missingRequired = requiredKeys.filter((key) => !keyToAsset[key]);

  console.log(`Synced ${copied} drawing assets from: ${sourceDir}`);
  console.log(`Assets destination: ${destinationDir}`);
  console.log(`Generated module: ${generatedModulePath}`);
  console.log(`Mapped keys: ${sortedKeys.length}`);

  if (missingRequired.length) {
    console.warn("[sync-book-paths-assets] Missing required keys:");
    console.warn(`  ${missingRequired.join(", ")}`);
  }
}

run().catch((error) => {
  console.error("sync-book-paths-assets failed:", error.message);
  process.exitCode = 1;
});
