<script setup lang="ts">
// Patient list — TanStack DataTable: sort, multiselect filter on sex, global
// search on name, sticky header, CSV export. Helpers below feed accessorFn
// / cell renderers so sorting works on the underlying value (e.g. DOB) and
// not the formatted display string.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { UserPlus, ExternalLink } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, DataTableColumnHeader, type FilterDefinition } from '@/components/ui/data-table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Patients' })

const state = useMockState()

type Patient = (typeof state.patients)[number]

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

function age(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  const adjusted = m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? years - 1 : years
  if (adjusted < 1) {
    const days = Math.floor((now.getTime() - birth.getTime()) / 86400000)
    if (days < 30) return `${days}d`
    return `${Math.floor(days / 30)}mo`
  }
  return `${adjusted}y`
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function sexVariant(sex: string): BadgeVariant {
  if (sex === 'male') return 'info'
  if (sex === 'female') return 'default'
  return 'outline'
}

function formatDob(dob: string): string {
  return new Date(dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const filters: FilterDefinition[] = [
  {
    column: 'sex',
    label: 'Sex',
    type: 'multiselect',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
    ],
  },
]

const columns: ColumnDef<Patient>[] = [
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
    accessorKey: 'mrn',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'MRN' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.mrn),
    size: 140,
  },
  {
    id: 'name',
    accessorFn: row => `${row.givenName} ${row.familyName}`,
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Name' }),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(Avatar, { size: 'sm' }, () => h(AvatarFallback, () => initials(row.original.givenName, row.original.familyName))),
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
        `${formatDob(row.original.dateOfBirth)} · ${age(row.original.dateOfBirth)}`,
      ),
    size: 160,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground' }, row.original.phone ?? '—'),
    enableSorting: false,
    size: 160,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        Button,
        { variant: 'ghost', size: 'sm', asChild: true },
        () => h(resolveComponent('NuxtLink'), { to: `/patients/${row.original.id}` }, () => h(ExternalLink, { class: 'size-4' })),
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
        title="Patients"
        description="Manage and search the hospital's patient registry."
      />
      <template #actions>
        <Button
          as-child
          size="sm"
          class="gap-2"
        >
          <NuxtLink to="/patients/new">
            <UserPlus class="size-4" />
            Register patient
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="state.patients"
        filter-column="name"
        filter-placeholder="Search by name…"
        :filters="filters"
        filter-mode="popover"
        sticky-header
        max-height="70vh"
      >
        <template #empty>
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <UserPlus class="text-muted-foreground size-10 opacity-40" />
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                No patients found
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        </template>
      </DataTable>
    </PageBody>
  </Page>
</template>
