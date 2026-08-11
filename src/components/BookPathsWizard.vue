<template>
  <div
    class="book-paths-overlay"
    :class="{ fullscreen }"
    @click.self="handleClose"
  >
    <section class="book-paths-modal surface-card" role="dialog" aria-modal="true" aria-label="Build a Bookbinding wizard">
      <header class="bp-header">
        <div>
          <h2>Build a Bookbinding</h2>
          <p class="bp-subtitle">
            <span v-if="styleLabel">{{ styleLabel }} binding</span>
            <span v-else>Choose a style to begin</span>
            <span v-if="state.context?.title"> | {{ state.context.title }}</span>
          </p>
        </div>
        <button class="secondary-btn" @click="handleClose">Close</button>
      </header>

      <div class="bp-layout">
        <aside class="bp-crumbs">
          <h3>Path</h3>
          <ul>
            <li>
              <button class="ghost-btn" @click="jumpToDecision(0)">Start</button>
            </li>
            <li v-for="(entry, i) in answeredEntries" :key="entry.key">
              <button class="ghost-btn" @click="jumpToDecision(entry.index)">
                {{ i + 1 }}. {{ entry.title }}
                <span class="crumb-choice">→ {{ entry.choiceLabel }}</span>
              </button>
            </li>
            <li class="current-step">
              Current: {{ summary ? "Summary" : (currentNode?.title || "Missing node") }}
            </li>
          </ul>
        </aside>

        <main class="bp-main">
          <template v-if="summary">
            <h3>Your Romanesque Binding</h3>
            <p class="bp-copy">Here's the binding you built. Click any step in the Path on the left to revise just that choice, or restart to begin again.</p>
            <div class="summary-grid">
              <div class="summary-recap surface-card">
                <p class="recap-style"><strong>{{ summary.style || "—" }}</strong> binding</p>
                <dl>
                  <template v-for="row in recapRows" :key="row.field">
                    <dt>{{ row.title }}</dt>
                    <dd>{{ row.value }}</dd>
                  </template>
                </dl>
              </div>
              <figure class="summary-figure">
                <figcaption class="figure-head">
                  <span class="fig-title">Your finished binding</span>
                  <span class="save-wrap">
                    <button type="button" class="ghost-btn save-btn" aria-haspopup="menu" :aria-expanded="saveMenuKey === 'summary'" @click="toggleSaveMenu('summary')">Save ▾</button>
                    <div v-if="saveMenuKey === 'summary'" class="save-menu" role="menu">
                      <button type="button" role="menuitem" @click="saveModel('png')">PNG (transparent)</button>
                      <button type="button" role="menuitem" @click="saveModel('jpg')">JPG (on white)</button>
                    </div>
                  </span>
                </figcaption>
                <img :src="finalModelSrc" alt="Your finished Romanesque binding" />
              </figure>
            </div>
          </template>

          <template v-else>
            <h3>{{ currentNode?.title || "Missing node" }}</h3>
            <p class="bp-copy">
              {{ currentNode?.body || "This node is not present in the current flow graph." }}
            </p>

            <div v-if="!isTerminal" class="bp-options">
              <button
                v-for="(option, idx) in currentNode.options"
                :key="`${currentNode.id}-${idx}`"
                class="primary-btn"
                :class="{ 'is-disabled': option.disabled }"
                :aria-disabled="option.disabled ? 'true' : 'false'"
                @click="choose(option)"
              >
                {{ option.label }}<span v-if="option.disabled" class="soon"> — coming soon</span>
              </button>
            </div>

            <div v-else class="bp-terminal-note">
              Your binding is complete. Click Finish to review it.
            </div>

            <!-- The evolving book, built up from every choice so far -->
            <section class="bp-model-wrap" aria-live="polite">
              <div class="model-caption">
                <span>{{ modelCaption }}</span>
                <span class="save-wrap">
                  <button type="button" class="ghost-btn save-btn" aria-haspopup="menu" :aria-expanded="saveMenuKey === 'model'" @click="toggleSaveMenu('model')">Save ▾</button>
                  <div v-if="saveMenuKey === 'model'" class="save-menu" role="menu">
                    <button type="button" role="menuitem" @click="saveModel('png')">PNG (transparent)</button>
                    <button type="button" role="menuitem" @click="saveModel('jpg')">JPG (on white)</button>
                  </div>
                </span>
              </div>
              <button
                type="button"
                class="model-stage"
                :title="`Zoom: ${modelCaption}`"
                @click="openLightbox"
              >
                <img
                  v-for="layer in modelLayers"
                  :key="layer.key"
                  :src="layer.src"
                  :alt="modelCaption"
                  class="model-layer"
                />
                <span class="zoom-hint" aria-hidden="true">⤢</span>
              </button>
              <p class="model-hint">The drawing reflects your choices so far.</p>
            </section>
          </template>

          <footer class="bp-footer">
            <button class="secondary-btn" :disabled="state.steps.length === 0 || !!summary" @click="goBack">Back</button>
            <button class="ghost-btn" @click="restartWizard">Restart</button>
            <button v-if="!summary && isTerminal" class="primary-btn" @click="finishWizard">Finish</button>
          </footer>
        </main>
      </div>

      <div v-if="lightbox" class="bp-lightbox" @click.self="closeLightbox">
        <div class="bp-lightbox-card surface-card" role="dialog" aria-modal="true" aria-label="Zoomed drawing">
          <div class="lightbox-head">
            <strong>{{ modelCaption }}</strong>
            <div class="lightbox-tools">
              <button type="button" class="ghost-btn" title="Zoom out" @click="zoomOut">−</button>
              <span class="zoom-label">{{ Math.round(lbZoom * 100) }}%</span>
              <button type="button" class="ghost-btn" title="Zoom in" @click="zoomIn">＋</button>
              <button type="button" class="ghost-btn" @click="resetZoom">Reset</button>
              <button ref="lightboxCloseBtn" type="button" class="secondary-btn" @click="closeLightbox">Close</button>
            </div>
          </div>
          <div
            class="lightbox-stage"
            :class="{ grabbing: lbDragging, zoomable: lbZoom > 1 }"
            @wheel.prevent="onWheel"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointerleave="onPointerUp"
            @dblclick="toggleDoubleZoom"
          >
            <div class="lightbox-canvas" :style="lbImgStyle">
              <img
                v-for="layer in modelLayers"
                :key="layer.key"
                :src="layer.src"
                :alt="modelCaption"
                class="lightbox-layer"
                draggable="false"
              />
            </div>
          </div>
          <p class="lightbox-hint">Scroll to zoom · drag to pan · double-click to toggle · Esc to close</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { BOOK_PATHS_FLOW } from "@/bookPaths/flow";
import { applyOption, buildSummary, createInitialWizardState, replayState } from "@/bookPaths/state";

const props = defineProps({
  initialContext: { type: Object, default: () => ({}) },
  fullscreen: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "finish"]);

const STORAGE_KEY = "fenius-bookpaths-progress";

const state = ref(createInitialWizardState(props.initialContext));
const summary = ref(null);
const lightbox = ref(null);
const saveMenuKey = ref(null);
const lightboxCloseBtn = ref(null);

// lightbox zoom / pan
const lbZoom = ref(1);
const lbPanX = ref(0);
const lbPanY = ref(0);
const lbDragging = ref(false);
let dragStart = null;
const lbImgStyle = computed(() => ({
  transform: `translate(${lbPanX.value}px, ${lbPanY.value}px) scale(${lbZoom.value})`,
}));

// ---------------------------------------------------------------------------
// The evolving "book so far": one drawing (or a registered layer stack) that
// reflects every choice, so the binding is built up step by step:
//   block -> holed block -> block on the sewing frame -> sewn book ->
//   [boards prepared on their own] -> sewn book gains lining -> + endband ->
//   + tab -> covered book -> fastened book.
// Lining/endband/tab drawings register onto the sewn book, so they stack.
// ---------------------------------------------------------------------------
const displaySrc = (key) => `/book-paths/display/${key}.webp`;
const layerSrc = (key) => `/book-paths/layers/${key}.webp`;

const HOLED = { cut: "9", pierced: "8" };
const SEWN = { herringbone: "82", straight: "81", "packed-straight": "83" };
const BOARD = { square: "26", bevelled: "27", rounded: "28" };
const CORNER = { square: "29", bevelled: "30", rounded: "31B" };
const LINING = { patch: "39B", slotted: "40B" };
const ENDBAND = { "double-herringbone": "48", "double-straight-packed": "49", "single-straight-packed": "50" };
const TAB = { square: "52", round: "53" };
const FASTEN = { "short-strap": "63", "long-strap": "64" };
const frameKey = (d) => (d.support === "twisted-leather" ? "14A" : "12A");
const coverKey = (d) =>
  d.endbandTab === "square"
    ? (d.coverStitch === "link" ? "55A" : "56B")
    : (d.coverStitch === "link" ? "55" : "56");

const BOARD_PREP = new Set(["romanesque_channels", "romanesque_backcorner"]);

function bookSoFar(d, cur) {
  // board-preparation detour: the board is shaped on its own (book set aside)
  if (cur === "romanesque_channels") return { keys: [d.board ? BOARD[d.board] : "26"], composite: false };
  if (cur === "romanesque_backcorner") return { keys: [d.board ? CORNER[d.board] : "29"], composite: false };
  // finished states
  if (d.fastening) return { keys: [FASTEN[d.fastening]], composite: false };
  if (d.coverStitch) return { keys: [coverKey(d)], composite: false };
  // the sewn book, accumulating lining -> endband -> tab (all register onto it)
  if (d.sewing) {
    const layers = [SEWN[d.sewing]];
    if (LINING[d.lining]) layers.push(LINING[d.lining]);
    if (ENDBAND[d.endband]) layers.push(ENDBAND[d.endband]);
    if (TAB[d.endbandTab]) layers.push(TAB[d.endbandTab]);
    return { keys: layers, composite: true }; // untrimmed layers so the pieces line up
  }
  if (d.support) return { keys: [d.holes ? HOLED[d.holes] : "72", frameKey(d)], composite: true };
  if (d.holes) return { keys: [HOLED[d.holes]], composite: false };
  return { keys: ["72"], composite: false };
}

const currentNode = computed(() => BOOK_PATHS_FLOW[state.value.currentNodeId] || null);

const modelLayers = computed(() => {
  if (state.value.style !== "Romanesque") return [{ key: "72", src: displaySrc("72") }];
  const { keys, composite } = bookSoFar(state.value.derived || {}, state.value.currentNodeId);
  return keys.filter(Boolean).map((k) => ({ key: k, src: composite ? layerSrc(k) : displaySrc(k) }));
});

const modelCaption = computed(() =>
  BOARD_PREP.has(state.value.currentNodeId) ? "Preparing the boards (the book is set aside)" : "Your book so far"
);

const isTerminal = computed(() => {
  if (!currentNode.value) return true;
  return currentNode.value.kind === "end" || !Array.isArray(currentNode.value.options) || currentNode.value.options.length === 0;
});

const styleLabel = computed(() => state.value.style || "");

// pure forced-advance transitions are not shown as revisable path steps
const HIDDEN_CRUMBS = new Set(["romanesque_intro", "romanesque_lacing"]);
const answeredEntries = computed(() =>
  state.value.steps
    .map((step, index) => ({
      key: `${step.nodeId}-${index}`,
      index,
      nodeId: step.nodeId,
      title: step.title || resolveNodeTitle(step.nodeId),
      choiceLabel: step.choiceLabel,
    }))
    .filter((e) => !HIDDEN_CRUMBS.has(e.nodeId))
);

// ---- human-readable summary ----
const LABELS = {
  holes: { cut: "Cut holes (knife/chisel)", pierced: "Pierced holes (awl/needle)" },
  endleaves: { none: "No endleaves", "first-last-pages": "First & last pages of the block", "added-quire": "Added thin quire", "wrapped-bifolium": "Wrapped in a large bifolium" },
  support: { "slit-leather": "Slit leather strap", "twisted-leather": "Twisted strap" },
  sewing: { herringbone: "Herringbone", straight: "Straight", "packed-straight": "Packed straight" },
  board: { square: "Squared edge", bevelled: "Slightly bevelled edge", rounded: "Rounded edge" },
  channels: { "type-1": "Type I (short channel)", "type-2": "Type II (long channel)" },
  lining: { none: "No lining", patch: "Patch lining", slotted: "Full-length slotted lining" },
  endband: { "double-straight-packed": "Double support, straight packed", "double-herringbone": "Double support, herringbone", "single-straight-packed": "Single support, straight packed" },
  endbandTab: { square: "Square tab", round: "Round tab" },
  coverStitch: { link: "Link stitch", saddle: "Saddle stitch" },
  fastening: { "short-strap": "Short strap", "long-strap": "Long strap" },
};
const FIELD_ORDER = ["holes", "endleaves", "support", "sewing", "board", "channels", "lining", "endband", "endbandTab", "coverStitch", "fastening"];
const FIELD_TITLES = {
  holes: "Sewing holes", endleaves: "Endleaves", support: "Sewing support", sewing: "Sewing stitch",
  board: "Board edge", channels: "Lacing channels", lining: "Spine lining", endband: "Endbands",
  endbandTab: "Endband tab", coverStitch: "Cover stitch", fastening: "Fastening",
};
const recapRows = computed(() => {
  const d = summary.value?.derived || {};
  return FIELD_ORDER.filter((f) => d[f] != null).map((f) => ({
    field: f,
    title: FIELD_TITLES[f],
    value: (LABELS[f] && LABELS[f][d[f]]) || String(d[f]),
  }));
});
const finalModelSrc = computed(() => {
  const d = summary.value?.derived || {};
  const layers = bookSoFar(d, "romanesque_end");
  const k = layers.keys[layers.keys.length - 1];
  return displaySrc(k);
});

function choose(option) {
  if (!currentNode.value || option.disabled) return;
  summary.value = null;
  saveMenuKey.value = null;
  state.value = applyOption(state.value, currentNode.value, option);
}

function jumpToDecision(stepIndex) {
  const capped = Math.max(0, Math.min(stepIndex, state.value.steps.length));
  const partial = state.value.steps.slice(0, capped);
  state.value = replayState(partial, BOOK_PATHS_FLOW, props.initialContext);
  summary.value = null;
  saveMenuKey.value = null;
}

function goBack() {
  if (!state.value.steps.length || summary.value) return;
  jumpToDecision(state.value.steps.length - 1);
}

function restartWizard() {
  state.value = createInitialWizardState(props.initialContext);
  summary.value = null;
  saveMenuKey.value = null;
  closeLightbox();
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function finishWizard() {
  summary.value = buildSummary(state.value);
  emit("finish", summary.value);
}

function resolveNodeTitle(nodeId) {
  return BOOK_PATHS_FLOW[nodeId]?.title || nodeId;
}

// ---- persistence (survive refresh / accidental reload) ----
watch(
  () => state.value.steps,
  (steps) => {
    try {
      if (steps && steps.length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  },
  { deep: true }
);

function beforeUnloadGuard(e) {
  if (state.value.steps.length && !summary.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

onMounted(() => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const steps = JSON.parse(saved);
      if (Array.isArray(steps) && steps.length) {
        state.value = replayState(steps, BOOK_PATHS_FLOW, props.initialContext);
      }
    }
  } catch (e) {}
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("beforeunload", beforeUnloadGuard);
  window.addEventListener("click", onDocClick, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("beforeunload", beforeUnloadGuard);
  window.removeEventListener("click", onDocClick, true);
});

function onKeydown(e) {
  if (e.key !== "Escape") return;
  if (lightbox.value) { closeLightbox(); return; }
  if (saveMenuKey.value) { saveMenuKey.value = null; }
}
function onDocClick(e) {
  if (saveMenuKey.value && !e.target.closest(".save-wrap")) saveMenuKey.value = null;
}

// ---- lightbox ----
let lightboxOpener = null;
function openLightbox(e) {
  lightboxOpener = e && e.currentTarget ? e.currentTarget : null;
  lightbox.value = true;
  resetZoom();
  nextTick(() => { if (lightboxCloseBtn.value) lightboxCloseBtn.value.focus(); });
}
function closeLightbox() {
  lightbox.value = null;
  resetZoom();
  if (lightboxOpener && lightboxOpener.focus) lightboxOpener.focus();
}
function resetZoom() { lbZoom.value = 1; lbPanX.value = 0; lbPanY.value = 0; lbDragging.value = false; dragStart = null; }
function clampZoom(z) { return Math.min(8, Math.max(0.25, +z.toFixed(3))); }
function zoomIn() { lbZoom.value = clampZoom(lbZoom.value + 0.25); }
function zoomOut() { lbZoom.value = clampZoom(lbZoom.value - 0.25); if (lbZoom.value <= 1) { lbPanX.value = 0; lbPanY.value = 0; } }
function toggleDoubleZoom() { if (lbZoom.value > 1) resetZoom(); else lbZoom.value = 2; }
function onWheel(e) { lbZoom.value = clampZoom(lbZoom.value * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); if (lbZoom.value <= 1) { lbPanX.value = 0; lbPanY.value = 0; } }
function onPointerDown(e) { if (lbZoom.value <= 1) return; lbDragging.value = true; dragStart = { x: e.clientX - lbPanX.value, y: e.clientY - lbPanY.value }; }
function onPointerMove(e) { if (!lbDragging.value || !dragStart) return; lbPanX.value = e.clientX - dragStart.x; lbPanY.value = e.clientY - dragStart.y; }
function onPointerUp() { lbDragging.value = false; dragStart = null; }

// ---- save the model ----
function toggleSaveMenu(key) { saveMenuKey.value = saveMenuKey.value === key ? null : key; }
function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
function loadImage(src) {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}
async function saveModel(fmt) {
  saveMenuKey.value = null;
  const layers = summary.value
    ? [{ key: "final", src: finalModelSrc.value }]
    : modelLayers.value;
  if (!layers.length) return;
  try {
    const imgs = await Promise.all(layers.map((l) => loadImage(l.src)));
    const w = imgs[0].naturalWidth || 1600;
    const h = imgs[0].naturalHeight || Math.round(w * (841.9 / 1190.6));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (fmt === "jpg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
    imgs.forEach((img) => ctx.drawImage(img, 0, 0, w, h));
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `bookbinding.${fmt === "jpg" ? "jpg" : "png"}`);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, fmt === "jpg" ? "image/jpeg" : "image/png", 0.92);
  } catch (e) { /* ignore */ }
}

function handleClose() { emit("close"); }
</script>

<style scoped>
.book-paths-overlay {
  position: fixed;
  inset: 0;
  z-index: 16000;
  background: rgb(6 14 25 / 0.75);
  display: grid;
  place-items: center;
  padding: 18px;
}

.book-paths-overlay.fullscreen {
  position: relative;
  inset: auto;
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(180deg, var(--app-bg-top), var(--app-bg-bottom));
}

.book-paths-modal {
  width: min(1420px, 100%);
  height: min(900px, calc(100vh - 36px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.book-paths-overlay.fullscreen .book-paths-modal {
  width: 100%;
  height: 100vh;
  border-radius: 0;
}

.bp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.bp-header h2 { margin: 0; font-size: 24px; }

.bp-subtitle {
  margin: 4px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.bp-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 250px 1fr;
}

.bp-crumbs,
.bp-main { padding: 14px; overflow: auto; }

.bp-crumbs {
  border-right: 1px solid hsl(var(--border));
  background: hsl(var(--card) / 0.78);
}

.bp-main { display: flex; flex-direction: column; }

.bp-crumbs h3,
.bp-main h3 { margin: 0 0 10px; font-size: 16px; }

.bp-crumbs ul {
  list-style: none;
  margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 8px;
}

.bp-crumbs button { width: 100%; text-align: left; font-weight: 600; }

.crumb-choice {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.current-step {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px dashed hsl(var(--border));
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.bp-copy {
  margin-top: 0;
  color: hsl(var(--muted-foreground));
  line-height: 1.55;
  max-width: 70ch;
}

.bp-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  margin: 12px 0 6px;
}

.primary-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.4);
}

.soon { font-size: 12px; opacity: 0.85; }

.bp-terminal-note {
  margin: 14px 0 6px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

/* ---- evolving model ---- */
.bp-model-wrap { margin: 16px auto 4px; width: min(820px, 100%); }

.model-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.model-caption > span:first-child {
  font-size: 14px;
  font-weight: 700;
  color: hsl(var(--card-foreground));
}

.model-stage {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1190.6 / 841.9;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  padding: 0;
  cursor: zoom-in;
  box-shadow: var(--shadow-sm);
}

.model-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.model-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.zoom-hint {
  position: absolute;
  right: 8px; bottom: 8px;
  width: 26px; height: 26px;
  display: grid; place-items: center;
  border-radius: 8px;
  background: rgb(6 14 25 / 0.6);
  color: #fff; font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.model-stage:hover .zoom-hint { opacity: 1; }

.save-wrap { position: relative; }
.save-btn { font-size: 12px; padding: 4px 10px; }

.save-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 5;
  display: flex;
  flex-direction: column;
  min-width: 170px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  overflow: hidden;
  background: hsl(var(--card));
  box-shadow: var(--shadow-md, 0 10px 24px rgb(6 14 25 / 0.3));
}

.save-menu button {
  border: 0; background: transparent;
  color: hsl(var(--card-foreground));
  text-align: left; padding: 9px 12px;
  font-size: 13px; cursor: pointer;
}

.save-menu button:hover { background: hsl(var(--muted)); }

.bp-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid hsl(var(--border));
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* ---- summary ---- */
.summary-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(280px, 1.2fr);
  gap: 18px;
  align-items: start;
}

.summary-recap { padding: 14px 16px; }
.recap-style { margin: 0 0 10px; font-size: 16px; }

.summary-recap dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
}

.summary-recap dt { color: hsl(var(--muted-foreground)); font-size: 13px; }
.summary-recap dd { margin: 0; font-size: 13px; font-weight: 600; color: hsl(var(--card-foreground)); }

.summary-figure {
  margin: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  overflow: hidden;
  background: hsl(var(--card));
}

.figure-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid hsl(var(--border));
}

.figure-head .fig-title { font-size: 12px; color: hsl(var(--muted-foreground)); }

.summary-figure img {
  width: 100%;
  aspect-ratio: 1190.6 / 841.9;
  object-fit: contain;
  display: block;
  background: #fff;
}

/* ---- lightbox ---- */
.bp-lightbox {
  position: fixed;
  inset: 0;
  z-index: 16100;
  background: rgb(4 10 18 / 0.86);
  display: grid;
  place-items: center;
  padding: 20px;
}

.bp-lightbox-card {
  width: min(1200px, 100%);
  height: min(92vh, 920px);
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.lightbox-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.lightbox-tools { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.lightbox-tools .ghost-btn { padding: 5px 10px; font-size: 13px; }

.zoom-label {
  min-width: 48px; text-align: center;
  font-size: 13px; color: hsl(var(--muted-foreground));
}

.lightbox-stage {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  display: grid;
  place-items: center;
  touch-action: none;
}

.lightbox-stage.zoomable { cursor: grab; }
.lightbox-stage.grabbing { cursor: grabbing; }

.lightbox-canvas {
  position: relative;
  width: min(100%, 92vh * 1190.6 / 841.9);
  aspect-ratio: 1190.6 / 841.9;
  transform-origin: center center;
  will-change: transform;
}

.lightbox-layer {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  user-select: none;
}

.lightbox-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 1120px) {
  .bp-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .bp-crumbs { border-right: 0; border-bottom: 1px solid hsl(var(--border)); }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>
