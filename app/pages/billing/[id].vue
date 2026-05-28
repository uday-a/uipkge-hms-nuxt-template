<script setup lang="ts">
import {
  IndianRupee,
  Plus,
  CheckCircle2,
  Printer,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
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
import { Textarea } from '@/components/ui/textarea'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { MockBillLine, MockPayment } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

// ── Currency helper ────────────────────────────────────────────────────────────
function rupees(cents: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100)
}

// ── State / route ─────────────────────────────────────────────────────────────
const route = useRoute()
const state = useMockState()

const billId = computed(() => route.params.id as string)

const bill = computed(() => state.bills.find(b => b.id === billId.value))
const billLines = computed(() => state.billLines.filter(l => l.billId === billId.value))
const payments = computed(() => state.payments.filter(p => p.billId === billId.value))

watchEffect(() => {
  if (import.meta.client && bill.value === undefined) {
    navigateTo('/billing')
  }
})

const patient = computed(() => {
  if (!bill.value) return null
  return state.patients.find(p => p.id === bill.value!.patientId) ?? null
})

const encounter = computed(() => {
  if (!bill.value) return null
  return state.encounters.find(e => e.id === bill.value!.encounterId) ?? null
})

useHead(() => ({
  title: bill.value ? `${bill.value.billNo}` : 'Bill',
}))

// ── Labels / variants ─────────────────────────────────────────────────────────
type BillStatusVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

function statusVariant(status: string): BillStatusVariant {
  if (status === 'paid') return 'success'
  if (status === 'partially_paid') return 'warning'
  if (status === 'open') return 'secondary'
  if (status === 'cancelled') return 'destructive'
  return 'outline' // draft
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    partially_paid: 'Partially paid',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank transfer',
    insurance_pending: 'Insurance pending',
  }
  return map[method] ?? method
}

type MethodVariant = 'default' | 'secondary' | 'outline' | 'info' | 'warning'

function methodVariant(method: string): MethodVariant {
  if (method === 'cash') return 'secondary'
  if (method === 'card') return 'default'
  if (method === 'upi') return 'info'
  if (method === 'bank_transfer') return 'secondary'
  if (method === 'insurance_pending') return 'warning'
  return 'outline'
}

function fmtDatetime(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function encounterDate(enc: { admissionAt?: string } | null): string {
  if (!enc?.admissionAt) return '—'
  return new Date(enc.admissionAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Totals recompute helper ───────────────────────────────────────────────────
function recomputeTotals() {
  const b = bill.value
  if (!b) return
  const lines = billLines.value
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0)
  const taxTotal = lines.reduce((sum, l) => {
    return sum + Math.round(l.qty * l.unitPriceCents * l.taxRateBp / 10000)
  }, 0)
  const total = subtotal + taxTotal - b.discountCents
  const paid = payments.value.reduce((sum, p) => sum + p.amountCents, 0)
  const balance = Math.max(0, total - paid)

  b.subtotalCents = subtotal
  b.taxTotalCents = taxTotal
  b.totalCents = total
  b.paidCents = paid
  b.balanceCents = balance

  // Update line amounts too
  for (const l of lines) {
    l.amountCents = Math.round(l.qty * l.unitPriceCents * (1 + l.taxRateBp / 10000))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Add / Edit line dialog ────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const lineDialogOpen = ref(false)
const editingLineId = ref<string | null>(null)

const lineForm = reactive({
  serviceId: '',
  description: '',
  qty: 1,
  unitPriceCents: 0,
  taxRateBp: 0,
})

const lineSubmitting = ref(false)

// Pre-fill from service catalog when a service is selected

function onServiceSelect(val: any) {
  const svcId = String(val ?? '')
  lineForm.serviceId = svcId
  if (!svcId) return
  const svc = state.services.find(s => s.id === svcId)
  if (svc) {
    lineForm.description = svc.display
    lineForm.unitPriceCents = svc.defaultPriceCents
    lineForm.taxRateBp = svc.taxRateBp
  }
}

const lineAmount = computed(() => {
  return Math.round(lineForm.qty * lineForm.unitPriceCents * (1 + lineForm.taxRateBp / 10000))
})

function openAddLine() {
  editingLineId.value = null
  lineForm.serviceId = ''
  lineForm.description = ''
  lineForm.qty = 1
  lineForm.unitPriceCents = 0
  lineForm.taxRateBp = 0
  lineDialogOpen.value = true
}

function openEditLine(line: MockBillLine) {
  editingLineId.value = line.id
  lineForm.serviceId = line.serviceId ?? ''
  lineForm.description = line.description
  lineForm.qty = line.qty
  lineForm.unitPriceCents = line.unitPriceCents
  lineForm.taxRateBp = line.taxRateBp
  lineDialogOpen.value = true
}

function submitLine() {
  if (!lineForm.description.trim() || lineForm.qty < 1 || lineForm.unitPriceCents < 0) return
  lineSubmitting.value = true

  if (editingLineId.value) {
    // Edit existing
    const existing = state.billLines.find(l => l.id === editingLineId.value)
    if (existing) {
      existing.serviceId = lineForm.serviceId || undefined
      existing.description = lineForm.description.trim()
      existing.qty = lineForm.qty
      existing.unitPriceCents = lineForm.unitPriceCents
      existing.taxRateBp = lineForm.taxRateBp
      existing.amountCents = lineAmount.value
    }
  }
  else {
    // Add new
    const newLine: MockBillLine = {
      id: `bl-${Date.now()}`,
      billId: billId.value,
      serviceId: lineForm.serviceId || undefined,
      description: lineForm.description.trim(),
      qty: lineForm.qty,
      unitPriceCents: lineForm.unitPriceCents,
      taxRateBp: lineForm.taxRateBp,
      amountCents: lineAmount.value,
    }
    state.billLines.push(newLine)
  }

  recomputeTotals()
  lineSubmitting.value = false
  lineDialogOpen.value = false
}

function deleteLine(lineId: string) {
  const idx = state.billLines.findIndex(l => l.id === lineId)
  if (idx !== -1) state.billLines.splice(idx, 1)
  recomputeTotals()
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Discount dialog ───────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const discountDialogOpen = ref(false)
const discountInputCents = ref(0)

function openDiscountDialog() {
  discountInputCents.value = bill.value?.discountCents ?? 0
  discountDialogOpen.value = true
}

function submitDiscount() {
  const b = bill.value
  if (!b) return
  b.discountCents = Math.max(0, discountInputCents.value)
  recomputeTotals()
  discountDialogOpen.value = false
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Take payment dialog ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const paymentDialogOpen = ref(false)
const paymentSubmitting = ref(false)

const paymentForm = reactive({
  method: '' as MockPayment['method'] | '',
  amountCents: 0,
  reference: '',
  notes: '',
})

function openPaymentDialog() {
  paymentForm.method = 'cash'
  paymentForm.amountCents = bill.value?.balanceCents ?? 0
  paymentForm.reference = ''
  paymentForm.notes = ''
  paymentDialogOpen.value = true
}

function submitPayment() {
  const b = bill.value
  if (!b || !paymentForm.method || paymentForm.amountCents <= 0) return
  paymentSubmitting.value = true

  const newPayment: MockPayment = {
    id: `pay-${Date.now()}`,
    billId: billId.value,
    method: paymentForm.method as MockPayment['method'],
    amountCents: paymentForm.amountCents,
    receivedAt: new Date().toISOString(),
    receivedByUserId: 114, // current user (receptionist)
    reference: paymentForm.reference.trim() || undefined,
  }
  state.payments.push(newPayment)

  // Recompute paid / balance / status
  recomputeTotals()
  if (b.balanceCents <= 0) {
    b.status = 'paid'
  }
  else {
    b.status = 'partially_paid'
  }

  paymentSubmitting.value = false
  paymentDialogOpen.value = false
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Bill-level actions ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function finalizeBill() {
  const b = bill.value
  if (!b || b.status !== 'draft') return
  b.status = 'open'
  b.finalizedAt = new Date().toISOString()
}

function cancelBill() {
  const b = bill.value
  if (!b || b.paidCents > 0 || b.status === 'cancelled') return
  b.status = 'cancelled'
}

function printReceipt() {
  window.print()
}
</script>

<template>
  <Page v-if="bill">
    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <PageHeader>
      <div class="flex items-start gap-3">
        <PageHeaderHeading
          :title="bill.billNo"
          :description="patient ? `${patient.givenName} ${patient.familyName} · ${encounterDate(encounter)}` : ''"
        />
        <Badge
          :variant="statusVariant(bill.status)"
          class="mt-1 text-xs"
        >
          {{ statusLabel(bill.status) }}
        </Badge>
      </div>

      <template #actions>
        <!-- Finalize -->
        <Button
          v-if="bill.status === 'draft'"
          size="sm"
          @click="finalizeBill"
        >
          <CheckCircle2 class="size-4" />
          Finalize
        </Button>

        <!-- Cancel -->
        <Button
          v-if="bill.paidCents === 0 && bill.status !== 'cancelled'"
          size="sm"
          variant="destructive"
          @click="cancelBill"
        >
          Cancel bill
        </Button>

        <!-- Print receipt -->
        <Button
          size="sm"
          variant="outline"
          @click="printReceipt"
        >
          <Printer class="size-4" />
          Print receipt
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- ── Line items ─────────────────────────────────────────────────── -->
      <SectionCard title="Line items">
        <template #header-action>
          <Button
            v-if="bill.status === 'draft'"
            size="sm"
            variant="outline"
            @click="openAddLine"
          >
            <Plus class="size-4" />
            Add line
          </Button>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead class="w-20 text-right">
                  Qty
                </TableHead>
                <TableHead class="w-36 text-right">
                  Unit price
                </TableHead>
                <TableHead class="w-20 text-right">
                  Tax %
                </TableHead>
                <TableHead class="w-36 text-right">
                  Amount
                </TableHead>
                <TableHead
                  v-if="bill.status === 'draft'"
                  class="w-20"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="billLines.length === 0">
                No line items yet. Add one above.
              </TableEmpty>
              <TableRow
                v-for="line in billLines"
                :key="line.id"
              >
                <TableCell class="text-sm">
                  {{ line.description }}
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums">
                  {{ line.qty }}
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums">
                  {{ rupees(line.unitPriceCents) }}
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                  {{ (line.taxRateBp / 100).toFixed(0) }}%
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums font-medium">
                  {{ rupees(line.amountCents) }}
                </TableCell>
                <TableCell v-if="bill.status === 'draft'">
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7"
                      @click="openEditLine(line)"
                    >
                      <Pencil class="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7 text-destructive hover:text-destructive"
                      @click="deleteLine(line.id)"
                    >
                      <Trash2 class="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Totals ─────────────────────────────────────────────────────── -->
      <SectionCard title="Totals">
        <template #header-action>
          <Button
            v-if="bill.status === 'draft'"
            size="sm"
            variant="outline"
            @click="openDiscountDialog"
          >
            <IndianRupee class="size-4" />
            Edit discount
          </Button>
        </template>

        <DataList>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Subtotal</span>
            <span class="text-sm tabular-nums">{{ rupees(bill.subtotalCents) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Tax</span>
            <span class="text-sm tabular-nums">{{ rupees(bill.taxTotalCents) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Discount</span>
            <span class="text-sm tabular-nums text-muted-foreground">
              {{ bill.discountCents > 0 ? `– ${rupees(bill.discountCents)}` : '—' }}
            </span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm font-semibold">Total</span>
            <span class="text-sm font-semibold tabular-nums">{{ rupees(bill.totalCents) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Paid</span>
            <span class="text-sm tabular-nums text-muted-foreground">{{ rupees(bill.paidCents) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm font-semibold">Balance due</span>
            <span
              class="text-sm font-semibold tabular-nums"
              :class="bill.balanceCents > 0 ? 'text-destructive' : 'text-muted-foreground'"
            >
              {{ rupees(bill.balanceCents) }}
            </span>
          </DataListItem>
        </DataList>
      </SectionCard>

      <!-- ── Payments ───────────────────────────────────────────────────── -->
      <SectionCard title="Payments">
        <template #header-action>
          <Button
            v-if="bill.status === 'open' || bill.status === 'partially_paid'"
            size="sm"
            @click="openPaymentDialog"
          >
            <IndianRupee class="size-4" />
            Take payment
          </Button>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead class="w-36">
                  Method
                </TableHead>
                <TableHead class="w-36 text-right">
                  Amount
                </TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="payments.length === 0">
                No payments recorded yet.
              </TableEmpty>
              <TableRow
                v-for="pay in payments"
                :key="pay.id"
              >
                <TableCell class="text-sm text-muted-foreground">
                  {{ fmtDatetime(pay.receivedAt) }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="methodVariant(pay.method)"
                    class="text-xs"
                  >
                    {{ methodLabel(pay.method) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right text-sm tabular-nums font-medium">
                  {{ rupees(pay.amountCents) }}
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">
                  {{ pay.reference ?? '—' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Add / Edit line dialog                                            -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="lineDialogOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingLineId ? 'Edit line item' : 'Add line item' }}</DialogTitle>
          <DialogDescription>
            Select a service from the catalog or enter details manually.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <!-- Service picker -->
          <div class="space-y-1.5">
            <Label>Service catalog</Label>
            <Select
              :model-value="lineForm.serviceId"
              @update:model-value="onServiceSelect"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service (optional)…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="svc in state.services"
                  :key="svc.id"
                  :value="svc.id"
                >
                  {{ svc.display }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <Label for="line-desc">Description <span class="text-destructive">*</span></Label>
            <Input
              id="line-desc"
              v-model="lineForm.description"
              placeholder="e.g. Specialist Consultation"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <!-- Qty -->
            <div class="space-y-1.5">
              <Label for="line-qty">Qty</Label>
              <Input
                id="line-qty"
                v-model.number="lineForm.qty"
                type="number"
                min="1"
              />
            </div>

            <!-- Unit price (rupees input, stored as cents) -->
            <div class="space-y-1.5">
              <Label for="line-price">Unit price (₹)</Label>
              <Input
                id="line-price"
                :model-value="lineForm.unitPriceCents / 100"
                type="number"
                min="0"
                step="1"
                @update:model-value="(v: number | string) => (lineForm.unitPriceCents = Math.round(Number(v) * 100))"
              />
            </div>

            <!-- Tax rate -->
            <div class="space-y-1.5">
              <Label for="line-tax">Tax %</Label>
              <Input
                id="line-tax"
                :model-value="lineForm.taxRateBp / 100"
                type="number"
                min="0"
                step="0.5"
                @update:model-value="(v: number | string) => (lineForm.taxRateBp = Math.round(Number(v) * 100))"
              />
            </div>
          </div>

          <!-- Preview amount -->
          <p class="text-sm text-muted-foreground">
            Line total: <span class="font-medium text-foreground">{{ rupees(lineAmount) }}</span>
          </p>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="lineSubmitting || !lineForm.description.trim() || lineForm.qty < 1"
            @click="submitLine"
          >
            <Loader2
              v-if="lineSubmitting"
              class="size-4 animate-spin"
            />
            {{ editingLineId ? 'Save changes' : 'Add line' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Discount dialog                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="discountDialogOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit discount</DialogTitle>
          <DialogDescription>
            Enter the discount amount in rupees.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-1.5 py-2">
          <Label for="discount-amount">Discount (₹)</Label>
          <Input
            id="discount-amount"
            :model-value="discountInputCents / 100"
            type="number"
            min="0"
            step="1"
            @update:model-value="(v: number | string) => (discountInputCents = Math.round(Number(v) * 100))"
          />
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button @click="submitDiscount">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Take payment dialog                                                -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="paymentDialogOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Record a payment against this bill. Balance due: {{ rupees(bill.balanceCents) }}.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <!-- Method -->
          <div class="space-y-1.5">
            <Label>Payment method <span class="text-destructive">*</span></Label>
            <Select v-model="paymentForm.method">
              <SelectTrigger>
                <SelectValue placeholder="Select method…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  Cash
                </SelectItem>
                <SelectItem value="card">
                  Card
                </SelectItem>
                <SelectItem value="upi">
                  UPI
                </SelectItem>
                <SelectItem value="bank_transfer">
                  Bank transfer
                </SelectItem>
                <SelectItem value="insurance_pending">
                  Insurance pending
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Amount -->
          <div class="space-y-1.5">
            <Label for="pay-amount">Amount (₹) <span class="text-destructive">*</span></Label>
            <Input
              id="pay-amount"
              :model-value="paymentForm.amountCents / 100"
              type="number"
              min="1"
              step="1"
              @update:model-value="(v: number | string) => (paymentForm.amountCents = Math.round(Number(v) * 100))"
            />
          </div>

          <!-- Reference -->
          <div class="space-y-1.5">
            <Label for="pay-ref">Reference <span class="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="pay-ref"
              v-model="paymentForm.reference"
              placeholder="e.g. UPI-123456, CARD-4422"
            />
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <Label for="pay-notes">Notes <span class="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              id="pay-notes"
              v-model="paymentForm.notes"
              :rows="2"
              placeholder="Any additional notes…"
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
            :disabled="paymentSubmitting || !paymentForm.method || paymentForm.amountCents <= 0"
            @click="submitPayment"
          >
            <Loader2
              v-if="paymentSubmitting"
              class="size-4 animate-spin"
            />
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
