<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

onMounted(() => {
  navigateTo('/admissions/new')
})
</script>

<template>
  <div />
</template>
