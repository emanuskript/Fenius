<template>
  <Teleport to="body">
    <div class="tour-welcome-overlay">
      <div class="tour-welcome-card surface-card" role="dialog" aria-modal="true" :aria-label="title">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <div class="tour-welcome-actions">
          <button class="secondary-btn" @click="$emit('skip')">Skip</button>
          <button class="primary-btn" @click="$emit('start')">Start tour</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/* eslint-disable */
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

defineEmits(["start", "skip"]);
</script>

<style scoped>
.tour-welcome-overlay {
  position: fixed;
  inset: 0;
  z-index: 13000;
  background: rgb(7 13 23 / 0.62);
  display: grid;
  place-items: center;
  padding: 24px;
}

.tour-welcome-card {
  width: min(520px, 100%);
  padding: 26px;
}

.tour-welcome-card h2 {
  margin: 0;
  font-size: 24px;
}

.tour-welcome-card p {
  margin: 12px 0 0;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.tour-welcome-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
