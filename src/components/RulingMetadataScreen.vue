<template>
  <div class="ruling-meta-page">
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

          <label class="field-label mt">Folio / Page</label>
          <input
            v-model="folio"
            type="text"
            class="field-input"
            placeholder="e.g. 12r or p. 24"
          />

          <label class="field-label mt">Quire(s)</label>
          <input
            v-model="quire"
            type="text"
            class="field-input"
            placeholder="e.g. III or 3"
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
          <option value=">">&gt; applied from recto</option>
          <option value="<">&lt; applied from verso</option>
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
const quire = ref("");
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
  quire.value = route.query.quire || "";
  widthCm.value = Number(route.query.widthCm) || 15;
  heightCm.value = Number(route.query.heightCm) || 20;
  tool.value = route.query.tool || "dry-point";
  direction.value = route.query.direction || "none";
});

// Required fields: cityRepository, shelfmark, width, height
const canContinue = computed(
  () =>
    cityRepository.value.trim() !== "" &&
    shelfmark.value.trim() !== "" &&
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
      quire: quire.value,
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
  justify-content: center;
  min-height: 100vh;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  color: hsl(var(--foreground));
  box-sizing: border-box;
  padding: 90px 0 24px;
  position: relative;
}

.ruling-meta-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--app-bg-top), var(--app-bg-bottom));
  pointer-events: none;
}

.ruling-meta-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgb(23 43 77 / 0.08) 1px, transparent 0);
  background-size: 24px 24px;
  opacity: 0.45;
  pointer-events: none;
}

.form-container {
  margin: auto;
  max-width: 860px;
  width: calc(100% - 32px);
  padding: 28px 28px 34px;
  border-radius: var(--radius-lg);
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card) / 0.95);
  box-shadow: var(--shadow-md);
  position: relative;
  z-index: 1;
}

.metadata {
  display: flex;
  gap: 38px;
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
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.field-input {
  margin-top: 4px;
  padding: 10px 12px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-sm);
  color: hsl(var(--card-foreground));
  font-size: 16px;
}

.mt {
  margin-top: 16px;
}

.separator {
  height: 1px;
  background: hsl(var(--border));
  margin: 28px 0;
}

.body {
  margin-bottom: 24px;
}

.help-text {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
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
  padding: 9px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-sm);
  color: hsl(var(--card-foreground));
  text-align: center;
  font-size: 16px;
}

.size-mult {
  font-size: 16px;
  color: hsl(var(--muted-foreground));
}

.size-unit {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.continue-btn {
  padding: 12px 48px;
  border-radius: var(--radius-md);
  border: 1px solid hsl(var(--primary));
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: filter 0.15s ease;
}

.continue-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.continue-btn:not(:disabled):hover {
  filter: brightness(0.95);
}
</style>
