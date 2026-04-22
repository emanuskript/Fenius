<template>
  <Teleport to="body">
    <div class="tour-overlay" @click.self="$emit('skip')">
      <div v-if="targetRect" class="tour-cutout" :style="cutoutStyle"></div>
      <div class="tour-tooltip surface-card" :style="tooltipStyle" role="dialog" aria-modal="true">
        <div class="tour-progress">Step {{ stepNumber }} / {{ total }}</div>
        <h3>{{ step.title }}</h3>
        <p>{{ step.content }}</p>
        <div class="tour-actions">
          <button class="ghost-btn" @click="$emit('skip')">Skip</button>
          <button class="secondary-btn" :disabled="stepNumber === 1" @click="$emit('prev')">
            Back
          </button>
          <button class="primary-btn" @click="$emit(isLast ? 'finish' : 'next')">
            {{ isLast ? 'Finish' : 'Next' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/* eslint-disable */
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  step: { type: Object, required: true },
  stepNumber: { type: Number, required: true },
  total: { type: Number, required: true },
});

defineEmits(["next", "prev", "finish", "skip"]);

const targetRect = ref(null);
let frameId = 0;

const isLast = computed(() => props.stepNumber === props.total);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function updateTargetRect({ shouldScroll = false } = {}) {
  if (!props.step?.target) {
    targetRect.value = null;
    return;
  }

  const el = document.querySelector(props.step.target);
  if (!el) {
    targetRect.value = null;
    return;
  }

  const rect = el.getBoundingClientRect();
  const pad = props.step.spotlightPadding ?? 10;
  targetRect.value = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    bottom: rect.bottom + pad,
    right: rect.right + pad,
  };

  if (shouldScroll && props.step.scrollIntoView !== false) {
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }
}

function scheduleTargetRectUpdate(options = {}) {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(() => {
    frameId = 0;
    updateTargetRect(options);
  });
}

watch(
  () => props.step,
  () => {
    scheduleTargetRectUpdate({ shouldScroll: true });
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("resize", scheduleTargetRectUpdate);
  window.addEventListener("scroll", scheduleTargetRectUpdate, true);
});

onUnmounted(() => {
  if (frameId) cancelAnimationFrame(frameId);
  window.removeEventListener("resize", scheduleTargetRectUpdate);
  window.removeEventListener("scroll", scheduleTargetRectUpdate, true);
});

const cutoutStyle = computed(() => {
  if (!targetRect.value) return {};
  return {
    top: `${targetRect.value.top}px`,
    left: `${targetRect.value.left}px`,
    width: `${targetRect.value.width}px`,
    height: `${targetRect.value.height}px`,
    borderRadius: "12px",
  };
});

const tooltipStyle = computed(() => {
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 720;

  if (!targetRect.value || props.step.placement === "center") {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const placement = props.step.placement || "bottom";
  const cardW = Math.min(380, vw - 32);
  const cardH = 210;
  const gap = 16;
  let left = targetRect.value.left;
  let top = targetRect.value.bottom + gap;

  if (placement === "top") {
    top = targetRect.value.top - cardH - gap;
    left = targetRect.value.left + targetRect.value.width / 2 - cardW / 2;
  }

  if (placement === "right") {
    left = targetRect.value.right + gap;
    top = targetRect.value.top + targetRect.value.height / 2 - cardH / 2;
  }

  if (placement === "left") {
    left = targetRect.value.left - cardW - gap;
    top = targetRect.value.top + targetRect.value.height / 2 - cardH / 2;
  }

  if (placement === "bottom") {
    left = targetRect.value.left + targetRect.value.width / 2 - cardW / 2;
    top = targetRect.value.bottom + gap;
  }

  left = clamp(left, 12, vw - cardW - 12);
  top = clamp(top, 12, vh - cardH - 12);

  return {
    top: `${top}px`,
    left: `${left}px`,
  };
});
</script>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 12900;
  background: rgb(3 9 18 / 0.72);
}

.tour-cutout {
  position: fixed;
  border: 2px solid hsl(var(--ring));
  box-shadow: 0 0 0 9999px rgb(3 9 18 / 0.72), 0 0 0 1px rgb(255 255 255 / 0.3) inset;
  pointer-events: none;
  transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease,
    border-radius 0.2s ease;
  will-change: top, left, width, height;
}

.tour-tooltip {
  position: fixed;
  width: min(380px, calc(100vw - 24px));
  padding: 18px;
  z-index: 12910;
  transition: top 0.18s ease, left 0.18s ease, transform 0.18s ease;
  will-change: top, left, transform;
}

.tour-progress {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

.tour-tooltip h3 {
  margin: 8px 0 0;
  font-size: 20px;
}

.tour-tooltip p {
  margin: 10px 0 0;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

.tour-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
