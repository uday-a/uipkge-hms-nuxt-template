<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

onMounted(() => {
  navigateTo('/radiology/worklist')
})
</script>

<template>
  <div />
</template>
