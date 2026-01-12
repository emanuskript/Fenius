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
          <label class="field-label">City/Repository *</label>
          <input
            v-model="cityRepository"
            type="text"
            required
            class="field-input"
            placeholder="e.g. Graz, UB"
          />

          <label class="field-label mt">Shelfmark *</label>
          <input
            v-model="shelfmark"
            type="text"
            required
            class="field-input"
            placeholder="e.g. Ms. 123"
          />

          <label class="field-label mt">Ruling tool</label>
          <select v-model="tool" class="field-input">
            <option value="dry-point">dry-point</option>
            <option value="lead-point">lead-point</option>
            <option value="ink">ink</option>
          </select>
        </div>

        <div class="meta-group">
          <label class="field-label">Siglum/ID Number</label>
          <input
            v-model="siglum"
            type="text"
            class="field-input"
            placeholder="Optional siglum or catalogue code"
          />

          <label class="field-label mt">Folio / Page *</label>
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

      <!-- Direction (centered) -->
      <div class="direction-centered">
        <label class="field-label">Direction</label>
        <select v-model="direction" class="field-input">
          <option value="none">none</option>
          <option value=">">&gt; applied from above</option>
          <option value="<">&lt; applied from below</option>
        </select>
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
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// Local state
const cityRepository = ref("");
const shelfmark = ref("");
const siglum = ref("");
const folio = ref("");
const widthCm = ref(15);
const heightCm = ref(20);
const tool = ref("dry-point");
const direction = ref("none");

// Prefill from query
onMounted(() => {
  // from route (e.g. coming back from ruling)
  cityRepository.value = route.query.cityRepository || "";
  shelfmark.value = route.query.shelfmark || "";
  siglum.value = route.query.siglum || "";
  folio.value = route.query.folio || "";
  widthCm.value = Number(route.query.widthCm) || 15;
  heightCm.value = Number(route.query.heightCm) || 20;
  tool.value = route.query.tool || "dry-point";
  direction.value = route.query.direction || "none";
});

// Required fields: cityRepository, shelfmark, folio, width, height
const canContinue = computed(
  () =>
    cityRepository.value.trim() !== "" &&
    shelfmark.value.trim() !== "" &&
    folio.value.trim() !== "" &&
    widthCm.value > 0 &&
    heightCm.value > 0
);

function goToRuling() {
  router.push({
    name: "ruling",
    query: {
      cityRepository: cityRepository.value,
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

.direction-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
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
  text-align: center;
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
