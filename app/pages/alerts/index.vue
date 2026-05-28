<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

onMounted(() => {
  navigateTo('/alerts/critical')
})
</script>

<template>
  <div />
</template>
