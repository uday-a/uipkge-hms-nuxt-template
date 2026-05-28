<script setup lang="ts">
// OT page — three view modes:
//   Daily:   time-grid with OR rooms as columns (06:00–22:00).
//   Weekly:  time-grid with Mon–Sun as columns, all rooms in one day.
//   Monthly: month grid with day cells showing surgery dots/counts.
//
// Plus a flat List tab (DataTable) for bulk search/filter.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  Plus,
  Scissors,
  Building2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Play,
  CheckCircle,
  XCircle,
  CalendarClock,
  Trash2,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdvanceSelect } from '@/components/ui/advance-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { formatDate, formatTime } from '@/utils/format-date'
import { resetMockState } from '@/composables/useMockState'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'OT Calendar' })

const state = useMockState()

/* ── types ──────────────────────────────────────────────────────────────── */
type SurgeryBooking = (typeof state.surgeryBookings)[number]
type BookingStatus = SurgeryBooking['status']
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
type ViewMode = 'daily' | 'weekly' | 'monthly'

/* ── helpers ────────────────────────────────────────────────────────────── */
function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function staffName(userId?: number) {
  if (!userId) return '—'
  return state.staff.find(s => s.id === userId)?.name ?? `User #${userId}`
}

function statusVariant(status: BookingStatus): BadgeVariant {
  if (status === 'scheduled') return 'outline'
  if (status === 'confirmed') return 'secondary'
  if (status === 'in_progress') return 'default'
  if (status === 'completed') return 'default'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function statusLabel(status: string) {
  return status.replace('_', ' ')
}

function roomById(id: string) {
  return state.units.find(u => u.id === id) ?? orRooms.value.find(r => r.id === id)
}

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function isoDateOf(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function endTimeOf(booking: SurgeryBooking) {
  const d = new Date(booking.scheduledAt)
  d.setMinutes(d.getMinutes() + booking.estimatedMinutes)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function hasRoomOverlap(roomId: string) {
  const bs = bookingsForRoom(roomId)
  for (let i = 0; i < bs.length; i++) {
    const a = bs[i]
    if (!a) continue
    const aStart = new Date(a.scheduledAt).getTime()
    const aEnd = aStart + a.estimatedMinutes * 60000
    for (let j = i + 1; j < bs.length; j++) {
      const b = bs[j]
      if (b && new Date(b.scheduledAt).getTime() < aEnd) return true
    }
  }
  return false
}

// ── Context menu actions (Teams / Google Calendar style – live update the grid)
function startSurgery(booking: SurgeryBooking) {
  if (!['scheduled', 'confirmed'].includes(booking.status)) return
  booking.status = 'in_progress'
  booking.startedAt = new Date().toISOString()
}

function completeSurgery(booking: SurgeryBooking) {
  if (booking.status !== 'in_progress') return
  booking.status = 'completed'
  booking.endedAt = new Date().toISOString()
}

function cancelSurgery(booking: SurgeryBooking) {
  if (['completed', 'cancelled'].includes(booking.status)) return
  booking.status = 'cancelled'
}

function deleteBooking(booking: SurgeryBooking) {
  const idx = state.surgeryBookings.findIndex(b => b.id === booking.id)
  if (idx !== -1) state.surgeryBookings.splice(idx, 1)
}

function openBooking(booking: SurgeryBooking) {
  navigateTo(`/ot/bookings/${booking.id}`)
}

function rescheduleBooking(booking: SurgeryBooking) {
  navigateTo(`/ot/bookings/${booking.id}`)
}

/**
 * POC / Client demo helper.
 * Because there is no backend, all mutations live in localStorage.
 * This lets presenters quickly return the OT calendar to a pristine state
 * before showing the next client or stakeholder.
 */
function resetOtDemo() {
  resetMockState()
  // Force a full reload so the page re-seeds from the static mocks cleanly
  window.location.reload()
}

/* ── OR rooms ───────────────────────────────────────────────────────────── */
const orRooms = computed(() => {
  const ot = state.units.filter(u => u.departmentId === 'dept-ot')
  if (ot.length) return ot
  return [
    { id: 'unit-ot-1', code: 'OT-1', name: 'Operating Room 1', departmentId: 'dept-ot' },
    { id: 'unit-ot-2', code: 'OT-2', name: 'Operating Room 2', departmentId: 'dept-ot' },
  ]
})

const facilities = computed(() => [state.facility])

/* ── Shared calendar constants ──────────────────────────────────────────── */
const START_HOUR = 6
const END_HOUR = 22
const PX_PER_HOUR = 56
const TOTAL_HOURS = END_HOUR - START_HOUR
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR
const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

/* ── View mode + date state ─────────────────────────────────────────────── */
const viewMode = ref<ViewMode>('daily')
const todayStr = new Date().toISOString().slice(0, 10)
const date = ref(todayStr) // pivot date for daily / weekly / monthly
const facilityId = ref('_all')

function shiftDate(days: number) {
  const d = new Date(date.value + 'T00:00:00')
  d.setDate(d.getDate() + days)
  date.value = d.toISOString().slice(0, 10)
}

/* ── Week helpers ───────────────────────────────────────────────────────── */
function getMonday(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function shiftWeek(days: number) {
  const d = new Date(date.value + 'T00:00:00')
  d.setDate(d.getDate() + days)
  date.value = d.toISOString().slice(0, 10)
}

const weekStart = computed(() => getMonday(date.value))
const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value + 'T00:00:00')
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    days.push({
      iso,
      name: d.toLocaleDateString('en', { weekday: 'short' }),
      fullName: d.toLocaleDateString('en', { weekday: 'long' }),
      dayOfMonth: d.getDate(),
      month: d.toLocaleDateString('en', { month: 'short' }),
      bookings: dayBookings(iso),
      isToday: iso === todayStr,
    })
  }
  return days
})

/* ── Month helpers ──────────────────────────────────────────────────────── */
function shiftMonth(months: number) {
  const d = new Date(date.value + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  date.value = d.toISOString().slice(0, 10)
}

const monthLabel = computed(() => {
  const d = new Date(date.value + 'T00:00:00')
  return d.toLocaleDateString('en', { month: 'long', year: 'numeric' })
})

const monthDays = computed(() => {
  const pivot = new Date(date.value + 'T00:00:00')
  const year = pivot.getFullYear()
  const month = pivot.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-start offset
  let offset = firstDay.getDay() - 1
  if (offset < 0) offset = 6

  const days: { iso: string, dayOfMonth: number, isCurrentMonth: boolean, isToday: boolean, bookings: SurgeryBooking[] }[] = []

  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    const iso = d.toISOString().slice(0, 10)
    days.push({ iso, dayOfMonth: d.getDate(), isCurrentMonth: false, isToday: iso === todayStr, bookings: dayBookings(iso) })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d)
    const iso = dt.toISOString().slice(0, 10)
    days.push({ iso, dayOfMonth: d, isCurrentMonth: true, isToday: iso === todayStr, bookings: dayBookings(iso) })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    const iso = d.toISOString().slice(0, 10)
    days.push({ iso, dayOfMonth: d.getDate(), isCurrentMonth: false, isToday: iso === todayStr, bookings: dayBookings(iso) })
  }
  return days
})

const isToday = computed(() => date.value === todayStr)

/* ── Active filter summary (for visibility when data looks filtered) ─────── */
const activeSurgeon = computed(() => {
  if (!calSurgeonId.value) return null
  return surgeons.value.find(s => s.id === Number(calSurgeonId.value))?.name ?? null
})

const activeStatus = computed(() => calStatus.value !== '_all' ? calStatus.value : null)

const hasActiveCalendarFilters = computed(() => {
  return !!calSurgeonId.value || calStatus.value !== '_all' || facilityId.value !== '_all'
})

const filteredCount = computed(() => calFilteredBookings.value.length)

function clearCalendarFilters() {
  calSurgeonId.value = undefined
  calStatus.value = '_all'
  facilityId.value = '_all'
}

/* ── Block styling (shared across daily + weekly) ─────────────────────────── */
function blockStyle(booking: SurgeryBooking) {
  const d = new Date(booking.scheduledAt)
  const hour = d.getUTCHours()
  const minute = d.getUTCMinutes()
  const top = ((hour - START_HOUR) * 60 + minute) * (PX_PER_HOUR / 60)
  const rawHeight = booking.estimatedMinutes * (PX_PER_HOUR / 60)
  const height = Math.min(rawHeight, GRID_HEIGHT - top)
  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(24, height)}px`,
  }
}

function blockClasses(status: BookingStatus) {
  const base = 'rounded-lg border px-3 py-2 text-xs cursor-pointer hover:shadow-lg hover:-translate-y-px transition-all duration-150 overflow-hidden ring-1 ring-inset ring-black/5'
  switch (status) {
    case 'scheduled':
      return `${base} border-l-4 border-l-slate-400 bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100`
    case 'confirmed':
      return `${base} border-l-4 border-l-blue-400 bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100`
    case 'in_progress':
      return `${base} border-l-4 border-l-amber-400 bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100 ring-amber-200`
    case 'completed':
      return `${base} border-l-4 border-l-emerald-400 bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100`
    case 'cancelled':
      return `${base} border-l-4 border-l-red-300 bg-red-50 text-red-800 border-red-200 opacity-70 line-through hover:opacity-80`
    default:
      return `${base} border-l-4 border-l-slate-300 bg-slate-50 text-slate-800 border-slate-200`
  }
}

function statusDotClass(status: BookingStatus) {
  switch (status) {
    case 'scheduled': return 'bg-slate-400'
    case 'confirmed': return 'bg-blue-400'
    case 'in_progress': return 'bg-amber-400'
    case 'completed': return 'bg-emerald-400'
    case 'cancelled': return 'bg-red-400'
    default: return 'bg-slate-400'
  }
}

const currentTimeOffset = computed(() => {
  if (!isToday.value) return null
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  if (hour < START_HOUR || hour > END_HOUR) return null
  return ((hour - START_HOUR) * 60 + minute) * (PX_PER_HOUR / 60)
})

/* ── List tab state ─────────────────────────────────────────────────────── */
// The List tab now reuses the same filtered data (calFilteredBookings) as the Calendar views.
// It only adds its own powerful date range filter on top of the shared calendar filters.
// Default to null (= "show everything that matches the current calendar filters").
// Previously defaulted to "today only", which made the List tab look almost empty
// compared to the visual calendar grids.
const listDateRange = ref<{ start: string, end: string } | null>(null)

const surgeons = computed(() => state.staff.filter(s => s.role === 'doctor'))
const surgeonOptions = computed(() =>
  surgeons.value.map(d => ({ value: String(d.id), label: d.name })),
)

/* ── Calendar filters (surgeon + status filter the grid views; facility narrows rooms) */
const calSurgeonId = ref<string | undefined>()
const calStatus = ref<string>('_all')

/* ── Right-click context menu state (Google/Teams Calendar style on events) */
const contextMenuOpen = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextBooking = ref<SurgeryBooking | null>(null)

function openContextForBooking(e: MouseEvent, booking: SurgeryBooking) {
  e.preventDefault()
  contextBooking.value = booking
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuOpen.value = true
}

function closeContextMenu() {
  contextMenuOpen.value = false
  contextBooking.value = null
}

const calFilteredBookings = computed(() =>
  state.surgeryBookings.filter((b) => {
    if (facilityId.value !== '_all') {
      const room = state.units.find(u => u.id === b.orRoomId)
      if (room && state.facility.id !== facilityId.value) return false
    }
    if (calSurgeonId.value && b.primarySurgeonUserId !== Number(calSurgeonId.value)) return false
    if (calStatus.value !== '_all' && b.status !== calStatus.value) return false
    return true
  }),
)

function dayBookings(iso: string) {
  return calFilteredBookings.value
    .filter(b => isoDateOf(b.scheduledAt) === iso)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

function bookingsForRoom(roomId: string) {
  return calFilteredBookings.value
    .filter((b) => {
      if (b.orRoomId !== roomId) return false
      return isoDateOf(b.scheduledAt) === date.value
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

/* Click empty time slot in daily room grid → prefill /ot/schedule */
function onRoomGridClick(e: MouseEvent, roomId: string) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = e.clientY - rect.top
  let minutes = (y / PX_PER_HOUR) * 60
  minutes = Math.max(0, Math.min(minutes, (END_HOUR - START_HOUR) * 60 - 15))
  minutes = Math.round(minutes / 15) * 15
  const hour = START_HOUR + Math.floor(minutes / 60)
  const min = Math.floor(minutes % 60)
  const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  const qs = new URLSearchParams({ orRoomId: roomId, date: date.value, time: timeStr })
  navigateTo(`/ot/schedule?${qs.toString()}`)
}

// List tab now uses the same filtered base as the Calendar views.
// This ensures the List and the visual calendar (daily/weekly/monthly) always show the same underlying data.
const listScoped = computed<SurgeryBooking[]>(() =>
  calFilteredBookings.value
    .filter((b) => {
      const d = isoDateOf(b.scheduledAt)
      if (listDateRange.value) {
        if (d < listDateRange.value.start || d > listDateRange.value.end) return false
      }
      // Note: facility / surgeon / status filtering is already applied via calFilteredBookings
      return true
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
)

/* ── list columns ───────────────────────────────────────────────────────── */
const listColumns: ColumnDef<SurgeryBooking>[] = [
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Time' }),
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground text-sm font-medium tabular-nums' }, formatTime(row.original.scheduledAt)),
    size: 90,
  },
  {
    id: 'room',
    accessorFn: row => roomById(row.orRoomId)?.code ?? row.orRoomId,
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Room' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, roomById(row.original.orRoomId)?.code ?? row.original.orRoomId),
    size: 100,
  },
  {
    id: 'surgeon',
    accessorFn: row => staffName(row.primarySurgeonUserId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Surgeon' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, staffName(row.original.primarySurgeonUserId)),
  },
  {
    accessorKey: 'procedureName',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Procedure' }),
    cell: ({ row }) => h('span', { class: 'max-w-[260px] truncate text-sm' }, row.original.procedureName),
  },
  {
    id: 'patient',
    accessorFn: (row) => {
      const p = patientById(row.patientId)
      return p ? `${p.givenName} ${p.familyName}` : row.patientId
    },
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Patient' }),
    cell: ({ row }) => {
      const p = patientById(row.original.patientId)
      if (!p) return h('span', { class: 'text-muted-foreground text-xs' }, row.original.patientId)
      const fullName = `${p.givenName} ${p.familyName}`
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h(Avatar, { class: 'size-7' }, () =>
          h(AvatarFallback, { class: 'bg-primary/10 text-primary text-[10px] font-semibold' }, () => initials(fullName)),
        ),
        h('div', {}, [
          h('p', { class: 'text-sm font-medium' }, fullName),
          h('p', { class: 'text-muted-foreground text-xs' }, p.mrn),
        ]),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Status' }),
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant(row.original.status), class: 'capitalize text-xs' }, () => statusLabel(row.original.status)),
    size: 120,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const booking = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () => h(MoreHorizontal, { class: 'size-3.5' })),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { asChild: true }, () =>
              h(resolveComponent('NuxtLink'), { to: `/ot/bookings/${booking.id}` }, () => 'Open booking'),
            ),
            booking.encounterId
              ? h(DropdownMenuItem, { asChild: true }, () =>
                  h(resolveComponent('NuxtLink'), { to: `/encounters/${booking.encounterId}` }, () => 'Open encounter'),
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
      <div class="flex items-center gap-3">
        <PageHeaderHeading
          title="OT Calendar"
          description="Operating theatre schedule by room."
        />
        <Badge variant="outline" class="text-[10px] font-normal px-2 py-0.5 text-muted-foreground self-start mt-1">
          Demo
        </Badge>
      </div>
      <template #actions>
        <Button as-child class="gap-2">
          <NuxtLink to="/ot/schedule">
            <Plus class="size-4" />
            Book surgery
          </NuxtLink>
        </Button>
        <Button variant="outline" as-child class="gap-2">
          <NuxtLink to="/admin/or-rooms">
            <Building2 class="size-4" />
            OR Rooms admin
          </NuxtLink>
        </Button>

        <!-- Demo control — only visible for presenters. Keep this subtle for client demos. -->
        <Button
          variant="ghost"
          size="icon"
          class="size-8 text-muted-foreground hover:text-foreground"
          title="Reset demo data to pristine state (presenter only)"
          @click="resetOtDemo"
        >
          <RefreshCw class="size-4" />
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <Tabs default-value="calendar">
        <TabsList>
          <TabsTrigger value="calendar">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            List
          </TabsTrigger>
        </TabsList>

        <!-- ═══════════════════════════════════════════════════════════════
             CALENDAR TAB  —  daily / weekly / monthly views
             ═══════════════════════════════════════════════════════════════ -->
        <TabsContent value="calendar" class="space-y-4">
          <!-- Toolbar: nav + view-mode toggle -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Date nav -->
            <div class="flex items-center gap-1">
              <Button variant="ghost" size="icon" class="size-8" @click="viewMode === 'monthly' ? shiftMonth(-1) : viewMode === 'weekly' ? shiftWeek(-7) : shiftDate(-1)">
                <ChevronLeft class="size-4" />
              </Button>
              <Button variant="ghost" size="sm" class="h-8 text-xs font-medium" @click="date = todayStr">
                Today
              </Button>
              <Button variant="ghost" size="icon" class="size-8" @click="viewMode === 'monthly' ? shiftMonth(1) : viewMode === 'weekly' ? shiftWeek(7) : shiftDate(1)">
                <ChevronRight class="size-4" />
              </Button>
            </div>

            <!-- View mode toggle -->
            <div class="inline-flex items-center rounded-md border bg-muted p-0.5">
              <button
                v-for="mode in (['daily', 'weekly', 'monthly'] as ViewMode[])"
                :key="mode"
                class="px-3 py-1 text-xs font-medium rounded-sm capitalize transition-colors"
                :class="viewMode === mode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
                @click="viewMode = mode"
              >
                {{ mode }}
              </button>
            </div>

            <Select v-model="facilityId">
              <SelectTrigger class="h-8 w-52 text-xs">
                <SelectValue placeholder="All facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">
                  All facilities
                </SelectItem>
                <SelectItem
                  v-for="f in facilities"
                  :key="f.id"
                  :value="f.id"
                >
                  {{ f.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Calendar-specific filters -->
            <AdvanceSelect
              v-model="calSurgeonId"
              :options="surgeonOptions"
              mode="single"
              placeholder="All surgeons"
              show-search
              allow-clear
              class="h-8 w-52 text-xs"
            />
            <Select v-model="calStatus">
              <SelectTrigger class="h-8 w-36 text-xs">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">
                  All statuses
                </SelectItem>
                <SelectItem value="scheduled">
                  Scheduled
                </SelectItem>
                <SelectItem value="confirmed">
                  Confirmed
                </SelectItem>
                <SelectItem value="in_progress">
                  In progress
                </SelectItem>
                <SelectItem value="completed">
                  Completed
                </SelectItem>
                <SelectItem value="cancelled">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Compact, elegant status legend -->
            <div class="ml-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-slate-400" />
                <span>Scheduled</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-blue-400" />
                <span>Confirmed</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-amber-400" />
                <span>In progress</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-emerald-400" />
                <span>Completed</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-red-400" />
                <span>Cancelled</span>
              </div>
            </div>

            <!-- Date label (pushed to the right end of the toolbar) -->
            <div class="ml-auto flex items-center gap-2 text-sm">
              <CalendarDays class="text-muted-foreground size-4" />
              <span class="font-semibold">
                <template v-if="viewMode === 'daily'">{{ formatDate(date + 'T00:00:00') }}</template>
                <template v-else-if="viewMode === 'weekly'">
                  {{ formatDate(weekStart + 'T00:00:00') }} – {{ formatDate((weekDays[6] ?? weekDays[weekDays.length-1] ?? { iso: date }).iso + 'T00:00:00') }}
                </template>
                <template v-else>{{ monthLabel }}</template>
              </span>
              <Badge v-if="isToday && viewMode === 'daily'" variant="secondary" class="text-[10px]">
                Today
              </Badge>
            </div>
          </div>

          <!-- Active filter feedback (very important for client demos) -->
          <div v-if="hasActiveCalendarFilters || filteredCount < 5" class="flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">
              Showing <span class="font-medium text-foreground">{{ filteredCount }}</span> surgeries
            </span>

            <div v-if="hasActiveCalendarFilters" class="flex items-center gap-1.5">
              <span class="text-muted-foreground">•</span>

              <div v-if="activeSurgeon" class="flex items-center gap-1">
                <Badge variant="secondary" class="text-xs px-2 py-0">
                  Surgeon: {{ activeSurgeon }}
                </Badge>
                <Button variant="ghost" size="icon" class="size-5" @click="calSurgeonId = undefined">
                  <X class="size-3" />
                </Button>
              </div>

              <div v-if="activeStatus" class="flex items-center gap-1">
                <Badge variant="secondary" class="text-xs px-2 py-0 capitalize">
                  Status: {{ activeStatus.replace('_', ' ') }}
                </Badge>
                <Button variant="ghost" size="icon" class="size-5" @click="calStatus = '_all'">
                  <X class="size-3" />
                </Button>
              </div>

              <Button
                v-if="hasActiveCalendarFilters"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-xs text-muted-foreground"
                @click="clearCalendarFilters"
              >
                Clear filters
              </Button>
            </div>
          </div>

          <!-- ── DAILY VIEW ─────────────────────────────────────────────── -->
          <template v-if="viewMode === 'daily'">
            <div class="overflow-x-auto rounded-lg border">
              <div class="flex min-w-[600px]">
                <!-- Time labels -->
                <div class="w-14 shrink-0 border-r bg-muted/30">
                  <div class="h-10 border-b bg-background" />
                  <div
                    v-for="hour in hourLabels"
                    :key="hour"
                    class="relative text-right pr-2"
                    :style="{ height: `${PX_PER_HOUR}px` }"
                  >
                    <span class="text-muted-foreground text-[11px] tabular-nums -mt-1.5 inline-block">
                      {{ String(hour).padStart(2, '0') }}:00
                    </span>
                  </div>
                </div>

                <!-- Room columns -->
                <div class="flex flex-1 relative">
                  <!-- Hour grid lines -->
                  <div
                    v-for="hour in hourLabels"
                    :key="`line-${hour}`"
                    class="absolute left-0 right-0 border-b border-dashed border-border/60 pointer-events-none"
                    :style="{ top: `${(hour - START_HOUR) * PX_PER_HOUR + 40}px` }"
                  />

                  <!-- Current time line -->
                  <div
                    v-if="currentTimeOffset !== null"
                    class="absolute left-0 right-0 z-20 pointer-events-none"
                    :style="{ top: `${currentTimeOffset + 40}px` }"
                  >
                    <div class="flex items-center">
                      <div class="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                      <div class="h-px bg-red-500 flex-1" />
                    </div>
                  </div>

                  <!-- One column per room -->
                  <div
                    v-for="(room, roomIdx) in orRooms"
                    :key="room.id"
                    class="flex-1 relative border-r last:border-r-0 min-w-[200px]"
                    :class="roomIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'"
                  >
                    <div class="h-10 flex items-center justify-center gap-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-2">
                      <div class="flex items-center gap-1.5">
                        <Scissors class="text-muted-foreground size-3.5" />
                        <span class="text-sm font-semibold tracking-tight">{{ room.name }}</span>
                        <span class="font-mono text-[10px] text-muted-foreground">{{ room.code }}</span>
                      </div>
                      <Badge v-if="hasRoomOverlap(room.id)" variant="destructive" class="h-5 px-1.5 text-[10px]">
                        Overlap
                      </Badge>
                    </div>
                    <div
                      class="relative cursor-crosshair"
                      :style="{ height: `${GRID_HEIGHT}px` }"
                      title="Click empty area to book a slot in this room"
                      @click="onRoomGridClick($event, room.id)"
                    >
                      <NuxtLink
                        v-for="booking in bookingsForRoom(room.id)"
                        :key="booking.id"
                        :to="`/ot/bookings/${booking.id}`"
                        class="absolute left-1.5 right-1.5 block"
                        :class="blockClasses(booking.status)"
                        :style="blockStyle(booking)"
                        @click.stop
                        @contextmenu.prevent="openContextForBooking($event, booking)"
                      >
                        <div class="font-semibold leading-snug truncate text-[13px]">{{ booking.procedureName }}</div>
                        <div class="mt-0.5 text-xs leading-tight truncate opacity-75">
                          {{ patientName(booking.patientId) }}
                        </div>
                        <div class="mt-1 flex items-center gap-1.5 text-[10px] opacity-60 font-medium">
                          <span class="tabular-nums">{{ formatTime(booking.scheduledAt) }}–{{ endTimeOf(booking) }}</span>
                          <span>·</span>
                          <span>{{ booking.estimatedMinutes }}m</span>
                        </div>
                        <div class="mt-0.5 text-[10px] opacity-60 truncate">
                          {{ staffName(booking.primarySurgeonUserId) }}
                        </div>
                      </NuxtLink>
                      <div
                        v-if="bookingsForRoom(room.id).length === 0"
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <span class="text-muted-foreground text-xs">No surgeries</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ── WEEKLY VIEW ────────────────────────────────────────────── -->
          <template v-if="viewMode === 'weekly'">
            <div class="overflow-x-auto rounded-lg border">
              <div class="flex min-w-[900px]">
                <!-- Time labels -->
                <div class="w-14 shrink-0 border-r bg-muted/30">
                  <div class="h-10 border-b bg-background" />
                  <div
                    v-for="hour in hourLabels"
                    :key="hour"
                    class="relative text-right pr-2"
                    :style="{ height: `${PX_PER_HOUR}px` }"
                  >
                    <span class="text-muted-foreground text-[11px] tabular-nums -mt-1.5 inline-block">
                      {{ String(hour).padStart(2, '0') }}:00
                    </span>
                  </div>
                </div>

                <!-- Day columns -->
                <div class="flex flex-1 relative">
                  <!-- Hour grid lines -->
                  <div
                    v-for="hour in hourLabels"
                    :key="`wline-${hour}`"
                    class="absolute left-0 right-0 border-b border-dashed border-border/60 pointer-events-none"
                    :style="{ top: `${(hour - START_HOUR) * PX_PER_HOUR + 40}px` }"
                  />

                  <!-- One column per day -->
                  <div
                    v-for="(day, dayIdx) in weekDays"
                    :key="day.iso"
                    class="flex-1 relative border-r last:border-r-0 min-w-[120px]"
                    :class="dayIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'"
                  >
                    <div
                      class="h-10 flex flex-col items-center justify-center border-b sticky top-0 z-10"
                      :class="day.isToday ? 'bg-primary/5' : 'bg-background/80 backdrop-blur-sm'"
                    >
                      <span class="text-sm font-semibold tracking-tight" :class="day.isToday ? 'text-primary' : ''">{{ day.name }}</span>
                      <span class="text-muted-foreground text-[10px]">{{ day.month }} {{ day.dayOfMonth }}</span>
                    </div>
                    <div class="relative" :style="{ height: `${GRID_HEIGHT}px` }">
                      <NuxtLink
                        v-for="booking in day.bookings"
                        :key="booking.id"
                        :to="`/ot/bookings/${booking.id}`"
                        class="absolute left-1 right-1 block"
                        :class="blockClasses(booking.status)"
                        :style="blockStyle(booking)"
                        @click.stop
                        @contextmenu.prevent="openContextForBooking($event, booking)"
                      >
                        <div class="font-semibold leading-snug truncate text-[13px]">{{ booking.procedureName }}</div>
                        <div class="mt-0.5 text-xs leading-tight truncate opacity-75">
                          {{ patientName(booking.patientId) }}
                        </div>
                        <div class="mt-1 flex items-center gap-1.5 text-[10px] opacity-60 font-medium">
                          <span class="font-mono">{{ roomById(booking.orRoomId)?.code }}</span>
                          <span>·</span>
                          <span class="tabular-nums">{{ formatTime(booking.scheduledAt) }}–{{ endTimeOf(booking) }}</span>
                        </div>
                      </NuxtLink>
                      <div
                        v-if="day.bookings.length === 0"
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <span class="text-muted-foreground text-xs">No surgeries</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ── MONTHLY VIEW ───────────────────────────────────────────── -->
          <template v-if="viewMode === 'monthly'">
            <div class="rounded-lg border overflow-hidden">
              <!-- Month header -->
              <div class="grid grid-cols-7 border-b bg-muted/30">
                <div
                  v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                  :key="d"
                  class="py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {{ d }}
                </div>
              </div>
              <!-- Day grid -->
              <div class="grid grid-cols-7 gap-px bg-border">
                <div
                  v-for="day in monthDays"
                  :key="day.iso"
                  class="min-h-[110px] p-2 bg-background cursor-pointer hover:bg-muted/40 transition-all border border-transparent"
                  :class="{ 'bg-muted/10 text-muted-foreground': !day.isCurrentMonth, 'ring-1 ring-inset ring-primary/30 bg-primary/5': day.isToday }"
                  @click="date = day.iso; viewMode = 'daily'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span
                      class="text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full"
                      :class="{
                        'bg-primary text-primary-foreground': day.isToday,
                        'text-muted-foreground': !day.isCurrentMonth,
                      }"
                    >
                      {{ day.dayOfMonth }}
                    </span>
                    <span
                      v-if="day.bookings.length > 0"
                      class="text-[10px] text-muted-foreground font-medium"
                    >
                      {{ day.bookings.length }}
                    </span>
                  </div>
                  <!-- Surgery dots -->
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="booking in day.bookings"
                      :key="booking.id"
                      class="w-full rounded px-1.5 py-0.5 text-[10px] truncate flex items-center gap-1"
                      :class="blockClasses(booking.status)"
                    >
                      <span class="shrink-0 w-1.5 h-1.5 rounded-full" :class="statusDotClass(booking.status)" />
                      <span class="truncate">{{ formatTime(booking.scheduledAt) }} {{ booking.procedureName }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Right-click context menu (positioned like Google/Teams Calendar) -->
          <DropdownMenu v-model:open="contextMenuOpen">
            <DropdownMenuTrigger as-child>
              <div
                class="fixed pointer-events-none"
                :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px', width: '1px', height: '1px' }"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-52 z-[100]"
              :style="{ position: 'fixed', left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
              @close-auto-focus.prevent
            >
              <template v-if="contextBooking">
                <DropdownMenuItem @click="openBooking(contextBooking)">
                  <ExternalLink class="mr-2 size-4" />
                  Open details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  v-if="['scheduled', 'confirmed'].includes(contextBooking.status)"
                  @click="startSurgery(contextBooking); closeContextMenu()"
                >
                  <Play class="mr-2 size-4" />
                  Start surgery
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="contextBooking.status === 'in_progress'"
                  @click="completeSurgery(contextBooking); closeContextMenu()"
                >
                  <CheckCircle class="mr-2 size-4" />
                  Mark completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="!['completed', 'cancelled'].includes(contextBooking.status)"
                  @click="cancelSurgery(contextBooking); closeContextMenu()"
                >
                  <XCircle class="mr-2 size-4" />
                  Cancel booking
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="rescheduleBooking(contextBooking); closeContextMenu()">
                  <CalendarClock class="mr-2 size-4" />
                  Reschedule…
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive"
                  @click="deleteBooking(contextBooking); closeContextMenu()"
                >
                  <Trash2 class="mr-2 size-4" />
                  Delete booking
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsContent>

        <!-- ═══════════════════════════════════════════════════════════════
             LIST TAB  —  flat DataTable with filters
             ═══════════════════════════════════════════════════════════════ -->
        <TabsContent value="list" class="space-y-4">
          <DataTable
            :columns="listColumns"
            :data="listScoped"
            filter-column="patient"
            filter-placeholder="Search by patient…"
            filter-mode="inline"
            sticky-header
            max-height="70vh"
          >
            <template #custom-filters>
              <DatePicker
                v-model="listDateRange"
                type="range"
                placeholder="All dates"
                locale="en-GB"
                :format="{ day: '2-digit', month: '2-digit', year: 'numeric' }"
                class="h-9 w-72 shrink-0"
              />
              <!-- Facility filtering is now handled by the main calendar toolbar (shared with Calendar views).
                   The List tab primarily adds a powerful date range filter. -->
            </template>
            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <Scissors class="size-8 opacity-50" />
                <span class="text-sm">No surgeries scheduled in this range.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>
</template>
