<template>
  <div class="app-shell">
      <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

onMounted(() => {
 
});
</script>
