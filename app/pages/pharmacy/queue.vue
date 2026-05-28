<script setup lang="ts">
import { Pill, Loader2 } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table'
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { MockMedicationDispense } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Dispense Queue' })

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const state = useMockState()

// ── filter state ─────────────────────────────────────────────────────────────
const facilityId = ref(state.facility.id)
const q = ref('')

// ── lookups ──────────────────────────────────────────────────────────────────
const patientById = (id: string) => state.patients.find(p => p.id === id)
const drugById = (id: string) => state.drugs.find(d => d.id === id)
const staffById = (id: number) => state.staff.find(s => s.id === id)

function patientFullName(patientId: string) {
  const p = patientById(patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

// ── pending queue ─────────────────────────────────────────────────────────────
// prescriptions where status='active' AND dispensed < dispenseQty
const pendingQueue = computed(() => {
  const search = q.value.trim().toLowerCase()
  return state.prescriptions
    .filter((rx) => {
      if (rx.status !== 'active') return false
      const drug = drugById(rx.drugId)
      if (!drug) return false
      // Only show if at a facility batch exists (or single facility)
      const totalDispensed = state.dispenses
        .filter(d => d.medicationRequestId === rx.id)
        .reduce((sum, d) => sum + d.qtyDispensed, 0)
      if (totalDispensed >= rx.dispenseQty) return false
      if (search) {
        const name = patientFullName(rx.patientId).toLowerCase()
        const drugDisplay = drug.display.toLowerCase()
        if (!name.includes(search) && !drugDisplay.includes(search)) return false
      }
      return true
    })
    .map((rx) => {
      const drug = drugById(rx.drugId)!
      const patient = patientById(rx.patientId)
      const totalDispensed = state.dispenses
        .filter(d => d.medicationRequestId === rx.id)
        .reduce((sum, d) => sum + d.qtyDispensed, 0)
      const qtyRemaining = rx.dispenseQty - totalDispensed
      return { rx, drug, patient, totalDispensed, qtyRemaining }
    })
})

// ── schedule badge ────────────────────────────────────────────────────────────
function scheduleVariant(schedule: number | undefined): BadgeVariant {
  if (!schedule) return 'outline'
  if (schedule <= 2) return 'destructive'
  if (schedule <= 3) return 'warning'
  return 'secondary'
}

// ── dispense dialog ───────────────────────────────────────────────────────────
const dialogOpen = ref(false)
const selectedRow = ref<(typeof pendingQueue.value)[0] | null>(null)

// dialog form state
const dispatchBatchId = ref('')
const dispatchQty = ref(1)
const dispatchWitnessId = ref('')
const dispatchNotes = ref('')
const dispatchLoading = ref(false)

const today = new Date().toISOString().slice(0, 10)

const availableBatches = computed(() => {
  if (!selectedRow.value) return []
  return state.drugBatches.filter(
    b =>
      b.drugId === selectedRow.value!.drug.id
      && b.facilityId === facilityId.value
      && b.qtyOnHand > 0
      && b.expiresOn > today,
  )
})

const witnessStaff = computed(() =>
  state.staff.filter(s => s.role === 'nurse' || s.role === 'admin'),
)

const selectedBatch = computed(() =>
  availableBatches.value.find(b => b.id === dispatchBatchId.value) ?? null,
)

const requiresWitness = computed(() =>
  (selectedRow.value?.drug.schedule ?? 0) >= 1
  && (selectedRow.value?.drug.schedule ?? 0) <= 5,
)

const dispatchMaxQty = computed(() => {
  if (!selectedRow.value) return 1
  const batchMax = selectedBatch.value?.qtyOnHand ?? 0
  return Math.min(selectedRow.value.qtyRemaining, batchMax)
})

function openDispenseDialog(row: (typeof pendingQueue.value)[0]) {
  selectedRow.value = row
  dispatchBatchId.value = ''
  dispatchQty.value = 1
  dispatchWitnessId.value = ''
  dispatchNotes.value = ''
  dialogOpen.value = true
}

function formatBatchLabel(batchId: string) {
  const batch = state.drugBatches.find(b => b.id === batchId)
  if (!batch) return batchId
  return `${batch.batchNo} · exp ${batch.expiresOn} · qty ${batch.qtyOnHand}`
}

function doDispense() {
  if (!selectedRow.value || !dispatchBatchId.value || dispatchQty.value < 1) return
  if (requiresWitness.value && !dispatchWitnessId.value) return

  dispatchLoading.value = true

  // Push a new MedicationDispense
  const newDispense: MockMedicationDispense = {
    id: `disp-${Date.now()}`,
    medicationRequestId: selectedRow.value.rx.id,
    drugId: selectedRow.value.drug.id,
    batchId: dispatchBatchId.value,
    qtyDispensed: dispatchQty.value,
    dispensedAt: new Date().toISOString(),
    dispensedByUserId: 108, // current pharmacist (Linda Foster)
    patientId: selectedRow.value.rx.patientId,
    encounterId: selectedRow.value.rx.encounterId,
  }
  state.dispenses.push(newDispense)

  // Decrement batch qty
  const batch = state.drugBatches.find(b => b.id === dispatchBatchId.value)
  if (batch) batch.qtyOnHand -= dispatchQty.value

  // Check if fully dispensed and flip status
  const totalAfter = state.dispenses
    .filter(d => d.medicationRequestId === selectedRow.value!.rx.id)
    .reduce((sum, d) => sum + d.qtyDispensed, 0)
  if (totalAfter >= selectedRow.value.rx.dispenseQty) {
    const rxIndex = state.prescriptions.findIndex(p => p.id === selectedRow.value!.rx.id)
    if (rxIndex !== -1) state.prescriptions[rxIndex]!.status = 'completed'
  }

  dispatchLoading.value = false
  dialogOpen.value = false
  selectedRow.value = null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Pharmacy Queue"
        description="Manage and dispense pending prescriptions efficiently."
      />
    </PageHeader>

    <PageBody class="space-y-4">
      <!-- Filter row -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="flex flex-col gap-1.5">
          <Label for="facility-select">Facility</Label>
          <Select v-model="facilityId">
            <SelectTrigger
              id="facility-select"
              class="w-48"
            >
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="state.facility.id">
                {{ state.facility.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-1.5 flex-1">
          <Label for="queue-search">Search</Label>
          <Input
            id="queue-search"
            v-model="q"
            placeholder="Patient name or drug…"
            class="max-w-80"
          />
        </div>
      </div>

      <!-- Queue table -->
      <div class="rounded-md border transition-shadow hover:shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Drug</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Qty remaining</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead class="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty
              v-if="pendingQueue.length === 0"
              :colspan="7"
            >
              No pending dispenses{{ q ? ' matching your search' : '' }}.
            </TableEmpty>
            <TableRow
              v-for="row in pendingQueue"
              :key="row.rx.id"
            >
              <TableCell>
                <div class="font-medium">
                  {{ row.patient ? `${row.patient.givenName} ${row.patient.familyName}` : row.rx.patientId }}
                </div>
                <div class="text-muted-foreground text-xs">
                  {{ row.patient?.mrn }}
                </div>
              </TableCell>
              <TableCell>
                <div class="font-medium">
                  {{ row.drug.display }}
                </div>
                <div class="text-muted-foreground text-xs capitalize">
                  {{ row.drug.form }}
                </div>
              </TableCell>
              <TableCell class="text-sm">
                {{ row.rx.doseValue }} {{ row.rx.doseUnit }} · {{ row.rx.route }}
              </TableCell>
              <TableCell class="text-sm">
                {{ row.qtyRemaining }} of {{ row.rx.dispenseQty }}
              </TableCell>
              <TableCell>
                <Badge
                  v-if="row.drug.schedule"
                  :variant="scheduleVariant(row.drug.schedule)"
                >
                  Schedule {{ row.drug.schedule }}
                </Badge>
                <span
                  v-else
                  class="text-muted-foreground text-xs"
                >—</span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  Routine
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Button
                  size="sm"
                  @click="openDispenseDialog(row)"
                >
                  <Pill class="mr-1.5 size-3.5" />
                  Dispense
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </PageBody>

    <!-- Dispense dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dispense medication</DialogTitle>
          <DialogDescription v-if="selectedRow">
            {{ selectedRow.drug.display }} for
            {{ selectedRow.patient ? `${selectedRow.patient.givenName} ${selectedRow.patient.familyName}` : selectedRow.rx.patientId }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="selectedRow"
          class="space-y-4 py-2"
        >
          <!-- Batch select -->
          <div class="space-y-1.5">
            <Label for="batch-select">Batch <span class="text-destructive">*</span></Label>
            <Select v-model="dispatchBatchId">
              <SelectTrigger id="batch-select">
                <SelectValue placeholder="Select a batch…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-if="availableBatches.length === 0"
                  value="__none__"
                  disabled
                >
                  No available batches
                </SelectItem>
                <SelectItem
                  v-for="batch in availableBatches"
                  :key="batch.id"
                  :value="batch.id"
                >
                  {{ batch.batchNo }} · exp {{ fmtDate(batch.expiresOn) }} · qty {{ batch.qtyOnHand }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Qty input -->
          <div class="space-y-1.5">
            <Label for="dispatch-qty">
              Quantity
              <span
                v-if="dispatchMaxQty > 0"
                class="text-muted-foreground font-normal"
              >
                (max {{ dispatchMaxQty }})
              </span>
              <span class="text-destructive"> *</span>
            </Label>
            <Input
              id="dispatch-qty"
              v-model.number="dispatchQty"
              type="number"
              :min="1"
              :max="dispatchMaxQty"
            />
          </div>

          <!-- Witness (required for controlled substances) -->
          <div class="space-y-1.5">
            <Label for="witness-select">
              Witness
              <span
                v-if="requiresWitness"
                class="text-destructive"
              > * (controlled substance)</span>
            </Label>
            <Select v-model="dispatchWitnessId">
              <SelectTrigger id="witness-select">
                <SelectValue placeholder="Select a witness…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="s in witnessStaff"
                  :key="String(s.id)"
                  :value="String(s.id)"
                >
                  {{ s.name }} · {{ s.role }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <Label for="dispatch-notes">Notes</Label>
            <Textarea
              id="dispatch-notes"
              v-model="dispatchNotes"
              placeholder="Optional counselling notes…"
              rows="2"
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
            :disabled="
              !dispatchBatchId
                || dispatchQty < 1
                || dispatchQty > dispatchMaxQty
                || (requiresWitness && !dispatchWitnessId)
                || dispatchLoading
            "
            @click="doDispense"
          >
            <Loader2
              v-if="dispatchLoading"
              class="mr-1.5 size-3.5 animate-spin"
            />
            <Pill
              v-else
              class="mr-1.5 size-3.5"
            />
            Dispense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
