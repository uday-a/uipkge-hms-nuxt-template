<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

onMounted(() => {
  navigateTo('/')
})
</script>

<template>
  <div />
</template>
