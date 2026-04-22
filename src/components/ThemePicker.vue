<template>
  <div ref="rootEl" class="theme-picker" @keydown.esc="isOpen = false">
    <RouterLink class="theme-home-link" to="/" aria-label="Return to home screen" title="Return to home screen">
      <img src="@/assets/logo.png" alt="Fenius" class="theme-home-logo" />
    </RouterLink>
    <button
      class="theme-trigger"
      type="button"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-haspopup="menu"
      :aria-label="`Current theme: ${themeLabel}. Open theme menu.`"
      :title="`Theme: ${themeLabel}`"
      @click="isOpen = !isOpen"
    >
      <span class="theme-trigger-icon" aria-hidden="true">{{ themeIcon }}</span>
      <span class="sr-only">Theme: {{ themeLabel }}</span>
    </button>
    <div v-if="isOpen" class="theme-menu surface-card">
      <button class="theme-option" type="button" @click="selectTheme('light')">
        <span class="theme-option-icon" aria-hidden="true">{{ themeMeta.light.icon }}</span>
        <span>Light</span>
      </button>
      <button class="theme-option" type="button" @click="selectTheme('dark')">
        <span class="theme-option-icon" aria-hidden="true">{{ themeMeta.dark.icon }}</span>
        <span>Dark</span>
      </button>
      <button class="theme-option" type="button" @click="selectTheme('high-contrast')">
        <span class="theme-option-icon" aria-hidden="true">{{ themeMeta["high-contrast"].icon }}</span>
        <span>High Contrast</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useTheme } from "@/composables/useTheme";

const { currentTheme, setTheme } = useTheme();
const isOpen = ref(false);
const rootEl = ref(null);
const themeMeta = {
  light: { label: "Light", icon: "☀" },
  dark: { label: "Dark", icon: "☾" },
  "high-contrast": { label: "High Contrast", icon: "◐" },
};

const themeLabel = computed(() => {
  return themeMeta[currentTheme.value]?.label || "Light";
});

const themeIcon = computed(() => themeMeta[currentTheme.value]?.icon || themeMeta.light.icon);

function selectTheme(theme) {
  setTheme(theme);
  isOpen.value = false;
}

function handleOutsideClick(event) {
  if (!isOpen.value) return;
  if (rootEl.value && !rootEl.value.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
});
</script>
