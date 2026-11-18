import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "..");

async function importSource(relativePath) {
  const source = await fs.readFile(path.join(repoRoot, relativePath), "utf8");
  const encoded = Buffer.from(source).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const ACTIVITY_PATH = "src/bookPaths/romanesque/activity.json";
const ASSET_DIR = path.join(repoRoot, "public", "book-paths", "romanesque");
const EXPECTED_PATHS = 10368;

// Options that, by design of the activity, do not change the sheet at their own step.
const NO_CHANGE_ALLOWLIST = {
  "style:romanesque": "the style step only opens the activity; the block drawing stays as it is",
  "endleaves:none": "no endleaves are added, so the block is unchanged",
  "endleaves:own": "the first and last pages are already part of the block drawing",
  "lining:none": "no lining is added",
  "tab:square": "the tab step shows thumbnails only; the tab shape appears once the book is covered",
  "tab:round": "the tab step shows thumbnails only; the tab shape appears once the book is covered",
};
// Keys that cannot change any scene because only one of their options is available.
const SINGLE_VALUE_KEYS = {
  style: "Carolingian and Gothic are in preparation, so Romanesque is the only available style",
};

const activity = JSON.parse(await fs.readFile(path.join(repoRoot, ACTIVITY_PATH), "utf8"));
const C = await importSource("src/bookPaths/romanesque/compositor.js");

// ---------------------------------------------------------------------------
// Static shape: every referenced scene and drawing exists.
// ---------------------------------------------------------------------------
assert.ok(Array.isArray(activity.canvas) && activity.canvas.length === 2, "canvas must be [w, h]");
for (const key of ["drawings", "scenes", "steps"]) assert.ok(activity[key], `activity.${key} is missing`);

function sceneNamesOf(value) {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  return Object.entries(value).filter(([k]) => k !== "by").map(([, v]) => v);
}

for (const [name, scene] of Object.entries(activity.scenes)) {
  assert.ok(Array.isArray(scene.layers), `scene ${name} has no layers`);
  for (const layer of scene.layers) {
    if (layer.scene) assert.ok(activity.scenes[layer.scene], `scene ${name} embeds missing scene ${layer.scene}`);
    else assert.ok(activity.drawings[layer.draw], `scene ${name} uses missing drawing ${layer.draw}`);
    if (layer.transform) assert.equal(layer.transform.length, 6, `scene ${name}: transform must have 6 numbers`);
  }
}
const stepIds = new Set();
for (const step of activity.steps) {
  assert.ok(step.id && !stepIds.has(step.id), `duplicate or missing step id ${step.id}`);
  stepIds.add(step.id);
  for (const name of [...sceneNamesOf(step.scene), ...sceneNamesOf(step.before)]) {
    assert.ok(activity.scenes[name], `step ${step.id} uses missing scene ${name}`);
  }
  for (const option of step.options || []) {
    if (option.thumb) assert.ok(activity.drawings[option.thumb.draw], `step ${step.id}: thumbnail drawing ${option.thumb.draw} missing`);
  }
  for (const figure of step.figures || []) {
    assert.ok(activity.drawings[figure.draw], `step ${step.id}: figure drawing ${figure.draw} missing`);
  }
}

// ---------------------------------------------------------------------------
// Files: every drawing file exists; every SVG's size equals its viewBox.
// ---------------------------------------------------------------------------
const referencedFiles = new Set();
for (const [id, drawing] of Object.entries(activity.drawings)) {
  assert.ok(typeof drawing.file === "string" && !drawing.file.startsWith("/") && !drawing.file.includes(".."),
    `drawing ${id}: file must be a relative path inside the asset folder`);
  referencedFiles.add(drawing.file);
  const filePath = path.join(ASSET_DIR, drawing.file);
  await fs.access(filePath).catch(() => assert.fail(`drawing ${id}: ${drawing.file} not found under public/book-paths/romanesque/`));
  if (/\.svg$/i.test(drawing.file)) {
    const head = (await fs.readFile(filePath, "utf8")).slice(0, 4000);
    const match = head.match(/<svg\b[^>]*\bviewBox\s*=\s*["']([^"']+)["']/i);
    assert.ok(match, `${drawing.file} has no viewBox`);
    const [, , w, h] = match[1].trim().split(/[\s,]+/).map(Number);
    assert.ok(Math.abs(w - drawing.size[0]) <= 0.1 && Math.abs(h - drawing.size[1]) <= 0.1,
      `drawing ${id}: size ${drawing.size} does not match viewBox ${w} ${h} of ${drawing.file}`);
  }
}

// ---------------------------------------------------------------------------
// Paths: enumerate every complete path, honouring `when` and `disabled`.
// Collect every reachable prefix (choices for the steps up to and including i).
// ---------------------------------------------------------------------------
const steps = activity.steps;
const prefixesAt = steps.map(() => new Map()); // stepIndex -> signature -> choices
let completePaths = 0;

function signature(choices) {
  return JSON.stringify(Object.keys(choices).sort().map((k) => [k, choices[k]]));
}

function walk(index, choices) {
  if (index === steps.length) {
    completePaths += 1;
    return;
  }
  const step = steps[index];
  if (!step.key) {
    prefixesAt[index].set(signature(choices), choices);
    walk(index + 1, choices);
    return;
  }
  const options = C.visibleOptions(step, choices).filter((o) => !o.disabled);
  assert.ok(options.length, `step ${step.id} has no available option for ${signature(choices)}`);
  for (const option of options) {
    const next = { ...choices, [step.key]: option.value };
    prefixesAt[index].set(signature(next), next);
    walk(index + 1, next);
  }
}
walk(0, {});
assert.equal(completePaths, EXPECTED_PATHS, "Unexpected number of Romanesque decision paths");

function layerList(sheet) {
  return sheet.layers.map((l) => `${l.id}@${l.matrix.map((n) => n.toFixed(3)).join(",")}`).join(" ");
}

// Every reachable state, unanswered and answered, resolves to drawings that exist.
let checkedStates = 0;
const changedOptions = new Set();
const unchangedOptions = new Set();
steps.forEach((step, index) => {
  for (const prefix of prefixesAt[index].values()) {
    const unansweredChoices = { ...prefix };
    if (step.key) delete unansweredChoices[step.key];
    const answered = C.composeSheet(activity, prefix, index);
    const unanswered = C.composeSheet(activity, unansweredChoices, index);
    for (const sheet of [answered, unanswered]) {
      if (sheet.sceneName) assert.ok(activity.scenes[sheet.sceneName], `missing scene ${sheet.sceneName}`);
      for (const layer of sheet.layers) assert.ok(referencedFiles.has(layer.file));
      assert.ok(sheet.layers.length || (!sheet.sceneName && steps[index].emptyText), `step ${step.id}: empty sheet without emptyText`);
      checkedStates += 1;
    }
    if (step.key) {
      const id = `${step.key}:${prefix[step.key]}`;
      if (layerList(answered) !== layerList(unanswered)) changedOptions.add(id);
      else unchangedOptions.add(id);
    }
  }
});

// Every option changes the sheet at its own step, or is allowlisted with a reason.
const neverChanges = [...unchangedOptions].filter((id) => !changedOptions.has(id)).sort();
const sometimesUnchanged = [...unchangedOptions].filter((id) => changedOptions.has(id) && !NO_CHANGE_ALLOWLIST[id]);
assert.deepEqual(
  neverChanges,
  Object.keys(NO_CHANGE_ALLOWLIST).sort(),
  "Options that do not change the sheet at their own step must match the allowlist exactly"
);
assert.deepEqual(sometimesUnchanged, [], "Some options change the sheet only for some earlier choices");

// Every key changes some scene somewhere: answering it changes the sheet at its own
// step, or two reachable states that differ only in that key draw differently later.
for (const [keyIndex, step] of steps.entries()) {
  if (!step.key || SINGLE_VALUE_KEYS[step.key]) continue;
  let changes = [...changedOptions].some((id) => id.startsWith(`${step.key}:`));
  for (let index = keyIndex; index < steps.length && !changes; index += 1) {
    const groups = new Map();
    for (const prefix of prefixesAt[index].values()) {
      const rest = { ...prefix };
      delete rest[step.key];
      const group = signature(rest);
      const drawn = layerList(C.composeSheet(activity, prefix, index));
      if (!groups.has(group)) groups.set(group, new Set());
      groups.get(group).add(drawn);
      if (groups.get(group).size > 1) { changes = true; break; }
    }
  }
  assert.ok(changes, `choice "${step.key}" never changes any scene`);
}
for (const key of Object.keys(SINGLE_VALUE_KEYS)) {
  const step = steps.find((s) => s.key === key);
  assert.equal((step.options || []).filter((o) => !o.disabled).length, 1, `${key} is no longer single-valued; remove it from SINGLE_VALUE_KEYS`);
}

// ---------------------------------------------------------------------------
// Step strings are plain text (rendered with interpolation, never as HTML).
// ---------------------------------------------------------------------------
let checkedStrings = 0;
function noMarkup(value, where) {
  if (typeof value === "string") {
    assert.ok(!value.includes("<"), `${where} contains "<"`);
    checkedStrings += 1;
  } else if (Array.isArray(value)) value.forEach((v, i) => noMarkup(v, `${where}[${i}]`));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) noMarkup(v, `${where}.${k}`);
}
noMarkup(activity.steps, "steps");
for (const [name, scene] of Object.entries(activity.scenes)) noMarkup(scene.caption, `scenes.${name}.caption`);
for (const [id, drawing] of Object.entries(activity.drawings)) noMarkup(drawing.name, `drawings.${id}.name`);

// ---------------------------------------------------------------------------
// No orphaned files in the Romanesque asset folder.
// ---------------------------------------------------------------------------
async function listFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}
const romanesqueFiles = (await listFiles(ASSET_DIR)).map((f) => path.relative(ASSET_DIR, f).split(path.sep).join("/"));
const orphans = romanesqueFiles.filter((f) => !referencedFiles.has(f) && !f.startsWith("."));
assert.deepEqual(orphans, [], "Files in public/book-paths/romanesque/ that no drawing uses");

// ---------------------------------------------------------------------------
// Security: every public SVG under public/book-paths (recursively).
// ---------------------------------------------------------------------------
const forbidden = [
  [/<script\b/i, "script element"],
  [/javascript\s*:/i, "javascript URL"],
  [/\son[a-z][\w:-]*\s*=/i, "event-handler attribute"],
  [/<!DOCTYPE\b/i, "external-capable DOCTYPE"],
  [/(?:href|xlink:href)\s*=\s*["']https?:\/\//i, "external linked resource"],
];
let checkedSvgCount = 0;
for (const file of await listFiles(path.join(repoRoot, "public", "book-paths"))) {
  if (path.extname(file).toLowerCase() !== ".svg") continue;
  const source = await fs.readFile(file, "utf8");
  for (const [pattern, label] of forbidden) {
    assert.ok(!pattern.test(source), `${path.relative(repoRoot, file)} contains a forbidden ${label}`);
  }
  checkedSvgCount += 1;
}

console.log(`Book-path audit passed: ${completePaths} valid Romanesque paths.`);
console.log(`Resolved ${checkedStates} reachable sheet states across ${steps.length} steps; ${referencedFiles.size} drawing files and viewBoxes verified.`);
console.log(`Allowlisted no-change options: ${Object.keys(NO_CHANGE_ALLOWLIST).join(", ")}.`);
console.log(`Checked ${checkedStrings} step strings for markup.`);
console.log(`Security-checked ${checkedSvgCount} public SVG files (recursive) for active or external content.`);
