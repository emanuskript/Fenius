<template>
  <div class="input-page">
    <!-- Centered form container -->
    <div class="form-container">
      <!-- Top metadata row -->
      <div class="metadata">
        <div class="meta-group">
          <label class="field-label">Title *</label>
          <input
            v-model="title"
            type="text"
            required
            class="field-input"
            placeholder="Enter title"
          />

          <label class="field-label mt">City/Repository</label>
          <input
            v-model="location"
            type="text"
            class="field-input"
            placeholder="Enter city or repository"
          />
        </div>
        <div class="meta-group">
          <label class="field-label">Date</label>
          <input v-model="manuscriptDate" type="date" class="field-input" />

          <label class="field-label mt">Shelfmark</label>
          <input
            v-model="shelfmark"
            type="text"
            class="field-input"
            placeholder="Enter shelfmark"
          />
        </div>
      </div>

      <div class="separator"></div>

      <!-- Main form -->
      <div class="body">
        <div class="column">
          <!-- Number of Quires -->
          <div class="field">
            <div class="field-header">
              <span class="field-title">Number of Quires *</span>
              <span class="info" data-tooltip="Choose how many quires (e.g. 1-10)"
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="quires"
                type="number"
                min="1"
                max="10"
                required
                class="number-input"
              />
              <div class="radios">
                <label class="radio">
                  <input type="radio" v-model="quiresStyle" value="roman" />
                  Roman I, II, III…
                </label>
                <label class="radio">
                  <input type="radio" v-model="quiresStyle" value="arabic" />
                  Arabic 1, 2, 3…
                </label>
              </div>
            </div>
          </div>

          <!-- Folios per Quire -->
          <div class="field">
            <div class="field-header">
              <span class="field-title">Folios per Quire</span>
              <span
                class="info"
                data-tooltip="Max 20; can be modified later"
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="foliosPerQuire"
                type="number"
                min="1"
                max="20"
                class="number-input"
              />
              <div class="radios">
                <label class="radio">
                  <input
                    type="radio"
                    v-model="collationStyle"
                    value="foliate"
                  />
                  Foliate (r–v)
                </label>
                <label class="radio">
                  <input
                    type="radio"
                    v-model="collationStyle"
                    value="paginate"
                  />
                  Paginate (×2 pages)
                </label>
              </div>
            </div>
          </div>

          <!-- Sewing Supports -->
          <div class="field">
            <div class="field-header">
              <span class="field-title">Sewing Supports</span>
              <span class="info" data-tooltip="Choose number of supports (e.g. 1–6)"
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="sewingSupports"
                type="number"
                min="1"
                max="6"
                class="number-input"
              />
              <div class="radios">
                <label class="radio">
                  <input type="radio" v-model="sewingType" value="single" />
                  Single
                </label>
                <label class="radio">
                  <input type="radio" v-model="sewingType" value="double" />
                  Double
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="column">
          <!-- Spine Length -->
          <div class="field">
            <div class="field-header">
              <span class="field-title">Spine Length (cm)</span>
              <span class="info" data-tooltip="Enter spine length in cm."
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="spineLength"
                type="number"
                min="1"
                class="number-input short"
              />
            </div>
          </div>

          <!-- Front Endleaves -->
          <div class="field">
            <div class="field-header">
              <span class="field-title">Front Endleaves</span>
              <span
                class="info"
                data-tooltip="Enter folios that precede the bookblock."
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="frontEndleaves"
                type="number"
                min="1"
                class="number-input short"
              />
            </div>
          </div>

          <!-- Back Endleaves -->
          <div class="field">
            <div class="field-header">
              <span class="field-title">Back Endleaves</span>
              <span
                class="info"
                data-tooltip="Enter folios that follow the bookblock."
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="backEndleaves"
                type="number"
                min="1"
                class="number-input short"
              />
            </div>
          </div>

          <!-- Extras -->
          <div class="extras">
            <label class="checkbox">
              <input type="checkbox" v-model="headbands" /> Endbands
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="changeOver" /> Change‐Over
              Stations
            </label>
          </div>
        </div>
      </div>

      <!-- Continue -->
      <div class="button-container">
        <button
          class="continue-btn"
          :disabled="!canContinue"
          @click="onContinue"
        >
          Continue
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

// Metadata
const title = ref("");
const manuscriptDate = ref("");
const location = ref("");
const shelfmark = ref("");

// Config
const quires = ref(1);
const quiresStyle = ref("roman");
const foliosPerQuire = ref(1);
const collationStyle = ref("foliate");
const sewingSupports = ref(0);
const sewingType = ref("");
const spineLength = ref(null);
const frontEndleaves = ref(null);
const backEndleaves = ref(null);
const headbands = ref(false);
const changeOver = ref(false);

// Fill from route query
title.value = route.query.title || "";
manuscriptDate.value = route.query.date || "";
location.value = route.query.location || "";
shelfmark.value = route.query.shelfmark || "";
quires.value = Number(route.query.quires) || 1;
quiresStyle.value = route.query.quiresStyle || "roman";
foliosPerQuire.value = Number(route.query.foliosPerQuire) || 1;
collationStyle.value = route.query.collationStyle || "foliate";
frontEndleaves.value = Number(route.query.frontEndleaves) || null;
backEndleaves.value = Number(route.query.backEndleaves) || null;
spineLength.value = Number(route.query.spineLength) || null;
sewingSupports.value = Number(route.query.sewingSupports) || 0;
sewingType.value = route.query.sewingType || "";
headbands.value = route.query.headbands === "true";
changeOver.value = route.query.changeOver === "true";

// Default date to today if not provided
onMounted(() => {
  if (!manuscriptDate.value) {
    try {
      manuscriptDate.value = new Date().toISOString().slice(0, 10);
    } catch (_) {
      // no-op
    }
  }
  try {
    const saved = localStorage.getItem("feniusForm");
    if (saved) {
      const s = JSON.parse(saved);
      title.value = s.title ?? title.value;
      manuscriptDate.value = s.manuscriptDate ?? manuscriptDate.value;
      location.value = s.location ?? location.value;
      shelfmark.value = s.shelfmark ?? shelfmark.value;
      quires.value = s.quires ?? quires.value;
      quiresStyle.value = s.quiresStyle ?? quiresStyle.value;
      foliosPerQuire.value = s.foliosPerQuire ?? foliosPerQuire.value;
      collationStyle.value = s.collationStyle ?? collationStyle.value;
      sewingSupports.value = s.sewingSupports ?? sewingSupports.value;
      sewingType.value = s.sewingType ?? sewingType.value;
      spineLength.value = s.spineLength ?? spineLength.value;
      frontEndleaves.value = s.frontEndleaves ?? frontEndleaves.value;
      backEndleaves.value = s.backEndleaves ?? backEndleaves.value;
      headbands.value = s.headbands ?? headbands.value;
      changeOver.value = s.changeOver ?? changeOver.value;
    }
  } catch (_) { void 0; }
});

watch(
  [
    title,
    manuscriptDate,
    location,
    shelfmark,
    quires,
    quiresStyle,
    foliosPerQuire,
    collationStyle,
    sewingSupports,
    sewingType,
    spineLength,
    frontEndleaves,
    backEndleaves,
    headbands,
    changeOver,
  ],
  () => {
    try {
      localStorage.setItem(
        "feniusForm",
        JSON.stringify({
          title: title.value,
          manuscriptDate: manuscriptDate.value,
          location: location.value,
          shelfmark: shelfmark.value,
          quires: quires.value,
          quiresStyle: quiresStyle.value,
          foliosPerQuire: foliosPerQuire.value,
          collationStyle: collationStyle.value,
          sewingSupports: sewingSupports.value,
          sewingType: sewingType.value,
          spineLength: spineLength.value,
          frontEndleaves: frontEndleaves.value,
          backEndleaves: backEndleaves.value,
          headbands: headbands.value,
          changeOver: changeOver.value,
        })
      );
    } catch (_) { void 0; }
  },
  { deep: false }
);

const canContinue = computed(
  () => title.value.trim() !== "" && quires.value >= 1
);

function onContinue() {
  const nextQuery = {
    title: title.value,
    date: manuscriptDate.value,
    location: location.value,
    shelfmark: shelfmark.value,
    quires: quires.value,
    quiresStyle: quiresStyle.value,
    foliosPerQuire: foliosPerQuire.value,
    collationStyle: collationStyle.value,
    frontEndleaves: frontEndleaves.value,
    backEndleaves: backEndleaves.value,
    sewingSupports: sewingSupports.value,
    sewingType: sewingType.value,
    spineLength: spineLength.value,
    headbands: headbands.value,
    changeOver: changeOver.value,
  };

  router.push({
    name: "bookBinding",
    query: nextQuery,
  });
}
</script>

<style scoped>
/* original styling unchanged */
.input-page {
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

.input-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--app-bg-top), var(--app-bg-bottom));
  pointer-events: none;
}

.input-page::after {
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
  display: flex;
  gap: 42px;
}
.column {
  flex: 1;
}
.field {
  margin-bottom: 28px;
}
.field-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field-title {
  font-size: 16px;
  font-weight: 600;
}
.field-body {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
}
.number-input {
  width: 88px;
  padding: 9px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-sm);
  color: hsl(var(--card-foreground));
  text-align: center;
  font-size: 16px;
}
.number-input.short {
  width: 60px;
}
.radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}
.extras {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: hsl(var(--card-foreground));
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

/* ✅ Tooltip styling */
.info {
  position: relative;
  display: inline-block;
  cursor: help;
  font-size: 16px;
  color: hsl(var(--muted-foreground));
}

.info::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: hsl(var(--card-foreground));
  color: hsl(var(--card));
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
  z-index: 1000;
}

.info:hover::after {
  opacity: 1;
}
</style>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
