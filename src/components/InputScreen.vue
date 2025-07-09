<template>
  <div class="input-page">
    <!-- Header -->
    <div class="header-bar">eManuskript Produkt</div>

    <!-- Title -->
    <div class="title">FENIUS</div>

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

          <label class="field-label mt">Location</label>
          <input
            v-model="location"
            type="text"
            class="field-input"
            placeholder="Enter repository"
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
              <span class="info" title="Choose how many quires (1–10)">ℹ</span>
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
              <span class="info" title="These entries can be modified later"
                >ℹ</span
              >
            </div>
            <div class="field-body">
              <input
                v-model.number="foliosPerQuire"
                type="number"
                min="1"
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
              <span class="info" title="Choose number of supports (1–6)"
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
              <span class="info" title="Enter spine length in cm">ℹ</span>
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
                title="Enter folios that precede the bookblock."
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
              <span class="info" title="Enter folios that follow the bookblock."
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
              <input type="checkbox" v-model="headbands" /> Headbands
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
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

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

const canContinue = computed(
  () => title.value.trim() !== "" && quires.value >= 1
);

function onContinue() {
  router.push({
    name: "bookBinding",
    query: {
      title: title.value,
      date: manuscriptDate.value,
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
    },
  });
}
</script>

<style scoped>
.input-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
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

/* Center the form, add generous top padding */
.form-container {
  margin: 0 auto;
  width: 800px;
  padding: 64px 0 48px;
}

.metadata {
  display: flex;
  gap: 64px;
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
  display: flex;
  gap: 80px;
}

.column {
  flex: 1;
}

.field {
  margin-bottom: 32px;
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

.info {
  font-size: 16px;
  color: #ccc;
  cursor: help;
}

.field-body {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
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
}

/* Bring Continue button closer */
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

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
