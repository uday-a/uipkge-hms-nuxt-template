<script setup lang="ts">
// Appointments list -- TanStack DataTable with sort, multiselect filters
// on doctor + status, pagination, and per-row actions. The date input is
// page-scoped (not a column filter) because it controls which appointments
// are loaded at all rather than narrowing already-loaded rows.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { MoreHorizontal, Plus, Stethoscope } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdvanceSelect } from '@/components/ui/advance-select'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Appointments' })

const state = useMockState()

type Appointment = (typeof state.appointments)[number]
type ApptStatus = Appointment['status']

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

// Inclusive ISO-date range. `null` means "all dates" -- the user hasn't
// picked a range yet. Defaults to today only so the page lands on a
// meaningful slice instead of dumping the full appointment book.
const today = new Date().toISOString().slice(0, 10)
const dateRange = ref<{ start: string, end: string } | null>({ start: today, end: today })
const doctorId = ref<string | undefined>()
const status = ref<string>('_all')

// All three filters are page-level: they narrow the data set before
// DataTable sees it.
const scoped = computed(() =>
  state.appointments
    .filter((a) => {
      const d = new Date(a.scheduledAt).toISOString().slice(0, 10)
      if (dateRange.value) {
        if (d < dateRange.value.start || d > dateRange.value.end) return false
      }
      if (doctorId.value && a.doctorUserId !== Number(doctorId.value)) return false
      if (status.value !== '_all' && a.status !== status.value) return false
      return true
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
)

const doctorOptions = computed(() =>
  doctors.value.map(d => ({ value: String(d.id), label: d.name })),
)

const doctors = computed(() => state.staff.filter(s => s.role === 'doctor'))

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function doctorById(id: number) {
  return state.staff.find(s => s.id === id)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function statusVariant(status: ApptStatus): BadgeVariant {
  if (status === 'completed') return 'default'
  if (status === 'arrived') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function statusLabel(status: ApptStatus) {
  return status.replace('_', ' ')
}

function canMarkArrived(status: ApptStatus) {
  return status === 'booked'
}

function canCancel(status: ApptStatus) {
  return status !== 'completed' && status !== 'cancelled' && status !== 'no_show'
}

function markArrived(apptId: string) {
  const appt = state.appointments.find(a => a.id === apptId)
  if (!appt) return
  const dayStr = new Date(appt.scheduledAt).toISOString().slice(0, 10)
  const sameDay = state.appointments.filter((a) => {
    const d = new Date(a.scheduledAt).toISOString().slice(0, 10)
    return d === dayStr && a.doctorUserId === appt.doctorUserId && a.tokenNumber != null
  })
  const maxToken = sameDay.reduce((m, a) => Math.max(m, a.tokenNumber ?? 0), 0)
  appt.tokenNumber = maxToken + 1
  appt.status = 'arrived'
  const encId = `enc-auto-${Date.now()}`
  state.encounters.push({
    id: encId,
    patientId: appt.patientId,
    facilityId: appt.facilityId,
    type: 'outpatient',
    status: 'arrived',
    attendingUserId: appt.doctorUserId,
    admissionAt: new Date().toISOString(),
    reasonChiefComplaint: appt.reasonNote,
    appointmentId: appt.id,
  })
  appt.encounterId = encId
}

function cancelAppt(apptId: string) {
  const appt = state.appointments.find(a => a.id === apptId)
  if (appt) appt.status = 'cancelled'
}

const columns: ColumnDef<Appointment>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? 'indeterminate' : false),
        'onUpdate:modelValue': (v: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!v),
        'aria-label': 'Select all',
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (v: boolean | 'indeterminate') => row.toggleSelected(!!v),
        'aria-label': 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Time' }),
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground text-sm font-medium tabular-nums' }, formatTime(row.original.scheduledAt)),
    size: 90,
  },
  {
    id: 'token',
    accessorFn: row => row.tokenNumber ?? -1,
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Token #' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground text-sm tabular-nums' },
        row.original.tokenNumber != null ? `#${row.original.tokenNumber}` : '—',
      ),
    size: 80,
  },
  {
    id: 'patient',
    accessorFn: (row) => {
      const p = state.patients.find(pp => pp.id === row.patientId)
      return p ? `${p.givenName} ${p.familyName}` : row.patientId
    },
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Patient' }),
    cell: ({ row }) => {
      const p = patientById(row.original.patientId)
      if (!p) return h('span', { class: 'text-muted-foreground text-xs' }, row.original.patientId)
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h(Avatar, { class: 'size-7' }, () =>
          h(AvatarFallback, { class: 'bg-primary/10 text-primary text-[10px] font-semibold' }, () =>
            initials(`${p.givenName} ${p.familyName}`),
          ),
        ),
        h('div', {}, [
          h('p', { class: 'text-sm font-medium' }, `${p.givenName} ${p.familyName}`),
          h('p', { class: 'text-muted-foreground text-xs' }, p.mrn),
        ]),
      ])
    },
  },
  {
    id: 'doctor',
    accessorFn: row => String(row.doctorUserId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Doctor' }),
    cell: ({ row }) => {
      const d = doctorById(row.original.doctorUserId)
      return d
        ? h('span', { class: 'text-sm' }, d.name)
        : h('span', { class: 'text-muted-foreground text-sm' }, '—')
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Status' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: statusVariant(row.original.status), class: 'capitalize text-xs' },
        () => statusLabel(row.original.status),
      ),
    size: 120,
  },
  {
    accessorKey: 'reasonNote',
    header: 'Reason',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground truncate text-sm' }, row.original.reasonNote ?? '—'),
    enableSorting: false,
    size: 200,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const appt = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            canMarkArrived(appt.status)
              ? h(DropdownMenuItem, { onSelect: () => markArrived(appt.id) }, () => 'Mark arrived')
              : null,
            appt.encounterId
              ? h(DropdownMenuItem, { asChild: true }, () =>
                  h(resolveComponent('NuxtLink'), { to: `/encounters/${appt.encounterId}` }, () => 'Open encounter'),
                )
              : null,
            canCancel(appt.status)
              ? h(
                  DropdownMenuItem,
                  { class: 'text-destructive focus:text-destructive', onSelect: () => cancelAppt(appt.id) },
                  () => 'Cancel',
                )
              : null,
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
        title="Appointments"
        description="View and manage all scheduled appointments."
      />
      <template #actions>
        <Button
          as-child
          size="sm"
          class="gap-2"
        >
          <NuxtLink to="/appointments/new">
            <Plus class="size-4" />
            Book appointment
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="scoped"
        filter-column="patient"
        filter-placeholder="Search by patient…"
        filter-mode="inline"
        sticky-header
        max-height="70vh"
      >
        <!-- Three page-scoped dropdowns live in the toolbar next to the
             search input. They narrow `scoped` before DataTable sees it,
             so DataTable's own filter-popover plumbing stays unused. -->
        <template #custom-filters>
          <DatePicker
            v-model="dateRange"
            type="range"
            placeholder="All dates"
            locale="en-GB"
            :format="{ day: '2-digit', month: '2-digit', year: 'numeric' }"
            class="h-9 w-72 shrink-0"
          />

          <AdvanceSelect
            v-model="doctorId"
            :options="doctorOptions"
            mode="single"
            placeholder="All doctors"
            show-search
            allow-clear
            class="h-9 w-60 shrink-0"
          />

          <Select v-model="status">
            <SelectTrigger class="h-9 w-40 shrink-0">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">
                All statuses
              </SelectItem>
              <SelectItem value="booked">
                Booked
              </SelectItem>
              <SelectItem value="arrived">
                Arrived
              </SelectItem>
              <SelectItem value="completed">
                Completed
              </SelectItem>
              <SelectItem value="cancelled">
                Cancelled
              </SelectItem>
              <SelectItem value="no_show">
                No show
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <Stethoscope class="text-muted-foreground size-10 opacity-40" />
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                No appointments found
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                Try a different date range or doctor filter
              </p>
            </div>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
