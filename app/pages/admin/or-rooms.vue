<script setup lang="ts">
// OR Rooms admin -- DataTable list of operating rooms with edit-in-place
// dialog. Single table, no tabs.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus, MoreHorizontal, Scissors } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import type { MockUnit } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'OR Rooms · Admin' })

type OrRoom = MockUnit

const state = useMockState()

const dialogOpen = ref(false)
const editingRoom = ref<OrRoom | null>(null)

const form = reactive({
  facilityId: 'fac-001',
  code: '',
  name: '',
  active: true,
})

const canSave = computed(() => !!form.code.trim() && !!form.name.trim())

const orRooms = computed<OrRoom[]>(() => {
  const ot = state.units.filter(u => u.departmentId === 'dept-ot')
  if (ot.length) return ot
  return [
    { id: 'unit-ot-1', code: 'OT-1', name: 'Operating Room 1', departmentId: 'dept-ot' },
    { id: 'unit-ot-2', code: 'OT-2', name: 'Operating Room 2', departmentId: 'dept-ot' },
  ]
})

const facilities = computed(() => [state.facility])

function openAdd() {
  editingRoom.value = null
  form.facilityId = state.facility.id
  form.code = ''
  form.name = ''
  form.active = true
  dialogOpen.value = true
}

function openEdit(unit: OrRoom) {
  editingRoom.value = unit
  form.facilityId = state.facility.id
  form.code = unit.code
  form.name = unit.name
  form.active = roomIsActive(unit)
  dialogOpen.value = true
}

function saveRoom() {
  if (!canSave.value) return
  if (editingRoom.value) {
    const existing = state.units.find(u => u.id === editingRoom.value!.id)
    if (existing) {
      existing.code = form.code.trim()
      existing.name = form.name.trim()
      const ext = existing as MockUnit & { active?: boolean }
      ext.active = form.active
    }
  }
  else {
    const newRoom: MockUnit & { active?: boolean } = {
      id: `unit-ot-${Date.now()}`,
      departmentId: 'dept-ot',
      code: form.code.trim(),
      name: form.name.trim(),
    }
    newRoom.active = form.active
    state.units.push(newRoom)
  }
  dialogOpen.value = false
}

function deleteRoom(unit: OrRoom) {
  const idx = state.units.findIndex(u => u.id === unit.id)
  if (idx !== -1) state.units.splice(idx, 1)
}

function toggleRoomActive(unit: OrRoom) {
  const idx = state.units.findIndex(u => u.id === unit.id)
  if (idx === -1) return
  const existing = state.units[idx] as MockUnit & { active?: boolean }
  existing.active = existing.active !== undefined ? !existing.active : false
}

function roomIsActive(unit: OrRoom): boolean {
  const u = unit as MockUnit & { active?: boolean }
  return u.active !== undefined ? u.active : true
}

function bookingCount(roomId: string) {
  return state.surgeryBookings.filter(
    b => b.orRoomId === roomId && ['scheduled', 'confirmed', 'in_progress'].includes(b.status),
  ).length
}

const columns: ColumnDef<OrRoom>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Code' }),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.code),
    size: 120,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Name' }),
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.name),
  },
  {
    id: 'facility',
    header: 'Facility',
    cell: () => h('span', { class: 'text-muted-foreground text-sm' }, state.facility.name),
    enableSorting: false,
  },
  {
    id: 'bookings',
    accessorFn: row => bookingCount(row.id),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Active bookings' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, bookingCount(row.original.id)),
    size: 140,
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': roomIsActive(row.original),
        'onUpdate:checked': () => toggleRoomActive(row.original),
      }),
    enableSorting: false,
    size: 80,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const room = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEdit(room) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteRoom(room) },
              () => 'Delete',
            ),
          ]),
        ],
      })
    },
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
]
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="OR Rooms"
        description="Manage operating room configuration."
      />
      <template #actions>
        <Button
          size="sm"
          class="gap-2"
          @click="openAdd"
        >
          <Plus class="size-4" />
          Add OR Room
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="orRooms"
        filter-column="name"
        filter-placeholder="Search by name…"
        sticky-header
        max-height="70vh"
      >
        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Scissors class="size-8 opacity-50" />
            <span class="text-sm">No OR rooms configured.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>

    <!-- Add / Edit dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingRoom ? 'Edit OR Room' : 'Add OR Room' }}</DialogTitle>
          <DialogDescription>
            {{ editingRoom ? 'Update operating room details.' : 'Configure a new operating room.' }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="or-facility">Facility</Label>
            <Select v-model="form.facilityId">
              <SelectTrigger id="or-facility">
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="f in facilities"
                  :key="f.id"
                  :value="f.id"
                >
                  {{ f.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="or-code">Code <span class="text-destructive">*</span></Label>
            <Input
              id="or-code"
              v-model="form.code"
              placeholder="e.g. OT-3"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="or-name">Name <span class="text-destructive">*</span></Label>
            <Input
              id="or-name"
              v-model="form.name"
              placeholder="e.g. Operating Room 3"
            />
          </div>
          <div class="flex items-center gap-3">
            <Switch
              id="or-active"
              :checked="form.active"
              @update:checked="(v: boolean) => form.active = v"
            />
            <Label for="or-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!canSave"
            @click="saveRoom"
          >
            {{ editingRoom ? 'Save changes' : 'Add room' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
