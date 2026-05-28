<script setup lang="ts">
// Radiology worklist -- single DataTable across all four lifecycle stages
// (awaiting_study / in_progress / awaiting_report / reported) with inline
// dropdown filters. The stage filter slices the rows at the page level
// before DataTable sees them, replacing the previous Tabs UI.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Scan, MoreHorizontal } from 'lucide-vue-next'
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

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Radiology Worklist — HMS' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
type StageSlice = 'all' | 'awaiting_study' | 'in_progress' | 'awaiting_report' | 'reported'

interface WorklistRow {
  orderId: string
  patientId: string
  display: string
  modality: string
  bodyRegion: string
  priority: 'routine' | 'urgent' | 'stat'
  createdAt: string
  stage: Exclude<StageSlice, 'all'>
}

const state = useMockState()

// ── filters ───────────────────────────────────────────────────────────────────

const stageSlice = ref<StageSlice>('awaiting_study')
const modalitySlice = ref<string>('all')

// ── stage classification ──────────────────────────────────────────────────────
//
// Recreate the original Tabs buckets as a single computed that assigns each
// active radiology order to exactly one stage. Order matters: a single order
// can have a study + a report, so we walk reported → awaiting_report →
// in_progress → awaiting_study (most-advanced wins).

const allRows = computed<WorklistRow[]>(() => {
  const reportedOrderIds = new Set(
    state.diagnosticReports
      .filter(r => r.category === 'radiology')
      .map(r => r.serviceRequestId),
  )
  const studiesByOrder = new Map<string, typeof state.imagingStudies[number]>()
  for (const s of state.imagingStudies) studiesByOrder.set(s.serviceRequestId, s)

  const rows: WorklistRow[] = []

  for (const ord of state.radiologyOrders) {
    const study = studiesByOrder.get(ord.id)

    let stage: WorklistRow['stage']
    if (reportedOrderIds.has(ord.id)) {
      stage = 'reported'
    }
    else if (study && study.status === 'completed') {
      stage = 'awaiting_report'
    }
    else if (study && study.status === 'in_progress') {
      stage = 'in_progress'
    }
    else if (ord.status === 'active' && !study) {
      stage = 'awaiting_study'
    }
    else {
      // Scheduled/cancelled study, draft order, etc. — skip from worklist.
      continue
    }

    rows.push({
      orderId: ord.id,
      patientId: ord.patientId,
      display: ord.display,
      modality: ord.modality ?? '—',
      bodyRegion: ord.bodyRegion ?? '—',
      priority: ord.priority,
      createdAt: ord.createdAt,
      stage,
    })
  }

  return rows
})

const modalityOptions = computed(() => {
  const set = new Set<string>()
  for (const r of allRows.value) {
    if (r.modality && r.modality !== '—') set.add(r.modality)
  }
  return Array.from(set).sort()
})

const scoped = computed<WorklistRow[]>(() => {
  return allRows.value
    .filter((r) => {
      if (stageSlice.value !== 'all' && r.stage !== stageSlice.value) return false
      if (modalitySlice.value !== 'all' && r.modality !== modalitySlice.value) return false
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

// ── helpers ───────────────────────────────────────────────────────────────────

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function modalityVariant(modality: string): BadgeVariant {
  const m = modality.toLowerCase()
  if (m === 'ct' || m === 'mri') return 'secondary'
  return 'outline'
}

function priorityVariant(priority: string): BadgeVariant {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'warning'
  return 'outline'
}

function stageVariant(stage: WorklistRow['stage']): BadgeVariant {
  switch (stage) {
    case 'reported': return 'success'
    case 'awaiting_report': return 'warning'
    case 'in_progress': return 'secondary'
    case 'awaiting_study': return 'outline'
  }
}

function stageLabel(stage: WorklistRow['stage']): string {
  switch (stage) {
    case 'reported': return 'Reported'
    case 'awaiting_report': return 'Awaiting report'
    case 'in_progress': return 'In progress'
    case 'awaiting_study': return 'Awaiting study'
  }
}

const columns: ColumnDef<WorklistRow>[] = [
  {
    id: 'patient',
    accessorFn: (row) => {
      const p = state.patients.find(pp => pp.id === row.patientId)
      return p ? `${p.givenName} ${p.familyName} ${p.mrn ?? ''}` : row.patientId
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
          h('p', { class: 'font-mono text-xs text-muted-foreground' }, p.mrn ?? '—'),
        ]),
      ])
    },
  },
  {
    accessorKey: 'modality',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Modality' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: modalityVariant(row.original.modality), class: 'capitalize text-xs' },
        () => row.original.modality.toUpperCase(),
      ),
    size: 110,
  },
  {
    accessorKey: 'bodyRegion',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Body region' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground' }, row.original.bodyRegion),
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
    size: 120,
  },
  {
    accessorKey: 'stage',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Status' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: stageVariant(row.original.stage), class: 'capitalize text-xs' },
        () => stageLabel(row.original.stage),
      ),
    size: 150,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Ordered' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground tabular-nums' }, relativeTime(row.original.createdAt)),
    size: 140,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const order = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { asChild: true }, () =>
              h(resolveComponent('NuxtLink'), { to: `/radiology/orders/${order.orderId}` }, () => 'Open'),
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
        title="Radiology Worklist"
        description="Track imaging orders from scheduling through to signed reports."
      />
      <template #actions>
        <Button
          variant="outline"
          size="sm"
          as-child
        >
          <NuxtLink to="/dashboard/radiology">
            <Scan class="size-4" />
            Dashboard
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
        <!-- Page-scoped filters: stage + modality. Both narrow `scoped`
             before DataTable sees the rows, so DataTable's own filter
             plumbing stays unused. -->
        <template #custom-filters>
          <Select v-model="stageSlice">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All stages
              </SelectItem>
              <SelectItem value="awaiting_study">
                Awaiting study
              </SelectItem>
              <SelectItem value="in_progress">
                In progress
              </SelectItem>
              <SelectItem value="awaiting_report">
                Awaiting report
              </SelectItem>
              <SelectItem value="reported">
                Reported
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="modalitySlice">
            <SelectTrigger class="h-9 w-36 shrink-0">
              <SelectValue placeholder="Modality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All modalities
              </SelectItem>
              <SelectItem
                v-for="m in modalityOptions"
                :key="m"
                :value="m"
              >
                {{ m.toUpperCase() }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Scan class="size-8 opacity-50" />
            <span class="text-sm">No radiology orders match the current filters.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
