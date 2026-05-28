<script setup lang="ts">
// Drugs & batches admin -- two tabs, each a DataTable. The formulary tab
// lists drug master records; the batches tab lists received stock with
// near-expiry / low-stock badges. Both tab actions live in PageHeader's
// #actions slot so the toolbar inside each DataTable stays clean.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus, Package, MoreHorizontal, Pill } from 'lucide-vue-next'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import type { MockDrug, MockDrugBatch } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Drugs & Batches · Admin' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const state = useMockState()

// ── helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)

function daysUntil(isoDate: string) {
  return Math.round((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
}

function isNearExpiry(batch: MockDrugBatch) {
  const days = daysUntil(batch.expiresOn)
  return days >= 0 && days < 90
}

function isLowStock(batch: MockDrugBatch) {
  return batch.qtyOnHand < 10
}

function isExpired(batch: MockDrugBatch) {
  return batch.expiresOn < today
}

function scheduleVariant(schedule: number | undefined): BadgeVariant {
  if (!schedule) return 'outline'
  if (schedule <= 2) return 'destructive'
  if (schedule <= 3) return 'warning'
  return 'secondary'
}

function drugDisplayById(id: string) {
  return state.drugs.find(d => d.id === id)?.display ?? id
}

// ── drug dialog ───────────────────────────────────────────────────────────────
const drugDialogOpen = ref(false)
const editingDrug = ref<MockDrug | null>(null)

const drugForm = reactive({
  code: '',
  display: '',
  form: 'tablet' as MockDrug['form'],
  strengthText: '',
  genericName: '',
  schedule: '' as string, // '' = none, '1'–'5'
  active: true,
})

const canSaveDrug = computed(() =>
  !!drugForm.code.trim() && !!drugForm.display.trim() && !!drugForm.strengthText.trim(),
)

const DRUG_FORMS: MockDrug['form'][] = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler']

function openAddDrug() {
  editingDrug.value = null
  drugForm.code = ''
  drugForm.display = ''
  drugForm.form = 'tablet'
  drugForm.strengthText = ''
  drugForm.genericName = ''
  drugForm.schedule = ''
  drugForm.active = true
  drugDialogOpen.value = true
}

function openEditDrug(drug: MockDrug) {
  editingDrug.value = drug
  drugForm.code = drug.code
  drugForm.display = drug.display
  drugForm.form = drug.form
  drugForm.strengthText = drug.strengthText
  drugForm.genericName = drug.genericName
  drugForm.schedule = drug.schedule != null ? String(drug.schedule) : ''
  drugForm.active = drugIsActive(drug)
  drugDialogOpen.value = true
}

function saveDrug() {
  if (!canSaveDrug.value) return
  const scheduleVal = drugForm.schedule ? Number(drugForm.schedule) : undefined
  if (editingDrug.value) {
    // PATCH existing
    const idx = state.drugs.findIndex(d => d.id === editingDrug.value!.id)
    if (idx !== -1) {
      const existing = state.drugs[idx]!
      existing.code = drugForm.code.trim()
      existing.display = drugForm.display.trim()
      existing.form = drugForm.form
      existing.strengthText = drugForm.strengthText.trim()
      existing.genericName = drugForm.genericName.trim()
      existing.schedule = scheduleVal
      const ext = existing as MockDrug & { active?: boolean }
      ext.active = drugForm.active
    }
  }
  else {
    // ADD new
    const newDrug: MockDrug & { active?: boolean } = {
      id: `drug-${Date.now()}`,
      code: drugForm.code.trim(),
      display: drugForm.display.trim(),
      form: drugForm.form,
      strengthText: drugForm.strengthText.trim(),
      genericName: drugForm.genericName.trim(),
      schedule: scheduleVal,
    }
    newDrug.active = drugForm.active
    state.drugs.push(newDrug)
  }
  drugDialogOpen.value = false
}

function deleteDrug(drug: MockDrug) {
  const idx = state.drugs.findIndex(d => d.id === drug.id)
  if (idx !== -1) state.drugs.splice(idx, 1)
}

function toggleDrugActive(drug: MockDrug) {
  // MockDrug has no `active` field — we simulate it by tracking toggled-off IDs
  // Since the type doesn't have `active`, we store a local reactive set for the demo
  const idx = state.drugs.findIndex(d => d.id === drug.id)
  if (idx === -1) return
  // We extend the drug object in-place with an `active` property for demo
  const existing = state.drugs[idx] as MockDrug & { active?: boolean }
  existing.active = existing.active !== undefined ? !existing.active : false
}

function drugIsActive(drug: MockDrug): boolean {
  const d = drug as MockDrug & { active?: boolean }
  return d.active !== undefined ? d.active : true
}

// ── batch dialog ──────────────────────────────────────────────────────────────
const batchDialogOpen = ref(false)
const editingBatch = ref<MockDrugBatch | null>(null)

const batchForm = reactive({
  drugId: '',
  batchNo: '',
  expiresOn: '',
  qtyOnHand: 0,
  costCents: undefined as number | undefined,
})

const canSaveBatch = computed(() =>
  !!batchForm.drugId && !!batchForm.batchNo.trim() && !!batchForm.expiresOn && batchForm.qtyOnHand >= 0,
)

function openReceiveBatch() {
  editingBatch.value = null
  batchForm.drugId = state.drugs[0]?.id ?? ''
  batchForm.batchNo = ''
  batchForm.expiresOn = ''
  batchForm.qtyOnHand = 0
  batchForm.costCents = undefined
  batchDialogOpen.value = true
}

function openEditBatch(batch: MockDrugBatch) {
  editingBatch.value = batch
  batchForm.drugId = batch.drugId
  batchForm.batchNo = batch.batchNo
  batchForm.expiresOn = batch.expiresOn
  batchForm.qtyOnHand = batch.qtyOnHand
  batchForm.costCents = (batch as MockDrugBatch & { costCents?: number }).costCents ?? undefined
  batchDialogOpen.value = true
}

function saveBatch() {
  if (!canSaveBatch.value) return
  if (editingBatch.value) {
    const idx = state.drugBatches.findIndex(b => b.id === editingBatch.value!.id)
    if (idx !== -1) {
      const existing = state.drugBatches[idx]!
      existing.drugId = batchForm.drugId
      existing.batchNo = batchForm.batchNo.trim()
      existing.expiresOn = batchForm.expiresOn
      existing.qtyOnHand = batchForm.qtyOnHand
      const ext = existing as MockDrugBatch & { costCents?: number }
      ext.costCents = batchForm.costCents
    }
  }
  else {
    const newBatch: MockDrugBatch & { costCents?: number } = {
      id: `batch-${Date.now()}`,
      drugId: batchForm.drugId,
      batchNo: batchForm.batchNo.trim(),
      expiresOn: batchForm.expiresOn,
      qtyOnHand: batchForm.qtyOnHand,
      facilityId: state.facility.id,
    }
    newBatch.costCents = batchForm.costCents
    state.drugBatches.push(newBatch)
  }
  batchDialogOpen.value = false
}

function deleteBatch(batch: MockDrugBatch) {
  const idx = state.drugBatches.findIndex(b => b.id === batch.id)
  if (idx !== -1) state.drugBatches.splice(idx, 1)
}

// ── columns ───────────────────────────────────────────────────────────────────
const drugColumns: ColumnDef<MockDrug>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Code' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.code),
    size: 120,
  },
  {
    accessorKey: 'display',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Display' }),
    cell: ({ row }) =>
      h('div', {}, [
        h('p', { class: 'text-sm font-medium' }, row.original.display),
        h('p', { class: 'text-muted-foreground text-xs italic' }, row.original.genericName),
      ]),
  },
  {
    accessorKey: 'form',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Form' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm capitalize' }, row.original.form),
    size: 110,
  },
  {
    accessorKey: 'strengthText',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Strength' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.strengthText),
    size: 120,
  },
  {
    accessorKey: 'schedule',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Schedule' }),
    cell: ({ row }) =>
      row.original.schedule
        ? h(
            Badge,
            { variant: scheduleVariant(row.original.schedule), class: 'text-xs' },
            () => `Schedule ${row.original.schedule}`,
          )
        : h('span', { class: 'text-muted-foreground text-xs' }, '—'),
    size: 130,
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': drugIsActive(row.original),
        'onUpdate:checked': () => toggleDrugActive(row.original),
      }),
    enableSorting: false,
    size: 80,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const drug = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEditDrug(drug) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteDrug(drug) },
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

const batchColumns: ColumnDef<MockDrugBatch>[] = [
  {
    id: 'drug',
    accessorFn: row => drugDisplayById(row.drugId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Drug' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm' }, drugDisplayById(row.original.drugId)),
  },
  {
    accessorKey: 'batchNo',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Batch #' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.batchNo),
    size: 160,
  },
  {
    accessorKey: 'expiresOn',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Expires' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm' }, formatDate(row.original.expiresOn)),
    size: 140,
  },
  {
    accessorKey: 'qtyOnHand',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Qty on hand' }),
    cell: ({ row }) =>
      h('span', { class: 'text-sm tabular-nums' }, row.original.qtyOnHand),
    size: 120,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const batch = row.original
      const badges: ReturnType<typeof h>[] = []
      if (isExpired(batch)) {
        badges.push(h(Badge, { variant: 'destructive', class: 'text-xs' }, () => 'Expired'))
      }
      else if (isNearExpiry(batch)) {
        badges.push(h(Badge, { variant: 'warning', class: 'text-xs' }, () => 'Near expiry'))
      }
      if (isLowStock(batch)) {
        badges.push(h(Badge, { variant: 'warning', class: 'text-xs' }, () => 'Low stock'))
      }
      if (!badges.length) {
        return h('span', { class: 'text-muted-foreground text-xs' }, 'OK')
      }
      return h('div', { class: 'flex flex-wrap gap-1' }, badges)
    },
    enableSorting: false,
    size: 180,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const batch = row.original
      return h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: 'ghost', size: 'icon', class: 'size-7' }, () =>
              h(MoreHorizontal, { class: 'size-3.5' }),
            ),
          ),
          h(DropdownMenuContent, { align: 'end' }, () => [
            h(DropdownMenuItem, { onSelect: () => openEditBatch(batch) }, () => 'Edit'),
            h(
              DropdownMenuItem,
              { class: 'text-destructive focus:text-destructive', onSelect: () => deleteBatch(batch) },
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
        title="Drugs & batches"
        description="Formulary management and inventory batch tracking."
      />
      <template #actions>
        <Button
          size="sm"
          variant="outline"
          class="gap-2"
          @click="openAddDrug"
        >
          <Plus class="size-4" />
          Add drug
        </Button>
        <Button
          size="sm"
          class="gap-2"
          @click="openReceiveBatch"
        >
          <Plus class="size-4" />
          Receive batch
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <Tabs default-value="drugs">
        <TabsList class="mb-4">
          <TabsTrigger value="drugs">
            <Package class="mr-1.5 size-3.5" />
            Drugs
          </TabsTrigger>
          <TabsTrigger value="batches">
            <Package class="mr-1.5 size-3.5" />
            Batches
          </TabsTrigger>
        </TabsList>

        <!-- ── Drugs tab ───────────────────────────────────────────────────── -->
        <TabsContent value="drugs">
          <DataTable
            :columns="drugColumns"
            :data="state.drugs"
            filter-column="display"
            filter-placeholder="Search by display name…"
            sticky-header
            max-height="70vh"
          >
            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <Pill class="size-8 opacity-50" />
                <span class="text-sm">No drugs in catalog.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>

        <!-- ── Batches tab ─────────────────────────────────────────────────── -->
        <TabsContent value="batches">
          <DataTable
            :columns="batchColumns"
            :data="state.drugBatches"
            filter-column="batchNo"
            filter-placeholder="Search by batch number…"
            sticky-header
            max-height="70vh"
          >
            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <Package class="size-8 opacity-50" />
                <span class="text-sm">No batches on record.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>
      </Tabs>
    </PageBody>

    <!-- ── Drug dialog ─────────────────────────────────────────────────────── -->
    <Dialog v-model:open="drugDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingDrug ? 'Edit drug' : 'Add drug' }}</DialogTitle>
          <DialogDescription>
            {{ editingDrug ? 'Update formulary entry.' : 'Add a new drug to the formulary.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="drug-code">Code <span class="text-destructive">*</span></Label>
              <Input
                id="drug-code"
                v-model="drugForm.code"
                placeholder="PARA500T"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="drug-strength">Strength <span class="text-destructive">*</span></Label>
              <Input
                id="drug-strength"
                v-model="drugForm.strengthText"
                placeholder="500 mg"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="drug-display">Display name <span class="text-destructive">*</span></Label>
            <Input
              id="drug-display"
              v-model="drugForm.display"
              placeholder="Paracetamol 500 mg Tablet"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="drug-generic">Generic name</Label>
            <Input
              id="drug-generic"
              v-model="drugForm.genericName"
              placeholder="paracetamol"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="drug-form">Form <span class="text-destructive">*</span></Label>
              <Select v-model="drugForm.form">
                <SelectTrigger id="drug-form">
                  <SelectValue placeholder="Form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="f in DRUG_FORMS"
                    :key="f"
                    :value="f"
                    class="capitalize"
                  >
                    {{ f }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="drug-schedule">Schedule</Label>
              <Select v-model="drugForm.schedule">
                <SelectTrigger id="drug-schedule">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    None
                  </SelectItem>
                  <SelectItem value="1">
                    Schedule 1
                  </SelectItem>
                  <SelectItem value="2">
                    Schedule 2
                  </SelectItem>
                  <SelectItem value="3">
                    Schedule 3
                  </SelectItem>
                  <SelectItem value="4">
                    Schedule 4
                  </SelectItem>
                  <SelectItem value="5">
                    Schedule 5
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Switch
              id="drug-active"
              :checked="drugForm.active"
              @update:checked="(v: boolean) => drugForm.active = v"
            />
            <Label for="drug-active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!canSaveDrug"
            @click="saveDrug"
          >
            {{ editingDrug ? 'Save changes' : 'Add drug' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ── Batch dialog ─────────────────────────────────────────────────────── -->
    <Dialog v-model:open="batchDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingBatch ? 'Edit batch' : 'Receive batch' }}</DialogTitle>
          <DialogDescription>
            {{ editingBatch ? 'Update batch record.' : 'Record a newly received stock batch.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="batch-drug">Drug <span class="text-destructive">*</span></Label>
            <Select v-model="batchForm.drugId">
              <SelectTrigger id="batch-drug">
                <SelectValue placeholder="Select drug…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="drug in state.drugs"
                  :key="drug.id"
                  :value="drug.id"
                >
                  {{ drug.display }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="batch-no">Batch number <span class="text-destructive">*</span></Label>
            <Input
              id="batch-no"
              v-model="batchForm.batchNo"
              placeholder="PARA-2025-0001"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="batch-expires">Expires on <span class="text-destructive">*</span></Label>
              <Input
                id="batch-expires"
                v-model="batchForm.expiresOn"
                type="date"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="batch-qty">Qty on hand <span class="text-destructive">*</span></Label>
              <Input
                id="batch-qty"
                v-model.number="batchForm.qtyOnHand"
                type="number"
                :min="0"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="batch-cost">Cost (cents, optional)</Label>
            <Input
              id="batch-cost"
              v-model.number="batchForm.costCents"
              type="number"
              :min="0"
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!canSaveBatch"
            @click="saveBatch"
          >
            {{ editingBatch ? 'Save changes' : 'Receive batch' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
