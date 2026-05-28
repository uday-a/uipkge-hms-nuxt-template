<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { ChevronRight } from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

const props = defineProps<{
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}>()

const { t } = useI18n()
const route = useRoute()

function isItemActive(item: typeof props.items[number]): boolean {
  if (item.items?.length) {
    return item.url === route.path || item.items.some(sub => sub.url === route.path)
  }
  return item.url === route.path
}

// Collapsible open states — initialized on mount so SSR and client agree
// during hydration (both start closed), then client opens active groups.
const openGroups = ref<Record<string, boolean>>({})
onMounted(() => {
  props.items.forEach((item) => {
    openGroups.value[item.title] = isItemActive(item)
  })
})
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>{{ t('nav.groups.platform') }}</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :open="openGroups[item.title] ?? false"
        @update:open="(v: boolean) => openGroups[item.title] = v"
      >
        <SidebarMenuItem>
          <SidebarMenuButton
            as-child
            :tooltip="item.title"
            :is-active="isItemActive(item)"
          >
            <NuxtLink :to="item.url">
              <component :is="item.icon" />
              <span>{{ item.title }}</span>
            </NuxtLink>
          </SidebarMenuButton>
          <template v-if="item.items?.length">
            <CollapsibleTrigger as-child>
              <SidebarMenuAction class="data-[state=open]:rotate-90">
                <ChevronRight />
                <span class="sr-only">{{ t('nav.actions.toggle') }}</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="subItem in item.items"
                  :key="subItem.title"
                >
                  <SidebarMenuSubButton
                    as-child
                    :is-active="subItem.url === route.path"
                  >
                    <NuxtLink :to="subItem.url">
                      <span>{{ subItem.title }}</span>
                    </NuxtLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </template>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
