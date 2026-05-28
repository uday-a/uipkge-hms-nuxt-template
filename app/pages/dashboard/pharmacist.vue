<script setup lang="ts">
import { Pill, Package, AlertCircle, ShieldAlert } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { SectionCard } from '@/components/ui/section-card'
import DashboardKpiTile from '@/components/blocks/DashboardKpiTile.vue'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pharmacy Dashboard' })

// ─── State ───────────────────────────────────────────────────────────────────

const state = useMockState()

// The first pharmacist in the staff list
const me = computed(() => state.staff.find(s => s.role === 'pharmacist') ?? state.staff[0]!)

const facility = computed(() => state.facility)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Total qty dispensed against a prescription */
function dispensedQtyForRx(rxId: string): number {
  return state.dispenses
    .filter(d => d.medicationRequestId === rxId)
    .reduce((sum, d) => sum + d.qtyDispensed, 0)
}

/** Days until a date string (YYYY-MM-DD). Negative = expired. */
function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

/** Relative time label for an ISO timestamp */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/** Patient full name by id */
function patientName(id: string): string {
  const p = state.patients.find(p => p.id === id)
  return p ? `${p.givenName} ${p.familyName}` : id
}

/** Drug display by id */
function drugDisplay(id: string): string {
  return state.drugs.find(d => d.id === id)?.display ?? id
}

// Derive priority from the encounter type for a prescription
function rxPriority(rx: (typeof state.prescriptions)[number]): 'stat' | 'urgent' | 'routine' {
  const enc = state.encounters.find(e => e.id === rx.encounterId)
  if (!enc) return 'routine'
  if (enc.type === 'emergency') return 'stat'
  if (enc.type === 'inpatient') return 'urgent'
  return 'routine'
}

// ─── KPI computations ────────────────────────────────────────────────────────

// 1. Dispense queue: active prescriptions with remaining qty
const dispenseQueue = computed(() => {
  return state.prescriptions.filter((rx) => {
    if (rx.status !== 'active') return false
    const dispensed = dispensedQtyForRx(rx.id)
    return dispensed < rx.dispenseQty
  })
})

// 2. Near-expiry batches: expires within 90 days (not already expired)
const nearExpiryBatches = computed(() => {
  return state.drugBatches
    .filter((b) => {
      const d = daysUntil(b.expiresOn)
      return d >= 0 && d <= 90
    })
    .sort((a, b) => daysUntil(a.expiresOn) - daysUntil(b.expiresOn))
})

// 3. Low-stock drugs: total qty across batches < 20
const lowStockDrugs = computed(() => {
  return state.drugs
    .map((drug) => {
      const totalQty = state.drugBatches
        .filter(b => b.drugId === drug.id)
        .reduce((sum, b) => sum + b.qtyOnHand, 0)
      return { drug, totalQty }
    })
    .filter(({ totalQty }) => totalQty < 20)
    .sort((a, b) => a.totalQty - b.totalQty)
})

// 4. Narcotics dispensed today (schedule 1–5, dispensed today)
const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)

const narcoticDispensesToday = computed(() => {
  const controlledDrugIds = new Set(
    state.drugs.filter(d => d.schedule !== undefined && d.schedule >= 1 && d.schedule <= 5).map(d => d.id),
  )
  return state.dispenses.filter((d) => {
    const dispensedAt = new Date(d.dispensedAt)
    return controlledDrugIds.has(d.drugId) && dispensedAt >= todayStart
  })
})

// ─── Receive Batch dialog state ───────────────────────────────────────────────

const batchDialogOpen = ref(false)
const batchForm = reactive({
  drugId: '',
  batchNo: '',
  qty: '',
  expiresOn: '',
})
const batchFormErrors = reactive({
  drugId: false,
  batchNo: false,
  qty: false,
  expiresOn: false,
})

function resetBatchForm() {
  batchForm.drugId = ''
  batchForm.batchNo = ''
  batchForm.qty = ''
  batchForm.expiresOn = ''
  batchFormErrors.drugId = false
  batchFormErrors.batchNo = false
  batchFormErrors.qty = false
  batchFormErrors.expiresOn = false
}

function submitBatchForm() {
  batchFormErrors.drugId = !batchForm.drugId
  batchFormErrors.batchNo = !batchForm.batchNo.trim()
  batchFormErrors.qty = !batchForm.qty || Number(batchForm.qty) <= 0
  batchFormErrors.expiresOn = !batchForm.expiresOn

  if (batchFormErrors.drugId || batchFormErrors.batchNo || batchFormErrors.qty || batchFormErrors.expiresOn) {
    return
  }

  // Mock mutation — push into reactive state (persisted to localStorage)
  const newBatch = {
    id: `batch-${Date.now()}`,
    drugId: batchForm.drugId,
    batchNo: batchForm.batchNo.trim(),
    expiresOn: batchForm.expiresOn,
    qtyOnHand: Number(batchForm.qty),
    facilityId: facility.value.id,
  }
  state.drugBatches.push(newBatch)
  batchDialogOpen.value = false
  resetBatchForm()
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function priorityVariant(p: 'stat' | 'urgent' | 'routine') {
  if (p === 'stat') return 'destructive' as const
  if (p === 'urgent') return 'secondary' as const
  return 'outline' as const
}

function expiryVariant(days: number) {
  if (days < 30) return 'destructive' as const
  if (days < 60) return 'secondary' as const
  return 'outline' as const
}

function stockVariant(qty: number) {
  if (qty < 10) return 'destructive' as const
  return 'secondary' as const
}

function witnessVariant(hasWitness: boolean) {
  return hasWitness ? 'success' as const : 'outline' as const
}
</script>

<template>
  <Page>
    <!-- ─── Header ──────────────────────────────────────────────────────── -->
    <PageHeader>
      <PageHeaderHeading
        :title="`Good morning, ${me.name}`"
        :description="`Pharmacy operations · ${facility.name}`"
      />

      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Quick link: Open formulary (placeholder — page not yet built) -->
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            <Pill class="mr-1.5 size-3.5" />
            Formulary
          </Button>

          <!-- Quick link: Receive batch — opens dialog -->
          <Dialog
            v-model:open="batchDialogOpen"
            @update:open="(v) => { if (!v) resetBatchForm() }"
          >
            <DialogTrigger as-child>
              <Button size="sm">
                <Package class="mr-1.5 size-3.5" />
                Receive batch
              </Button>
            </DialogTrigger>

            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Receive drug batch</DialogTitle>
                <DialogDescription>
                  Add a new stock batch to the formulary. Changes are saved locally.
                </DialogDescription>
              </DialogHeader>

              <div class="grid gap-4 py-2">
                <!-- Drug select -->
                <div class="grid gap-1.5">
                  <Label for="batch-drug">Drug</Label>
                  <Select v-model="batchForm.drugId">
                    <SelectTrigger
                      id="batch-drug"
                      :class="batchFormErrors.drugId ? 'border-destructive' : ''"
                    >
                      <SelectValue placeholder="Select a drug…" />
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
                  <p
                    v-if="batchFormErrors.drugId"
                    class="text-destructive text-xs"
                  >
                    Required.
                  </p>
                </div>

                <!-- Batch no -->
                <div class="grid gap-1.5">
                  <Label for="batch-no">Batch number</Label>
                  <Input
                    id="batch-no"
                    v-model="batchForm.batchNo"
                    placeholder="e.g. PARA-2026-0001"
                    :class="batchFormErrors.batchNo ? 'border-destructive' : ''"
                  />
                  <p
                    v-if="batchFormErrors.batchNo"
                    class="text-destructive text-xs"
                  >
                    Required.
                  </p>
                </div>

                <!-- Qty -->
                <div class="grid gap-1.5">
                  <Label for="batch-qty">Quantity</Label>
                  <Input
                    id="batch-qty"
                    v-model="batchForm.qty"
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    :class="batchFormErrors.qty ? 'border-destructive' : ''"
                  />
                  <p
                    v-if="batchFormErrors.qty"
                    class="text-destructive text-xs"
                  >
                    Enter a positive quantity.
                  </p>
                </div>

                <!-- Expiry date -->
                <div class="grid gap-1.5">
                  <Label for="batch-expires">Expiry date</Label>
                  <Input
                    id="batch-expires"
                    v-model="batchForm.expiresOn"
                    type="date"
                    :class="batchFormErrors.expiresOn ? 'border-destructive' : ''"
                  />
                  <p
                    v-if="batchFormErrors.expiresOn"
                    class="text-destructive text-xs"
                  >
                    Required.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <DialogClose as-child>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button @click="submitBatchForm">
                  Save batch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- ─── KPI Row ──────────────────────────────────────────────────── -->
      <KpiGrid :columns="4">
        <DashboardKpiTile
          label="Dispense Queue"
          :value="String(dispenseQueue.length)"
          :icon="Pill"
          :delta="dispenseQueue.length > 0 ? 'Pending prescriptions' : undefined"
        />
        <DashboardKpiTile
          label="Near-Expiry Batches"
          :value="String(nearExpiryBatches.length)"
          :icon="AlertCircle"
          :delta="nearExpiryBatches.length > 0 ? 'Within 90 days' : undefined"
          :delta-tone="nearExpiryBatches.length > 0 ? 'negative' : undefined"
        />
        <DashboardKpiTile
          label="Low Stock Drugs"
          :value="String(lowStockDrugs.length)"
          :icon="Package"
          :delta="lowStockDrugs.length > 0 ? 'Total qty < 20' : undefined"
          :delta-tone="lowStockDrugs.length > 0 ? 'negative' : undefined"
        />
        <DashboardKpiTile
          label="Narcotics Today"
          :value="String(narcoticDispensesToday.length)"
          :icon="ShieldAlert"
          :delta="narcoticDispensesToday.length > 0 ? 'Controlled dispenses' : undefined"
        />
      </KpiGrid>

      <!-- ─── Dispense queue ────────────────────────────────────────────── -->
      <SectionCard title="Pending dispenses" class="transition-shadow hover:shadow-sm">
        <template #header-action>
          <Badge variant="secondary">
            {{ dispenseQueue.length }} pending
          </Badge>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Qty (dispensed / total)</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead class="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="dispenseQueue.length === 0"
                :colspan="6"
              >
                No pending dispenses.
              </TableEmpty>
              <TableRow
                v-for="rx in dispenseQueue"
                :key="rx.id"
              >
                <TableCell class="font-medium">
                  {{ patientName(rx.patientId) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ drugDisplay(rx.drugId) }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ rx.doseValue }} {{ rx.doseUnit }} · {{ rx.route }}
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="tabular-nums text-sm">
                      {{ dispensedQtyForRx(rx.id) }} / {{ rx.dispenseQty }}
                    </span>
                    <Progress
                      class="h-1.5 w-16"
                      :model-value="Math.round((dispensedQtyForRx(rx.id) / rx.dispenseQty) * 100)"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="priorityVariant(rxPriority(rx))">
                    {{ rxPriority(rx) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    as-child
                  >
                    <NuxtLink to="/pharmacy/queue">
                      Open
                    </NuxtLink>
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ─── Near-expiry batches ───────────────────────────────────────── -->
      <SectionCard title="Near-expiry batches" class="transition-shadow hover:shadow-sm">
        <template #header-action>
          <Badge
            v-if="nearExpiryBatches.some(b => daysUntil(b.expiresOn) < 30)"
            variant="destructive"
          >
            Action required
          </Badge>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Batch no</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Days left</TableHead>
                <TableHead class="text-right">
                  Qty on hand
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="nearExpiryBatches.length === 0"
                :colspan="5"
              >
                No batches expiring within 90 days.
              </TableEmpty>
              <TableRow
                v-for="batch in nearExpiryBatches"
                :key="batch.id"
              >
                <TableCell class="font-medium">
                  {{ drugDisplay(batch.drugId) }}
                </TableCell>
                <TableCell class="text-muted-foreground font-mono text-xs">
                  {{ batch.batchNo }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ batch.expiresOn }}
                </TableCell>
                <TableCell>
                  <Badge :variant="expiryVariant(daysUntil(batch.expiresOn))">
                    {{ daysUntil(batch.expiresOn) }}d
                  </Badge>
                </TableCell>
                <TableCell class="text-right tabular-nums text-sm">
                  {{ batch.qtyOnHand }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ─── Low stock ────────────────────────────────────────────────── -->
      <SectionCard title="Low stock drugs" class="transition-shadow hover:shadow-sm">
        <template #header-action>
          <Badge
            v-if="lowStockDrugs.some(({ totalQty }) => totalQty < 10)"
            variant="destructive"
          >
            Critical
          </Badge>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead class="text-right">
                  Total qty on hand
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="lowStockDrugs.length === 0"
                :colspan="3"
              >
                All drugs adequately stocked.
              </TableEmpty>
              <TableRow
                v-for="{ drug, totalQty } in lowStockDrugs"
                :key="drug.id"
              >
                <TableCell>
                  <div>
                    <p class="text-sm font-medium">
                      {{ drug.display }}
                    </p>
                    <p class="text-muted-foreground text-xs">
                      {{ drug.genericName }}
                    </p>
                  </div>
                </TableCell>
                <TableCell class="text-right tabular-nums text-sm font-semibold">
                  {{ totalQty }}
                </TableCell>
                <TableCell>
                  <Badge :variant="stockVariant(totalQty)">
                    {{ totalQty < 10 ? 'Critical' : 'Low' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ─── Narcotic register today ──────────────────────────────────── -->
      <SectionCard title="Narcotic register — today" class="transition-shadow hover:shadow-sm">
        <template #header-action>
          <span class="text-muted-foreground text-xs">
            Schedule I–V dispenses
          </span>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead class="text-right">
                  Qty
                </TableHead>
                <TableHead>Witness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="narcoticDispensesToday.length === 0"
                :colspan="5"
              >
                No controlled substance dispenses today.
              </TableEmpty>
              <TableRow
                v-for="d in narcoticDispensesToday"
                :key="d.id"
              >
                <TableCell class="text-muted-foreground text-xs tabular-nums">
                  {{ relativeTime(d.dispensedAt) }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ drugDisplay(d.drugId) }}
                  <Badge
                    variant="outline"
                    class="ml-1 text-[10px]"
                  >
                    Sch {{ state.drugs.find(dr => dr.id === d.drugId)?.schedule }}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm">
                  {{ patientName(d.patientId) }}
                </TableCell>
                <TableCell class="text-right tabular-nums text-sm">
                  {{ d.qtyDispensed }}
                </TableCell>
                <TableCell>
                  <!--
                  Witness status: mock treats any second pharmacist who
                  dispensed the same Rx as the witness. If dispensedByUserId
                  differs from me.id, a witness was present.
                -->
                  <Badge :variant="witnessVariant(d.dispensedByUserId !== me.id)">
                    {{ d.dispensedByUserId !== me.id ? 'Yes' : 'No' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
