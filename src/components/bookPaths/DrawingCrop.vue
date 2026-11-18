<template>
  <div class="dc-frame" :style="{ aspectRatio: `${crop[2]} / ${crop[3]}` }">
    <img :src="base + drawing.file" :alt="alt" loading="lazy" decoding="async" :style="style" draggable="false" />
  </div>
</template>

<script setup>
/* global defineProps */
import { computed } from "vue";
import { IDENTITY, layerStyle } from "@/bookPaths/romanesque/compositor";

// A small static picture of one drawing, cropped to a region of its own viewBox
// (used for option thumbnails and step figures).
const props = defineProps({
  drawing: { type: Object, required: true },
  box: { type: Array, default: null },
  base: { type: String, required: true },
  alt: { type: String, default: "" },
});

const crop = computed(() => props.box || [0, 0, props.drawing.size[0], props.drawing.size[1]]);
const style = computed(() => layerStyle(props.drawing.size, IDENTITY, crop.value));
</script>

<style scoped>
.dc-frame {
  position: relative;
  overflow: hidden;
  background: #fff;
}

.dc-frame img {
  position: absolute;
  max-width: none;
  transform-origin: 0 0;
  user-select: none;
}
</style>
