<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { LayoutDashboard, FileText, Inbox, Settings, Users, KanbanSquare, Search } from 'lucide-vue-next'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

export interface CommandPaletteItem {
  label: string
  value?: string
  hint?: string
  icon?: Component
  onSelect?: () => void
}

export interface CommandPaletteGroup {
  heading: string
  items: CommandPaletteItem[]
}

const props = withDefaults(
  defineProps<{
    groups?: CommandPaletteGroup[]
    placeholder?: string
    triggerLabel?: string
    showTrigger?: boolean
  }>(),
  {
    placeholder: 'Search pages, commands…',
    triggerLabel: 'Search pages, commands…',
    showTrigger: true,
    groups: () => [
      {
        heading: 'Navigate',
        items: [
          { label: 'Dashboard', hint: '/dashboard', icon: LayoutDashboard },
          { label: 'Messages', hint: '/dashboard/messages', icon: Inbox },
          { label: 'Kanban', hint: '/dashboard/kanban', icon: KanbanSquare },
          { label: 'Team', hint: '/settings/team', icon: Users },
        ],
      },
      {
        heading: 'Settings',
        items: [
          { label: 'General', hint: '/settings/general', icon: FileText },
          { label: 'Settings', hint: '/settings', icon: Settings },
        ],
      },
    ],
  },
)

const emit = defineEmits<{
  (e: 'select', item: CommandPaletteItem): void
}>()

const open = ref(false)

function show() {
  open.value = true
}

function hide() {
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function pick(item: CommandPaletteItem) {
  hide()
  item.onSelect?.()
  emit('select', item)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    toggle()
  }
}

// Default to '⌘K' during SSR/hydration so the server and client render the
// same text node. After mount we detect the real platform and flip if needed.
const isMac = ref(true)
if (import.meta.client) {
  onMounted(() => {
    isMac.value = /Mac|iPhone|iPad/i.test(navigator.platform)
  })
}
const triggerShortcut = computed(() => (isMac.value ? '⌘K' : 'Ctrl K'))

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ show, hide, toggle })
</script>

<template>
  <Button
    v-if="showTrigger"
    variant="secondary"
    size="sm"
    class="relative hidden h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-sm shadow-none sm:flex md:w-[220px] lg:w-[300px]"
    aria-label="Open command palette"
    @click="show"
  >
    <Search class="size-3.5 shrink-0" />
    <span class="flex-1 truncate text-left">{{ triggerLabel }}</span>
    <kbd
      class="bg-muted/80 text-muted-foreground pointer-events-none flex h-5 items-center justify-center rounded-md border px-1.5 font-mono text-[10px] font-medium"
    >
      <span>{{ triggerShortcut }}</span>
    </kbd>
  </Button>

  <CommandDialog
    v-model:open="open"
    title="Command palette"
    description="Search pages and run commands"
  >
    <CommandInput :placeholder="placeholder" />
    <CommandList class="max-h-[480px]">
      <CommandEmpty>No matches.</CommandEmpty>
      <template
        v-for="(group, gi) in groups"
        :key="group.heading"
      >
        <CommandGroup :heading="group.heading">
          <CommandItem
            v-for="item in group.items"
            :key="`${group.heading}-${item.label}`"
            :value="`${group.heading} ${item.label} ${item.hint ?? ''}`"
            @select="pick(item)"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="size-4"
            />
            <span>{{ item.label }}</span>
            <CommandShortcut
              v-if="item.hint"
              class="text-muted-foreground/70"
            >
              {{ item.hint }}
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator v-if="gi < groups.length - 1" />
      </template>
    </CommandList>
  </CommandDialog>
</template>
