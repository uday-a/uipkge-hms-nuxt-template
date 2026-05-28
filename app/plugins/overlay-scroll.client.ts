import type { PartialOptions } from 'overlayscrollbars'
import { OverlayScrollbars } from 'overlayscrollbars'
import 'overlayscrollbars/overlayscrollbars.css'

// Default options for the `v-os-scroll` directive. Match the OsScroll
// component so directive and component render the same scrollbar look.
const baseOptions: PartialOptions = {
  scrollbars: { autoHide: 'leave', autoHideDelay: 600, theme: 'os-theme-dark' },
  overflow: { x: 'scroll', y: 'scroll' },
}

type DirectiveBinding = PartialOptions | undefined

// Stash the OverlayScrollbars instance on the element so we can destroy
// it on unmount without leaking observers / event listeners.
interface OsHostEl extends HTMLElement {
  __osInstance?: ReturnType<typeof OverlayScrollbars>
}

// Client-only -- the package touches `window` at construct time. The
// `.client.ts` suffix already gates this plugin to the browser, but the
// guard inside is a belt-and-braces against SSR misuse.
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  // Initialize OverlayScrollbars on <body> so the main page scroll uses
  // the custom scrollbar theme consistently with interior v-os-scroll regions.
  OverlayScrollbars(document.body, {
    ...baseOptions,
    overflow: { x: 'hidden', y: 'scroll' },
  })

  nuxtApp.vueApp.directive<OsHostEl, DirectiveBinding>('os-scroll', {
    mounted(el, binding) {
      const options: PartialOptions = {
        ...baseOptions,
        ...(binding.value ?? {}),
        scrollbars: { ...baseOptions.scrollbars, ...(binding.value?.scrollbars ?? {}) },
        overflow: { ...baseOptions.overflow, ...(binding.value?.overflow ?? {}) },
      }
      el.__osInstance = OverlayScrollbars(el, options)
    },
    updated(el, binding) {
      if (!el.__osInstance) return
      const options: PartialOptions = {
        ...baseOptions,
        ...(binding.value ?? {}),
        scrollbars: { ...baseOptions.scrollbars, ...(binding.value?.scrollbars ?? {}) },
        overflow: { ...baseOptions.overflow, ...(binding.value?.overflow ?? {}) },
      }
      el.__osInstance.options(options)
    },
    unmounted(el) {
      el.__osInstance?.destroy()
      el.__osInstance = undefined
    },
  })
})
