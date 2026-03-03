<template>
  <div class="app-shell">
    <ThemePicker />
    <TourManager />
    <router-view />
  </div>
</template>

<script setup>
import ThemePicker from "@/components/ThemePicker.vue";
import TourManager from "@/components/TourManager.vue";
</script>
