<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

onMounted(() => {
  navigateTo('/lab/worklist')
})
</script>

<template>
  <div />
</template>
