<template>
  <div ref="rootEl" class="theme-picker" @keydown.esc="isOpen = false">
    <button class="theme-trigger" @click="isOpen = !isOpen">
      Theme: {{ themeLabel }}
    </button>
    <div v-if="isOpen" class="theme-menu surface-card">
      <button class="theme-option" @click="selectTheme('light')">Light</button>
      <button class="theme-option" @click="selectTheme('dark')">Dark</button>
      <button class="theme-option" @click="selectTheme('high-contrast')">High Contrast</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useTheme } from "@/composables/useTheme";

const { currentTheme, setTheme } = useTheme();
const isOpen = ref(false);
const rootEl = ref(null);

const themeLabel = computed(() => {
  if (currentTheme.value === "high-contrast") return "High Contrast";
  return currentTheme.value.charAt(0).toUpperCase() + currentTheme.value.slice(1);
});

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
