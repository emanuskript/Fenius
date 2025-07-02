<template>
  <div class="landing-page">
    <!-- Header -->
    <div class="header-bar">eManuskript Produkt</div>

    <!-- Title -->
    <div class="title">FENIUS</div>

    <!-- Buttons -->
    <div class="button-group">
      <button @click="goToInputScreen" class="action-button">Create new</button>

      <label class="action-button cursor-pointer text-center">
        Import from VCEditor (JSON)
        <input
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileUpload"
        />
      </label>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function goToInputScreen() {
  router.push("/input-screen");
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    console.log("File selected:", file);
    // Placeholder for JSON parsing or backend upload
  }
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

.action-button input[type="file"] {
  display: none !important;
  visibility: hidden !important;
  position: absolute !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
}
</style>

<!-- Ensure body and html have no margins (place this in your global style, e.g., main.css or index.css) -->
<style>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent scrolling */
  height: 100%;
}
</style>
