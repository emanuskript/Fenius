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
          </template>

          <footer class="bp-footer">
            <button class="secondary-btn" :disabled="state.steps.length === 0 || !!summary" @click="goBack">Back</button>
            <button class="ghost-btn" @click="restartWizard">Restart</button>
            <button v-if="!summary && isTerminal" class="primary-btn" @click="finishWizard">Finish</button>
          </footer>
        </main>

        <aside class="bp-images">
          <h3>Illustrations</h3>

          <p v-if="compositeMissingNote" class="composite-note">
            {{ compositeMissingNote }}
          </p>

          <div
            class="gallery-grid"
            :class="{ single: renderedImages.length === 1 && renderedImages[0]?.src }"
          >
            <template v-if="renderedImages.length">
              <template v-for="image in renderedImages" :key="image.key">
                <button
                  v-if="image.src"
                  class="gallery-item"
                  @click="openLightbox(image.key, image.src)"
                  :title="`Open ${image.key}`"
                >
                  <img :src="image.src" :alt="`Drawing ${image.key}`" />
                  <span>{{ image.key }}</span>
                </button>
                <div v-else class="gallery-item missing">
                  <span>Missing asset: {{ image.key }}</span>
                </div>
              </template>
            </template>
            <div v-else class="gallery-empty">No images for this step.</div>
          </div>
        </aside>
      </div>

      <div v-if="lightbox" class="bp-lightbox" @click.self="closeLightbox">
        <div class="bp-lightbox-card surface-card">
          <div class="lightbox-head">
            <strong>{{ lightbox.key }}</strong>
            <button class="secondary-btn" @click="closeLightbox">Close</button>
          </div>
          <img :src="lightbox.src" :alt="`Drawing ${lightbox.key}`" />
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
  initialContext: {
    type: Object,
    default: () => ({}),
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "finish"]);

const state = ref(createInitialWizardState(props.initialContext));
const summary = ref(null);
const lightbox = ref(null);

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

const renderedImages = computed(() => {
  const node = currentNode.value;
  if (!node) return [];

  if (node.compositeKey) {
    const compositeSrc = resolveBookPathAsset(node.compositeKey);
    if (compositeSrc) {
      return [{ key: node.compositeKey, src: compositeSrc }];
    }

    const fallbackKeys = (node.compositeOf && node.compositeOf.length)
      ? node.compositeOf
      : [node.compositeKey];

    return fallbackKeys.map((key) => ({ key, src: resolveBookPathAsset(key) }));
  }

  return (node.images || []).map((key) => ({
    key,
    src: resolveBookPathAsset(key),
  }));
});

const formattedDerived = computed(() => {
  if (!summary.value) return "{}";
  return JSON.stringify(summary.value.derived, null, 2);
});

function choose(option) {
  if (!currentNode.value) return;
  summary.value = null;
  state.value = applyOption(state.value, currentNode.value, option);
}

function jumpToDecision(stepIndex) {
  const capped = Math.max(0, Math.min(stepIndex, state.value.steps.length));
  const partial = state.value.steps.slice(0, capped);
  state.value = replayState(partial, BOOK_PATHS_FLOW, props.initialContext);
  summary.value = null;
}

function goBack() {
  if (!state.value.steps.length || summary.value) return;
  jumpToDecision(state.value.steps.length - 1);
}

function restartWizard() {
  state.value = createInitialWizardState(props.initialContext);
  summary.value = null;
  closeLightbox();
}

function finishWizard() {
  summary.value = buildSummary(state.value);
  emit("finish", summary.value);
}

function resolveNodeTitle(nodeId) {
  return BOOK_PATHS_FLOW[nodeId]?.title || nodeId;
}

function openLightbox(key, src) {
  lightbox.value = { key, src };
}

function closeLightbox() {
  lightbox.value = null;
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

.bp-header h2 {
  margin: 0;
  font-size: 24px;
}

.bp-subtitle {
  margin: 4px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.bp-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 250px 1fr 340px;
}

.bp-crumbs,
.bp-main,
.bp-images {
  padding: 14px;
  overflow: auto;
}

.bp-crumbs {
  border-right: 1px solid hsl(var(--border));
  background: hsl(var(--card) / 0.78);
}

.bp-images {
  border-left: 1px solid hsl(var(--border));
  background: hsl(var(--card) / 0.78);
}

.bp-crumbs h3,
.bp-main h3,
.bp-images h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.bp-crumbs ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bp-crumbs button {
  width: 100%;
  text-align: left;
  font-weight: 600;
}

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
}

.bp-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  margin: 12px 0 18px;
}

.bp-terminal-note {
  margin: 14px 0 18px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.bp-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid hsl(var(--border));
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.summary-box {
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  padding: 12px;
  background: hsl(var(--card) / 0.84);
}

.summary-box ul {
  margin: 6px 0 10px;
  padding-left: 18px;
}

.summary-box pre {
  margin: 0;
  font-size: 12px;
  padding: 10px;
  border-radius: 8px;
  background: hsl(var(--muted));
  overflow: auto;
}

.composite-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.gallery-grid.single {
  grid-template-columns: 1fr;
}

.gallery-item {
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: hsl(var(--card));
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.gallery-grid.single .gallery-item img {
  height: min(58vh, 520px);
}

.gallery-item img {
  width: 100%;
  height: 120px;
  object-fit: contain;
  background: #fff;
  display: block;
}

.gallery-item span {
  display: block;
  padding: 6px 8px;
  font-size: 12px;
  color: hsl(var(--card-foreground));
}

.gallery-item.missing {
  min-height: 120px;
  border-style: dashed;
  display: grid;
  place-items: center;
  background: hsl(var(--muted));
  padding: 8px;
}

.gallery-item.missing span {
  text-align: center;
  color: hsl(var(--muted-foreground));
}

.gallery-empty {
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.bp-lightbox {
  position: fixed;
  inset: 0;
  z-index: 16100;
  background: rgb(4 10 18 / 0.84);
  display: grid;
  place-items: center;
  padding: 20px;
}

.bp-lightbox-card {
  width: min(1100px, 100%);
  max-height: 92vh;
  overflow: auto;
  padding: 12px;
}

.lightbox-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.bp-lightbox-card img {
  width: 100%;
  height: auto;
  display: block;
  background: #fff;
}

@media (max-width: 1120px) {
  .bp-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .bp-crumbs,
  .bp-images {
    border: 0;
    border-top: 1px solid hsl(var(--border));
  }
}
</style>
