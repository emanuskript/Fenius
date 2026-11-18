<template>
  <div class="rs-sheet" role="img" :aria-label="sheet.ariaLabel">
    <img
      v-for="entry in entries"
      :key="entry.key"
      class="rs-layer"
      :class="{ on: entry.loaded && !entry.leaving }"
      :src="base + entry.layer.file"
      :style="entry.style"
      alt=""
      draggable="false"
      decoding="async"
      @load="onLoad(entry)"
      @error="onError(entry)"
    />
    <div v-if="!sheet.layers.length && sheet.emptyText" class="rs-empty">{{ sheet.emptyText }}</div>
    <div v-if="busyText" class="rs-busy" aria-hidden="true">{{ busyText }}</div>
  </div>
</template>

<script setup>
/* global defineProps */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { layerKey, layerStyle } from "@/bookPaths/romanesque/compositor";

const props = defineProps({
  // output of composeSheet(): { layers, view, emptyText, ariaLabel, ... }
  sheet: { type: Object, required: true },
  base: { type: String, required: true },
});

const FADE_MS = 500;
const entries = ref([]);
const failed = ref("");
const timers = new Set();

function sync(sheet) {
  const view = sheet.view;
  const wanted = new Map();
  sheet.layers.forEach((layer, index) => wanted.set(layerKey(layer, view), { layer, index }));

  const next = [];
  for (const entry of entries.value) {
    const hit = wanted.get(entry.key);
    if (hit) {
      entry.style = { ...layerStyle(hit.layer.size, hit.layer.matrix, view), zIndex: String(hit.index + 1) };
      entry.leaving = false;
      wanted.delete(entry.key);
      next.push(entry);
    } else if (!entry.leaving) {
      entry.leaving = true;
      const key = entry.key;
      const timer = setTimeout(() => {
        timers.delete(timer);
        entries.value = entries.value.filter((e) => !(e.key === key && e.leaving));
      }, FADE_MS);
      timers.add(timer);
      next.push(entry);
    } else {
      next.push(entry);
    }
  }
  for (const [key, { layer, index }] of wanted) {
    next.push({
      key,
      layer,
      loaded: false,
      leaving: false,
      style: { ...layerStyle(layer.size, layer.matrix, view), zIndex: String(index + 1) },
    });
  }
  failed.value = "";
  entries.value = next;
}

watch(() => props.sheet, sync, { immediate: true });

function onLoad(entry) {
  entry.loaded = true;
}
function onError(entry) {
  entry.loaded = true;
  failed.value = `could not load ${entry.layer.file}`;
}

const busyText = computed(() => {
  if (failed.value) return failed.value;
  return entries.value.some((e) => !e.leaving && !e.loaded) ? "loading drawing…" : "";
});

onBeforeUnmount(() => {
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
});
</script>

<style scoped>
/* Always a white sheet, in every theme: the drawings are black line on transparent. */
.rs-sheet {
  position: relative;
  width: 100%;
  aspect-ratio: 1190.6 / 841.9;
  overflow: hidden;
  background: #fff;
}

.rs-layer {
  position: absolute;
  max-width: none;
  transform-origin: 0 0;
  opacity: 0;
  transition: opacity 0.45s ease;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.rs-layer.on { opacity: 1; }

.rs-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
  color: #5f6670;
  font-style: italic;
  font-size: 1rem;
  line-height: 1.4;
}

.rs-busy {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 0.72rem;
  color: #5f6670;
}

@media (prefers-reduced-motion: reduce) {
  .rs-layer { transition: none; }
}
</style>
