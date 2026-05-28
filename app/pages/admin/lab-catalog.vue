<script setup lang="ts">
// Lab Catalog admin -- DataTable list of lab tests with edit-in-place dialog.
// Single table, no tabs.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus, MoreHorizontal, TestTubeDiagonal } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import type { MockLabCatalogItem } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Lab Catalog · Admin' })

const state = useMockState()

// ── Dialog state ──────────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editingItem = ref<MockLabCatalogItem | null>(null)

const form = reactive({
  code: '',
  display: '',
  specimenType: 'blood',
  unit: '',
  referenceLow: '',
  referenceHigh: '',
  criticalLow: '',
  criticalHigh: '',
  active: true,
})

const canSave = computed(() => !!form.code.trim() && !!form.display.trim())

function resetForm() {
  form.code = ''
  form.display = ''
  form.specimenType = 'blood'
  form.unit = ''
  form.referenceLow = ''
  form.referenceHigh = ''
  form.criticalLow = ''
  form.criticalHigh = ''
  form.active = true
  editingItem.value = null
}

function openAdd() {
  resetForm()
  dialogOpen.value = true
}

function openEdit(item: MockLabCatalogItem) {
  editingItem.value = item
  form.code = item.code
  form.display = item.display
  form.specimenType = item.specimenType
  form.unit = item.unit ?? ''
  form.referenceLow = item.referenceLow !== undefined ? String(item.referenceLow) : ''
  form.referenceHigh = item.referenceHigh !== undefined ? String(item.referenceHigh) : ''
  form.criticalLow = item.criticalLow !== undefined ? String(item.criticalLow) : ''
  form.criticalHigh = item.criticalHigh !== undefined ? String(item.criticalHigh) : ''
  form.active = (item as any).active !== false
  dialogOpen.value = true
}

function saveItem() {
  if (!canSave.value) return

  const parsed = {
    code: form.code.trim().toUpperCase(),
    display: form.display.trim(),
    specimenType: form.specimenType,
    unit: form.unit.trim() || undefined,
    referenceLow: form.referenceLow !== '' ? parseFloat(form.referenceLow) : undefined,
    referenceHigh: form.referenceHigh !== '' ? parseFloat(form.referenceHigh) : undefined,
    criticalLow: form.criticalLow !== '' ? parseFloat(form.criticalLow) : undefined,
    criticalHigh: form.criticalHigh !== '' ? parseFloat(form.criticalHigh) : undefined,
    active: form.active,
  }

  if (editingItem.value) {
    const idx = state.labCatalog.findIndex(c => c.id === editingItem.value!.id)
    if (idx !== -1) Object.assign(state.labCatalog[idx]!, parsed)
  }
  else {
    state.labCatalog.push({
      id: `lc-${Date.now()}`,
      facilityId: state.facility.id,
      ...parsed,
    } as MockLabCatalogItem)
  }

  dialogOpen.value = false
  resetForm()
}

function deleteItem(item: MockLabCatalogItem) {
  const idx = state.labCatalog.findIndex(c => c.id === item.id)
  if (idx !== -1) state.labCatalog.splice(idx, 1)
}

function toggleItemActive(item: MockLabCatalogItem) {
  const idx = state.labCatalog.findIndex(c => c.id === item.id)
  if (idx === -1) return
  const existing = state.labCatalog[idx] as MockLabCatalogItem & { active?: boolean }
  existing.active = existing.active !== undefined ? !existing.active : false
}

function itemIsActive(item: MockLabCatalogItem): boolean {
  const i = item as MockLabCatalogItem & { active?: boolean }
  return i.active !== undefined ? i.active : true
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info'

function specimenVariant(specimen: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    blood: 'destructive',
    urine: 'warning',
    swab: 'secondary',
    stool: 'outline',
    csf: 'info',
    sputum: 'default',
  }
  return map[specimen] ?? 'secondary'
}

function referenceRange(item: MockLabCatalogItem): string {
  if (item.referenceLow !== undefined && item.referenceHigh !== undefined) {
    return `${item.referenceLow} – ${item.referenceHigh}`
  }
  if (item.referenceHigh !== undefined) return `< ${item.referenceHigh}`
  if (item.referenceLow !== undefined) return `> ${item.referenceLow}`
  return '—'
}

function criticalRange(item: MockLabCatalogItem): string {
  const parts: string[] = []
  if (item.criticalLow !== undefined) parts.push(`< ${item.criticalLow}`)
  if (item.criticalHigh !== undefined) parts.push(`> ${item.criticalHigh}`)
  return parts.length > 0 ? parts.join(' / ') : '—'
}

const columns: ColumnDef<MockLabCatalogItem>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Code' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.code),
    size: 120,
  },
  {
    accessorKey: 'display',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Name' }),
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.display),
  },
  {
    accessorKey: 'specimenType',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Specimen' }),
    cell: ({ row }) =>
      h(Badge, { variant: specimenVariant(row.original.specimenType), class: 'capitalize text-xs' }, () => row.original.specimenType),
    size: 120,
  },
  {
    id: 'referenceRange',
    accessorFn: row => referenceRange(row),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Reference range' }),
    cell: ({ row }) => {
      const r = referenceRange(row.original)
      const unit = row.original.unit
      return h('span', { class: 'text-muted-foreground text-sm tabular-nums' }, [
        r,
        unit && r !== '—' ? h('span', { class: 'ml-0.5 text-xs' }, ` ${unit}`) : null,
      ])
    },
    size: 160,
  },
  {
    id: 'criticalRange',
    accessorFn: row => criticalRange(row),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Critical range' }),
    cell: ({ row }) => {
      const r = criticalRange(row.original)
      const unit = row.original.unit
      return h('span', { class: 'text-muted-foreground text-sm tabular-nums' }, [
        r,
        unit && r !== '—' ? h('span', { class: 'ml-0.5 text-xs' }, ` ${unit}`) : null,
      ])
    },
    size: 160,
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': itemIsActive(row.original),
        'onUpdate:checked': () => toggleItemActive(row.original),
      }),
    enableSorting: false,
    size: 80,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const item = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEdit(item) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteItem(item) },
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
        title="Lab catalog"
        description="Manage lab test definitions, reference ranges, and critical thresholds."
      />
      <template #actions>
        <Button
          size="sm"
          class="gap-2"
          @click="openAdd"
        >
          <Plus class="size-4" />
          Add test
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <DataTable
        :columns="columns"
        :data="state.labCatalog"
        filter-column="display"
        filter-placeholder="Search by name…"
        sticky-header
        max-height="70vh"
      >
        <template #empty>
          <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
            <TestTubeDiagonal class="size-8 opacity-50" />
            <span class="text-sm">No lab tests configured.</span>
          </div>
        </template>
      </DataTable>
    </PageBody>

    <!-- Add / Edit dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingItem ? 'Edit test' : 'Add test' }}</DialogTitle>
          <DialogDescription>
            {{ editingItem ? 'Update lab test catalog entry.' : 'Add a new lab test definition.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="lc-code">Code <span class="text-destructive">*</span></Label>
              <Input
                id="lc-code"
                v-model="form.code"
                class="font-mono uppercase"
                placeholder="HGB"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="lc-specimen">Specimen type</Label>
              <Select v-model="form.specimenType">
                <SelectTrigger id="lc-specimen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood">
                    Blood
                  </SelectItem>
                  <SelectItem value="urine">
                    Urine
                  </SelectItem>
                  <SelectItem value="swab">
                    Swab
                  </SelectItem>
                  <SelectItem value="stool">
                    Stool
                  </SelectItem>
                  <SelectItem value="csf">
                    CSF
                  </SelectItem>
                  <SelectItem value="sputum">
                    Sputum
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="lc-display">Display name <span class="text-destructive">*</span></Label>
            <Input
              id="lc-display"
              v-model="form.display"
              placeholder="Haemoglobin"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="lc-unit">Unit</Label>
            <Input
              id="lc-unit"
              v-model="form.unit"
              placeholder="g/dL"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="lc-ref-low">Reference low</Label>
              <Input
                id="lc-ref-low"
                v-model="form.referenceLow"
                type="number"
                placeholder="12.0"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="lc-ref-high">Reference high</Label>
              <Input
                id="lc-ref-high"
                v-model="form.referenceHigh"
                type="number"
                placeholder="17.5"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="lc-crit-low">Critical low</Label>
              <Input
                id="lc-crit-low"
                v-model="form.criticalLow"
                type="number"
                placeholder="7.0"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="lc-crit-high">Critical high</Label>
              <Input
                id="lc-crit-high"
                v-model="form.criticalHigh"
                type="number"
                placeholder="20.0"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Switch
              :id="`active-switch-${editingItem?.id ?? 'new'}`"
              :checked="form.active"
              @update:checked="(v: boolean) => form.active = v"
            />
            <Label :for="`active-switch-${editingItem?.id ?? 'new'}`">Active</Label>
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
            @click="saveItem"
          >
            {{ editingItem ? 'Save changes' : 'Add test' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
