<template>
  <div class="tour-manager">
    <TourWelcome
      v-if="showWelcome"
      :title="welcomeTitle"
      :description="welcomeDescription"
      @start="startTour"
      @skip="skipTour"
    />

    <TourOverlay
      v-if="isActive && currentStep"
      :step="currentStep"
      :step-number="stepIndex + 1"
      :total="steps.length"
      @next="nextStep"
      @prev="prevStep"
      @finish="finishTour"
      @skip="skipTour"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import TourOverlay from "@/components/tour/TourOverlay.vue";
import TourWelcome from "@/components/tour/TourWelcome.vue";
import { FLOW_TOUR_STEPS } from "@/data/tourSteps";

const route = useRoute();
const flowKey = ref(null);
const stepIndex = ref(0);
const showWelcome = ref(false);
const isActive = ref(false);

const flowMap = {
  ruling: "ruling",
  bookBinding: "bookBinding",
};

function keyFor(flow) {
  return `fenius-tour-seen-${flow}`;
}

function hasSeen(flow) {
  if (!flow) return true;
  try {
    return localStorage.getItem(keyFor(flow)) === "true";
  } catch (_) {
    return false;
  }
}

function markSeen(flow) {
  if (!flow) return;
  try {
    localStorage.setItem(keyFor(flow), "true");
  } catch (_) {
    void 0;
  }
}

const steps = computed(() => {
  if (!flowKey.value) return [];
  return FLOW_TOUR_STEPS[flowKey.value] || [];
});

const currentStep = computed(() => steps.value[stepIndex.value] || null);

const welcomeTitle = computed(() => {
  if (flowKey.value === "ruling") return "Ruling Flow Tour";
  if (flowKey.value === "bookBinding") return "Book Spine Flow Tour";
  return "Guided Tour";
});

const welcomeDescription = computed(() => {
  if (flowKey.value === "ruling") {
    return "A quick walkthrough of ruling construction, canvas controls, and export tools.";
  }
  return "A quick walkthrough of pen controls, recoloring, structure tools, and export in the book spine workspace.";
});

function resetTourState() {
  stepIndex.value = 0;
  isActive.value = false;
  showWelcome.value = false;
}

function startTour() {
  showWelcome.value = false;
  stepIndex.value = 0;
  isActive.value = true;
}

function nextStep() {
  if (stepIndex.value >= steps.value.length - 1) {
    finishTour();
    return;
  }
  stepIndex.value += 1;
}

function prevStep() {
  if (stepIndex.value > 0) stepIndex.value -= 1;
}

function finishTour() {
  isActive.value = false;
  markSeen(flowKey.value);
}

function skipTour() {
  resetTourState();
  markSeen(flowKey.value);
}

watch(
  () => route.name,
  (routeName) => {
    const nextFlow = flowMap[routeName] || null;
    resetTourState();
    flowKey.value = nextFlow;

    if (!nextFlow) return;

    setTimeout(() => {
      if (!hasSeen(nextFlow)) {
        showWelcome.value = true;
      }
    }, 450);
  },
  { immediate: true }
);
</script>

<style scoped>
.tour-manager {
  display: contents;
}
</style>
