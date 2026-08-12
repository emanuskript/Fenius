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

const [{ BOOK_PATHS_FLOW }, stateModule, visualStateModule, assetsModule] = await Promise.all([
  importSource("src/bookPaths/flow.js"),
  importSource("src/bookPaths/state.js"),
  importSource("src/bookPaths/romanModelState.js"),
  importSource("src/bookPaths/assets.generated.js"),
]);

const { applyOption, createInitialWizardState } = stateModule;
const { ROMANESQUE_VISUAL_FIELDS, romanModelSignature } = visualStateModule;
const { BOOK_PATHS_ASSETS } = assetsModule;

const terminalStates = [];
const visitedNodeIds = new Set();

function walk(state) {
  const node = BOOK_PATHS_FLOW[state.currentNodeId];
  assert.ok(node, `Missing flow node: ${state.currentNodeId}`);
  visitedNodeIds.add(node.id);

  const options = (node.options || []).filter((option) => !option.disabled);
  if (node.kind === "end" || options.length === 0) {
    terminalStates.push(state);
    return;
  }

  for (const option of options) {
    assert.ok(option.next, `${node.id} / ${option.label} has no next node`);
    assert.ok(BOOK_PATHS_FLOW[option.next], `${node.id} points to missing node ${option.next}`);
    walk(applyOption(state, node, option));
  }
}

walk(createInitialWizardState());

assert.equal(terminalStates.length, 10368, "Unexpected number of Romanesque decision paths");
assert.ok(terminalStates.every((state) => state.currentNodeId === "romanesque_end"));

const requiredFields = [
  "holes",
  "endleaves",
  "support",
  "sewing",
  "board",
  "channels",
  "backCornered",
  "lining",
  "endband",
  "endbandTab",
  "coverStitch",
  "fastening",
];
for (const state of terminalStates) {
  assert.equal(state.style, "Romanesque");
  for (const field of requiredFields) {
    assert.notEqual(state.derived[field], undefined, `Terminal path is missing ${field}`);
  }
}

const finalSignatures = new Set(
  terminalStates.map((state) => romanModelSignature(state.derived))
);
assert.equal(
  finalSignatures.size,
  terminalStates.length,
  "Every complete decision path must reach the renderer as a distinct model state"
);

const modelComponent = await fs.readFile(
  path.join(repoRoot, "src/components/bookPaths/RomanesqueBookModel.vue"),
  "utf8"
);
assert.ok(modelComponent.includes("<svg"), "The book model must be a single SVG scene");
assert.ok(
  !modelComponent.includes("/book-paths/layers/"),
  "The connected model must not stack independently framed drawing plates"
);
for (const field of ROMANESQUE_VISUAL_FIELDS) {
  assert.ok(
    modelComponent.includes(field),
    `The connected model does not account for ${field}`
  );
}

// Construction geometry must remain joined rather than regressing to a stack
// of unrelated reference-image fragments. Back-cornering changes the board
// polygon itself; the lower board is a complete plane; and cover sewing follows
// the selected endband-tab edge rather than decorating the whole upper cover.
for (const geometryFeature of [
  "const boardThickness = 16",
  "backCorneredBoardPoints",
  "const lowerBoardTopPoints",
  "const headTabStitchPath",
  "const tailTabStitchPath",
  "const lowerBoardForeStart = lowerBoardFront",
]) {
  assert.ok(
    modelComponent.includes(geometryFeature),
    `The connected model is missing required construction geometry: ${geometryFeature}`
  );
}
assert.ok(
  !modelComponent.includes("headBackCornerPath") &&
    !modelComponent.includes("tailBackCornerPath") &&
    !modelComponent.includes("coverPerimeterPath"),
  "Back-cornering and cover stitching must not be simulated with detached overlays"
);

const romanNodes = Object.values(BOOK_PATHS_FLOW).filter((node) =>
  node.id === "start" || node.style === "Romanesque"
);

// In the endleaf section, the chart's "no change" circles mean that the two
// non-added-endleaf choices retain the preceding cut/pierced book-block image.
// Guard this explicitly so they cannot regress to empty option cards.
const endleafNode = BOOK_PATHS_FLOW.romanesque_endleaves;
assert.deepEqual(endleafNode.imagesFromDerived?.map?.cut?.slice(0, 2), ["9", "9"]);
assert.deepEqual(endleafNode.imagesFromDerived?.map?.pierced?.slice(0, 2), ["8", "8"]);

// The chart distinguishes the small fastening option drawings (63A/64A)
// from the resulting binding drawings (63/64). Do not collapse them again.
const fasteningNode = BOOK_PATHS_FLOW.romanesque_fastening;
assert.deepEqual(fasteningNode.options.map((option) => option.image), ["63A", "64A"]);
const endNode = BOOK_PATHS_FLOW.romanesque_end;
assert.deepEqual(
  endNode.supplementalImagesFromDerived?.map?.["short-strap"]?.map((image) => image.key),
  ["63"]
);
assert.deepEqual(
  endNode.supplementalImagesFromDerived?.map?.["long-strap"]?.map((image) => image.key),
  ["64"]
);

const flowAssetKeys = new Set();
for (const node of romanNodes) {
  for (const key of node.images || []) flowAssetKeys.add(key);
  for (const option of node.options || []) if (option.image) flowAssetKeys.add(option.image);
  for (const image of node.supplementalImages || []) {
    flowAssetKeys.add(typeof image === "string" ? image : image.key);
  }
  if (node.supplementalImagesFromDerived) {
    for (const images of Object.values(node.supplementalImagesFromDerived.map || {})) {
      for (const image of images) {
        flowAssetKeys.add(typeof image === "string" ? image : image.key);
      }
    }
  }
  if (node.imagesFromDerived) {
    for (const keys of Object.values(node.imagesFromDerived.map || {})) {
      for (const key of keys) flowAssetKeys.add(key);
    }
    for (const key of node.imagesFromDerived.fallback || []) flowAssetKeys.add(key);
  }
}

for (const key of flowAssetKeys) {
  const publicPath = BOOK_PATHS_ASSETS[key];
  assert.ok(publicPath, `Drawing ${key} is not registered`);
  await fs.access(path.join(repoRoot, "public", publicPath.replace(/^\/book-paths\//, "book-paths/")));
}
console.log(`Book-path audit passed: ${terminalStates.length} valid Romanesque paths.`);
console.log(`Verified ${visitedNodeIds.size} reachable nodes and ${flowAssetKeys.size} chart drawings.`);
console.log(`Verified ${finalSignatures.size} distinct state-driven final model signatures.`);
