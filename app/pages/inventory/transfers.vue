<script setup lang="ts">
import {
  Plus,
  Loader2,
  ArrowLeftRight,
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
import type { MockStockTransferLine } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Stock Transfers — HMS' })

// ── helpers ────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusVariant(status: string) {
  if (status === 'received') return 'default' as const
  if (status === 'in_transit') return 'secondary' as const
  if (status === 'pending') return 'outline' as const
  return 'destructive' as const
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending',
    in_transit: 'In transit',
    received: 'Received',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

// ── state ──────────────────────────────────────────────────────────────
const state = useMockState()

const stores = computed(() => state.inventoryStores)
const items = computed(() => state.inventoryItems)
const transfers = computed(() =>
  [...state.inventoryTransfers].sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()),
)

function storeName(id: string) {
  return stores.value.find(s => s.id === id)?.name ?? id
}

function itemDisplay(id: string) {
  return items.value.find(i => i.id === id)?.display ?? id
}

// ── New transfer dialog ────────────────────────────────────────────────
const dialogOpen = ref(false)
const submitting = ref(false)

const form = reactive({
  fromStoreId: '',
  toStoreId: '',
  lines: [] as MockStockTransferLine[],
})

function openDialog() {
  form.fromStoreId = stores.value[0]?.id ?? ''
  form.toStoreId = stores.value[1]?.id ?? ''
  form.lines = []
  dialogOpen.value = true
}

function addLine() {
  form.lines.push({ itemId: '', qty: 1 })
}

function removeLine(idx: number) {
  form.lines.splice(idx, 1)
}

function submitTransfer() {
  if (!form.fromStoreId || !form.toStoreId || form.fromStoreId === form.toStoreId || form.lines.length === 0) return
  if (form.lines.some(l => !l.itemId || l.qty < 1)) return
  submitting.value = true

  const transferNo = `TRF-${new Date().getFullYear()}-${String(state.inventoryTransfers.length + 1).padStart(4, '0')}`
  const newTransfer = {
    id: `trf-${Date.now()}`,
    transferNo,
    fromStoreId: form.fromStoreId,
    toStoreId: form.toStoreId,
    status: 'pending' as const,
    initiatedAt: new Date().toISOString(),
    lines: form.lines.map(l => ({ itemId: l.itemId, qty: l.qty })),
  }
  state.inventoryTransfers.push(newTransfer)

  submitting.value = false
  dialogOpen.value = false
}

// ── Receive action ─────────────────────────────────────────────────────
function receiveTransfer(id: string) {
  const trf = state.inventoryTransfers.find(t => t.id === id)
  if (!trf || trf.status !== 'in_transit') return

  trf.status = 'received'

  // Move stock
  for (const line of trf.lines) {
    const fromSl = state.inventoryStockLevels.find(s => s.storeId === trf.fromStoreId && s.itemId === line.itemId)
    const toSl = state.inventoryStockLevels.find(s => s.storeId === trf.toStoreId && s.itemId === line.itemId)
    if (fromSl) fromSl.qtyOnHand = Math.max(0, fromSl.qtyOnHand - line.qty)
    if (toSl) toSl.qtyOnHand += line.qty
  }
}

function cancelTransfer(id: string) {
  const trf = state.inventoryTransfers.find(t => t.id === id)
  if (!trf || trf.status === 'received' || trf.status === 'cancelled') return
  trf.status = 'cancelled'
}

function dispatchTransfer(id: string) {
  const trf = state.inventoryTransfers.find(t => t.id === id)
  if (!trf || trf.status !== 'pending') return
  trf.status = 'in_transit'
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Stock Transfers"
        description="Inter-store stock movements and transfer status"
      />
      <template #actions>
        <Button
          size="sm"
          @click="openDialog"
        >
          <Plus class="mr-2 size-4" />
          New transfer
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <SectionCard title="All Transfers">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer #</TableHead>
                <TableHead class="w-32">
                  Date
                </TableHead>
                <TableHead class="w-36">
                  From
                </TableHead>
                <TableHead class="w-36">
                  To
                </TableHead>
                <TableHead class="w-28 text-right">
                  Items
                </TableHead>
                <TableHead class="w-28">
                  Status
                </TableHead>
                <TableHead class="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="transfers.length === 0">
                <div class="flex flex-col items-center gap-2 py-8 text-center">
                  <ArrowLeftRight class="text-muted-foreground size-8" />
                  <p class="text-muted-foreground text-sm">
                    No transfers recorded yet.
                  </p>
                </div>
              </TableEmpty>
              <TableRow
                v-for="trf in transfers"
                :key="trf.id"
              >
                <TableCell class="font-mono text-xs font-medium">
                  {{ trf.transferNo }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ fmtDate(trf.initiatedAt) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ storeName(trf.fromStoreId) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ storeName(trf.toStoreId) }}
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums">
                  {{ trf.lines.reduce((s, l) => s + l.qty, 0) }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="statusVariant(trf.status)"
                    class="text-xs capitalize"
                  >
                    {{ statusLabel(trf.status) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Button
                      v-if="trf.status === 'pending'"
                      variant="outline"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="dispatchTransfer(trf.id)"
                    >
                      Dispatch
                    </Button>
                    <Button
                      v-if="trf.status === 'in_transit'"
                      variant="default"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="receiveTransfer(trf.id)"
                    >
                      Receive
                    </Button>
                    <Button
                      v-if="trf.status === 'pending'"
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      @click="cancelTransfer(trf.id)"
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Transfer detail cards -->
      <SectionCard title="Transfer Details">
        <div class="space-y-4">
          <div
            v-for="trf in transfers.slice(0, 4)"
            :key="trf.id"
            class="rounded-md border"
          >
            <div class="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
              <div class="flex items-center gap-3">
                <span class="font-mono text-xs font-semibold">{{ trf.transferNo }}</span>
                <Badge
                  :variant="statusVariant(trf.status)"
                  class="text-xs capitalize"
                >
                  {{ statusLabel(trf.status) }}
                </Badge>
              </div>
              <span class="text-muted-foreground text-xs">{{ fmtDate(trf.initiatedAt) }}</span>
            </div>
            <div class="rounded-md border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead class="w-24 text-right">
                      Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(line, idx) in trf.lines"
                    :key="idx"
                  >
                    <TableCell class="text-sm">
                      {{ itemDisplay(line.itemId) }}
                    </TableCell>
                    <TableCell class="text-right text-sm tabular-nums">
                      {{ line.qty }}
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
    <!-- New transfer dialog                                               -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Stock Transfer</DialogTitle>
          <DialogDescription>
            Create a transfer request between stores.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>From store <span class="text-destructive">*</span></Label>
              <Select v-model="form.fromStoreId">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
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
              <Label>To store <span class="text-destructive">*</span></Label>
              <Select v-model="form.toStoreId">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
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
              <div class="col-span-8 space-y-1">
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
              <div class="col-span-3 space-y-1">
                <Label class="text-xs">Qty</Label>
                <Input
                  v-model.number="line.qty"
                  type="number"
                  min="1"
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
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="submitting || !form.fromStoreId || !form.toStoreId || form.fromStoreId === form.toStoreId || form.lines.length === 0"
            @click="submitTransfer"
          >
            <Loader2
              v-if="submitting"
              class="mr-2 size-4 animate-spin"
            />
            Create transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
