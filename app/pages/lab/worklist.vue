<script setup lang="ts">
// Lab worklist -- single DataTable with inline stage + facility filters.
// Replaces the previous 3-tab (collection / result / reported) navigation
// with a stage Select that narrows `scoped` at the page level before the
// DataTable sees the rows. Lifecycle classification logic (sample collected?
// report present?) lives unchanged in `stageOf` + the `scoped` computed.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { TestTubeDiagonal } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Lab Worklist' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
type Stage = 'collection' | 'result' | 'reported'
type StageFilter = 'all' | Stage

const state = useMockState()

type LabOrder = (typeof state.labOrders)[number]

// ── filters ───────────────────────────────────────────────────────────────────

const facilityFilter = ref<string>('all')
const stageFilter = ref<StageFilter>('all')

const facilities = computed(() => {
  const ids = [...new Set(state.labOrders.map(o => o.facilityId))]
  return ids.map((id) => {
    const f = state.facility.id === id ? state.facility : null
    return { id, name: f?.name ?? id }
  })
})

// ── helpers ───────────────────────────────────────────────────────────────────

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function catalogItem(catalogId: string | undefined) {
  if (!catalogId) return undefined
  return state.labCatalog.find(c => c.id === catalogId)
}

function priorityVariant(priority: string): BadgeVariant {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'warning'
  return 'secondary'
}

function stageVariant(stage: Stage): BadgeVariant {
  if (stage === 'collection') return 'outline'
  if (stage === 'result') return 'secondary'
  return 'default'
}

function stageLabel(stage: Stage): string {
  if (stage === 'collection') return 'Awaiting collection'
  if (stage === 'result') return 'Awaiting result'
  return 'Reported'
}

// Lifecycle classifier -- kept identical to the original Tab logic:
//   collection = no sample collected
//   result     = sample collected, no diagnostic report
//   reported   = has a diagnostic report (any status)
function stageOf(order: LabOrder): Stage {
  const sample = state.labSamples.find(s => s.serviceRequestId === order.id)
  if (!sample?.collectedAt) return 'collection'
  if (state.diagnosticReports.some(r => r.serviceRequestId === order.id)) return 'reported'
  return 'result'
}

// ── scoped rows ───────────────────────────────────────────────────────────────

const scoped = computed<LabOrder[]>(() => {
  return state.labOrders
    .filter(o => o.category === 'lab')
    .filter(o => facilityFilter.value === 'all' || o.facilityId === facilityFilter.value)
    .filter(o => stageFilter.value === 'all' || stageOf(o) === stageFilter.value)
})

// ── columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<LabOrder>[] = [
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
          h(AvatarFallback, { class: 'bg-secondary text-[10px] font-semibold' }, () =>
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
    id: 'test',
    accessorFn: row => row.display,
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Test' }),
    cell: ({ row }) =>
      h('div', {}, [
        h('p', { class: 'text-sm font-medium' }, row.original.display),
        h(
          'p',
          { class: 'text-muted-foreground font-mono text-xs' },
          catalogItem(row.original.catalogId)?.code ?? row.original.code,
        ),
      ]),
  },
  {
    id: 'stage',
    accessorFn: row => stageOf(row),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Stage' }),
    cell: ({ row }) => {
      const s = stageOf(row.original)
      return h(
        Badge,
        { variant: stageVariant(s), class: 'capitalize text-xs' },
        () => stageLabel(s),
      )
    },
    size: 160,
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Priority' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: priorityVariant(row.original.priority), class: 'capitalize text-xs' },
        () => row.original.priority,
      ),
    size: 110,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Ordered' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground text-sm tabular-nums' },
        relativeTime(row.original.createdAt),
      ),
    size: 130,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        Button,
        { variant: 'outline', size: 'sm', asChild: true },
        () => h(resolveComponent('NuxtLink'), { to: `/lab/orders/${row.original.id}` }, () => 'Open'),
      ),
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
]
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Lab Worklist"
        description="Track lab orders from sample collection through to signed reports."
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
        <!-- Page-scoped filters: stage + facility. Both narrow `scoped`
             before DataTable sees the rows. -->
        <template #custom-filters>
          <Select v-model="stageFilter">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All stages
              </SelectItem>
              <SelectItem value="collection">
                Awaiting collection
              </SelectItem>
              <SelectItem value="result">
                Awaiting result
              </SelectItem>
              <SelectItem value="reported">
                Reported
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="facilityFilter">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="Facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All facilities
              </SelectItem>
              <SelectItem
                v-for="fac in facilities"
                :key="fac.id"
                :value="fac.id"
              >
                {{ fac.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <TestTubeDiagonal class="size-8 opacity-50" />
            <span class="text-sm">No lab orders match the current filters.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
