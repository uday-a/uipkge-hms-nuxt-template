<script setup lang="ts">
// Audit log -- TanStack DataTable with page-scoped filters (action group,
// resource type, date range). Filters narrow `filtered` before DataTable
// sees it; DataTable's own filter plumbing stays unused.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { History, ShieldCheck } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdvanceSelect } from '@/components/ui/advance-select'
import { DatePicker } from '@/components/ui/date-picker'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Audit log · Admin' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const state = useMockState()

type AuditEvent = (typeof state.auditEvents)[number]

// ── helpers ────────────────────────────────────────────────────────────────────

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function actorName(userId?: number) {
  if (!userId) return 'System'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}

function actorRole(userId?: number): string {
  if (!userId) return 'system'
  return state.staff.find(u => u.id === userId)?.role ?? 'unknown'
}

function patientName(patientId?: string) {
  if (!patientId) return '—'
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

// Derive coarse action group from the raw action string (e.g. "note.signed" → "create")
function actionGroup(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('login') || a.includes('logout')) return 'login'
  if (a.includes('break_glass')) return 'break_glass'
  if (a.includes('print')) return 'print'
  if (a.includes('export')) return 'export'
  if (a.includes('delete') || a.includes('removed')) return 'delete'
  if (
    a.includes('.created')
    || a.includes('.opened')
    || a.includes('.received')
    || a.includes('.assigned')
  ) return 'create'
  if (
    a.includes('.updated')
    || a.includes('.signed')
    || a.includes('.completed')
    || a.includes('.finalized')
    || a.includes('.given')
    || a.includes('.acknowledged')
  ) return 'update'
  if (a.includes('.read') || a.includes('.viewed')) return 'read'
  return 'update'
}

function actionVariant(action: string): BadgeVariant {
  const g = actionGroup(action)
  if (g === 'delete') return 'destructive'
  if (g === 'break_glass') return 'destructive'
  if (g === 'create') return 'default'
  if (g === 'login') return 'secondary'
  if (g === 'print' || g === 'export') return 'outline'
  return 'outline'
}

function roleVariant(role: string): BadgeVariant {
  if (role === 'admin') return 'destructive'
  if (role === 'doctor') return 'default'
  if (role === 'nurse') return 'secondary'
  return 'outline'
}

// ── filter state ───────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'read', label: 'Read' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'break_glass', label: 'Break glass' },
  { value: 'print', label: 'Print' },
  { value: 'export', label: 'Export' },
]

const RESOURCE_OPTIONS = [
  'all',
  'Patient',
  'Encounter',
  'ClinicalNote',
  'MedRequest',
  'MedAdministration',
  'Dispense',
  'ServiceRequest',
  'DiagnosticReport',
  'Observation',
  'Bill',
  'Payment',
  'BedAssignment',
  'NursingEntry',
  'SurgeryBooking',
  'DischargeSummary',
  'Appointment',
  'CriticalAlert',
]

// AdvanceSelect needs { value, label } shape; map 'all' to a human label.
const resourceOptions = RESOURCE_OPTIONS.map(r => ({
  value: r,
  label: r === 'all' ? 'All resources' : r,
}))

const filterAction = ref('all')
const filterResource = ref<string | null>('all')
// Inclusive ISO-date range. `null` means "all dates".
const dateRange = ref<{ start: string, end: string } | null>(null)

const filtered = computed(() => {
  // Sort DESC first
  const sorted = [...state.auditEvents].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  return sorted
    .filter((e) => {
      if (filterAction.value !== 'all' && actionGroup(e.action) !== filterAction.value) return false
      // AdvanceSelect's `allow-clear` can set filterResource to null/empty -- treat that as "all".
      if (filterResource.value && filterResource.value !== 'all' && e.resourceType !== filterResource.value) return false
      if (dateRange.value) {
        const day = e.occurredAt.slice(0, 10)
        if (day < dateRange.value.start || day > dateRange.value.end) return false
      }
      return true
    })
    .slice(0, 100) // cap at 100 most recent
})

// ── hash chain status (static mock) ───────────────────────────────────────────

const verifiedAt = relTime(
  new Date(Date.now() - 5 * 60_000).toISOString(), // "5 minutes ago"
)

// ── columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'occurredAt',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Time' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground text-xs tabular-nums whitespace-nowrap' },
        formatDateTime(row.original.occurredAt),
      ),
    size: 180,
  },
  {
    id: 'actor',
    accessorFn: row => actorName(row.actorUserId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Actor' }),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-0.5' }, [
        h('span', { class: 'text-sm font-medium leading-none' }, actorName(row.original.actorUserId)),
        h(
          Badge,
          {
            variant: roleVariant(actorRole(row.original.actorUserId)),
            class: 'w-fit capitalize text-xs',
          },
          () => actorRole(row.original.actorUserId),
        ),
      ]),
  },
  {
    accessorKey: 'action',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Action' }),
    cell: ({ row }) =>
      h(
        Badge,
        {
          variant: actionVariant(row.original.action),
          class: 'max-w-[180px] truncate capitalize text-xs',
          title: row.original.action,
        },
        () => row.original.action,
      ),
    size: 200,
  },
  {
    accessorKey: 'resourceType',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Resource type' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.resourceType),
    size: 160,
  },
  {
    accessorKey: 'resourceId',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Resource ID' }),
    cell: ({ row }) =>
      h(
        'span',
        {
          class: 'font-mono text-xs text-muted-foreground truncate block max-w-[140px]',
          title: row.original.resourceId,
        },
        row.original.resourceId ?? '—',
      ),
    size: 160,
  },
  {
    id: 'patient',
    accessorFn: row => patientName(row.patientId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Patient' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, patientName(row.original.patientId)),
  },
  {
    id: 'requestId',
    accessorFn: row => String(row.id),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Request ID' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-mono text-xs text-muted-foreground truncate block max-w-[120px]' },
        String(row.original.id),
      ),
    size: 140,
    enableSorting: false,
  },
]
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Audit log"
        description="Append-only event history. Last 100 events shown."
      />
    </PageHeader>

    <PageBody class="space-y-4">
      <!-- Hash chain status card -->
      <Card>
        <CardContent class="flex flex-wrap items-center gap-4 py-4">
          <ShieldCheck class="text-muted-foreground size-5" />
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">Append-only chain:</span>
            <Badge
              variant="success"
              class="capitalize text-xs"
            >
              verified
            </Badge>
          </div>
          <div class="text-muted-foreground text-sm">
            <History class="mr-1 inline size-4" />
            {{ filtered.length }} events checked
          </div>
          <div class="text-muted-foreground text-sm">
            Last verified {{ verifiedAt }}
          </div>
        </CardContent>
      </Card>

      <DataTable
        :columns="columns"
        :data="filtered"
        filter-mode="inline"
        :enable-column-visibility="false"
        :enable-export="false"
        sticky-header
        max-height="70vh"
      >
        <!-- Three page-scoped controls live in the toolbar. They narrow
             `filtered` before DataTable sees it. -->
        <template #custom-filters>
          <DatePicker
            v-model="dateRange"
            type="range"
            placeholder="All dates"
            locale="en-GB"
            :format="{ day: '2-digit', month: '2-digit', year: 'numeric' }"
            class="h-9 w-72 shrink-0"
          />

          <Select v-model="filterAction">
            <SelectTrigger class="h-9 w-40 shrink-0">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in ACTION_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <AdvanceSelect
            v-model="filterResource"
            :options="resourceOptions"
            mode="single"
            placeholder="All resources"
            show-search
            allow-clear
            class="h-9 w-60 shrink-0"
          />
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <History class="size-8 opacity-50" />
            <span class="text-sm">No audit events match these filters.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
