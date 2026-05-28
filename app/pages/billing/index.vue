<script setup lang="ts">
// Bills list -- TanStack DataTable with sort, page-scoped facility +
// status dropdown filters in the toolbar's `#custom-filters` slot, and a
// per-row actions dropdown. The previous Tabs layout was collapsed into
// a single `<Select>` for status; both filters narrow the data set
// before DataTable sees it.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { MoreHorizontal, Receipt } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import type { MockBill } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Bills' })

type Bill = MockBill
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const state = useMockState()

// ── helpers ───────────────────────────────────────────────────────────────────

function rupees(cents: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100)
}

function patientName(patientId: string): string {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function encounterTypeLabel(encounterId: string): string {
  const enc = state.encounters.find(e => e.id === encounterId)
  if (!enc) return '—'
  const map: Record<string, string> = {
    outpatient: 'OPD',
    inpatient: 'IPD',
    emergency: 'ER',
    daycare: 'Daycare',
    telemedicine: 'Tele',
  }
  return map[enc.type] ?? enc.type
}

function encounterTypeVariant(encounterId: string): BadgeVariant {
  const enc = state.encounters.find(e => e.id === encounterId)
  if (!enc) return 'outline'
  if (enc.type === 'emergency') return 'destructive'
  if (enc.type === 'inpatient') return 'default'
  if (enc.type === 'daycare') return 'info'
  if (enc.type === 'telemedicine') return 'secondary'
  return 'outline'
}

function statusVariant(status: Bill['status']): BadgeVariant {
  if (status === 'paid') return 'success'
  if (status === 'partially_paid') return 'warning'
  if (status === 'open') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline' // draft
}

function statusLabel(status: Bill['status']): string {
  const map: Record<Bill['status'], string> = {
    draft: 'Draft',
    open: 'Pending',
    paid: 'Paid',
    partially_paid: 'Partial',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

// ── filters ───────────────────────────────────────────────────────────────────

// Page-scoped filters: both narrow the data set before DataTable sees it,
// so DataTable's own column-filter plumbing stays out of the picture.
const filterFacility = ref<string>(state.facility.id)
const filterStatus = ref<string>('_all')

const facilityOptions = computed(() => {
  const ids = [...new Set(state.bills.map(b => b.facilityId))]
  return ids.map(id => ({ id, name: state.facility.id === id ? state.facility.name : id }))
})

const filtered = computed(() => {
  return state.bills
    .filter((b) => {
      if (filterFacility.value && b.facilityId !== filterFacility.value) return false
      if (filterStatus.value === '_all') return true
      return b.status === filterStatus.value
    })
    .sort((a, b) => b.billNo.localeCompare(a.billNo))
})

// ── row actions ───────────────────────────────────────────────────────────────

const router = useRouter()

function viewBill(bill: Bill) {
  router.push(`/billing/${bill.id}`)
}

function markPaid(bill: Bill) {
  const idx = state.bills.findIndex(b => b.id === bill.id)
  if (idx === -1) return
  const b = state.bills[idx]!
  b.paidCents = b.totalCents
  b.balanceCents = 0
  b.status = 'paid'
}

// `window.print` only exists in the browser. Keep the call client-only so
// SSR / typecheck stays clean.
function printBill(bill: Bill) {
  router.push(`/billing/${bill.id}`)
  if (import.meta.client) {
    nextTick(() => window.print())
  }
}

// ── columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<Bill>[] = [
  {
    accessorKey: 'billNo',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Bill #' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.billNo),
    size: 160,
  },
  {
    id: 'patient',
    accessorFn: row => patientName(row.patientId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Patient' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm font-medium' }, patientName(row.original.patientId)),
  },
  {
    id: 'type',
    accessorFn: row => encounterTypeLabel(row.encounterId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Type' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: encounterTypeVariant(row.original.encounterId), class: 'capitalize text-xs' },
        () => encounterTypeLabel(row.original.encounterId),
      ),
    size: 110,
  },
  {
    id: 'date',
    accessorFn: row => row.finalizedAt ?? '',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Date' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground text-sm' },
        row.original.finalizedAt ? formatDate(row.original.finalizedAt) : '—',
      ),
    size: 130,
  },
  {
    accessorKey: 'totalCents',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Total' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, rupees(row.original.totalCents)),
    size: 120,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'paidCents',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Paid' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums text-muted-foreground' }, rupees(row.original.paidCents)),
    size: 120,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'balanceCents',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Balance' }),
    cell: ({ row }) =>
      h(
        'span',
        {
          class: [
            'text-sm tabular-nums',
            row.original.balanceCents > 0 ? 'text-destructive font-medium' : 'text-muted-foreground',
          ],
        },
        rupees(row.original.balanceCents),
      ),
    size: 120,
    meta: { align: 'right' },
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
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const bill = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => viewBill(bill) }, () => 'View'),
            h(DropdownMenuItem, { onSelect: () => printBill(bill) }, () => 'Print'),
            bill.status !== 'paid' && bill.status !== 'cancelled'
              ? h(DropdownMenuItem, { onSelect: () => markPaid(bill) }, () => 'Mark paid')
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
        title="Billing"
        description="Manage patient bills, payments, and revenue tracking."
      />
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="filtered"
        filter-column="patient"
        filter-placeholder="Search by patient…"
        filter-mode="inline"
        sticky-header
        max-height="70vh"
      >
        <template #custom-filters>
          <Select v-model="filterFacility">
            <SelectTrigger class="h-9 w-44 shrink-0">
              <SelectValue placeholder="All facilities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="fac in facilityOptions"
                :key="fac.id"
                :value="fac.id"
              >
                {{ fac.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="filterStatus">
            <SelectTrigger class="h-9 w-40 shrink-0">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">
                All
              </SelectItem>
              <SelectItem value="paid">
                Paid
              </SelectItem>
              <SelectItem value="open">
                Pending
              </SelectItem>
              <SelectItem value="partially_paid">
                Partial
              </SelectItem>
              <SelectItem value="draft">
                Draft
              </SelectItem>
              <SelectItem value="cancelled">
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Receipt class="size-8 opacity-50" />
            <span class="text-sm">No bills match the selected filters.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
