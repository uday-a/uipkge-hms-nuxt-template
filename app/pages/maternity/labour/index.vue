<script setup lang="ts">
// Redirect — labour records are viewed from the maternity dashboard
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
await navigateTo('/maternity', { replace: true })
</script>
