<script setup lang="ts">
// Dashboard index — reads the current HMS persona and redirects to that
// persona's default dashboard route. Actual per-persona dashboards
// (/dashboard/admin, /dashboard/doctor, etc.) are authored by other agents.
// This page acts as a router for the base /dashboard path.
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Dashboard' })

const { config, current } = usePersona()

// Redirect synchronously on the client. usePersona defers its localStorage
// read to onMounted to avoid a hydration mismatch, but this page only ever
// renders the same "Redirecting…" text regardless of persona, so we can read
// the saved persona here and navigate immediately — without waiting for the
// page (and the dashboard layout's Suspense boundary) to finish mounting,
// which is what made the redirect feel stuck. config falls back to admin.
if (import.meta.client) {
  const saved = localStorage.getItem('hms-persona') as typeof current.value | null
  if (saved) current.value = saved
  navigateTo(config.value.defaultRoute || '/dashboard/admin', { replace: true })
}
</script>

<template>
  <div class="flex items-center justify-center p-8">
    <p class="text-muted-foreground text-sm">
      Redirecting to your dashboard…
    </p>
  </div>
</template>
