<template>
  <div class="landing-page">
    <!-- Header -->
    <div class="header-bar">eManuskript Produkt</div>

    <!-- Title -->
    <div class="title">FENIUS</div>

    <!-- Main App Buttons -->
    <div class="button-group">
      <button @click="goToRuling" class="action-button">
        Create a ruling scheme
      </button>

      <div class="spine-container">
        <button @click="toggleSpineOptions" class="action-button">
          Visualise a book spine
        </button>
        
        <!-- Sub-options for Visualise a book spine -->
        <transition name="slide-pop">
          <div v-if="showSpineOptions" class="sub-options">
            <button @click="goToBookbinding" class="sub-button">
              Create New
            </button>
            <label class="sub-button cursor-pointer">
              Import from VCEditor (JSON)
              <input
                type="file"
                accept=".json"
                class="hidden"
                @change="handleFileUpload"
              />
            </label>
          </div>
        </transition>
      </div>

      <button @click="goToBookbinding" class="action-button">
        Build a bookbinding
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const showSpineOptions = ref(false);

function toggleSpineOptions() {
  showSpineOptions.value = !showSpineOptions.value;
}

function goToBookbinding() {
  router.push("/input-screen");
}

function goToRuling() {
  router.push({ name: "rulingMetadata" });
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      const project = json?.project || {};
      const metadata = project.metadata || {};
      const preferences = project.preferences || {};

      const fields = {
        title: project.title || "",
        shelfmark: project.shelfmark || "",
        date: metadata.date || "",
        // These fields assume you're using them in InputScreen
        foliosPerQuire: Number(preferences.leavesPerQuire || 0),
        frontEndleaves: Number(preferences.startLeaves || 0),
        backEndleaves: Number(preferences.endLeaves || 0),
        spineLength: Number(preferences.spineLength || 0),
        sewingSupports: Number(preferences.sewingSupports || 0),
        headbands: preferences.headband === true,
        changeOver: preferences.changeOvers === true,
        collationStyle: preferences.collationFormula || "",
        quiresStyle: preferences.quiresStyle || "",
        sewingType: preferences.sewingType || "",
        location: preferences.location || "", // fallback
      };

      router.push({ path: "/input-screen", query: fields });
    } catch (err) {
      alert("Invalid JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}
</script>

<style scoped>
.landing-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #3a4b60 0%, #112233 100%);
  color: white;
}

.header-bar {
  background-color: #c0c2c3;
  color: black;
  font-size: 1.125rem; /* ~18px */
  font-weight: 600;
  padding: 8px 16px;
}

.title {
  text-align: center;
  color: #a0a0a0;
  font-size: 2rem; /* ~32px */
  margin-top: 12px;
}

.button-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-grow: 1;
  margin: 0;
}

.action-button {
  width: 400px;
  padding: 16px 0;
  border: 1px solid white;
  color: white;
  font-size: 1.125rem; /* ~18px */
  text-align: center;
  background: transparent;
  transition: background-color 0.2s, color 0.2s;
}

.action-button:hover {
  background-color: white;
  color: black;
}

.spine-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.sub-options {
  position: absolute;
  left: calc(50% + 220px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 300px;
}

.sub-button {
  width: 100%;
  padding: 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: white;
  font-size: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
}

.sub-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
}

/* Slide-pop animation */
.slide-pop-enter-active {
  animation: slidePopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-pop-leave-active {
  animation: slidePopOut 0.3s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes slidePopIn {
  0% {
    opacity: 0;
    transform: translateX(-40px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slidePopOut {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-40px) scale(0.8);
  }
}

.action-button input[type="file"],
.sub-button input[type="file"] {
  display: none !important;
  visibility: hidden !important;
  position: absolute !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>

<style>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}
</style>
