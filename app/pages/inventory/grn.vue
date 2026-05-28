<script setup lang="ts">
import {
  Plus,
  Loader2,
  ClipboardList,
  Trash2,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MockGRNLine } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Goods Receipt Notes — HMS' })

// ── helpers ────────────────────────────────────────────────────────────
function rupees(cents: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── state ──────────────────────────────────────────────────────────────
const state = useMockState()

const stores = computed(() => state.inventoryStores)
const items = computed(() => state.inventoryItems)
const grns = computed(() =>
  [...state.inventoryGRNs].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()),
)

function storeName(id: string) {
  return stores.value.find(s => s.id === id)?.name ?? id
}

function itemDisplay(id: string) {
  return items.value.find(i => i.id === id)?.display ?? id
}

// ── Add GRN dialog ─────────────────────────────────────────────────────
const dialogOpen = ref(false)
const submitting = ref(false)

const form = reactive({
  storeId: '',
  supplierName: '',
  lines: [] as MockGRNLine[],
})

const formTotal = computed(() => {
  return form.lines.reduce((sum, l) => sum + l.qty * l.unitCostCents, 0)
})

function openDialog() {
  form.storeId = stores.value[0]?.id ?? ''
  form.supplierName = ''
  form.lines = []
  dialogOpen.value = true
}

function addLine() {
  form.lines.push({ itemId: '', qty: 1, unitCostCents: 0, batchNo: '' })
}

function removeLine(idx: number) {
  form.lines.splice(idx, 1)
}

function submitGRN() {
  if (!form.storeId || !form.supplierName.trim() || form.lines.length === 0) return
  if (form.lines.some(l => !l.itemId || l.qty < 1 || l.unitCostCents < 0)) return
  submitting.value = true

  const grnNo = `GRN-${new Date().getFullYear()}-${String(state.inventoryGRNs.length + 1).padStart(6, '0')}`
  const newGRN = {
    id: `grn-${Date.now()}`,
    grnNo,
    receivedAt: new Date().toISOString(),
    receivedByUserId: 101,
    storeId: form.storeId,
    supplierName: form.supplierName.trim(),
    lines: form.lines.map(l => ({
      itemId: l.itemId,
      qty: l.qty,
      unitCostCents: l.unitCostCents,
      batchNo: l.batchNo?.trim() || undefined,
    })),
    totalCents: formTotal.value,
  }
  state.inventoryGRNs.push(newGRN)

  // Update stock levels
  for (const line of form.lines) {
    const sl = state.inventoryStockLevels.find(s => s.storeId === form.storeId && s.itemId === line.itemId)
    if (sl) {
      sl.qtyOnHand += line.qty
    }
  }

  submitting.value = false
  dialogOpen.value = false
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Goods Receipt Notes"
        description="Incoming stock receipts by store and supplier"
      />
      <template #actions>
        <Button
          size="sm"
          @click="openDialog"
        >
          <Plus class="mr-2 size-4" />
          Add GRN
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <SectionCard title="All GRNs">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN #</TableHead>
                <TableHead class="w-32">
                  Date
                </TableHead>
                <TableHead class="w-36">
                  Store
                </TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead class="w-28 text-right">
                  Items
                </TableHead>
                <TableHead class="w-32 text-right">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="grns.length === 0">
                <div class="flex flex-col items-center gap-2 py-8 text-center">
                  <ClipboardList class="text-muted-foreground size-8" />
                  <p class="text-muted-foreground text-sm">
                    No GRNs recorded yet.
                  </p>
                </div>
              </TableEmpty>
              <TableRow
                v-for="grn in grns"
                :key="grn.id"
              >
                <TableCell class="font-mono text-xs font-medium">
                  {{ grn.grnNo }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ fmtDate(grn.receivedAt) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ storeName(grn.storeId) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ grn.supplierName }}
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums">
                  {{ grn.lines.length }}
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums font-medium">
                  {{ rupees(grn.totalCents) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- GRN detail cards -->
      <SectionCard title="GRN Details">
        <div class="space-y-4">
          <div
            v-for="grn in grns.slice(0, 6)"
            :key="grn.id"
            class="rounded-md border"
          >
            <div class="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
              <div class="flex items-center gap-3">
                <span class="font-mono text-xs font-semibold">{{ grn.grnNo }}</span>
                <Badge
                  variant="outline"
                  class="text-xs"
                >
                  {{ storeName(grn.storeId) }}
                </Badge>
              </div>
              <span class="text-muted-foreground text-xs">{{ fmtDate(grn.receivedAt) }}</span>
            </div>
            <div class="rounded-md border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead class="w-24 text-right">
                      Qty
                    </TableHead>
                    <TableHead class="w-28 text-right">
                      Unit cost
                    </TableHead>
                    <TableHead class="w-28 text-right">
                      Line total
                    </TableHead>
                    <TableHead class="w-28">
                      Batch
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(line, idx) in grn.lines"
                    :key="idx"
                  >
                    <TableCell class="text-sm">
                      {{ itemDisplay(line.itemId) }}
                    </TableCell>
                    <TableCell class="text-right text-sm tabular-nums">
                      {{ line.qty }}
                    </TableCell>
                    <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                      {{ rupees(line.unitCostCents) }}
                    </TableCell>
                    <TableCell class="text-right text-sm tabular-nums font-medium">
                      {{ rupees(line.qty * line.unitCostCents) }}
                    </TableCell>
                    <TableCell class="font-mono text-xs text-muted-foreground">
                      {{ line.batchNo ?? '—' }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageBody>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Add GRN dialog                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add GRN</DialogTitle>
          <DialogDescription>
            Record a new goods receipt note with line items.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Store <span class="text-destructive">*</span></Label>
            <Select v-model="form.storeId">
              <SelectTrigger>
                <SelectValue placeholder="Select store…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="st in stores"
                  :key="st.id"
                  :value="st.id"
                >
                  {{ st.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="grn-supplier">Supplier <span class="text-destructive">*</span></Label>
            <Input
              id="grn-supplier"
              v-model="form.supplierName"
              placeholder="e.g. MediSupply Corp"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label>Line items</Label>
              <Button
                variant="outline"
                size="sm"
                @click="addLine"
              >
                <Plus class="mr-2 size-4" />
                Add line
              </Button>
            </div>

            <div
              v-for="(line, idx) in form.lines"
              :key="idx"
              class="grid grid-cols-12 gap-2 rounded-md border p-3"
            >
              <div class="col-span-5 space-y-1">
                <Label class="text-xs">Item</Label>
                <Select v-model="line.itemId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="it in items"
                      :key="it.id"
                      :value="it.id"
                    >
                      {{ it.display }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="col-span-2 space-y-1">
                <Label class="text-xs">Qty</Label>
                <Input
                  v-model.number="line.qty"
                  type="number"
                  min="1"
                />
              </div>
              <div class="col-span-3 space-y-1">
                <Label class="text-xs">Unit cost (₹)</Label>
                <Input
                  :model-value="line.unitCostCents / 100"
                  type="number"
                  min="0"
                  step="1"
                  @update:model-value="(v: number | string) => (line.unitCostCents = Math.round(Number(v) * 100))"
                />
              </div>
              <div class="col-span-1 space-y-1">
                <Label class="text-xs">Batch</Label>
                <Input
                  v-model="line.batchNo"
                  placeholder="…"
                />
              </div>
              <div class="col-span-1 flex items-end justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive"
                  @click="removeLine(idx)"
                >
                  <span class="sr-only">Remove</span>
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>

            <p
              v-if="form.lines.length === 0"
              class="text-muted-foreground text-sm"
            >
              No lines yet. Add one above.
            </p>
          </div>

          <p class="text-sm text-muted-foreground">
            GRN total: <span class="font-medium text-foreground">{{ rupees(formTotal) }}</span>
          </p>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="submitting || !form.storeId || !form.supplierName.trim() || form.lines.length === 0"
            @click="submitGRN"
          >
            <Loader2
              v-if="submitting"
              class="mr-2 size-4 animate-spin"
            />
            Record GRN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
