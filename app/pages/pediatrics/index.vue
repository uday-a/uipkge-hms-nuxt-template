<script setup lang="ts">
// Pediatrics list -- TanStack DataTable scoped to patients under 18.
// Built-in search box matches across "Name · MRN" (accessor joins both
// so the global filter widget covers everything). The age-stage Select
// in #custom-filters narrows the data set before DataTable sees it.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Baby, ExternalLink, Syringe } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { IMMUNIZATIONS } from '~/mocks/pediatrics'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pediatrics' })

const state = useMockState()

type Patient = (typeof state.patients)[number]

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const stage = ref<string>('_all')

function ageInYears(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  const y = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? y - 1 : y
}

function ageLabel(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000)
  if (totalDays < 30) return `${totalDays}d`
  if (totalDays < 365) return `${Math.floor(totalDays / 30)}mo`
  return `${ageInYears(dob)}y`
}

function ageBucket(dob: string): 'infant' | 'toddler' | 'child' | 'teen' {
  const y = ageInYears(dob)
  if (y < 1) return 'infant'
  if (y < 3) return 'toddler'
  if (y < 12) return 'child'
  return 'teen'
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function sexVariant(sex: string): BadgeVariant {
  if (sex === 'male') return 'info'
  if (sex === 'female') return 'default'
  return 'outline'
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function upcomingCount(patientId: string): number {
  const today = isoDate(new Date())
  return IMMUNIZATIONS.filter(i =>
    i.patientId === patientId && !i.givenAt && i.scheduledFor && i.scheduledFor >= today,
  ).length
}

function overdueCount(patientId: string): number {
  const today = isoDate(new Date())
  return IMMUNIZATIONS.filter(i =>
    i.patientId === patientId && !i.givenAt && i.scheduledFor && i.scheduledFor < today,
  ).length
}

// Page-level filter: bucket runs before DataTable sees the rows, so
// DataTable's own column filter plumbing stays unused for stage.
const scoped = computed<Patient[]>(() =>
  state.patients
    .filter(p => ageInYears(p.dateOfBirth) < 18)
    .filter(p => stage.value === '_all' || ageBucket(p.dateOfBirth) === stage.value)
    .sort((a, b) => a.dateOfBirth.localeCompare(b.dateOfBirth)),
)

const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: 'mrn',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'MRN' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.mrn),
    size: 140,
  },
  {
    id: 'name',
    // Accessor concatenates name + MRN so the built-in search box also
    // matches MRN substrings without needing a custom global filter.
    accessorFn: row => `${row.givenName} ${row.familyName} ${row.mrn}`,
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Name' }),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(Avatar, { size: 'sm' }, () =>
          h(AvatarFallback, () => initials(row.original.givenName, row.original.familyName)),
        ),
        h('span', { class: 'text-sm font-medium' }, `${row.original.givenName} ${row.original.familyName}`),
      ]),
  },
  {
    accessorKey: 'sex',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Sex' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: sexVariant(row.original.sex), class: 'capitalize text-xs' },
        () => row.original.sex,
      ),
    size: 96,
  },
  {
    accessorKey: 'dateOfBirth',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'DOB / Age' }),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-sm text-muted-foreground' },
        `${formatDate(row.original.dateOfBirth)} · ${ageLabel(row.original.dateOfBirth)}`,
      ),
    size: 180,
  },
  {
    id: 'upcoming',
    accessorFn: row => upcomingCount(row.id),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Upcoming' }),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(Syringe, { class: 'text-muted-foreground size-3.5' }),
        h('span', { class: 'text-sm tabular-nums' }, upcomingCount(row.original.id)),
      ]),
    size: 120,
  },
  {
    id: 'overdue',
    accessorFn: row => overdueCount(row.id),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Overdue' }),
    cell: ({ row }) => {
      const n = overdueCount(row.original.id)
      return n > 0
        ? h(Badge, { variant: 'destructive', class: 'capitalize text-xs' }, () => n)
        : h('span', { class: 'text-sm text-muted-foreground' }, '—')
    },
    size: 120,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        Button,
        { variant: 'ghost', size: 'sm', asChild: true },
        () =>
          h(
            resolveComponent('NuxtLink'),
            { to: `/pediatrics/${row.original.id}` },
            () => h(ExternalLink, { class: 'size-4' }),
          ),
      ),
    enableSorting: false,
    enableHiding: false,
    size: 64,
  },
]
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Pediatrics"
        description="Growth charts and immunization tracking for patients under 18."
      />
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="scoped"
        filter-column="name"
        filter-placeholder="Search by name or MRN…"
        filter-mode="inline"
        sticky-header
        max-height="70vh"
      >
        <template #custom-filters>
          <Select v-model="stage">
            <SelectTrigger class="h-9 w-40 shrink-0">
              <SelectValue placeholder="All ages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">
                All ages
              </SelectItem>
              <SelectItem value="infant">
                Infant (&lt;1y)
              </SelectItem>
              <SelectItem value="toddler">
                Toddler (1–3y)
              </SelectItem>
              <SelectItem value="child">
                Child (3–12y)
              </SelectItem>
              <SelectItem value="teen">
                Teen (12–18y)
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Baby class="size-8 opacity-50" />
            <span class="text-sm">No pediatric patients found.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
