// SSR stub for the v-os-scroll directive registered on the client in
// overlay-scroll.client.ts. Vue's SSR renderer requires every directive
// referenced in templates to have a registered definition (even a no-op
// one) or it throws "Cannot read properties of undefined (reading
// 'getSSRProps')".
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('os-scroll', {
    getSSRProps() {
      return {}
    },
    mounted() {},
    updated() {},
    unmounted() {},
  })
})
