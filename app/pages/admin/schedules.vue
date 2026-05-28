<script setup lang="ts">
// Doctor schedules admin -- two DataTables, one per tab. The "Weekly"
// tab manages recurring slot blocks; the "Exceptions" tab manages
// date-based overrides (full-day blocks or extra sessions). Doctor
// filter lives in each table's custom-filters slot rather than at the
// page level so each tab's toolbar is self-contained.
import { h } from 'vue'
import type { Component } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { CalendarDays, MoreHorizontal, Plus } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdvanceSelect } from '@/components/ui/advance-select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Doctor schedules · Admin' })

// ── composables ───────────────────────────────────────────────────────────────

const state = useMockState()

// ── types ─────────────────────────────────────────────────────────────────────

interface DoctorSchedule {
  id: string
  doctorUserId: number
  facilityId: string
  weekday: number // 0 = Sunday … 6 = Saturday
  startTime: string // HH:MM
  endTime: string // HH:MM
  slotMins: number
  active: boolean
}

interface ScheduleException {
  id: string
  doctorUserId: number
  date: string // YYYY-MM-DD
  startTime?: string // blank = whole day
  endTime?: string
  type: 'block' | 'extra'
  reason?: string
}

// ── constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60]

// Adapter for DataTableColumnHeader. The component's TData/TValue inference
// loses through Vue's render function — a thin cast on the import keeps the
// column defs clean without `as any` per-call.
const ColHeader = DataTableColumnHeader as unknown as Component

// ── reactive state ────────────────────────────────────────────────────────────

// Local page state -- no doctorSchedules in global mock state.
const schedules = ref<DoctorSchedule[]>([
  {
    id: 'sch-001',
    doctorUserId: 101,
    facilityId: 'fac-001',
    weekday: 1,
    startTime: '09:00',
    endTime: '13:00',
    slotMins: 15,
    active: true,
  },
  {
    id: 'sch-002',
    doctorUserId: 101,
    facilityId: 'fac-001',
    weekday: 3,
    startTime: '09:00',
    endTime: '13:00',
    slotMins: 15,
    active: true,
  },
  {
    id: 'sch-003',
    doctorUserId: 102,
    facilityId: 'fac-001',
    weekday: 2,
    startTime: '14:00',
    endTime: '18:00',
    slotMins: 20,
    active: true,
  },
  {
    id: 'sch-004',
    doctorUserId: 102,
    facilityId: 'fac-001',
    weekday: 4,
    startTime: '14:00',
    endTime: '17:00',
    slotMins: 20,
    active: false,
  },
  {
    id: 'sch-005',
    doctorUserId: 103,
    facilityId: 'fac-001',
    weekday: 1,
    startTime: '08:00',
    endTime: '12:00',
    slotMins: 10,
    active: true,
  },
])

const exceptions = ref<ScheduleException[]>([
  {
    id: 'exc-001',
    doctorUserId: 101,
    date: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    type: 'block',
    reason: 'Conference leave',
  },
  {
    id: 'exc-002',
    doctorUserId: 102,
    date: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '11:00',
    type: 'extra',
    reason: 'Extra OPD session',
  },
])

// Doctor filter -- lives in both DataTable toolbars via the custom-filters
// slot. `undefined` means "all doctors"; otherwise the string id of a doctor.
const doctorFilter = ref<string | undefined>()

const schDialogOpen = ref(false)
const editingSch = ref<DoctorSchedule | null>(null)

const schForm = reactive({
  doctorUserId: '',
  weekday: '1',
  startTime: '09:00',
  endTime: '13:00',
  slotMins: '15',
  facilityId: 'fac-001',
})

const excDialogOpen = ref(false)
const editingExc = ref<ScheduleException | null>(null)

const excForm = reactive({
  doctorUserId: '',
  date: '',
  startTime: '',
  endTime: '',
  type: 'block' as 'block' | 'extra',
  reason: '',
})

// ── computed ──────────────────────────────────────────────────────────────────

const doctors = computed(() => state.staff.filter(u => u.role === 'doctor'))

const facilities = computed(() => [state.facility])

const doctorOptions = computed(() =>
  doctors.value.map(d => ({ value: String(d.id), label: d.name })),
)

const filteredSchedules = computed(() =>
  doctorFilter.value
    ? schedules.value.filter(s => String(s.doctorUserId) === doctorFilter.value)
    : schedules.value,
)

const filteredExceptions = computed(() =>
  doctorFilter.value
    ? exceptions.value.filter(e => String(e.doctorUserId) === doctorFilter.value)
    : exceptions.value,
)

const canSaveSch = computed(
  () => !!schForm.doctorUserId && !!schForm.startTime && !!schForm.endTime && !!schForm.facilityId,
)
const canSaveExc = computed(() => !!excForm.doctorUserId && !!excForm.date)

// ── functions ─────────────────────────────────────────────────────────────────

function doctorName(doctorUserId: number) {
  return doctors.value.find(d => d.id === doctorUserId)?.name ?? '—'
}

function openAddSch() {
  editingSch.value = null
  // Default to the filtered doctor if one is set, else the first doctor.
  schForm.doctorUserId = doctorFilter.value ?? String(doctors.value[0]?.id ?? '')
  schForm.weekday = '1'
  schForm.startTime = '09:00'
  schForm.endTime = '13:00'
  schForm.slotMins = '15'
  schForm.facilityId = state.facility.id
  schDialogOpen.value = true
}

function openEditSch(sch: DoctorSchedule) {
  editingSch.value = sch
  schForm.doctorUserId = String(sch.doctorUserId)
  schForm.weekday = String(sch.weekday)
  schForm.startTime = sch.startTime
  schForm.endTime = sch.endTime
  schForm.slotMins = String(sch.slotMins)
  schForm.facilityId = sch.facilityId
  schDialogOpen.value = true
}

function saveSch() {
  if (editingSch.value) {
    const idx = schedules.value.findIndex(s => s.id === editingSch.value!.id)
    const existing = idx !== -1 ? schedules.value[idx] : undefined
    if (existing) {
      schedules.value[idx] = {
        id: existing.id,
        doctorUserId: Number(schForm.doctorUserId),
        active: existing.active,
        weekday: Number(schForm.weekday),
        startTime: schForm.startTime,
        endTime: schForm.endTime,
        slotMins: Number(schForm.slotMins),
        facilityId: schForm.facilityId,
      }
    }
  }
  else {
    schedules.value.push({
      id: `sch-${Date.now()}`,
      doctorUserId: Number(schForm.doctorUserId),
      facilityId: schForm.facilityId,
      weekday: Number(schForm.weekday),
      startTime: schForm.startTime,
      endTime: schForm.endTime,
      slotMins: Number(schForm.slotMins),
      active: true,
    })
  }
  schDialogOpen.value = false
}

function deleteSch(id: string) {
  schedules.value = schedules.value.filter(s => s.id !== id)
}

function openAddExc() {
  editingExc.value = null
  excForm.doctorUserId = doctorFilter.value ?? String(doctors.value[0]?.id ?? '')
  excForm.date = ''
  excForm.startTime = ''
  excForm.endTime = ''
  excForm.type = 'block'
  excForm.reason = ''
  excDialogOpen.value = true
}

function openEditExc(exc: ScheduleException) {
  editingExc.value = exc
  excForm.doctorUserId = String(exc.doctorUserId)
  excForm.date = exc.date
  excForm.startTime = exc.startTime ?? ''
  excForm.endTime = exc.endTime ?? ''
  excForm.type = exc.type
  excForm.reason = exc.reason ?? ''
  excDialogOpen.value = true
}

function saveExc() {
  if (editingExc.value) {
    const idx = exceptions.value.findIndex(e => e.id === editingExc.value!.id)
    const existing = idx !== -1 ? exceptions.value[idx] : undefined
    if (existing) {
      exceptions.value[idx] = {
        id: existing.id,
        doctorUserId: Number(excForm.doctorUserId),
        date: excForm.date,
        startTime: excForm.startTime || undefined,
        endTime: excForm.endTime || undefined,
        type: excForm.type,
        reason: excForm.reason || undefined,
      }
    }
  }
  else {
    exceptions.value.push({
      id: `exc-${Date.now()}`,
      doctorUserId: Number(excForm.doctorUserId),
      date: excForm.date,
      startTime: excForm.startTime || undefined,
      endTime: excForm.endTime || undefined,
      type: excForm.type,
      reason: excForm.reason || undefined,
    })
  }
  excDialogOpen.value = false
}

function deleteExc(id: string) {
  exceptions.value = exceptions.value.filter(e => e.id !== id)
}

// ── columns: weekly schedule ───────────────────────────────────────────────────

const scheduleColumns: ColumnDef<DoctorSchedule>[] = [
  {
    id: 'doctor',
    accessorFn: row => doctorName(row.doctorUserId),
    header: ({ column }) => h(ColHeader, { column, label: 'Doctor' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm font-medium' }, doctorName(row.original.doctorUserId)),
  },
  {
    accessorKey: 'weekday',
    header: ({ column }) => h(ColHeader, { column, label: 'Weekday' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, WEEKDAYS[row.original.weekday] ?? '—'),
    size: 120,
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => h(ColHeader, { column, label: 'Start' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, row.original.startTime),
    size: 90,
  },
  {
    accessorKey: 'endTime',
    header: ({ column }) => h(ColHeader, { column, label: 'End' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, row.original.endTime),
    size: 90,
  },
  {
    accessorKey: 'slotMins',
    header: ({ column }) => h(ColHeader, { column, label: 'Slot mins' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, `${row.original.slotMins} min`),
    size: 110,
  },
  {
    id: 'facility',
    header: 'Facility',
    cell: () => h('span', { class: 'text-muted-foreground text-sm' }, state.facility.name),
    enableSorting: false,
  },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': row.original.active,
        'onUpdate:checked': (v: boolean) => {
          const target = schedules.value.find(s => s.id === row.original.id)
          if (target) target.active = v
        },
      }),
    enableSorting: false,
    size: 80,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const sch = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEditSch(sch) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteSch(sch.id) },
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

// ── columns: exceptions ────────────────────────────────────────────────────────

const exceptionColumns: ColumnDef<ScheduleException>[] = [
  {
    id: 'doctor',
    accessorFn: row => doctorName(row.doctorUserId),
    header: ({ column }) => h(ColHeader, { column, label: 'Doctor' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm font-medium' }, doctorName(row.original.doctorUserId)),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => h(ColHeader, { column, label: 'Date' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, formatDate(row.original.date)),
    size: 140,
  },
  {
    id: 'window',
    header: 'Time window',
    cell: ({ row }) => {
      const exc = row.original
      if (exc.startTime && exc.endTime) {
        return h('span', { class: 'text-sm tabular-nums' }, `${exc.startTime} – ${exc.endTime}`)
      }
      return h('span', { class: 'text-muted-foreground text-sm' }, 'All day')
    },
    enableSorting: false,
    size: 140,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => h(ColHeader, { column, label: 'Type' }),
    cell: ({ row }) =>
      h(
        Badge,
        {
          variant: row.original.type === 'block' ? 'destructive' : 'secondary',
          class: 'capitalize text-xs',
        },
        () => row.original.type,
      ),
    size: 110,
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground max-w-[240px] truncate text-sm' },
        row.original.reason ?? '—',
      ),
    enableSorting: false,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const exc = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEditExc(exc) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteExc(exc.id) },
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
        title="Doctor schedules"
        description="Manage weekly recurring schedules and one-off exceptions."
      />
      <template #actions>
        <Button
          size="sm"
          class="gap-2"
          @click="openAddSch"
        >
          <Plus class="size-4" />
          Add weekly slot
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="gap-2"
          @click="openAddExc"
        >
          <Plus class="size-4" />
          Add exception
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <Tabs default-value="weekly">
        <TabsList class="mb-4">
          <TabsTrigger value="weekly">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="exceptions">
            Exceptions
          </TabsTrigger>
        </TabsList>

        <!-- Weekly schedule tab -->
        <TabsContent value="weekly">
          <DataTable
            :columns="scheduleColumns"
            :data="filteredSchedules"
            filter-column="doctor"
            filter-placeholder="Search by doctor…"
            filter-mode="inline"
            sticky-header
            max-height="70vh"
          >
            <template #custom-filters>
              <AdvanceSelect
                v-model="doctorFilter"
                :options="doctorOptions"
                mode="single"
                show-search
                allow-clear
                placeholder="All doctors"
                class="h-9 w-60 shrink-0"
              />
            </template>

            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays class="size-8 opacity-50" />
                <span class="text-sm">No weekly slots configured.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>

        <!-- Exceptions tab -->
        <TabsContent value="exceptions">
          <DataTable
            :columns="exceptionColumns"
            :data="filteredExceptions"
            filter-column="doctor"
            filter-placeholder="Search by doctor…"
            filter-mode="inline"
            sticky-header
            max-height="70vh"
          >
            <template #custom-filters>
              <AdvanceSelect
                v-model="doctorFilter"
                :options="doctorOptions"
                mode="single"
                show-search
                allow-clear
                placeholder="All doctors"
                class="h-9 w-60 shrink-0"
              />
            </template>

            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays class="size-8 opacity-50" />
                <span class="text-sm">No exceptions configured.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>
      </Tabs>
    </PageBody>

    <!-- Add/edit schedule dialog -->
    <Dialog v-model:open="schDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingSch ? 'Edit weekly slot' : 'Add weekly slot' }}</DialogTitle>
          <DialogDescription>Define a recurring weekly slot block.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="sch-doctor">Doctor <span class="text-destructive">*</span></Label>
            <Select v-model="schForm.doctorUserId">
              <SelectTrigger id="sch-doctor">
                <SelectValue placeholder="Doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="doc in doctors"
                  :key="doc.id"
                  :value="String(doc.id)"
                >
                  {{ doc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="sch-weekday">Weekday <span class="text-destructive">*</span></Label>
            <Select v-model="schForm.weekday">
              <SelectTrigger id="sch-weekday">
                <SelectValue placeholder="Weekday" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="(day, idx) in WEEKDAYS"
                  :key="idx"
                  :value="String(idx)"
                >
                  {{ day }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="sch-start">Start time <span class="text-destructive">*</span></Label>
              <Input
                id="sch-start"
                v-model="schForm.startTime"
                type="time"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="sch-end">End time <span class="text-destructive">*</span></Label>
              <Input
                id="sch-end"
                v-model="schForm.endTime"
                type="time"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="sch-slot">Slot duration <span class="text-destructive">*</span></Label>
            <Select v-model="schForm.slotMins">
              <SelectTrigger id="sch-slot">
                <SelectValue placeholder="Slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="mins in SLOT_OPTIONS"
                  :key="mins"
                  :value="String(mins)"
                >
                  {{ mins }} min
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="sch-facility">Facility <span class="text-destructive">*</span></Label>
            <Select v-model="schForm.facilityId">
              <SelectTrigger id="sch-facility">
                <SelectValue placeholder="Facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="fac in facilities"
                  :key="fac.id"
                  :value="fac.id"
                >
                  {{ fac.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!canSaveSch"
            @click="saveSch"
          >
            {{ editingSch ? 'Save changes' : 'Add slot' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add/edit exception dialog -->
    <Dialog v-model:open="excDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingExc ? 'Edit exception' : 'Add exception' }}</DialogTitle>
          <DialogDescription>Block or add an extra session for a specific date.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="exc-doctor">Doctor <span class="text-destructive">*</span></Label>
            <Select v-model="excForm.doctorUserId">
              <SelectTrigger id="exc-doctor">
                <SelectValue placeholder="Doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="doc in doctors"
                  :key="doc.id"
                  :value="String(doc.id)"
                >
                  {{ doc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="exc-date">Date <span class="text-destructive">*</span></Label>
            <Input
              id="exc-date"
              v-model="excForm.date"
              type="date"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="exc-start">Start (optional)</Label>
              <Input
                id="exc-start"
                v-model="excForm.startTime"
                type="time"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="exc-end">End (optional)</Label>
              <Input
                id="exc-end"
                v-model="excForm.endTime"
                type="time"
              />
            </div>
          </div>

          <p class="text-muted-foreground text-xs">
            Leave time blank to apply to the whole day.
          </p>

          <div class="space-y-1.5">
            <Label for="exc-type">Type <span class="text-destructive">*</span></Label>
            <Select v-model="excForm.type">
              <SelectTrigger id="exc-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">
                  Block (unavailable)
                </SelectItem>
                <SelectItem value="extra">
                  Extra session
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="exc-reason">Reason</Label>
            <Textarea
              id="exc-reason"
              v-model="excForm.reason"
              placeholder="e.g. Conference leave, CME, extra OPD…"
              class="resize-none"
              rows="2"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!canSaveExc"
            @click="saveExc"
          >
            {{ editingExc ? 'Save changes' : 'Add exception' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
