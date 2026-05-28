<script setup lang="ts">
// Service catalog admin -- DataTable list of billable services with
// edit-in-place dialog. Category + facility filter live in the toolbar's
// `#custom-filters` slot so they narrow the dataset before DataTable
// sees it.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus, MoreHorizontal, Package } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MockServiceCatalogItem } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Service catalog · Admin' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const state = useMockState()

// ── helpers ────────────────────────────────────────────────────────────────────

const inr = (cents: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100)

const taxPercent = (bp: number) => `${(bp / 100).toFixed(0)}%`

const CATEGORIES: Array<MockServiceCatalogItem['category'] | 'all'> = [
  'all', 'consultation', 'procedure', 'investigation', 'ward', 'misc',
]

function categoryVariant(cat: MockServiceCatalogItem['category']): BadgeVariant {
  if (cat === 'consultation') return 'default'
  if (cat === 'procedure') return 'secondary'
  if (cat === 'investigation') return 'outline'
  if (cat === 'ward') return 'outline'
  return 'outline'
}

// ── filters ────────────────────────────────────────────────────────────────────

const filterFacility = ref<string>('all')
const filterCategory = ref<string>('all')

const facilities = computed(() => {
  const ids = [...new Set(state.services.map(s => s.facilityId))]
  return ids.map(id => ({ id, name: state.facility.id === id ? state.facility.name : id }))
})

const filtered = computed(() => {
  return state.services.filter((s) => {
    if (filterFacility.value !== 'all' && s.facilityId !== filterFacility.value) return false
    if (filterCategory.value !== 'all' && s.category !== filterCategory.value) return false
    return true
  })
})

// ── service active toggle (local extension — MockServiceCatalogItem has no active field) ─

function isActive(svc: MockServiceCatalogItem): boolean {
  const s = svc as MockServiceCatalogItem & { active?: boolean }
  return s.active !== undefined ? s.active : true
}

function toggleActive(svc: MockServiceCatalogItem) {
  const idx = state.services.findIndex(s => s.id === svc.id)
  if (idx === -1) return
  const s = state.services[idx] as MockServiceCatalogItem & { active?: boolean }
  s.active = !isActive(s)
}

// ── dialog ────────────────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editing = ref<MockServiceCatalogItem | null>(null)

const form = reactive({
  code: '',
  display: '',
  category: 'consultation' as MockServiceCatalogItem['category'],
  priceRupees: 0, // user enters in rupees; stored as cents
  taxRateBp: 0,
  active: true,
})

function openAdd() {
  editing.value = null
  form.code = ''
  form.display = ''
  form.category = 'consultation'
  form.priceRupees = 0
  form.taxRateBp = 0
  form.active = true
  dialogOpen.value = true
}

function openEdit(svc: MockServiceCatalogItem) {
  editing.value = svc
  form.code = svc.code
  form.display = svc.display
  form.category = svc.category
  form.priceRupees = Math.round(svc.defaultPriceCents / 100)
  form.taxRateBp = svc.taxRateBp
  form.active = isActive(svc)
  dialogOpen.value = true
}

function save() {
  if (!canSave.value) return
  const priceCents = Math.round(form.priceRupees * 100)
  if (editing.value) {
    const idx = state.services.findIndex(s => s.id === editing.value!.id)
    if (idx !== -1) {
      const updated = state.services[idx] as MockServiceCatalogItem & { active?: boolean }
      updated.code = form.code.trim()
      updated.display = form.display.trim()
      updated.category = form.category
      updated.defaultPriceCents = priceCents
      updated.taxRateBp = form.taxRateBp
      updated.active = form.active
    }
  }
  else {
    const s = {
      id: `svc-${Date.now()}`,
      facilityId: state.facility.id,
      code: form.code.trim(),
      display: form.display.trim(),
      category: form.category,
      defaultPriceCents: priceCents,
      taxRateBp: form.taxRateBp,
    } as MockServiceCatalogItem & { active?: boolean }
    s.active = form.active
    state.services.push(s)
  }
  dialogOpen.value = false
}

function deleteService(svc: MockServiceCatalogItem) {
  const idx = state.services.findIndex(s => s.id === svc.id)
  if (idx !== -1) state.services.splice(idx, 1)
}

const canSave = computed(() => !!form.code.trim() && !!form.display.trim() && form.priceRupees >= 0)

const columns: ColumnDef<MockServiceCatalogItem>[] = [
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
    accessorKey: 'code',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Code' }),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.code),
    size: 140,
  },
  {
    accessorKey: 'display',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Display' }),
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.display),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Category' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: categoryVariant(row.original.category), class: 'capitalize text-xs' },
        () => row.original.category,
      ),
    size: 140,
  },
  {
    accessorKey: 'defaultPriceCents',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Price' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, inr(row.original.defaultPriceCents)),
    size: 120,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'taxRateBp',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Tax %' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, taxPercent(row.original.taxRateBp)),
    size: 100,
    meta: { align: 'right' },
  },
  {
    id: 'active',
    accessorFn: row => isActive(row),
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': isActive(row.original),
        'onUpdate:checked': () => toggleActive(row.original),
      }),
    enableSorting: false,
    size: 80,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const svc = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEdit(svc) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteService(svc) },
              () => 'Delete',
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
        title="Service catalog"
        description="Manage billable services, procedures and investigations."
      />
      <template #actions>
        <Button
          size="sm"
          class="gap-2"
          @click="openAdd"
        >
          <Plus class="size-4" />
          Add service
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="filtered"
        filter-column="display"
        filter-placeholder="Search by display name…"
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

          <Select v-model="filterCategory">
            <SelectTrigger class="h-9 w-48 shrink-0">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="cat in CATEGORIES"
                :key="cat"
                :value="cat"
                class="capitalize"
              >
                {{ cat === 'all' ? 'All categories' : cat }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <Package class="size-8 opacity-50" />
            <span class="text-sm">No services configured.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>

    <!-- Add / Edit dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editing ? 'Edit service' : 'Add service' }}</DialogTitle>
          <DialogDescription>
            {{ editing ? 'Update service catalog entry.' : 'Add a new billable service to the catalog.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="svc-code">Code <span class="text-destructive">*</span></Label>
              <Input
                id="svc-code"
                v-model="form.code"
                placeholder="CONSULT-GP"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="svc-category">Category <span class="text-destructive">*</span></Label>
              <Select v-model="form.category">
                <SelectTrigger id="svc-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="cat in CATEGORIES.filter(c => c !== 'all')"
                    :key="cat"
                    :value="cat"
                    class="capitalize"
                  >
                    {{ cat }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="svc-display">Display name <span class="text-destructive">*</span></Label>
            <Input
              id="svc-display"
              v-model="form.display"
              placeholder="General Practice Consultation"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="svc-price">Price (₹) <span class="text-destructive">*</span></Label>
              <Input
                id="svc-price"
                v-model.number="form.priceRupees"
                type="number"
                :min="0"
                placeholder="500"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="svc-tax">Tax rate (basis pts)</Label>
              <Input
                id="svc-tax"
                v-model.number="form.taxRateBp"
                type="number"
                :min="0"
                :max="10000"
                placeholder="1000 = 10%"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Switch
              id="svc-active"
              :checked="form.active"
              @update:checked="(v: boolean) => form.active = v"
            />
            <Label for="svc-active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!canSave"
            @click="save"
          >
            {{ editing ? 'Save changes' : 'Add service' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
