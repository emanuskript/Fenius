<template>
  <div class="landing-page">
    <div class="app-bg-icons" aria-hidden="true"></div>

    <div class="brand-row">
      <img src="@/assets/logo.png" alt="Fenius logo" class="brand-logo" />
    </div>

    <section class="landing-card surface-card">
      <p class="ribbon">Select a workflow</p>

      <div class="button-group">
        <button @click="goToRuling" class="action-button secondary-btn">
          Create a ruling scheme
        </button>

        <div class="spine-container">
          <button @click="toggleSpineOptions" class="action-button secondary-btn">
            Visualise a book spine
          </button>

          <transition name="slide-pop">
            <div v-if="showSpineOptions" class="sub-options">
              <button @click="goToBookbindingCreate" class="sub-button secondary-btn">
                Create New
              </button>
              <label class="sub-button ghost-btn cursor-pointer">
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

        <button type="button" class="action-button secondary-btn is-coming-soon" disabled>
          Build a bookbinding • Coming soon!
        </button>
      </div>
    </section>
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

function goToBookbindingCreate() {
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
  position: relative;
  inset: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: hsl(var(--foreground));
}

.brand-row {
  position: absolute;
  top: 18px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
}

.brand-logo {
  width: min(380px, 56vw);
  height: auto;
  display: block;
  margin-bottom: 10px;
  filter: drop-shadow(0 10px 20px rgb(15 23 42 / 0.26));
}

.landing-card {
  position: relative;
  z-index: 3;
  width: min(760px, calc(100vw - 32px));
  padding: 26px 24px 24px;
  margin-top: 230px;
}

.ribbon {
  margin: -42px auto 12px;
  width: fit-content;
  padding: 8px 20px;
  border-radius: 999px;
  background: #7a2359;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 6px 0 0;
}

.action-button {
  width: 100%;
  padding: 14px 16px;
  font-size: 1.05rem;
  line-height: 1.25;
  text-align: center;
  white-space: normal;
}

.is-coming-soon {
  opacity: 0.78;
  cursor: not-allowed;
  color: hsl(var(--muted-foreground));
  background: linear-gradient(
    135deg,
    hsl(var(--card)) 0%,
    hsl(var(--muted)) 45%,
    hsl(var(--card)) 100%
  );
  border-color: hsl(var(--border));
  box-shadow: var(--shadow-sm), inset 0 1px 0 hsl(var(--background) / 0.85);
}

.spine-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

.sub-options {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  margin-left: 24px;
  padding-left: 14px;
  width: calc(100% - 24px);
  border-left: 1px solid hsl(var(--border));
}

.sub-button {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.92rem;
  line-height: 1.25;
  text-align: center;
  white-space: normal;
  cursor: pointer;
  border-radius: 10px;
}

/* Slide-pop animation */
.slide-pop-enter-active {
  animation: slidePopIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-pop-leave-active {
  animation: slidePopOut 0.22s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes slidePopIn {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slidePopOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
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

@media (max-width: 700px) {
  .landing-card {
    margin-top: 190px;
    padding: 22px 18px 18px;
  }

  .brand-logo {
    width: min(320px, 66vw);
  }
}

@media (max-width: 480px) {
  .button-group {
    gap: 12px;
  }

  .action-button,
  .sub-button {
    padding: 12px 14px;
    font-size: 1rem;
  }

}
</style>
