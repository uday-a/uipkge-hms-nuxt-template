<script setup lang="ts">
// Redirect — prescriptions are managed from the pharmacy queue
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
await navigateTo('/pharmacy/queue', { replace: true })
</script>
