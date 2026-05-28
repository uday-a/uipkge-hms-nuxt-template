<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

onMounted(() => {
  navigateTo('/pharmacy/queue')
})
</script>

<template>
  <div />
</template>
