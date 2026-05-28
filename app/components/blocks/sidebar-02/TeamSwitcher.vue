<script setup lang="ts">
// Persona switcher — replaces the boilerplate team switcher with the HMS
// seven-persona model. Clicking a persona saves the selection to localStorage
// and navigates to that persona's default dashboard route.
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const { isMobile } = useSidebar()
const { current, set, config, personas, getIconComponent } = usePersona()

function selectPersona(key: typeof personas[number]['key']) {
  const target = personas.find(p => p.key === key)
  set(key)
  if (target) navigateTo(target.defaultRoute)
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!justify-center"
          >
            <div class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-6">
              <component
                :is="getIconComponent(config.icon)"
                class="size-4 group-data-[collapsible=icon]:size-3.5"
              />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span class="truncate font-display font-bold">{{ config.label }}</span>
              <span class="truncate text-xs text-muted-foreground">HMS Persona</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="start"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-muted-foreground text-xs">
            Switch Persona
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="persona in personas"
            :key="persona.key"
            class="gap-2 p-2"
            @select="selectPersona(persona.key)"
          >
            <div class="flex size-6 items-center justify-center rounded-sm border">
              <component
                :is="getIconComponent(persona.icon)"
                class="size-3.5 shrink-0"
              />
            </div>
            {{ persona.label }}
            <Check
              v-if="current === persona.key"
              class="ml-auto size-4"
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
