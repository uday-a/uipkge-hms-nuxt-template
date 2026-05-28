<script setup lang="ts">
import { CheckCircle2, Loader2, Printer } from 'lucide-vue-next'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { MockObservation } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const state = useMockState()

// ── Load order + related data ─────────────────────────────────────────────────

const order = computed(() => state.labOrders.find(o => o.id === id))
const sample = computed(() => state.labSamples.find(s => s.serviceRequestId === id))
const report = computed(() => state.diagnosticReports.find(r => r.serviceRequestId === id))
const observations = computed(() => state.observations.filter(o => o.serviceRequestId === id))
const catalog = computed(() => order.value?.catalogId ? state.labCatalog.find(c => c.id === order.value!.catalogId) : undefined)
const patientData = computed(() => order.value ? state.patients.find(p => p.id === order.value!.patientId) : undefined)

useHead({ title: computed(() => order.value ? `Lab Order — ${order.value.display}` : 'Lab Order') })

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function relativeTime(iso: string | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info'

function interpretationVariant(interp: string | undefined): BadgeVariant {
  if (interp === 'critical_high' || interp === 'critical_low') return 'destructive'
  if (interp === 'high' || interp === 'low') return 'warning'
  if (interp === 'normal') return 'success'
  return 'secondary'
}

function interpretationLabel(interp: string | undefined): string {
  return (interp ?? '—').replace('_', ' ')
}

function computeInterpretation(
  value: number | undefined,
  cat: typeof catalog.value,
): MockObservation['interpretation'] {
  if (value === undefined || !cat) return undefined
  if (cat.criticalLow !== undefined && value < cat.criticalLow) return 'critical_low'
  if (cat.criticalHigh !== undefined && value > cat.criticalHigh) return 'critical_high'
  if (cat.referenceLow !== undefined && value < cat.referenceLow) return 'low'
  if (cat.referenceHigh !== undefined && value > cat.referenceHigh) return 'high'
  return 'normal'
}

function referenceRangeText(cat: typeof catalog.value): string {
  if (!cat) return ''
  const parts: string[] = []
  if (cat.referenceLow !== undefined && cat.referenceHigh !== undefined) {
    parts.push(`${cat.referenceLow} – ${cat.referenceHigh}`)
  }
  else if (cat.referenceHigh !== undefined) {
    parts.push(`< ${cat.referenceHigh}`)
  }
  else if (cat.referenceLow !== undefined) {
    parts.push(`> ${cat.referenceLow}`)
  }
  if (cat.unit) parts.push(cat.unit)
  return parts.join(' ')
}

// ── Barcode generator ─────────────────────────────────────────────────────────

function generateBarcode(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(Math.random() * 900000) + 100000)
  return `MH-LAB-${dateStr}-${rand}`
}

// ── Tab: Sample — Collect dialog ──────────────────────────────────────────────

const collectOpen = ref(false)
const collectSpecimenType = ref<string>('')
const collectBarcode = ref<string>('')
const collectSaving = ref(false)

function openCollectDialog() {
  collectSpecimenType.value = catalog.value?.specimenType ?? ''
  collectBarcode.value = generateBarcode()
  collectOpen.value = true
}

function submitCollect() {
  if (!order.value) return
  collectSaving.value = true
  const now = new Date().toISOString()
  const newSample = {
    id: `samp-${Date.now()}`,
    serviceRequestId: id,
    patientId: order.value.patientId,
    specimenType: collectSpecimenType.value,
    barcode: collectBarcode.value,
    collectedAt: now,
    collectedByUserId: state.staff.find(s => s.role === 'lab_tech')?.id ?? 110,
    receivedAt: undefined,
    rejectedAt: undefined,
  }
  state.labSamples.push(newSample)
  collectOpen.value = false
  collectSaving.value = false
}

function markReceived() {
  const s = state.labSamples.find(x => x.serviceRequestId === id)
  if (s) s.receivedAt = new Date().toISOString()
}

function rejectSample() {
  const s = state.labSamples.find(x => x.serviceRequestId === id)
  if (s) s.rejectedAt = new Date().toISOString()
}

// ── Tab: Results — observation entry ─────────────────────────────────────────

interface ResultRow {
  code: string
  display: string
  value: string
}

const resultRows = ref<ResultRow[]>([
  {
    code: catalog.value?.code ?? order.value?.code ?? '',
    display: catalog.value?.display ?? order.value?.display ?? '',
    value: '',
  },
])

function addResultRow() {
  resultRows.value.push({ code: '', display: '', value: '' })
}

function computedInterpForRow(row: ResultRow): MockObservation['interpretation'] {
  const num = parseFloat(row.value)
  if (isNaN(num)) return undefined
  return computeInterpretation(num, catalog.value)
}

const submitResultsSaving = ref(false)

function submitResults() {
  if (!order.value) return
  submitResultsSaving.value = true

  const now = new Date().toISOString()
  const observationIds: string[] = []
  let hasCritical = false

  for (const row of resultRows.value) {
    if (!row.value.trim()) continue
    const numVal = parseFloat(row.value)
    const interp = computeInterpretation(isNaN(numVal) ? undefined : numVal, catalog.value)
    const obsId = `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    observationIds.push(obsId)

    const obs: MockObservation = {
      id: obsId,
      serviceRequestId: id,
      encounterId: order.value.encounterId,
      patientId: order.value.patientId,
      code: row.code || (catalog.value?.code ?? order.value.code),
      display: row.display || (catalog.value?.display ?? order.value.display),
      unit: catalog.value?.unit,
      effectiveAt: now,
      interpretation: interp,
      referenceRangeText: referenceRangeText(catalog.value),
      ...(isNaN(numVal) ? { valueString: row.value } : { valueNumeric: numVal }),
    }
    state.observations.push(obs)

    if (interp === 'critical_high' || interp === 'critical_low') hasCritical = true
  }

  // Create draft diagnostic report
  const reportId = `drep-${Date.now()}`
  state.diagnosticReports.push({
    id: reportId,
    serviceRequestId: id,
    encounterId: order.value.encounterId,
    patientId: order.value.patientId,
    category: 'lab',
    code: order.value.code,
    display: `${order.value.display} Result`,
    status: 'draft',
    effectiveAt: now,
    observationIds,
  })

  // Push critical alert if needed
  if (hasCritical) {
    state.criticalAlerts.push({
      id: `alert-${Date.now()}`,
      observationId: observationIds[0] ?? '',
      patientId: order.value.patientId,
      encounterId: order.value.encounterId,
      facilityId: order.value.facilityId,
      triggeredAt: now,
    })
  }

  submitResultsSaving.value = false
}

// ── Tab: Report — sign / amend ────────────────────────────────────────────────

const signSaving = ref(false)

function signReport() {
  if (!report.value) return
  signSaving.value = true
  const now = new Date().toISOString()
  const me = state.staff.find(s => s.role === 'lab_tech')
  report.value.status = 'final'
  report.value.issuedAt = now
  report.value.signedByUserId = me?.id
  // Mark order complete
  if (order.value) order.value.status = 'completed'
  signSaving.value = false
}

function amendReport() {
  if (!report.value) return
  const prev = report.value
  prev.status = 'superseded'
  const now = new Date().toISOString()
  state.diagnosticReports.push({
    id: `drep-amend-${Date.now()}`,
    serviceRequestId: prev.serviceRequestId,
    encounterId: prev.encounterId,
    patientId: prev.patientId,
    category: 'lab',
    code: prev.code,
    display: prev.display,
    status: 'draft',
    effectiveAt: now,
    observationIds: [...prev.observationIds],
    conclusion: prev.conclusion,
  })
}

// ── Tab enable logic ──────────────────────────────────────────────────────────

const resultsEnabled = computed(() => !!sample.value?.receivedAt)
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        :title="order ? `Lab Order — ${order.display}` : 'Lab Order'"
        :description="patientData && order
          ? `${patientData.givenName} ${patientData.familyName} · ${patientData.mrn} · Ordered ${formatDate(order.createdAt)}`
          : undefined"
      />
      <template
        v-if="report?.status === 'final'"
        #actions
      >
        <Button
          variant="outline"
          size="sm"
          as-child
        >
          <NuxtLink :to="`/lab/reports/${report!.id}`">
            <Printer class="size-4" />
            View report
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- Not found -->
      <div
        v-if="!order"
        class="text-muted-foreground py-12 text-center text-sm"
      >
        Order not found.
      </div>

      <Tabs
        v-else
        default-value="sample"
      >
        <TabsList>
          <TabsTrigger value="sample">
            Sample
          </TabsTrigger>
          <TabsTrigger
            value="results"
            :disabled="!resultsEnabled"
          >
            Results
          </TabsTrigger>
          <TabsTrigger value="report">
            Report
          </TabsTrigger>
        </TabsList>

        <!-- ── Tab: Sample ──────────────────────────────────────────────── -->
        <TabsContent value="sample">
          <SectionCard title="Sample collection">
            <!-- No sample yet -->
            <template v-if="!sample?.collectedAt">
              <p class="text-muted-foreground mb-4 text-sm">
                No sample has been collected for this order.
              </p>

              <Dialog v-model:open="collectOpen">
                <DialogTrigger as-child>
                  <Button
                    size="sm"
                    @click="openCollectDialog"
                  >
                    Collect sample
                  </Button>
                </DialogTrigger>
                <DialogContent class="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Collect sample</DialogTitle>
                  </DialogHeader>

                  <div class="space-y-4 py-2">
                    <div class="space-y-1.5">
                      <Label>Specimen type</Label>
                      <Select v-model="collectSpecimenType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select specimen type" />
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

                    <div class="space-y-1.5">
                      <Label>Barcode</Label>
                      <Input
                        v-model="collectBarcode"
                        class="font-mono"
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
                      :disabled="!collectSpecimenType || !collectBarcode || collectSaving"
                      @click="submitCollect"
                    >
                      <Loader2
                        v-if="collectSaving"
                        class="mr-2 size-4 animate-spin"
                      />
                      Confirm collection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </template>

            <!-- Sample exists -->
            <template v-else>
              <div class="mb-6 inline-block rounded-md border bg-muted/40 px-4 py-3">
                <p class="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                  Barcode
                </p>
                <p class="font-mono text-lg font-semibold">
                  {{ sample!.barcode }}
                </p>
                <p class="text-muted-foreground mt-1 text-xs">
                  Collected {{ formatDate(sample!.collectedAt) }}
                </p>
                <p
                  v-if="sample!.receivedAt"
                  class="text-muted-foreground text-xs"
                >
                  Received {{ formatDate(sample!.receivedAt) }}
                </p>
                <p
                  v-if="sample!.rejectedAt"
                  class="text-destructive text-xs font-medium"
                >
                  Rejected {{ formatDate(sample!.rejectedAt) }}
                </p>
              </div>

              <div
                v-if="!sample!.receivedAt && !sample!.rejectedAt"
                class="flex gap-2"
              >
                <Button
                  size="sm"
                  @click="markReceived"
                >
                  <CheckCircle2 class="mr-2 size-4" />
                  Mark received
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="text-destructive"
                  @click="rejectSample"
                >
                  Reject sample
                </Button>
              </div>

              <div
                v-else-if="sample!.receivedAt"
                class="flex items-center gap-2"
              >
                <Badge variant="success">
                  Received
                </Badge>
                <span class="text-muted-foreground text-sm">Sample received — proceed to Results tab to enter values.</span>
              </div>
            </template>
          </SectionCard>
        </TabsContent>

        <!-- ── Tab: Results ─────────────────────────────────────────────── -->
        <TabsContent value="results">
          <SectionCard title="Result entry">
            <template v-if="!resultsEnabled">
              <p class="text-muted-foreground text-sm">
                Sample must be received before entering results.
              </p>
            </template>

            <template v-else-if="observations.length > 0 && report">
              <!-- Results already submitted -->
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead class="w-32">
                        Unit
                      </TableHead>
                      <TableHead class="w-36">
                        Interpretation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="obs in observations"
                      :key="obs.id"
                    >
                      <TableCell class="font-mono text-xs">
                        {{ obs.code }}
                      </TableCell>
                      <TableCell class="text-sm font-medium">
                        {{ obs.display }}
                      </TableCell>
                      <TableCell class="text-sm font-semibold">
                        {{ obs.valueNumeric !== undefined ? obs.valueNumeric : (obs.valueString ?? '—') }}
                      </TableCell>
                      <TableCell class="text-muted-foreground text-sm">
                        {{ obs.unit ?? '—' }}
                      </TableCell>
                      <TableCell>
                        <Badge :variant="interpretationVariant(obs.interpretation)">
                          {{ interpretationLabel(obs.interpretation) }}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </template>

            <template v-else>
              <!-- Entry form -->
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="w-28">
                        Code
                      </TableHead>
                      <TableHead>Test name</TableHead>
                      <TableHead class="w-36">
                        Value
                      </TableHead>
                      <TableHead class="w-24">
                        Unit
                      </TableHead>
                      <TableHead class="w-36">
                        Interpretation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="(row, idx) in resultRows"
                      :key="idx"
                    >
                      <TableCell>
                        <Input
                          v-model="row.code"
                          class="font-mono"
                          placeholder="CODE"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          v-model="row.display"
                          placeholder="Test name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          v-model="row.value"
                          placeholder="Value"
                        />
                      </TableCell>
                      <TableCell class="text-muted-foreground text-sm">
                        {{ catalog?.unit ?? '—' }}
                      </TableCell>
                      <TableCell>
                        <Badge
                          v-if="row.value.trim()"
                          :variant="interpretationVariant(computedInterpForRow(row))"
                        >
                          {{ interpretationLabel(computedInterpForRow(row)) }}
                        </Badge>
                        <span
                          v-else
                          class="text-muted-foreground text-xs"
                        >—</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div class="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="addResultRow"
                >
                  Add row
                </Button>
                <Button
                  size="sm"
                  :disabled="submitResultsSaving"
                  @click="submitResults"
                >
                  <Loader2
                    v-if="submitResultsSaving"
                    class="mr-2 size-4 animate-spin"
                  />
                  Submit results
                </Button>
              </div>
            </template>
          </SectionCard>
        </TabsContent>

        <!-- ── Tab: Report ──────────────────────────────────────────────── -->
        <TabsContent value="report">
          <SectionCard title="Diagnostic report">
            <template v-if="!report">
              <p class="text-muted-foreground text-sm">
                No report yet. Submit results to create a draft report.
              </p>
            </template>

            <template v-else>
              <div class="mb-4 flex items-center justify-between">
                <Badge :variant="report.status === 'final' ? 'success' : report.status === 'draft' ? 'warning' : 'secondary'">
                  {{ report.status }}
                </Badge>
                <p
                  v-if="report.issuedAt"
                  class="text-muted-foreground text-xs"
                >
                  Issued {{ formatDate(report.issuedAt) }}
                </p>
              </div>

              <!-- Observations summary -->
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead class="w-36">
                        Value
                      </TableHead>
                      <TableHead class="w-32">
                        Reference range
                      </TableHead>
                      <TableHead class="w-36">
                        Interpretation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableEmpty v-if="observations.length === 0">
                      No observations linked to this report.
                    </TableEmpty>
                    <TableRow
                      v-for="obs in observations"
                      :key="obs.id"
                    >
                      <TableCell>
                        <p class="text-sm font-medium">
                          {{ obs.display }}
                        </p>
                        <p class="text-muted-foreground font-mono text-xs">
                          {{ obs.code }}
                        </p>
                      </TableCell>
                      <TableCell class="text-sm font-semibold">
                        {{ obs.valueNumeric !== undefined ? obs.valueNumeric : (obs.valueString ?? '—') }}
                        <span
                          v-if="obs.unit"
                          class="text-muted-foreground text-xs font-normal"
                        >
                          {{ obs.unit }}
                        </span>
                      </TableCell>
                      <TableCell class="text-muted-foreground text-xs">
                        {{ obs.referenceRangeText ?? '—' }}
                      </TableCell>
                      <TableCell>
                        <Badge :variant="interpretationVariant(obs.interpretation)">
                          {{ interpretationLabel(obs.interpretation) }}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <!-- Actions -->
              <div
                v-if="report.status === 'draft'"
                class="mt-4 flex gap-2"
              >
                <Button
                  size="sm"
                  :disabled="signSaving"
                  @click="signReport"
                >
                  <Loader2
                    v-if="signSaving"
                    class="mr-2 size-4 animate-spin"
                  />
                  <CheckCircle2
                    v-else
                    class="mr-2 size-4"
                  />
                  Sign report
                </Button>
              </div>

              <div
                v-else-if="report.status === 'final'"
                class="mt-4 flex gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  as-child
                >
                  <NuxtLink :to="`/lab/reports/${report.id}`">
                    <Printer class="mr-2 size-4" />
                    Print report
                  </NuxtLink>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="amendReport"
                >
                  Amend
                </Button>
              </div>
            </template>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>
</template>
