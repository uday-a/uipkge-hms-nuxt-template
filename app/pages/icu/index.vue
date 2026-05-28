<script setup lang="ts">
// ICU census -- single DataTable with inline filters (facility + status).
// Status filter slices "Active" / "Discharged" / "All" at the page level
// before DataTable sees the data, replacing the previous Tabs UI.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus, MoreHorizontal, HeartPulse } from 'lucide-vue-next'
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
import type { MockICUAdmission } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'ICU — HMS' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const state = useMockState()

// ── filters ───────────────────────────────────────────────────────────────────

const facilityId = ref<string>(state.facility.id)
const statusSlice = ref<'active' | 'discharged' | 'all'>('active')

const scoped = computed<MockICUAdmission[]>(() => {
  return state.icuAdmissions
    .filter((a) => {
      if (statusSlice.value === 'active' && a.dischargedAt) return false
      if (statusSlice.value === 'discharged' && !a.dischargedAt) return false
      return true
    })
    .sort((a, b) => {
      // Active sort by admittedAt desc; discharged by dischargedAt desc; all by admittedAt desc.
      if (statusSlice.value === 'discharged') {
        return (b.dischargedAt ?? '').localeCompare(a.dischargedAt ?? '')
      }
      return b.admittedAt.localeCompare(a.admittedAt)
    })
})

// ── helpers ───────────────────────────────────────────────────────────────────

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function staffName(userId?: number): string {
  if (!userId) return '—'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function sourceLabel(source?: string): string {
  const map: Record<string, string> = {
    OT: 'OT',
    ER: 'ER',
    ward: 'Ward',
    external_transfer: 'External',
  }
  return source ? (map[source] ?? source) : '—'
}

function sourceVariant(source?: string): BadgeVariant {
  if (source === 'ER') return 'destructive'
  if (source === 'OT') return 'warning'
  if (source === 'external_transfer') return 'secondary'
  return 'outline'
}

function severityVariant(severity?: string): BadgeVariant {
  if (severity === 'severe') return 'destructive'
  if (severity === 'moderate') return 'secondary'
  return 'outline'
}

function outcomeLabel(outcome?: string): string {
  if (!outcome) return '—'
  const map: Record<string, string> = {
    discharged_to_ward: 'To ward',
    transferred: 'Transferred',
    expired: 'Expired',
    left_against_advice: 'LAMA',
  }
  return map[outcome] ?? outcome
}

function outcomeVariant(outcome?: string): BadgeVariant {
  if (outcome === 'discharged_to_ward') return 'success'
  if (outcome === 'transferred') return 'secondary'
  if (outcome === 'expired') return 'destructive'
  return 'outline'
}

function truncate(text: string, len = 60): string {
  return text.length > len ? `${text.slice(0, len)}…` : text
}

const columns: ColumnDef<MockICUAdmission>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'ID' }),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.id),
    size: 110,
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
            initials(p.givenName, p.familyName),
          ),
        ),
        h('div', {}, [
          h('p', { class: 'text-sm font-medium' }, `${p.givenName} ${p.familyName}`),
          h('p', { class: 'text-muted-foreground text-xs font-mono' }, p.mrn ?? '—'),
        ]),
      ])
    },
  },
  {
    accessorKey: 'admittedAt',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Admitted' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground tabular-nums' }, formatDateTime(row.original.admittedAt)),
    size: 170,
  },
  {
    accessorKey: 'source',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Source' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: sourceVariant(row.original.source), class: 'capitalize text-xs' },
        () => sourceLabel(row.original.source),
      ),
    size: 110,
  },
  {
    accessorKey: 'indication',
    header: 'Indication',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground text-sm' }, truncate(row.original.indication)),
    enableSorting: false,
  },
  {
    accessorKey: 'initialSeverity',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Severity' }),
    cell: ({ row }) => {
      const sev = row.original.initialSeverity
      if (!sev) return h('span', { class: 'text-muted-foreground text-xs' }, '—')
      return h(
        Badge,
        { variant: severityVariant(sev), class: 'capitalize text-xs' },
        () => sev,
      )
    },
    size: 120,
  },
  {
    id: 'intensivist',
    accessorFn: row => staffName(row.intensivistUserId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Intensivist' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground' }, staffName(row.original.intensivistUserId)),
    size: 180,
  },
  {
    accessorKey: 'outcome',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Outcome' }),
    cell: ({ row }) => {
      const o = row.original.outcome
      if (!o) return h('span', { class: 'text-muted-foreground text-xs' }, '—')
      return h(
        Badge,
        { variant: outcomeVariant(o), class: 'capitalize text-xs' },
        () => outcomeLabel(o),
      )
    },
    size: 140,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const adm = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { asChild: true }, () =>
              h(resolveComponent('NuxtLink'), { to: `/icu/${adm.id}` }, () => 'Open'),
            ),
            !adm.dischargedAt
              ? h(DropdownMenuItem, { asChild: true }, () =>
                  h(resolveComponent('NuxtLink'), { to: `/icu/${adm.id}` }, () => 'Discharge'),
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
        title="ICU"
        description="Intensive care unit census."
      />
      <template #actions>
        <Button
          as-child
          size="sm"
          class="gap-2"
        >
          <NuxtLink to="/icu/admit">
            <Plus class="size-4" />
            Admit to ICU
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
        <!-- Page-scoped filters: facility + status slice. Both narrow
             `scoped` before DataTable sees the rows. -->
        <template #custom-filters>
          <Select v-model="facilityId">
            <SelectTrigger class="h-9 w-48 shrink-0">
              <SelectValue placeholder="Facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="state.facility.id">
                {{ state.facility.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="statusSlice">
            <SelectTrigger class="h-9 w-40 shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                Active
              </SelectItem>
              <SelectItem value="discharged">
                Discharged
              </SelectItem>
              <SelectItem value="all">
                All
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <HeartPulse class="size-8 opacity-50" />
            <span class="text-sm">No ICU admissions match the current filters.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
