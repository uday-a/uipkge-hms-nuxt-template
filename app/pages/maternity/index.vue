<script setup lang="ts">
// Maternity overview -- single DataTable across all four maternity stages
// (ANC / Labour / Delivery / Postpartum). The stage select in the toolbar
// narrows the dataset before DataTable sees it -- replacing the previous
// Tabs UI so the same column shell + search filter applies across stages.
//
// Postpartum vs Delivery split: deliveries within the last 48h are
// classified as "Delivery" (the event itself); older deliveries are
// "Postpartum" (recovery period). This is a heuristic over the same
// MockDelivery rows -- no separate postpartum dataset exists.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Baby, HeartPulse, MoreHorizontal, Users } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
useHead({ title: 'Maternity — HMS' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
type Stage = 'anc' | 'labour' | 'delivery' | 'postpartum'

interface MaternityRow {
  id: string
  stage: Stage
  patientId: string
  patientName: string
  patientMrn: string
  // Stage-specific anchor date: ANC->LMP, Labour->startedAt, Delivery/Postpartum->deliveredAt.
  anchorDate: string
  // Single-cell summary string per stage (weeks, dilation, weight + sex, recovery day, etc.).
  summary: string
  statusLabel: string
  statusVariant: BadgeVariant
  detailHref: string
}

const state = useMockState()

// ── Helpers ──────────────────────────────────────────────────────────────────

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function patientName(id: string): string {
  const p = patientById(id)
  return p ? `${p.givenName} ${p.familyName}` : id
}

function weeksSinceLmp(lmp: string): number {
  const diff = Date.now() - new Date(lmp).getTime()
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000)
}

function ancRiskVariant(risks: string[]): BadgeVariant {
  if (risks.some(r => r.toLowerCase().includes('pre-eclampsia') || r.toLowerCase().includes('severe'))) return 'destructive'
  if (risks.length > 0) return 'secondary'
  return 'outline'
}

function labourStageLabel(stage: number): string {
  const map: Record<number, string> = { 1: 'Early labour', 2: 'Active', 3: 'Delivery', 4: 'Placenta' }
  return map[stage] ?? `Stage ${stage}`
}

function labourStatusVariant(status: string): BadgeVariant {
  if (status === 'in_progress') return 'default'
  if (status === 'cs_pending') return 'secondary'
  if (status === 'transferred') return 'destructive'
  return 'outline'
}

function labourStatusLabel(status: string): string {
  if (status === 'in_progress') return 'In progress'
  if (status === 'cs_pending') return 'CS pending'
  return status.replace('_', ' ')
}

function deliveryModeLabel(mode: string): string {
  const map: Record<string, string> = {
    svd: 'SVD',
    instrumental: 'Instrumental',
    cs_elective: 'C-section (elective)',
    cs_emergency: 'C-section (emergency)',
  }
  return map[mode] ?? mode
}

function deliveryModeVariant(mode: string): BadgeVariant {
  if (mode === 'cs_emergency') return 'destructive'
  if (mode === 'instrumental') return 'secondary'
  if (mode === 'cs_elective') return 'outline'
  return 'default'
}

function stageBadgeVariant(stage: Stage): BadgeVariant {
  if (stage === 'labour') return 'default'
  if (stage === 'delivery') return 'secondary'
  if (stage === 'postpartum') return 'outline'
  return 'outline'
}

function stageLabel(stage: Stage): string {
  if (stage === 'anc') return 'ANC'
  if (stage === 'labour') return 'Labour'
  if (stage === 'delivery') return 'Delivery'
  return 'Postpartum'
}

// ── Stage filter ─────────────────────────────────────────────────────────────

const stageFilter = ref<Stage | '_all'>('_all')

// ── Row builders -- one per source dataset ───────────────────────────────────

const ancRows = computed<MaternityRow[]>(() =>
  state.ancRecords.map((rec) => {
    const weeks = weeksSinceLmp(rec.lmp)
    const risk = rec.riskFactors.length ? rec.riskFactors[0]! : 'Low risk'
    return {
      id: `anc-${rec.id}`,
      stage: 'anc' as const,
      patientId: rec.patientId,
      patientName: patientName(rec.patientId),
      patientMrn: patientById(rec.patientId)?.mrn ?? '—',
      anchorDate: rec.lmp,
      summary: `${weeks}w · G/P ${rec.gravidaPara} · ${rec.visits.length} visit${rec.visits.length === 1 ? '' : 's'}`,
      statusLabel: risk,
      statusVariant: ancRiskVariant(rec.riskFactors),
      detailHref: `/maternity/anc/${rec.patientId}`,
    }
  }),
)

const labourRows = computed<MaternityRow[]>(() =>
  state.labours
    .filter(l => l.status === 'in_progress')
    .map(lab => ({
      id: `labour-${lab.id}`,
      stage: 'labour' as const,
      patientId: lab.patientId,
      patientName: patientName(lab.patientId),
      patientMrn: patientById(lab.patientId)?.mrn ?? '—',
      anchorDate: lab.startedAt,
      summary: `${labourStageLabel(lab.stage)} · ${lab.cervicalDilationCm} cm`,
      statusLabel: labourStatusLabel(lab.status),
      statusVariant: labourStatusVariant(lab.status),
      detailHref: `/maternity/labour/${lab.id}`,
    })),
)

// Deliveries split into Delivery (≤48h) and Postpartum (>48h).
const deliveryRows = computed<MaternityRow[]>(() =>
  state.deliveries.map((del) => {
    const isPostpartum = hoursSince(del.deliveredAt) > 48
    const stage: Stage = isPostpartum ? 'postpartum' : 'delivery'
    const weightKg = (del.babyWeightGrams / 1000).toFixed(2)
    const summary = isPostpartum
      ? `Day ${Math.floor(hoursSince(del.deliveredAt) / 24)} · ${deliveryModeLabel(del.mode)}`
      : `${deliveryModeLabel(del.mode)} · ${del.babySexAtBirth} ${weightKg} kg · Apgar ${del.apgar1Min}/${del.apgar5Min}`
    return {
      id: `delivery-${del.id}`,
      stage,
      patientId: del.patientId,
      patientName: patientName(del.patientId),
      patientMrn: patientById(del.patientId)?.mrn ?? '—',
      anchorDate: del.deliveredAt,
      summary,
      statusLabel: deliveryModeLabel(del.mode),
      statusVariant: deliveryModeVariant(del.mode),
      detailHref: `/maternity/delivery/${del.id}`,
    }
  }),
)

// Concatenate all rows; DataTable's built-in search filters by name.
const allRows = computed<MaternityRow[]>(() => [
  ...ancRows.value,
  ...labourRows.value,
  ...deliveryRows.value,
])

const rows = computed<MaternityRow[]>(() => {
  if (stageFilter.value === '_all') return allRows.value
  return allRows.value.filter(r => r.stage === stageFilter.value)
})

// ── KPIs ─────────────────────────────────────────────────────────────────────

const kpis = computed(() => [
  { title: 'Active ANC', value: state.ancRecords.length, icon: Users },
  { title: 'In labour', value: labourRows.value.length, icon: HeartPulse },
  { title: 'Deliveries', value: state.deliveries.length, icon: Baby },
])

// ── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<MaternityRow>[] = [
  {
    accessorKey: 'stage',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Stage' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: stageBadgeVariant(row.original.stage), class: 'capitalize text-xs' },
        () => stageLabel(row.original.stage),
      ),
    size: 120,
  },
  {
    accessorKey: 'patientName',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Patient' }),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-medium' }, row.original.patientName),
        h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.patientMrn),
      ]),
  },
  {
    accessorKey: 'anchorDate',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Date' }),
    cell: ({ row }) => {
      const r = row.original
      const text = r.stage === 'labour' ? formatDateTime(r.anchorDate) : formatDate(r.anchorDate)
      return h('span', { class: 'text-muted-foreground text-sm tabular-nums' }, text)
    },
    size: 160,
  },
  {
    accessorKey: 'summary',
    header: 'Summary',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.summary),
    enableSorting: false,
  },
  {
    accessorKey: 'statusLabel',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Status' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.statusVariant, class: 'capitalize text-xs' },
        () => row.original.statusLabel,
      ),
    size: 160,
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
            h(DropdownMenuItem, { asChild: true }, () =>
              h(resolveComponent('NuxtLink'), { to: r.detailHref }, () => 'Open record'),
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
        title="Maternity"
        description="Antenatal, labour, and postnatal overview."
      />
    </PageHeader>

    <PageBody class="space-y-4">
      <!-- KPIs -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          v-for="kpi in kpis"
          :key="kpi.title"
        >
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <component
                :is="kpi.icon"
                class="size-4 text-muted-foreground"
              />
              {{ kpi.title }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold">
              {{ kpi.value }}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        :columns="columns"
        :data="rows"
        filter-column="patientName"
        filter-placeholder="Search by patient name or MRN…"
        filter-mode="inline"
        sticky-header
        max-height="70vh"
      >
        <template #custom-filters>
          <Select v-model="stageFilter">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">
                All stages
              </SelectItem>
              <SelectItem value="anc">
                ANC
              </SelectItem>
              <SelectItem value="labour">
                Labour
              </SelectItem>
              <SelectItem value="delivery">
                Delivery
              </SelectItem>
              <SelectItem value="postpartum">
                Postpartum
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Baby class="size-8 opacity-50" />
            <span class="text-sm">No maternity records match the current filter.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
