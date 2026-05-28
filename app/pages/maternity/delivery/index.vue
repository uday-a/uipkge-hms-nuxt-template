<script setup lang="ts">
// Redirect — deliveries are viewed from the maternity dashboard
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
await navigateTo('/maternity', { replace: true })
</script>
