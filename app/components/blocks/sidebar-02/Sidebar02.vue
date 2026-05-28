<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import {
  LifeBuoy,
} from 'lucide-vue-next'

import NavMain from './NavMain.vue'
import NavSecondary from './NavSecondary.vue'
import NavUser from './NavUser.vue'
import TeamSwitcher from './TeamSwitcher.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

// Pull the signed-in user from the session. When the auth middleware
// BYPASS flag is on (boilerplate preview without OAuth) user.value is
// null, so we render a 'Guest' placeholder rather than crashing.
const { user, clear } = useUserSession()
const navUser = computed(() => ({
  name: user.value?.name || user.value?.login || 'Guest',
  email: user.value?.email || '',
  avatar: user.value?.avatar ?? undefined,
}))

async function onLogout() {
  await $fetch('/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/')
}

// Persona-driven nav — resolves the current persona's navItems into the
// shape NavMain expects: { title, url, icon: Component }.
const { config, getIconComponent } = usePersona()

const navMain = computed(() =>
  config.value.navItems.map(item => ({
    title: item.title,
    url: item.url,
    // getIconComponent returns Component | undefined; NavMain expects LucideIcon.
    // All HMS_ICONS entries are lucide functional components so this cast is safe.
    icon: getIconComponent(item.icon) as LucideIcon,
    items: item.items,
  })),
)

// Support is the only secondary nav item.
const navSecondary = [
  { title: 'Support', url: '/support', icon: LifeBuoy },
]
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <TeamSwitcher />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
      <NavSecondary
        :items="navSecondary"
        class="mt-auto"
      />
    </SidebarContent>
    <SidebarFooter>
      <NavUser
        :user="navUser"
        @logout="onLogout"
      />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
