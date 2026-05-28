<script setup lang="ts">
// Wards admin -- two DataTables (Units, Beds) inside Tabs. Each tab's
// Add button is mounted into the DataTable's #toolbar-extra slot so the
// page only has one Page/PageBody chrome.
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Plus, BedDouble, Bed } from 'lucide-vue-next'
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
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import type { MockUnit, MockBed } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Wards · Admin' })

const state = useMockState()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deptName(deptId: string): string {
  return state.departments.find(d => d.id === deptId)?.name ?? deptId
}

function unitName(unitId: string): string {
  return state.units.find(u => u.id === unitId)?.name ?? unitId
}

// ─── Unit active toggle (simulated via extended property) ─────────────────────

type UnitWithActive = MockUnit & { active?: boolean }

function unitIsActive(unit: MockUnit): boolean {
  return (unit as UnitWithActive).active !== undefined ? (unit as UnitWithActive).active! : true
}

function toggleUnitActive(unit: MockUnit) {
  const u = unit as UnitWithActive
  u.active = u.active !== undefined ? !u.active : false
}

// ─── Bed active toggle ────────────────────────────────────────────────────────

type BedWithActive = MockBed & { active?: boolean }

function bedIsActive(bed: MockBed): boolean {
  return (bed as BedWithActive).active !== undefined ? (bed as BedWithActive).active! : true
}

function toggleBedActive(bed: MockBed) {
  const b = bed as BedWithActive
  b.active = b.active !== undefined ? !b.active : false
}

// ─── Unit dialog ──────────────────────────────────────────────────────────────

const unitDialogOpen = ref(false)
const editingUnit = ref<MockUnit | null>(null)

const unitForm = reactive({
  departmentId: '',
  code: '',
  name: '',
})

function openAddUnit() {
  editingUnit.value = null
  unitForm.departmentId = state.departments[0]?.id ?? ''
  unitForm.code = ''
  unitForm.name = ''
  unitDialogOpen.value = true
}

function openEditUnit(unit: MockUnit) {
  editingUnit.value = unit
  unitForm.departmentId = unit.departmentId
  unitForm.code = unit.code
  unitForm.name = unit.name
  unitDialogOpen.value = true
}

function saveUnit() {
  if (editingUnit.value) {
    const idx = state.units.findIndex(u => u.id === editingUnit.value!.id)
    if (idx !== -1) {
      const u = state.units[idx]!
      u.departmentId = unitForm.departmentId
      u.code = unitForm.code.trim()
      u.name = unitForm.name.trim()
    }
  }
  else {
    state.units.push({
      id: `unit-${Date.now()}`,
      departmentId: unitForm.departmentId,
      code: unitForm.code.trim(),
      name: unitForm.name.trim(),
    })
  }
  unitDialogOpen.value = false
}

// ─── Bed dialog ───────────────────────────────────────────────────────────────

const bedDialogOpen = ref(false)
const editingBed = ref<MockBed | null>(null)

const bedForm = reactive({
  unitId: '',
  label: '',
  status: 'available' as MockBed['status'],
})

const BED_STATUSES: MockBed['status'][] = ['available', 'occupied', 'cleaning', 'maintenance', 'blocked']

function openAddBed() {
  editingBed.value = null
  bedForm.unitId = state.units[0]?.id ?? ''
  bedForm.label = ''
  bedForm.status = 'available'
  bedDialogOpen.value = true
}

function openEditBed(bed: MockBed) {
  editingBed.value = bed
  bedForm.unitId = bed.unitId
  bedForm.label = bed.label
  bedForm.status = bed.status
  bedDialogOpen.value = true
}

function saveBed() {
  if (editingBed.value) {
    const idx = state.beds.findIndex(b => b.id === editingBed.value!.id)
    if (idx !== -1) {
      const b = state.beds[idx]!
      b.unitId = bedForm.unitId
      b.label = bedForm.label.trim()
      b.status = bedForm.status
    }
  }
  else {
    state.beds.push({
      id: `bed-${Date.now()}`,
      unitId: bedForm.unitId,
      label: bedForm.label.trim(),
      status: bedForm.status,
    })
  }
  bedDialogOpen.value = false
}

function bedStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
  if (status === 'available') return 'success'
  if (status === 'occupied') return 'default'
  if (status === 'cleaning' || status === 'maintenance') return 'secondary'
  if (status === 'blocked') return 'destructive'
  return 'outline'
}

// ─── Unit columns ─────────────────────────────────────────────────────────────

const unitColumns: ColumnDef<MockUnit>[] = [
  {
    id: 'department',
    accessorFn: row => deptName(row.departmentId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Department' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, deptName(row.original.departmentId)),
  },
  {
    accessorKey: 'code',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Code' }),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.code),
    size: 120,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Name' }),
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.name),
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': unitIsActive(row.original),
        'onUpdate:checked': () => toggleUnitActive(row.original),
      }),
    enableSorting: false,
    enableHiding: false,
    size: 96,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        Button,
        { variant: 'outline', size: 'sm', onClick: () => openEditUnit(row.original) },
        () => 'Edit',
      ),
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
]

// ─── Bed columns ──────────────────────────────────────────────────────────────

const bedColumns: ColumnDef<MockBed>[] = [
  {
    id: 'unit',
    accessorFn: row => unitName(row.unitId),
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Unit' }),
    cell: ({ row }) => h('span', { class: 'text-sm' }, unitName(row.original.unitId)),
  },
  {
    accessorKey: 'label',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Label' }),
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.label),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader as any, { column, label: 'Status' }),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: bedStatusVariant(row.original.status), class: 'capitalize text-xs' },
        () => row.original.status,
      ),
    size: 120,
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) =>
      h(Switch, {
        'checked': bedIsActive(row.original),
        'onUpdate:checked': () => toggleBedActive(row.original),
      }),
    enableSorting: false,
    enableHiding: false,
    size: 96,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        Button,
        { variant: 'outline', size: 'sm', onClick: () => openEditBed(row.original) },
        () => 'Edit',
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
        title="Wards admin"
        description="Manage hospital units and beds."
      />
      <template #actions>
        <Button
          size="sm"
          variant="outline"
          class="gap-2"
          @click="openAddUnit"
        >
          <Plus class="size-4" />
          Add unit
        </Button>
        <Button
          size="sm"
          class="gap-2"
          @click="openAddBed"
        >
          <Plus class="size-4" />
          Add bed
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <Tabs default-value="units">
        <TabsList class="mb-4">
          <TabsTrigger value="units">
            Units
            <Badge
              variant="secondary"
              class="ml-1.5 text-xs"
            >
              {{ state.units.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="beds">
            Beds
            <Badge
              variant="secondary"
              class="ml-1.5 text-xs"
            >
              {{ state.beds.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- ── Units tab ──────────────────────────────────────────────────────── -->
        <TabsContent value="units">
          <DataTable
            :columns="unitColumns"
            :data="state.units"
            filter-column="name"
            filter-placeholder="Search by name…"
            sticky-header
            max-height="70vh"
          >
            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <BedDouble class="size-8 opacity-50" />
                <span class="text-sm">No units configured.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>

        <!-- ── Beds tab ───────────────────────────────────────────────────────── -->
        <TabsContent value="beds">
          <DataTable
            :columns="bedColumns"
            :data="state.beds"
            filter-column="label"
            filter-placeholder="Search by label…"
            sticky-header
            max-height="70vh"
          >
            <template #empty>
              <div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <Bed class="size-8 opacity-50" />
                <span class="text-sm">No beds configured.</span>
              </div>
            </template>
          </DataTable>
        </TabsContent>
      </Tabs>
    </PageBody>

    <!-- ── Unit dialog ──────────────────────────────────────────────────────── -->
    <Dialog v-model:open="unitDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingUnit ? 'Edit unit' : 'Add unit' }}</DialogTitle>
          <DialogDescription>
            {{ editingUnit ? 'Update unit details.' : 'Create a new ward unit.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="ward-dept">Department <span class="text-destructive">*</span></Label>
            <Select v-model="unitForm.departmentId">
              <SelectTrigger id="ward-dept">
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="d in state.departments"
                  :key="d.id"
                  :value="d.id"
                >
                  {{ d.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="ward-code">Code <span class="text-destructive">*</span></Label>
              <Input
                id="ward-code"
                v-model="unitForm.code"
                placeholder="MED-A"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="ward-name">Name <span class="text-destructive">*</span></Label>
              <Input
                id="ward-name"
                v-model="unitForm.name"
                placeholder="Medical Ward A"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!unitForm.departmentId || !unitForm.code.trim() || !unitForm.name.trim()"
            @click="saveUnit"
          >
            {{ editingUnit ? 'Save changes' : 'Add unit' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ── Bed dialog ────────────────────────────────────────────────────────── -->
    <Dialog v-model:open="bedDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingBed ? 'Edit bed' : 'Add bed' }}</DialogTitle>
          <DialogDescription>
            {{ editingBed ? 'Update bed details.' : 'Add a new bed to a unit.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="bed-unit">Unit <span class="text-destructive">*</span></Label>
            <Select v-model="bedForm.unitId">
              <SelectTrigger id="bed-unit">
                <SelectValue placeholder="Select unit…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="u in state.units"
                  :key="u.id"
                  :value="u.id"
                >
                  {{ u.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="bed-label">Bed label <span class="text-destructive">*</span></Label>
            <Input
              id="bed-label"
              v-model="bedForm.label"
              placeholder="MED-A 07"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="bed-status">Status</Label>
            <Select v-model="bedForm.status">
              <SelectTrigger id="bed-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="s in BED_STATUSES"
                  :key="s"
                  :value="s"
                  class="capitalize"
                >
                  {{ s }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!bedForm.unitId || !bedForm.label.trim()"
            @click="saveBed"
          >
            {{ editingBed ? 'Save changes' : 'Add bed' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
