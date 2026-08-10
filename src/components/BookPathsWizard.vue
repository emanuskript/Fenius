<template>
  <div
    class="book-paths-overlay"
    :class="{ fullscreen }"
    @click.self="handleClose"
  >
    <section class="book-paths-modal surface-card" role="dialog" aria-modal="true" aria-label="Book Paths Wizard">
      <header class="bp-header">
        <div>
          <h2>Book Paths</h2>
          <p class="bp-subtitle">
            <span v-if="styleLabel">Style: {{ styleLabel }}</span>
            <span v-else>Style not selected</span>
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
            <li v-for="(entry, index) in answeredEntries" :key="entry.key">
              <button class="ghost-btn" @click="jumpToDecision(index + 1)">
                {{ index + 1 }}. {{ entry.title }}
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
            <h3>Chosen Path Summary</h3>
            <p class="bp-copy">Review the result, restart to explore alternatives, or close to return.</p>
            <div class="summary-box">
              <p><strong>Style:</strong> {{ summary.style || "Not set" }}</p>
              <p><strong>Steps:</strong></p>
              <ul>
                <li v-for="(step, idx) in summary.steps" :key="`${step.nodeId}-${idx}`">
                  {{ idx + 1 }}. {{ step.title || resolveNodeTitle(step.nodeId) }} — {{ step.choiceLabel }}
                </li>
              </ul>
              <p><strong>Derived:</strong></p>
              <pre>{{ formattedDerived }}</pre>
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
                @click="choose(option)"
              >
                {{ option.label }}
              </button>
            </div>

            <div v-else class="bp-terminal-note">
              Terminal node reached. Click Finish to store this path in summary.
            </div>

            <!-- The drawing(s) the chart specifies for this step -->
            <section class="bp-figures-wrap">
              <p v-if="compositeMissingNote" class="composite-note">{{ compositeMissingNote }}</p>
              <div
                class="bp-figures"
                :class="{ single: renderedImages.length === 1 && renderedImages[0] && renderedImages[0].src }"
              >
                <template v-if="renderedImages.length">
                  <figure v-for="image in renderedImages" :key="image.key" class="figure-card">
                    <button
                      v-if="image.src"
                      type="button"
                      class="figure-img"
                      @click="openLightbox(image.key, image.src)"
                      :title="`Zoom ${image.key}`"
                    >
                      <img :src="image.src" :alt="`Drawing ${image.key}`" loading="lazy" />
                      <span class="zoom-hint" aria-hidden="true">⤢</span>
                    </button>
                    <div v-else class="figure-img missing">
                      <span>Missing asset: {{ image.key }}</span>
                    </div>
                    <figcaption class="figure-cap">
                      <span class="fig-key">{{ image.key }}</span>
                      <span v-if="image.src" class="save-wrap">
                        <button type="button" class="ghost-btn save-btn" @click="toggleSaveMenu(image.key)">Save ▾</button>
                        <div v-if="saveMenuKey === image.key" class="save-menu">
                          <button type="button" @click="saveImage(image, 'svg')">SVG (vector)</button>
                          <button type="button" @click="saveImage(image, 'jpg')">JPG (image)</button>
                        </div>
                      </span>
                    </figcaption>
                  </figure>
                </template>
                <div v-else class="gallery-empty">No drawing for this step.</div>
              </div>
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
        <div class="bp-lightbox-card surface-card">
          <div class="lightbox-head">
            <strong>{{ lightbox.key }}</strong>
            <div class="lightbox-tools">
              <button type="button" class="ghost-btn" title="Zoom out" @click="zoomOut">−</button>
              <span class="zoom-label">{{ Math.round(lbZoom * 100) }}%</span>
              <button type="button" class="ghost-btn" title="Zoom in" @click="zoomIn">＋</button>
              <button type="button" class="ghost-btn" @click="resetZoom">Reset</button>
              <span class="tool-sep" aria-hidden="true"></span>
              <button type="button" class="ghost-btn" @click="saveImage(lightbox, 'svg')">SVG</button>
              <button type="button" class="ghost-btn" @click="saveImage(lightbox, 'jpg')">JPG</button>
              <button type="button" class="secondary-btn" @click="closeLightbox">Close</button>
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
            <img
              :src="lightbox.src"
              :alt="`Drawing ${lightbox.key}`"
              :style="lbImgStyle"
              draggable="false"
            />
          </div>
          <p class="lightbox-hint">Scroll to zoom · drag to pan · double-click to toggle</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed, ref } from "vue";
import { BOOK_PATHS_FLOW } from "@/bookPaths/flow";
import { applyOption, buildSummary, createInitialWizardState, replayState } from "@/bookPaths/state";
import { resolveBookPathAsset } from "@/bookPaths/assets.generated";

const props = defineProps({
  initialContext: { type: Object, default: () => ({}) },
  fullscreen: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "finish"]);

const state = ref(createInitialWizardState(props.initialContext));
const summary = ref(null);
const lightbox = ref(null);
const saveMenuKey = ref(null);

// lightbox zoom / pan
const lbZoom = ref(1);
const lbPanX = ref(0);
const lbPanY = ref(0);
const lbDragging = ref(false);
let dragStart = null;

const lbImgStyle = computed(() => ({
  transform: `translate(${lbPanX.value}px, ${lbPanY.value}px) scale(${lbZoom.value})`,
}));

// Keys that have a trimmed, uniformly-framed "display" image (the delivered Romanesque set).
const DISPLAY_KEYS = new Set([
  "2B","3B","8","9","12A","14A","26","27","28","29","30","31B","35C","36C","35R",
  "39B","40B","48","49","50","52","53","55","55A","56","59","63","63A","64","64A","72","81","82","83","90",
]);
const displaySrc = (key) => `/book-paths/display/${key}.webp`;
// Use the trimmed display drawing when we have one, else fall back to the raw asset.
const bestSrc = (key) => (DISPLAY_KEYS.has(key) ? displaySrc(key) : resolveBookPathAsset(key));

const currentNode = computed(() => BOOK_PATHS_FLOW[state.value.currentNodeId] || null);

const isTerminal = computed(() => {
  if (!currentNode.value) return true;
  return currentNode.value.kind === "end" || !Array.isArray(currentNode.value.options) || currentNode.value.options.length === 0;
});

const styleLabel = computed(() => state.value.style || currentNode.value?.style || "");

const answeredEntries = computed(() =>
  state.value.steps.map((step, index) => ({
    key: `${step.nodeId}-${index}`,
    title: step.title || resolveNodeTitle(step.nodeId),
    choiceLabel: step.choiceLabel,
  }))
);

const compositeMissingNote = computed(() => {
  if (!currentNode.value?.compositeKey) return "";
  const compositeSrc = resolveBookPathAsset(currentNode.value.compositeKey);
  if (compositeSrc) return "";
  const parts = (currentNode.value.compositeOf || []).join(", ");
  return `Composite missing: ${currentNode.value.compositeKey}. Showing components: ${parts || currentNode.value.compositeKey}.`;
});

// The drawing(s) the chart pairs with the current step.
const renderedImages = computed(() => {
  const node = currentNode.value;
  if (!node) return [];
  if (node.compositeKey) {
    const compositeSrc = bestSrc(node.compositeKey);
    if (compositeSrc) return [{ key: node.compositeKey, src: compositeSrc }];
    const fallbackKeys = (node.compositeOf && node.compositeOf.length) ? node.compositeOf : [node.compositeKey];
    return fallbackKeys.map((key) => ({ key, src: bestSrc(key) }));
  }
  if (node.imagesFromDerived) {
    const { key, map, fallback } = node.imagesFromDerived;
    const value = state.value.derived?.[key];
    const list = (value && map && map[value]) ? map[value] : (fallback || []);
    return list.map((k) => ({ key: k, src: bestSrc(k) }));
  }
  return (node.images || []).map((key) => ({ key, src: bestSrc(key) }));
});

const formattedDerived = computed(() => {
  if (!summary.value) return "{}";
  return JSON.stringify(summary.value.derived, null, 2);
});

function choose(option) {
  if (!currentNode.value) return;
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
}

function finishWizard() {
  summary.value = buildSummary(state.value);
  emit("finish", summary.value);
}

function resolveNodeTitle(nodeId) {
  return BOOK_PATHS_FLOW[nodeId]?.title || nodeId;
}

// ---- lightbox zoom / pan ----
function openLightbox(key, src) {
  lightbox.value = { key, src };
  resetZoom();
}

function closeLightbox() {
  lightbox.value = null;
  resetZoom();
}

function resetZoom() {
  lbZoom.value = 1;
  lbPanX.value = 0;
  lbPanY.value = 0;
  lbDragging.value = false;
  dragStart = null;
}

function clampZoom(z) {
  return Math.min(8, Math.max(0.25, +z.toFixed(3)));
}

function zoomIn() { lbZoom.value = clampZoom(lbZoom.value + 0.25); }

function zoomOut() {
  lbZoom.value = clampZoom(lbZoom.value - 0.25);
  if (lbZoom.value <= 1) { lbPanX.value = 0; lbPanY.value = 0; }
}

function toggleDoubleZoom() {
  if (lbZoom.value > 1) resetZoom();
  else lbZoom.value = 2;
}

function onWheel(e) {
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  lbZoom.value = clampZoom(lbZoom.value * factor);
  if (lbZoom.value <= 1) { lbPanX.value = 0; lbPanY.value = 0; }
}

function onPointerDown(e) {
  if (lbZoom.value <= 1) return;
  lbDragging.value = true;
  dragStart = { x: e.clientX - lbPanX.value, y: e.clientY - lbPanY.value };
}

function onPointerMove(e) {
  if (!lbDragging.value || !dragStart) return;
  lbPanX.value = e.clientX - dragStart.x;
  lbPanY.value = e.clientY - dragStart.y;
}

function onPointerUp() { lbDragging.value = false; dragStart = null; }

// ---- save / download ----
function toggleSaveMenu(key) {
  saveMenuKey.value = saveMenuKey.value === key ? null : key;
}

function svgUrlFor(src) {
  if (!src) return null;
  if (src.toLowerCase().endsWith(".svg")) return src;
  const file = src.split("/").pop().replace(/\.(webp|png|jpe?g)$/i, ".svg");
  return `/book-paths/originals/${file}`;
}

function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function saveImage(image, fmt) {
  saveMenuKey.value = null;
  if (!image || !image.src) return;
  if (fmt === "svg") {
    triggerDownload(svgUrlFor(image.src), `${image.key}.svg`);
    return;
  }
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth || 1600;
    const h = img.naturalHeight || Math.round(w * (841.9 / 1190.6));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${image.key}.jpg`);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, "image/jpeg", 0.92);
  };
  img.onerror = () => triggerDownload(image.src, `${image.key}`);
  img.src = image.src;
}

function handleClose() {
  emit("close");
}
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
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.bp-terminal-note {
  margin: 14px 0 6px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.bp-figures-wrap { margin: 16px 0 4px; }

.bp-figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 360px));
  gap: 16px;
  justify-content: center;
  align-items: start;
}

.bp-figures.single { grid-template-columns: min(760px, 100%); }

.figure-card {
  margin: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  overflow: hidden;
  background: hsl(var(--card));
  box-shadow: var(--shadow-sm);
}

.figure-img {
  position: relative;
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  cursor: zoom-in;
  background: #fff;
}

.figure-img img {
  width: 100%;
  height: 300px;
  object-fit: contain;
  background: #fff;
  display: block;
}

.bp-figures.single .figure-img img { height: min(60vh, 560px); }

.figure-img.missing {
  cursor: default;
  min-height: 200px;
  display: grid;
  place-items: center;
  border: 1px dashed hsl(var(--border));
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  padding: 12px;
  text-align: center;
}

.figure-cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid hsl(var(--border));
}

.fig-key { font-size: 13px; font-weight: 600; color: hsl(var(--card-foreground)); }

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
  border: 0;
  background: transparent;
  color: hsl(var(--card-foreground));
  text-align: left;
  padding: 9px 12px;
  font-size: 13px;
  cursor: pointer;
}

.save-menu button:hover { background: hsl(var(--muted)); }

.zoom-hint {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgb(6 14 25 / 0.6);
  color: #fff;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.figure-img:hover .zoom-hint { opacity: 1; }

.gallery-empty { color: hsl(var(--muted-foreground)); font-size: 14px; }

.composite-note { margin: 0 0 10px; font-size: 12px; color: hsl(var(--muted-foreground)); }

.bp-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid hsl(var(--border));
  display: flex;
  justify-content: center;
  gap: 10px;
}

.summary-box {
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  padding: 12px;
  background: hsl(var(--card) / 0.84);
}

.summary-box ul { margin: 6px 0 10px; padding-left: 18px; }

.summary-box pre {
  margin: 0;
  font-size: 12px;
  padding: 10px;
  border-radius: 8px;
  background: hsl(var(--muted));
  overflow: auto;
}

/* ---- zoomable lightbox ---- */
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
  min-width: 48px;
  text-align: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.tool-sep { width: 1px; height: 20px; background: hsl(var(--border)); margin: 0 4px; }

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

.lightbox-stage img {
  max-width: 100%;
  max-height: 100%;
  display: block;
  transform-origin: center center;
  will-change: transform;
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
}
</style>
