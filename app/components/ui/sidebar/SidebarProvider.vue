<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { TooltipProvider } from 'reka-ui'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import {
  provideSidebarContext,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from './utils'

// Use useCookie so the server and client agree on the initial open state.
// defaultDocument?.cookie is undefined during SSR, which always produced
// defaultOpen=true even when the client cookie said false — a hydration mismatch.
const props = defineProps<{
  defaultOpen?: boolean
  open?: boolean
  class?: HTMLAttributes['class']
}>()

// Use useCookie so the server and client agree on the initial open state.
// We read it reactively inside setup rather than in withDefaults (which
// cannot reference local variables due to hoisting).
const sidebarCookie = useCookie(SIDEBAR_COOKIE_NAME, { default: () => 'true' })

const emits = defineEmits<{
  'update:open': [open: boolean]
}>()

// `useMediaQuery` returns `false` during SSR (no matchMedia) and
// re-evaluates synchronously on the client's first render. If the
// viewport is < 768px, SSR HTML has the desktop branch but the
// client wants the mobile <Sheet> branch -- Vue throws a hydration
// mismatch and the Sheet renders without its overlay (the desktop
// sidebar's div is the parent the diff lands against).
//
// Gating on `mounted` makes both the server and the client's first
// synchronous render produce the desktop branch unconditionally;
// `onMounted` then flips the flag and `Sidebar.vue`'s v-else-if
// re-runs against the real matchMedia signal. Cost: a brief
// desktop-layout flash for mobile users on first paint. That's the
// universal tradeoff for SSR-without-viewport-detection -- there is
// no clean way to know the viewport on the server.
const mediaMobile = useMediaQuery('(max-width: 768px)')
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const isMobile = computed(() => mounted.value && mediaMobile.value)
const openMobile = ref(false)

// Sidebar is open by default. Cookie is still written on toggle so
// the state survives client-side navigation, but a full reload always
// resets to expanded.
const open = ref<boolean>(true)

function setOpen(value: boolean) {
  open.value = value

  // This sets the cookie to keep the sidebar state.
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
}

// Helper to toggle the sidebar.
function toggleSidebar() {
  return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    toggleSidebar()
  }
})

// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with Tailwind classes.
const state = computed(() => (open.value ? 'expanded' : 'collapsed'))

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-uipkge
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
      }"
      :class="cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', props.class)"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
