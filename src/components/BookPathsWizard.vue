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
            <template v-if="styleLabel">
              <span class="bp-activity-title">{{ ACTIVITY.title }}</span>
              <span v-if="ACTIVITY.subtitle" class="bp-activity-sub"><span class="bp-sep" aria-hidden="true"> · </span>{{ ACTIVITY.subtitle }}</span>
            </template>
            <span v-else>Choose a style to begin</span>
            <span v-if="initialContext?.title" class="bp-context"><span class="bp-sep" aria-hidden="true"> | </span>{{ initialContext.title }}</span>
          </p>
        </div>
        <button type="button" class="secondary-btn" @click="handleClose">Close</button>
      </header>

      <div ref="scrollArea" class="bp-body">
        <ol class="bp-rail" aria-label="Stages of the binding">
          <li
            v-for="(s, i) in steps"
            :key="s.id"
            :class="{ current: i === stepIndex, done: i !== stepIndex && i < reach }"
          >
            <button
              type="button"
              :disabled="i > reach"
              :aria-current="i === stepIndex ? 'step' : undefined"
              @click="go(i)"
            >
              <span class="rail-num" aria-hidden="true">{{ i + 1 }}</span>
              <span>{{ s.short || s.title }}</span>
            </button>
          </li>
        </ol>

        <div class="bp-bench">
          <div class="bp-sheet-col">
            <button
              type="button"
              class="model-stage"
              :title="`Zoom: ${sheet.caption || 'drawing'}`"
              :disabled="!sheet.layers.length"
              @click="openLightbox"
            >
              <RomanesqueSheet :sheet="sheet" :base="ASSET_BASE" />
              <span v-if="sheet.layers.length" class="zoom-hint" aria-hidden="true">⤢</span>
            </button>
            <div class="figline">
              <span>{{ sheet.caption }}</span>
              <span class="figline-end">
                <span class="nums">{{ sheet.numbers }}</span>
                <span v-if="sheet.layers.length" class="save-wrap">
                  <button type="button" class="ghost-btn save-btn" aria-haspopup="menu" :aria-expanded="saveMenuKey === 'sheet'" @click="toggleSaveMenu('sheet')">Save ▾</button>
                  <div v-if="saveMenuKey === 'sheet'" class="save-menu" role="menu">
                    <button type="button" role="menuitem" @click="saveSheet('png')">PNG (transparent)</button>
                    <button type="button" role="menuitem" @click="saveSheet('jpg')">JPG (on white)</button>
                  </div>
                </span>
              </span>
            </div>
          </div>

          <main class="bp-notes" aria-live="polite">
            <div>
              <p class="eyebrow">Step {{ stepIndex + 1 }} of {{ steps.length }}</p>
              <h3 ref="stepTitle" tabindex="-1" class="step-title">{{ step.title }}</h3>
            </div>

            <div v-if="step.text && step.text.length" class="prose">
              <p v-for="(p, i) in step.text" :key="`t${i}`">{{ p }}</p>
            </div>

            <figure v-for="f in figuresAfterText" :key="`fa-${f.draw}`" class="fig">
              <DrawingCrop :drawing="drawings[f.draw]" :box="f.box" :base="ASSET_BASE" :alt="drawings[f.draw].name || ''" class="fig-frame" />
              <figcaption>{{ f.caption || drawings[f.draw].name }}</figcaption>
            </figure>

            <template v-if="options.length">
              <p v-if="step.question" class="question">{{ step.question }}</p>
              <p v-if="because" class="cond">{{ because }}</p>
              <ul class="options" :class="{ thumbs: hasThumbs }">
                <li v-for="o in options" :key="o.value">
                  <button
                    :id="`opt-${step.id}-${o.value}`"
                    type="button"
                    class="opt"
                    :class="{ withthumb: !!o.thumb }"
                    :aria-pressed="choices[step.key] === o.value ? 'true' : 'false'"
                    :disabled="!!o.disabled"
                    @click="pick(o.value)"
                  >
                    <span class="opt-row">
                      <span class="mark" aria-hidden="true"></span>
                      <span>{{ o.label }}</span>
                      <span v-if="o.disabled" class="later">{{ o.disabled }}</span>
                    </span>
                    <DrawingCrop v-if="o.thumb" :drawing="drawings[o.thumb.draw]" :box="o.thumb.box" :base="ASSET_BASE" class="thumb" />
                  </button>
                </li>
              </ul>
            </template>

            <div v-if="step.after && step.after.length" class="prose">
              <p v-for="(p, i) in step.after" :key="`a${i}`" class="aside">{{ p }}</p>
            </div>

            <figure v-for="f in figuresOther" :key="`fo-${f.draw}`" class="fig">
              <DrawingCrop :drawing="drawings[f.draw]" :box="f.box" :base="ASSET_BASE" :alt="drawings[f.draw].name || ''" class="fig-frame" />
              <figcaption>{{ f.caption || drawings[f.draw].name }}</figcaption>
            </figure>

            <template v-if="step.summary">
              <dl class="summary">
                <template v-for="row in summary" :key="row.key">
                  <dt>{{ row.short }}</dt>
                  <dd>{{ row.label }}</dd>
                </template>
              </dl>
              <div v-if="sheet.layers.length" class="save-wrap summary-save">
                <button type="button" class="secondary-btn" aria-haspopup="menu" :aria-expanded="saveMenuKey === 'summary'" @click="toggleSaveMenu('summary')">Save your binding ▾</button>
                <div v-if="saveMenuKey === 'summary'" class="save-menu" role="menu">
                  <button type="button" role="menuitem" @click="saveSheet('png')">PNG (transparent)</button>
                  <button type="button" role="menuitem" @click="saveSheet('jpg')">JPG (on white)</button>
                </div>
              </div>
            </template>

            <div class="nav">
              <button v-if="stepIndex > 0" type="button" class="secondary-btn" @click="go(stepIndex - 1)">Back</button>
              <button
                v-if="!isLast"
                type="button"
                class="primary-btn"
                :disabled="!answered"
                @click="go(stepIndex + 1)"
              >{{ step.next || "Continue" }}</button>
              <button v-if="stepIndex > 0" type="button" class="ghost-btn restart" @click="restart">Start again</button>
            </div>
            <p v-if="!isLast && !answered" class="hint">Choose an option to see it on the drawing. You can change your mind before you continue.</p>
          </main>
        </div>
      </div>

      <div v-if="lightbox" class="bp-lightbox" @click.self="closeLightbox">
        <div class="bp-lightbox-card surface-card" role="dialog" aria-modal="true" aria-label="Zoomed drawing">
          <div class="lightbox-head">
            <strong>{{ sheet.caption }}</strong>
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
              <RomanesqueSheet :sheet="sheet" :base="ASSET_BASE" />
            </div>
          </div>
          <p class="lightbox-hint">Scroll to zoom · drag to pan · double-click to toggle · Esc to close</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import ACTIVITY from "@/bookPaths/romanesque/activity.json";
import {
  canContinue,
  choose,
  composeSheet,
  furthest,
  previewFiles,
  soFar,
  summaryRows,
  test,
  visibleOptions,
} from "@/bookPaths/romanesque/compositor";
import RomanesqueSheet from "@/components/bookPaths/RomanesqueSheet.vue";
import DrawingCrop from "@/components/bookPaths/DrawingCrop.vue";

defineProps({
  initialContext: { type: Object, default: () => ({}) },
  fullscreen: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "finish"]);

const STORAGE_KEY = "fenius-bookpaths-romanesque-v2";
const LEGACY_STORAGE_KEYS = ["fenius-bookpaths-progress"];
const ASSET_BASE = `${process.env.BASE_URL}book-paths/romanesque/`;

const steps = ACTIVITY.steps;
const drawings = ACTIVITY.drawings;
const lastIndex = steps.length - 1;

const choices = ref({});
const stepIndex = ref(0);
const finishEmitted = ref(false);
const lightbox = ref(false);
const saveMenuKey = ref(null);
const lightboxCloseBtn = ref(null);
const stepTitle = ref(null);
const scrollArea = ref(null);

const step = computed(() => steps[stepIndex.value]);
const isLast = computed(() => stepIndex.value === lastIndex);
const answered = computed(() => canContinue(step.value, choices.value));
const reach = computed(() => Math.max(furthest(ACTIVITY, choices.value), stepIndex.value));
const now = computed(() => soFar(ACTIVITY, choices.value, stepIndex.value));
const sheet = computed(() => composeSheet(ACTIVITY, choices.value, stepIndex.value));

const options = computed(() => visibleOptions(step.value, choices.value));
const because = computed(() => (options.value.find((o) => o.because) || {}).because || "");
const hasThumbs = computed(() => options.value.some((o) => o.thumb));
const figuresAfterText = computed(() =>
  (step.value.figures || []).filter((f) => f.place === "afterText" && test(f.when, now.value))
);
const figuresOther = computed(() =>
  (step.value.figures || []).filter((f) => f.place !== "afterText" && test(f.when, now.value))
);
const summary = computed(() => summaryRows(ACTIVITY, choices.value));

const styleLabel = computed(() => {
  const value = choices.value.style;
  if (!value) return "";
  const option = (steps[0].options || []).find((o) => o.value === value);
  return option ? option.label : "";
});

// ---- navigation ----
function pick(value) {
  const option = options.value.find((o) => o.value === value);
  if (!option || option.disabled) return;
  saveMenuKey.value = null;
  choices.value = choose(ACTIVITY, choices.value, stepIndex.value, value);
}

function go(index) {
  const target = Math.max(0, Math.min(lastIndex, index));
  if (target > reach.value) return;
  saveMenuKey.value = null;
  stepIndex.value = target;
  nextTick(() => {
    if (scrollArea.value) scrollArea.value.scrollTop = 0;
    if (stepTitle.value) stepTitle.value.focus({ preventScroll: true });
  });
}

function restart() {
  choices.value = {};
  finishEmitted.value = false;
  closeLightbox();
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
  go(0);
}

watch(stepIndex, (index) => {
  if (index !== lastIndex || finishEmitted.value) return;
  finishEmitted.value = true;
  emit("finish", {
    style: styleLabel.value || "Romanesque",
    choices: { ...choices.value },
    steps: summaryRows(ACTIVITY, choices.value).map(({ key, title, label }) => ({ key, title, label })),
  });
});

// ---- preload what the next click could need ----
const preloaded = new Set();
watch(
  [choices, stepIndex],
  () => {
    for (const file of previewFiles(ACTIVITY, choices.value, stepIndex.value)) {
      if (preloaded.has(file)) continue;
      preloaded.add(file);
      const img = new Image();
      img.decoding = "async";
      img.src = ASSET_BASE + file;
    }
  },
  { immediate: true }
);

// ---- persistence (survive refresh / accidental reload) ----
function sanitize(saved) {
  if (!saved || typeof saved !== "object" || !saved.choices || typeof saved.choices !== "object") return null;
  let clean = {};
  for (const s of steps) {
    if (!s.key || saved.choices[s.key] == null) continue;
    const value = saved.choices[s.key];
    const ok = visibleOptions(s, clean).some((o) => o.value === value && !o.disabled);
    if (ok) clean = { ...clean, [s.key]: value };
  }
  const index = Number.isInteger(saved.stepIndex) ? saved.stepIndex : 0;
  return { choices: clean, stepIndex: Math.max(0, Math.min(index, furthest(ACTIVITY, clean))) };
}

watch(
  [choices, stepIndex],
  () => {
    try {
      if (Object.keys(choices.value).length || stepIndex.value > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ choices: choices.value, stepIndex: stepIndex.value }));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) { /* storage unavailable */ }
  },
  { deep: true }
);

function restore() {
  try {
    for (const key of LEGACY_STORAGE_KEYS) sessionStorage.removeItem(key);
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const restored = sanitize(JSON.parse(raw));
    if (!restored) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    choices.value = restored.choices;
    finishEmitted.value = restored.stepIndex === lastIndex;
    stepIndex.value = restored.stepIndex;
  } catch (e) {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* storage unavailable */ }
  }
}

function beforeUnloadGuard(e) {
  if (Object.keys(choices.value).length && !isLast.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

restore();

onMounted(() => {
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

// ---- lightbox zoom / pan ----
const lbZoom = ref(1);
const lbPanX = ref(0);
const lbPanY = ref(0);
const lbDragging = ref(false);
let dragStart = null;
const lbImgStyle = computed(() => ({
  transform: `translate(${lbPanX.value}px, ${lbPanY.value}px) scale(${lbZoom.value})`,
}));

let lightboxOpener = null;
function openLightbox(e) {
  if (!sheet.value.layers.length) return;
  lightboxOpener = e && e.currentTarget ? e.currentTarget : null;
  lightbox.value = true;
  resetZoom();
  nextTick(() => { if (lightboxCloseBtn.value) lightboxCloseBtn.value.focus(); });
}
function closeLightbox() {
  if (!lightbox.value) return;
  lightbox.value = false;
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

// ---- save the sheet as PNG / JPG ----
// Drawn from the same composeSheet() layers and matrices as the on-screen sheet.
function toggleSaveMenu(key) { saveMenuKey.value = saveMenuKey.value === key ? null : key; }
function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}
// SVGs without width/height have no intrinsic size, which some browsers refuse to draw
// on a canvas; give each one explicit pixel dimensions at the scale it will be drawn.
async function loadLayerForCanvas(layer, pixelScale) {
  const url = ASSET_BASE + layer.file;
  if (!/\.svg$/i.test(layer.file)) return { img: await loadImage(url), revoke: null };
  const text = await (await fetch(url)).text();
  const w = Math.min(8192, Math.ceil(layer.size[0] * pixelScale));
  const h = Math.min(8192, Math.ceil(layer.size[1] * pixelScale));
  const sized = text.replace(/<svg\b/, `<svg width="${w}" height="${h}"`);
  const blobUrl = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
  return { img: await loadImage(blobUrl), revoke: blobUrl };
}
async function saveSheet(fmt) {
  saveMenuKey.value = null;
  const current = sheet.value;
  if (!current.layers.length) return;
  const [canvasW, canvasH] = ACTIVITY.canvas;
  const W = Math.round(canvasW * 2);
  const H = Math.round(canvasH * 2);
  const [vx, vy, vw] = current.view;
  const s = W / vw;
  const loaded = [];
  try {
    for (const layer of current.layers) {
      const [a, b, c, d] = layer.matrix;
      const stretch = Math.max(Math.hypot(a, b), Math.hypot(c, d));
      loaded.push(await loadLayerForCanvas(layer, s * stretch));
    }
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (fmt === "jpg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); }
    current.layers.forEach((layer, i) => {
      const [a, b, c, d, e, f] = layer.matrix;
      ctx.setTransform(s * a, s * b, s * c, s * d, s * (e - vx), s * (f - vy));
      ctx.drawImage(loaded[i].img, 0, 0, layer.size[0], layer.size[1]);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const stepName = (step.value.id || "sheet").replace(/[^a-z0-9-]/gi, "");
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          triggerDownload(url, `romanesque-binding-${stepName}.${fmt === "jpg" ? "jpg" : "png"}`);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        resolve();
      }, fmt === "jpg" ? "image/jpeg" : "image/png", 0.92);
    });
  } catch (e) {
    /* a failed export leaves the page as it was */
  } finally {
    for (const item of loaded) if (item.revoke) URL.revokeObjectURL(item.revoke);
  }
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
  height: 100dvh;
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
  line-height: 1.4;
}

.bp-activity-title { font-weight: 600; color: hsl(var(--foreground)); }

.bp-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- stage rail ---- */
.bp-rail {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.bp-rail button {
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.2;
  color: hsl(var(--muted-foreground));
  background: none;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 4px 10px 4px 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rail-num {
  font-size: 0.7rem;
  font-weight: 600;
  width: 1.6em;
  height: 1.6em;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  border: 1px solid hsl(var(--border));
  font-variant-numeric: tabular-nums;
}

.bp-rail button:disabled { cursor: default; opacity: 0.55; }
.bp-rail li.done button { color: hsl(var(--foreground)); }
.bp-rail li.done .rail-num { background: hsl(var(--primary) / 0.14); border-color: transparent; }
.bp-rail li.current button {
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
  background: hsl(var(--card));
  font-weight: 600;
}
.bp-rail li.current .rail-num {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

/* ---- bench: sheet left, notes right ---- */
.bp-bench {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.bp-sheet-col {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.model-stage {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  cursor: zoom-in;
  box-shadow: var(--shadow-sm);
}

.model-stage:disabled { cursor: default; }

.zoom-hint {
  position: absolute;
  right: 8px; top: 8px;
  width: 26px; height: 26px;
  display: grid; place-items: center;
  border-radius: 8px;
  background: rgb(6 14 25 / 0.6);
  color: #fff; font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 100;
}

.model-stage:hover .zoom-hint,
.model-stage:focus-visible .zoom-hint { opacity: 1; }

.figline {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 2px 16px;
  color: hsl(var(--muted-foreground));
  font-size: 0.78rem;
}

.figline-end { display: inline-flex; align-items: center; gap: 10px; }
.nums { font-variant-numeric: tabular-nums; }

/* ---- notes ---- */
.bp-notes {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

.step-title {
  margin: 4px 0 0;
  font-size: 1.45rem;
  line-height: 1.2;
}

.step-title:focus { outline: none; }
.step-title:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }

.prose { display: flex; flex-direction: column; gap: 10px; max-width: 62ch; line-height: 1.55; }
.prose p { margin: 0; }
.prose p.aside { color: hsl(var(--muted-foreground)); font-size: 0.93rem; }
.question { margin: 0; font-weight: 600; }
.cond { margin: 0; color: hsl(var(--muted-foreground)); font-size: 0.9rem; }

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-width: 62ch;
}

.options.thumbs { flex-direction: row; flex-wrap: wrap; }
.options.thumbs li { flex: 1 1 180px; }

.opt {
  width: 100%;
  text-align: left;
  font: inherit;
  color: hsl(var(--card-foreground));
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.opt-row { display: flex; align-items: center; gap: 12px; }

.mark {
  flex: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid hsl(var(--muted-foreground));
  display: inline-grid;
  place-items: center;
}

.opt[aria-pressed="true"] { border-color: hsl(var(--primary)); background: hsl(var(--primary) / 0.1); }
.opt[aria-pressed="true"] .mark { border-color: hsl(var(--primary)); }
.opt[aria-pressed="true"] .mark::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(var(--primary));
}
.opt:hover:not(:disabled) { border-color: hsl(var(--primary)); }
.opt:disabled {
  cursor: not-allowed;
  color: hsl(var(--muted-foreground));
  border-style: dashed;
  background: none;
}
.opt:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }
.later { margin-left: auto; font-size: 0.78rem; color: hsl(var(--muted-foreground)); white-space: nowrap; }

.thumb {
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
}

.fig { margin: 0; max-width: 340px; display: flex; flex-direction: column; gap: 6px; }
.fig-frame { border: 1px solid hsl(var(--border)); border-radius: 4px; }
.fig figcaption { color: hsl(var(--muted-foreground)); font-size: 0.82rem; }

.summary {
  margin: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 16px;
  max-width: 62ch;
  font-size: 0.93rem;
}

.summary dt { color: hsl(var(--muted-foreground)); }
.summary dd { margin: 0; font-weight: 600; }

.summary-save { align-self: flex-start; }

.nav { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 4px; }
.nav .restart { margin-left: auto; }
.nav button:disabled { opacity: 0.45; cursor: not-allowed; }
.hint { margin: 0; color: hsl(var(--muted-foreground)); font-size: 0.85rem; }

/* ---- save menu ---- */
.save-wrap { position: relative; }
.save-btn { font-size: 12px; padding: 4px 10px; }

.save-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 200;
  display: flex;
  flex-direction: column;
  min-width: 170px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  overflow: hidden;
  background: hsl(var(--card));
  box-shadow: var(--shadow-md, 0 10px 24px rgb(6 14 25 / 0.3));
}

.summary-save .save-menu { left: 0; right: auto; }

.save-menu button {
  border: 0; background: transparent;
  color: hsl(var(--card-foreground));
  text-align: left; padding: 9px 12px;
  font-size: 13px; cursor: pointer;
}

.save-menu button:hover,
.save-menu button:focus-visible { background: hsl(var(--muted)); }

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
  flex-wrap: wrap;
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
  width: min(100%, calc((92vh - 110px) * 1190.6 / 841.9));
  transform-origin: center center;
}

.lightbox-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 860px) {
  .bp-bench { grid-template-columns: minmax(0, 1fr); gap: 18px; }
  .bp-sheet-col { position: static; }
}

@media (max-width: 480px) {
  .bp-body { padding: 12px 12px 24px; }
  .bp-header { padding: 12px; }
  .bp-header h2 { font-size: 20px; }
  /* one piece per line instead of a run-on sentence on phones */
  .bp-subtitle .bp-activity-title,
  .bp-subtitle .bp-activity-sub,
  .bp-subtitle .bp-context { display: block; }
  .bp-subtitle .bp-sep { display: none; }
  .bp-subtitle { font-size: 13px; }
}
</style>
