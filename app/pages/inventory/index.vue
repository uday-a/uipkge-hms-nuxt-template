<script setup lang="ts">
import {
  Package,
  AlertTriangle,
  ClipboardList,
  ArrowLeftRight,
  Plus,
  Loader2,
  PackageOpen,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'

import { KpiGrid } from '@/components/ui/kpi-grid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Inventory — HMS' })

// ── helpers ────────────────────────────────────────────────────────────
function rupees(cents: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100)
}

// ── state ──────────────────────────────────────────────────────────────
const state = useMockState()

const stores = computed(() => state.inventoryStores)
const items = computed(() => state.inventoryItems)
const stockLevels = computed(() => state.inventoryStockLevels)

// ── KPIs ───────────────────────────────────────────────────────────────
const totalSKUs = computed(() => items.value.length)

const lowStockCount = computed(() => {
  return stockLevels.value.filter((sl) => {
    const item = items.value.find(i => i.id === sl.itemId)
    if (!item) return false
    return sl.qtyOnHand <= item.reorderLevel
  }).length
})

const pendingGRNs = computed(() => {
  // All GRNs received in last 3 days = pending review
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 3)
  return state.inventoryGRNs.filter(g => new Date(g.receivedAt) >= cutoff).length
})

const pendingTransfers = computed(() => {
  return state.inventoryTransfers.filter(t => t.status === 'pending' || t.status === 'in_transit').length
})

// ── Store picker for "By store" tab ────────────────────────────────────
const selectedStoreId = ref(stores.value[0]?.id ?? '')

const storeStockRows = computed(() => {
  return stockLevels.value
    .filter(sl => sl.storeId === selectedStoreId.value)
    .map((sl) => {
      const item = items.value.find(i => i.id === sl.itemId)!
      const low = sl.qtyOnHand <= item.reorderLevel
      return { ...sl, item, low }
    })
    .sort((a, b) => a.item.display.localeCompare(b.item.display))
})

// ── Low stock rows (global) ────────────────────────────────────────────
const lowStockRows = computed(() => {
  return stockLevels.value
    .filter((sl) => {
      const item = items.value.find(i => i.id === sl.itemId)
      if (!item) return false
      return sl.qtyOnHand <= item.reorderLevel
    })
    .map((sl) => {
      const item = items.value.find(i => i.id === sl.itemId)!
      const store = stores.value.find(s => s.id === sl.storeId)!
      return { ...sl, item, store }
    })
    .sort((a, b) => a.item.display.localeCompare(b.item.display))
})

// ── All items (global totals) ──────────────────────────────────────────
const allItemRows = computed(() => {
  return items.value.map((item) => {
    const totalQty = stockLevels.value
      .filter(sl => sl.itemId === item.id)
      .reduce((sum, sl) => sum + sl.qtyOnHand, 0)
    const low = totalQty <= item.reorderLevel
    return { item, totalQty, low }
  }).sort((a, b) => a.item.display.localeCompare(b.item.display))
})

// ── Add GRN dialog (quick action from index) ───────────────────────────
const grnDialogOpen = ref(false)
const grnSubmitting = ref(false)

const grnForm = reactive({
  storeId: '',
  supplierName: '',
  lineItemId: '',
  lineQty: 1,
  lineUnitCostCents: 0,
  lineBatchNo: '',
})

const grnLineTotal = computed(() => {
  return grnForm.lineQty * grnForm.lineUnitCostCents
})

function openGrnDialog() {
  grnForm.storeId = stores.value[0]?.id ?? ''
  grnForm.supplierName = ''
  grnForm.lineItemId = ''
  grnForm.lineQty = 1
  grnForm.lineUnitCostCents = 0
  grnForm.lineBatchNo = ''
  grnDialogOpen.value = true
}

function submitGrn() {
  if (!grnForm.storeId || !grnForm.supplierName.trim() || !grnForm.lineItemId || grnForm.lineQty < 1 || grnForm.lineUnitCostCents < 0) return
  grnSubmitting.value = true

  const grnNo = `GRN-${new Date().getFullYear()}-${String(state.inventoryGRNs.length + 1).padStart(6, '0')}`
  const newGRN = {
    id: `grn-${Date.now()}`,
    grnNo,
    receivedAt: new Date().toISOString(),
    receivedByUserId: 101,
    storeId: grnForm.storeId,
    supplierName: grnForm.supplierName.trim(),
    lines: [{
      itemId: grnForm.lineItemId,
      qty: grnForm.lineQty,
      unitCostCents: grnForm.lineUnitCostCents,
      batchNo: grnForm.lineBatchNo.trim() || undefined,
    }],
    totalCents: grnLineTotal.value,
  }
  state.inventoryGRNs.push(newGRN)

  // Update stock level
  const sl = state.inventoryStockLevels.find(s => s.storeId === grnForm.storeId && s.itemId === grnForm.lineItemId)
  if (sl) {
    sl.qtyOnHand += grnForm.lineQty
  }

  grnSubmitting.value = false
  grnDialogOpen.value = false
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Inventory"
        description="Multi-store stock overview and low-stock alerts"
      />
      <template #actions>
        <Button
          size="sm"
          variant="outline"
          @click="openGrnDialog"
        >
          <Plus class="mr-2 size-4" />
          Quick GRN
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- ── KPIs ─────────────────────────────────────────────────────── -->
      <KpiGrid :columns="4">
        <Card class="transition-shadow hover:shadow-md">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-muted-foreground text-sm font-medium">
                Total SKUs
              </CardTitle>
              <Package class="text-muted-foreground size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">
              {{ totalSKUs }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              active items in catalog
            </p>
          </CardContent>
        </Card>

        <Card class="transition-shadow hover:shadow-md">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-muted-foreground text-sm font-medium">
                Low Stock Alerts
              </CardTitle>
              <AlertTriangle class="text-muted-foreground size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-2">
              <p class="text-3xl font-bold">
                {{ lowStockCount }}
              </p>
              <Badge
                v-if="lowStockCount > 0"
                variant="destructive"
                class="text-xs"
              >
                Action needed
              </Badge>
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              at or below reorder level
            </p>
          </CardContent>
        </Card>

        <Card class="transition-shadow hover:shadow-md">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-muted-foreground text-sm font-medium">
                Recent GRNs
              </CardTitle>
              <ClipboardList class="text-muted-foreground size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">
              {{ pendingGRNs }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              received in last 3 days
            </p>
          </CardContent>
        </Card>

        <Card class="transition-shadow hover:shadow-md">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-muted-foreground text-sm font-medium">
                Pending Transfers
              </CardTitle>
              <ArrowLeftRight class="text-muted-foreground size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">
              {{ pendingTransfers }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              in transit or awaiting dispatch
            </p>
          </CardContent>
        </Card>
      </KpiGrid>

      <!-- ── Tabs ─────────────────────────────────────────────────────── -->
      <Tabs default-value="by-store">
        <TabsList>
          <TabsTrigger value="by-store">
            By store
          </TabsTrigger>
          <TabsTrigger value="low-stock">
            Low stock
          </TabsTrigger>
          <TabsTrigger value="all-items">
            All items
          </TabsTrigger>
        </TabsList>

        <!-- By store -->
        <TabsContent
          value="by-store"
          class="space-y-4"
        >
          <div class="flex items-center gap-3">
            <Label class="text-sm">Store</Label>
            <Select v-model="selectedStoreId">
              <SelectTrigger class="w-56">
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

          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead class="w-28">
                    Category
                  </TableHead>
                  <TableHead class="w-24 text-right">
                    Qty
                  </TableHead>
                  <TableHead class="w-24 text-right">
                    Reorder
                  </TableHead>
                  <TableHead class="w-24">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="storeStockRows.length === 0">
                  No stock records for this store.
                </TableEmpty>
                <TableRow
                  v-for="row in storeStockRows"
                  :key="row.id"
                >
                  <TableCell class="font-mono text-xs text-muted-foreground">
                    {{ row.item.code }}
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ row.item.display }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground capitalize">
                    {{ row.item.category }}
                  </TableCell>
                  <TableCell class="text-right text-sm tabular-nums">
                    {{ row.qtyOnHand }}
                  </TableCell>
                  <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                    {{ row.item.reorderLevel }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="row.low ? 'destructive' : 'default'"
                      class="text-xs"
                    >
                      {{ row.low ? 'Low' : 'OK' }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <!-- Low stock -->
        <TabsContent value="low-stock">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead class="w-36">
                    Store
                  </TableHead>
                  <TableHead class="w-24 text-right">
                    Qty
                  </TableHead>
                  <TableHead class="w-24 text-right">
                    Reorder
                  </TableHead>
                  <TableHead class="w-28">
                    Category
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="lowStockRows.length === 0">
                  <div class="flex flex-col items-center gap-2 py-8 text-center">
                    <PackageOpen class="text-muted-foreground size-8" />
                    <p class="text-muted-foreground text-sm">
                      No low stock alerts. All items are above reorder levels.
                    </p>
                  </div>
                </TableEmpty>
                <TableRow
                  v-for="row in lowStockRows"
                  :key="row.id"
                >
                  <TableCell class="text-sm">
                    {{ row.item.display }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ row.store.name }}
                  </TableCell>
                  <TableCell class="text-right text-sm tabular-nums font-medium">
                    {{ row.qtyOnHand }}
                  </TableCell>
                  <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                    {{ row.item.reorderLevel }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="destructive"
                      class="text-xs capitalize"
                    >
                      {{ row.item.category }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <!-- All items -->
        <TabsContent value="all-items">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead class="w-28">
                    Category
                  </TableHead>
                  <TableHead class="w-20 text-right">
                    Total Qty
                  </TableHead>
                  <TableHead class="w-24 text-right">
                    Reorder
                  </TableHead>
                  <TableHead class="w-24">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="allItemRows.length === 0">
                  No items in catalog.
                </TableEmpty>
                <TableRow
                  v-for="row in allItemRows"
                  :key="row.item.id"
                >
                  <TableCell class="font-mono text-xs text-muted-foreground">
                    {{ row.item.code }}
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ row.item.display }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground capitalize">
                    {{ row.item.category }}
                  </TableCell>
                  <TableCell class="text-right text-sm tabular-nums">
                    {{ row.totalQty }}
                  </TableCell>
                  <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                    {{ row.item.reorderLevel }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="row.low ? 'destructive' : 'default'"
                      class="text-xs"
                    >
                      {{ row.low ? 'Low' : 'OK' }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </PageBody>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Quick GRN dialog                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="grnDialogOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick GRN</DialogTitle>
          <DialogDescription>
            Record a quick goods receipt note into a store.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Store <span class="text-destructive">*</span></Label>
            <Select v-model="grnForm.storeId">
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
              v-model="grnForm.supplierName"
              placeholder="e.g. MediSupply Corp"
            />
          </div>

          <div class="space-y-1.5">
            <Label>Item <span class="text-destructive">*</span></Label>
            <Select v-model="grnForm.lineItemId">
              <SelectTrigger>
                <SelectValue placeholder="Select item…" />
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

          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label for="grn-qty">Qty</Label>
              <Input
                id="grn-qty"
                v-model.number="grnForm.lineQty"
                type="number"
                min="1"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="grn-cost">Unit cost (₹)</Label>
              <Input
                id="grn-cost"
                :model-value="grnForm.lineUnitCostCents / 100"
                type="number"
                min="0"
                step="1"
                @update:model-value="(v: number | string) => (grnForm.lineUnitCostCents = Math.round(Number(v) * 100))"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="grn-batch">Batch #</Label>
              <Input
                id="grn-batch"
                v-model="grnForm.lineBatchNo"
                placeholder="Optional"
              />
            </div>
          </div>

          <p class="text-sm text-muted-foreground">
            Line total: <span class="font-medium text-foreground">{{ rupees(grnLineTotal) }}</span>
          </p>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="grnSubmitting || !grnForm.storeId || !grnForm.supplierName.trim() || !grnForm.lineItemId || grnForm.lineQty < 1"
            @click="submitGrn"
          >
            <Loader2
              v-if="grnSubmitting"
              class="mr-2 size-4 animate-spin"
            />
            Record GRN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
