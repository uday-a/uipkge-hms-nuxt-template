<script setup lang="ts">
// Redirect — lab reports are viewed from the worklist
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
await navigateTo('/lab/worklist', { replace: true })
</script>
