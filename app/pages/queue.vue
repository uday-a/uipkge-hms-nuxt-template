<script setup lang="ts">
// Queue -- single DataTable with inline stage / facility / doctor filters.
// Replaces the previous 3-tab (waiting / in-consult / finished) navigation
// with a stage Select that narrows `scoped` at the page level before the
// DataTable sees the rows. Lifecycle classification (arrived appointment vs.
// in-progress encounter vs. finished encounter) is normalised into a single
// `QueueRow` shape so one column set serves all three stages.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { ListChecks, MoreHorizontal } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import type { MockAppointment, MockEncounter } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Queue — HMS' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
type Stage = 'waiting' | 'in-consult' | 'finished'
type StageFilter = 'all' | Stage

// Normalised row -- the union of an arrived appointment (waiting stage) and
// an outpatient encounter (in-consult / finished stages). Keeping a single
// shape lets one column set drive the whole table.
interface QueueRow {
  key: string
  stage: Stage
  patientId: string
  doctorUserId?: number
  tokenNumber: number | null
  // The timestamp shown in the "Arrived" column -- scheduledAt for waiting,
  // admissionAt for in-consult, dischargeAt (falling back to admissionAt)
  // for finished.
  timestamp: string
  encounterId?: string
}

const state = useMockState()

// ── filters ───────────────────────────────────────────────────────────────────

// Land on the active queue by default so the page is useful without a click.
const stageFilter = ref<StageFilter>('waiting')
const facilityId = ref<string>(state.facility.id)
const doctorFilter = ref<string>('all')

const todayStr = new Date().toISOString().slice(0, 10)

function isToday(iso: string) {
  return iso.slice(0, 10) === todayStr
}

// ── lookups ───────────────────────────────────────────────────────────────────

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function doctorById(id: number | undefined) {
  if (!id) return null
  return state.staff.find(s => s.id === id)
}

function tokenForEncounter(encId: string): number | null {
  const appt = state.appointments.find(a => a.encounterId === encId)
  return appt?.tokenNumber ?? null
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

const doctors = computed(() => state.staff.filter(s => s.role === 'doctor'))

// ── row builders (preserve original waiting / in-consult / finished logic) ───

function waitingRows(facility: string): QueueRow[] {
  return state.appointments
    .filter((a: MockAppointment) =>
      a.status === 'arrived'
      && a.facilityId === facility
      && isToday(a.scheduledAt),
    )
    .sort((a, b) => (a.tokenNumber ?? 999) - (b.tokenNumber ?? 999))
    .map<QueueRow>(a => ({
      key: `appt:${a.id}`,
      stage: 'waiting',
      patientId: a.patientId,
      doctorUserId: a.doctorUserId,
      tokenNumber: a.tokenNumber ?? null,
      timestamp: a.scheduledAt,
      encounterId: a.encounterId,
    }))
}

function inConsultRows(facility: string): QueueRow[] {
  return state.encounters
    .filter((e: MockEncounter) =>
      e.type === 'outpatient'
      && e.status === 'in_progress'
      && e.facilityId === facility
      && e.admissionAt
      && isToday(e.admissionAt),
    )
    .sort((a, b) => a.admissionAt!.localeCompare(b.admissionAt!))
    .map<QueueRow>(e => ({
      key: `enc:${e.id}`,
      stage: 'in-consult',
      patientId: e.patientId,
      doctorUserId: e.attendingUserId,
      tokenNumber: tokenForEncounter(e.id),
      timestamp: e.admissionAt!,
      encounterId: e.id,
    }))
}

function finishedRows(facility: string): QueueRow[] {
  return state.encounters
    .filter((e: MockEncounter) =>
      e.type === 'outpatient'
      && e.status === 'finished'
      && e.facilityId === facility
      && e.admissionAt
      && isToday(e.admissionAt),
    )
    .sort((a, b) => {
      const ta = a.dischargeAt ?? a.admissionAt ?? ''
      const tb = b.dischargeAt ?? b.admissionAt ?? ''
      return tb.localeCompare(ta) // most recent first
    })
    .map<QueueRow>(e => ({
      key: `enc:${e.id}`,
      stage: 'finished',
      patientId: e.patientId,
      doctorUserId: e.attendingUserId,
      tokenNumber: tokenForEncounter(e.id),
      timestamp: e.dischargeAt ?? e.admissionAt!,
      encounterId: e.id,
    }))
}

// ── scoped rows ───────────────────────────────────────────────────────────────

const scoped = computed<QueueRow[]>(() => {
  const fac = facilityId.value
  let rows: QueueRow[]
  if (stageFilter.value === 'waiting') rows = waitingRows(fac)
  else if (stageFilter.value === 'in-consult') rows = inConsultRows(fac)
  else if (stageFilter.value === 'finished') rows = finishedRows(fac)
  else rows = [...waitingRows(fac), ...inConsultRows(fac), ...finishedRows(fac)]

  if (doctorFilter.value !== 'all') {
    const docId = Number(doctorFilter.value)
    rows = rows.filter(r => r.doctorUserId === docId)
  }
  return rows
})

// ── stage badge ───────────────────────────────────────────────────────────────

function stageVariant(stage: Stage): BadgeVariant {
  if (stage === 'waiting') return 'secondary'
  if (stage === 'in-consult') return 'default'
  return 'outline'
}

function stageLabel(stage: Stage): string {
  if (stage === 'waiting') return 'Waiting'
  if (stage === 'in-consult') return 'In consult'
  return 'Finished'
}

// ── columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<QueueRow>[] = [
  {
    id: 'token',
    accessorFn: row => row.tokenNumber ?? -1,
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Token #' }),
    cell: ({ row }) => {
      const t = row.original.tokenNumber
      if (t == null) return h('span', { class: 'text-muted-foreground text-sm' }, '—')
      return h('span', { class: 'text-sm tabular-nums font-semibold' }, `#${t}`)
    },
    size: 90,
  },
  {
    id: 'patient',
    accessorFn: (row) => {
      const p = patientById(row.patientId)
      if (!p) return row.patientId
      // Concatenate name + MRN so the built-in search box matches either.
      return `${p.givenName} ${p.familyName} ${p.mrn ?? ''}`.trim()
    },
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Patient' }),
    cell: ({ row }) => {
      const p = patientById(row.original.patientId)
      if (!p) return h('span', { class: 'text-muted-foreground text-xs' }, row.original.patientId)
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h(Avatar, { class: 'size-7' }, () =>
          h(AvatarFallback, { class: 'bg-primary/10 text-primary text-[10px] font-semibold' }, () =>
            initials(p.givenName, p.familyName),
          ),
        ),
        h('div', {}, [
          h('p', { class: 'text-sm font-medium leading-none' }, `${p.givenName} ${p.familyName}`),
          h('p', { class: 'text-muted-foreground text-xs font-mono' }, p.mrn ?? '—'),
        ]),
      ])
    },
  },
  {
    id: 'doctor',
    accessorFn: (row) => {
      const d = doctorById(row.doctorUserId)
      return d?.name ?? ''
    },
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Doctor' }),
    cell: ({ row }) => {
      const d = doctorById(row.original.doctorUserId)
      if (!d) return h('span', { class: 'text-muted-foreground text-sm' }, '—')
      return h('span', { class: 'text-sm' }, d.name)
    },
  },
  {
    accessorKey: 'timestamp',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Arrived' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground text-sm tabular-nums' },
        relativeTime(row.original.timestamp),
      ),
    size: 130,
  },
  {
    accessorKey: 'stage',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Stage' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: stageVariant(row.original.stage), class: 'capitalize text-xs' },
        () => stageLabel(row.original.stage),
      ),
    size: 130,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const r = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            r.encounterId
              ? h(DropdownMenuItem, { asChild: true }, () =>
                  h(resolveComponent('NuxtLink'), { to: `/encounters/${r.encounterId}` }, () => 'Open encounter'),
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
        title="Queue"
        description="Today's outpatient flow."
      />
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
        <!-- Page-scoped filters: stage + facility + doctor. All narrow
             `scoped` before DataTable sees the rows. -->
        <template #custom-filters>
          <Select v-model="stageFilter">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="waiting">
                Waiting
              </SelectItem>
              <SelectItem value="in-consult">
                In consult
              </SelectItem>
              <SelectItem value="finished">
                Finished today
              </SelectItem>
              <SelectItem value="all">
                All stages
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="facilityId">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="Facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="state.facility.id">
                {{ state.facility.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="doctorFilter">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All doctors
              </SelectItem>
              <SelectItem
                v-for="d in doctors"
                :key="d.id"
                :value="String(d.id)"
              >
                {{ d.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <ListChecks class="size-8 opacity-50" />
            <span class="text-sm">No patients match the current filters.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
