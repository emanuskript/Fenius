<template>
  <div class="ruling-meta-page">
    <!-- Header -->
    <div class="header-bar">eManuskript Produkt</div>

    <!-- Title -->
    <div class="title">FENIUS</div>

    <!-- Centered form container -->
    <div class="form-container">
      <!-- Top metadata row -->
      <div class="metadata">
        <div class="meta-group">
          <label class="field-label">Manuscript Shelfmark *</label>
          <input
            v-model="shelfmark"
            type="text"
            required
            class="field-input"
            placeholder="e.g. Graz, UB, Ms. 123"
          />

          <label class="field-label mt">Siglum / Code</label>
          <input
            v-model="siglum"
            type="text"
            class="field-input"
            placeholder="Optional siglum or catalogue code"
          />
        </div>

        <div class="meta-group">
          <label class="field-label">Folio / Page *</label>
          <input
            v-model="folio"
            type="text"
            required
            class="field-input"
            placeholder="e.g. 12r or p. 24"
          />

          <label class="field-label mt">Page Size (in cm) *</label>
          <div class="size-row">
            <input
              v-model.number="widthCm"
              type="number"
              min="1"
              step="0.1"
              class="number-input"
            />
            <span class="size-mult">×</span>
            <input
              v-model.number="heightCm"
              type="number"
              min="1"
              step="0.1"
              class="number-input"
            />
            <span class="size-unit">cm</span>
          </div>
        </div>
      </div>

      <!-- Secondary metadata row: ruling tool / direction -->
      <div class="metadata secondary">
        <div class="meta-group">
          <label class="field-label">Ruling tool</label>
          <select v-model="tool" class="field-input">
            <option value="dry-point">dry-point</option>
            <option value="lead-point">lead-point</option>
            <option value="ink">ink</option>
          </select>
        </div>

        <div class="meta-group">
          <label class="field-label">Direction</label>
          <select v-model="direction" class="field-input">
            <option value="none">none</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
        </div>
      </div>

      <div class="separator"></div>

      <!-- Info text -->
      <div class="body">
        <p class="help-text">
          These details will be shown in the header and exported into the PDF
          together with the ruling schema.
        </p>
      </div>

      <!-- Continue -->
      <div class="button-container">
        <button
          class="continue-btn"
          :disabled="!canContinue"
          @click="goToRuling"
        >
          Continue to Ruling
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// Local state
const shelfmark = ref("");
const siglum = ref("");
const folio = ref("");
const widthCm = ref(15);
const heightCm = ref(20);
const tool = ref("dry-point");
const direction = ref("none");

const STORAGE_KEY = "feniusRulingMetadata";

// Prefill from query or localStorage
onMounted(() => {
  // from route (e.g. coming back from ruling)
  shelfmark.value = route.query.shelfmark || "";
  siglum.value = route.query.siglum || "";
  folio.value = route.query.folio || "";
  widthCm.value = Number(route.query.widthCm) || 15;
  heightCm.value = Number(route.query.heightCm) || 20;
  tool.value = route.query.tool || "dry-point";
  direction.value = route.query.direction || "none";

  // from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      shelfmark.value = s.shelfmark ?? shelfmark.value;
      siglum.value = s.siglum ?? siglum.value;
      folio.value = s.folio ?? folio.value;
      widthCm.value = s.widthCm ?? widthCm.value;
      heightCm.value = s.heightCm ?? heightCm.value;
      tool.value = s.tool ?? tool.value;
      direction.value = s.direction ?? direction.value;
    }
  } catch (_) {
    // ignore
  }
});

// Persist metadata
watch(
  [shelfmark, siglum, folio, widthCm, heightCm, tool, direction],
  () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          shelfmark: shelfmark.value,
          siglum: siglum.value,
          folio: folio.value,
          widthCm: widthCm.value,
          heightCm: heightCm.value,
          tool: tool.value,
          direction: direction.value,
        })
      );
    } catch (_) {
      // ignore
    }
  },
  { deep: false }
);

// Required fields: shelfmark, folio, width, height
const canContinue = computed(
  () =>
    shelfmark.value.trim() !== "" &&
    folio.value.trim() !== "" &&
    widthCm.value > 0 &&
    heightCm.value > 0
);

function goToRuling() {
  router.push({
    name: "ruling",
    query: {
      shelfmark: shelfmark.value,
      siglum: siglum.value,
      folio: folio.value,
      widthCm: widthCm.value,
      heightCm: heightCm.value,
      tool: tool.value,
      direction: direction.value,
    },
  });
}
</script>

<style scoped>
.ruling-meta-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(to bottom, #3a4b60, #112233);
  color: white;
}

.header-bar {
  background: #c0c2c3;
  color: black;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 18px;
}

.title {
  text-align: center;
  margin: 16px 0;
  font-size: 32px;
  color: #a0a0a0;
}

.form-container {
  margin: 0 auto;
  max-width: 800px;
  width: calc(100% - 32px);
  padding: 32px 0 48px;
}

.metadata {
  display: flex;
  gap: 64px;
}

.metadata.secondary {
  margin-top: 24px;
}

.meta-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
}

.field-input {
  margin-top: 4px;
  padding: 8px 12px;
  background: #1f2a3a;
  border: 1px solid #666;
  border-radius: 4px;
  color: white;
  font-size: 16px;
}

.mt {
  margin-top: 16px;
}

.separator {
  height: 1px;
  background: #2e3a4b;
  margin: 32px 0;
}

.body {
  margin-bottom: 24px;
}

.help-text {
  font-size: 14px;
  color: #d0d4dd;
  line-height: 1.4;
}

.size-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.number-input {
  width: 80px;
  padding: 8px;
  background: #1f2a3a;
  border: 1px solid #666;
  border-radius: 4px;
  color: white;
  text-align: center;
  font-size: 16px;
}

.size-mult {
  font-size: 16px;
  color: #cccccc;
}

.size-unit {
  font-size: 14px;
  color: #cccccc;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.continue-btn {
  padding: 12px 48px;
  border: 1px solid white;
  border-radius: 4px;
  background: transparent;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.continue-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-btn:not(:disabled):hover {
  background: white;
  color: black;
}
</style>
