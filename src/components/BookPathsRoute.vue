<template>
  <BookPathsWizard fullscreen :initial-context="initialContext" @close="goBack" />
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import BookPathsWizard from "@/components/BookPathsWizard.vue";

const router = useRouter();
const route = useRoute();

const initialContext = computed(() => ({
  title: route.query.title || "",
  manuscriptDate: route.query.date || "",
  shelfmark: route.query.shelfmark || "",
  location: route.query.location || "",
}));

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push({ name: "landing" });
}
</script>

<style scoped>
:global(body) {
  overflow: hidden;
}
</style>
