<script setup lang="ts">
import { LogOut, Plus, Activity, X } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import type { MockNursingEntry } from '~/mocks/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const admissionId = computed(() => route.params.admissionId as string)

const admission = computed(() => state.icuAdmissions.find(a => a.id === admissionId.value))
const patient = computed(() => admission.value ? state.patients.find(p => p.id === admission.value!.patientId) : undefined)
const encounter = computed(() => admission.value ? state.encounters.find(e => e.id === admission.value!.encounterId) : undefined)

watchEffect(() => {
  if (import.meta.client && admission.value === undefined) {
    navigateTo('/icu')
  }
})

useHead(() => ({
  title: patient.value
    ? `${patient.value.givenName} ${patient.value.familyName} — ICU Stay`
    : 'ICU Stay',
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function staffName(userId?: number): string {
  if (!userId) return '—'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function sourceLabel(source?: string): string {
  const map: Record<string, string> = { OT: 'OT', ER: 'ER', ward: 'Ward', external_transfer: 'External Transfer' }
  return source ? (map[source] ?? source) : '—'
}

function sourceVariant(source?: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' {
  if (source === 'ER') return 'destructive'
  if (source === 'OT') return 'warning'
  if (source === 'external_transfer') return 'secondary'
  return 'outline'
}

function severityVariant(severity?: string): 'outline' | 'secondary' | 'destructive' {
  if (severity === 'severe') return 'destructive'
  if (severity === 'moderate') return 'secondary'
  return 'outline'
}

function outcomeLabel(outcome?: string): string {
  if (!outcome) return '—'
  const map: Record<string, string> = {
    discharged_to_ward: 'Discharged to ward',
    transferred: 'Transferred',
    expired: 'Expired',
    left_against_advice: 'Left against advice',
  }
  return map[outcome] ?? outcome
}

function outcomeVariant(outcome?: string): 'success' | 'secondary' | 'destructive' | 'outline' {
  if (outcome === 'discharged_to_ward') return 'success'
  if (outcome === 'transferred') return 'secondary'
  if (outcome === 'expired') return 'destructive'
  return 'outline'
}

// ── Monitoring entries ────────────────────────────────────────────────────────

const monitoringEntries = computed(() => {
  if (!admission.value) return []
  return state.nursingEntries
    .filter(n => n.encounterId === admission.value!.encounterId && n.context === 'icu')
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 20)
})

// ── Discharge dialog ──────────────────────────────────────────────────────────

const dischargeDialogOpen = ref(false)
const dischargeOutcome = ref<'discharged_to_ward' | 'transferred' | 'expired' | 'left_against_advice' | ''>('')
const dischargeLoading = ref(false)

function openDischargeDialog() {
  dischargeOutcome.value = ''
  dischargeDialogOpen.value = true
}

function confirmDischarge() {
  if (!dischargeOutcome.value || !admission.value) return
  dischargeLoading.value = true

  const idx = state.icuAdmissions.findIndex(a => a.id === admissionId.value)
  const row = idx !== -1 ? state.icuAdmissions[idx] : undefined
  if (row) {
    row.dischargedAt = new Date().toISOString()
    row.outcome = dischargeOutcome.value as 'discharged_to_ward' | 'transferred' | 'expired' | 'left_against_advice'
  }

  dischargeLoading.value = false
  dischargeDialogOpen.value = false
}

// ── Add monitoring entry dialog ───────────────────────────────────────────────

const monitorDialogOpen = ref(false)

// Pressors: repeatable rows
interface PressorsRow { drug: string, dose: string }

const monitorForm = reactive({
  // Vitals
  bpSys: '' as string,
  bpDia: '' as string,
  hr: '' as string,
  spo2: '' as string,
  rr: '' as string,
  temp: '' as string,
  // Ventilator
  ventMode: '' as string,
  fio2: '' as string,
  peep: '' as string,
  tidalVolume: '' as string,
  // Scores
  gcs: '' as string,
  apache: '' as string,
  sofa: '' as string,
  ramsay: '' as string,
  // Notes
  notes: '' as string,
})

const pressorsRows = ref<PressorsRow[]>([{ drug: '', dose: '' }])

function addPressorsRow() {
  pressorsRows.value.push({ drug: '', dose: '' })
}

function removePressorsRow(i: number) {
  pressorsRows.value.splice(i, 1)
}

const monitorLoading = ref(false)

function openMonitorDialog() {
  // Reset form
  Object.assign(monitorForm, {
    bpSys: '', bpDia: '', hr: '', spo2: '', rr: '', temp: '',
    ventMode: '', fio2: '', peep: '', tidalVolume: '',
    gcs: '', apache: '', sofa: '', ramsay: '',
    notes: '',
  })
  pressorsRows.value = [{ drug: '', dose: '' }]
  monitorDialogOpen.value = true
}

function submitMonitorEntry() {
  if (!admission.value) return
  monitorLoading.value = true

  const encounterId = admission.value.encounterId
  const patientId = admission.value.patientId

  // Build ventilator object (null if mode is 'none' or empty)
  const hasVent = monitorForm.ventMode && monitorForm.ventMode !== 'none'
  const ventilator = hasVent
    ? {
        mode: monitorForm.ventMode,
        fio2: monitorForm.fio2 ? Number(monitorForm.fio2) : undefined,
        peep: monitorForm.peep ? Number(monitorForm.peep) : undefined,
        tidalVolume: monitorForm.tidalVolume ? Number(monitorForm.tidalVolume) : undefined,
      }
    : null

  // Build pressors (only non-empty rows)
  const pressors = pressorsRows.value
    .filter(r => r.drug.trim())
    .map(r => ({ drug: r.drug.trim(), dose: r.dose.trim() }))

  // Build scores
  const scores: Record<string, number> = {}
  if (monitorForm.gcs) scores.gcs = Number(monitorForm.gcs)
  if (monitorForm.apache) scores.apache = Number(monitorForm.apache)
  if (monitorForm.sofa) scores.sofa = Number(monitorForm.sofa)
  if (monitorForm.ramsay) scores.ramsay = Number(monitorForm.ramsay)

  // Build vitals
  const vitals: MockNursingEntry['vitals'] = {}
  if (monitorForm.bpSys) vitals.bpSys = Number(monitorForm.bpSys)
  if (monitorForm.bpDia) vitals.bpDia = Number(monitorForm.bpDia)
  if (monitorForm.hr) vitals.hr = Number(monitorForm.hr)
  if (monitorForm.spo2) vitals.spo2 = Number(monitorForm.spo2)
  if (monitorForm.rr) vitals.rr = Number(monitorForm.rr)
  if (monitorForm.temp) vitals.t = Number(monitorForm.temp)

  const now = new Date()
  const hour = now.getHours()
  const shift: 'morning' | 'afternoon' | 'night'
    = hour >= 6 && hour < 14 ? 'morning' : hour >= 14 && hour < 22 ? 'afternoon' : 'night'

  const entry: MockNursingEntry = {
    id: `ne-icu-${Date.now()}`,
    encounterId,
    patientId,
    recordedAt: now.toISOString(),
    recordedByUserId: 104, // Karen Walsh (on-call nurse)
    shift,
    vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
    notes: monitorForm.notes.trim() || undefined,
    context: 'icu',
    icuData: {
      ventilator: ventilator ?? null,
      pressors: pressors.length > 0 ? pressors : null,
      scores: Object.keys(scores).length > 0 ? scores : null,
    },
  }

  state.nursingEntries.push(entry)

  monitorLoading.value = false
  monitorDialogOpen.value = false
}

// ── Sign entry ────────────────────────────────────────────────────────────────

function signEntry(entryId: string) {
  const idx = state.nursingEntries.findIndex(n => n.id === entryId)
  const row = idx !== -1 ? state.nursingEntries[idx] : undefined
  if (row) {
    row.signedAt = new Date().toISOString()
  }
}

// ── Table helpers ─────────────────────────────────────────────────────────────

function vitalsCompact(entry: MockNursingEntry): string {
  const v = entry.vitals
  if (!v) return '—'
  const parts: string[] = []
  if (v.bpSys != null && v.bpDia != null) parts.push(`${v.bpSys}/${v.bpDia}`)
  if (v.hr != null) parts.push(`HR ${v.hr}`)
  if (v.spo2 != null) parts.push(`SpO₂ ${v.spo2}%`)
  return parts.join(' · ') || '—'
}

function ventCompact(entry: MockNursingEntry): string {
  const vent = entry.icuData?.ventilator
  if (!vent || !vent.mode) return '—'
  return vent.fio2 != null ? `${vent.mode} · FiO₂ ${vent.fio2}%` : vent.mode
}

function pressorsCount(entry: MockNursingEntry): number {
  const p = entry.icuData?.pressors
  if (!p || !Array.isArray(p)) return 0
  return p.length
}

const VENT_MODES = ['none', 'SIMV', 'AC', 'PSV', 'CPAP', 'BiPAP']
</script>

<template>
  <Page v-if="admission && patient">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{{ initials(patient.givenName, patient.familyName) }}</AvatarFallback>
        </Avatar>
        <PageHeaderHeading
          :title="`${patient.givenName} ${patient.familyName} — ICU Stay`"
          :description="`MRN: ${patient.mrn} · Admission: ${admission.id}`"
        />
      </div>
      <template #actions>
        <Button
          v-if="!admission.dischargedAt"
          size="sm"
          variant="destructive"
          @click="openDischargeDialog"
        >
          <LogOut class="size-4" />
          Discharge from ICU
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- ── Admission summary ─────────────────────────────────────────────── -->
      <Card>
        <CardContent class="pt-6">
          <DataList>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Patient</span>
              <span class="text-sm font-medium">{{ patient.givenName }} {{ patient.familyName }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">MRN</span>
              <span class="font-mono text-sm">{{ patient.mrn }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Admitted at</span>
              <span class="text-sm">{{ fmtDateTime(admission.admittedAt) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Source</span>
              <Badge :variant="sourceVariant(admission.source)">
                {{ sourceLabel(admission.source) }}
              </Badge>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Indication</span>
              <span class="text-sm text-right max-w-sm">{{ admission.indication }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Initial severity</span>
              <Badge
                v-if="admission.initialSeverity"
                :variant="severityVariant(admission.initialSeverity)"
                class="capitalize"
              >
                {{ admission.initialSeverity }}
              </Badge>
              <span
                v-else
                class="text-muted-foreground text-sm"
              >—</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Intensivist</span>
              <span class="text-sm">{{ staffName(admission.intensivistUserId) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Initial GCS</span>
              <span class="text-sm">{{ admission.initialGcs ?? '—' }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Status</span>
              <Badge
                v-if="admission.dischargedAt && admission.outcome"
                :variant="outcomeVariant(admission.outcome)"
              >
                {{ outcomeLabel(admission.outcome) }}
              </Badge>
              <Badge
                v-else
                variant="default"
              >
                Active
              </Badge>
            </DataListItem>
            <DataListItem v-if="admission.dischargedAt">
              <span class="text-muted-foreground text-sm">Discharged at</span>
              <span class="text-sm">{{ fmtDateTime(admission.dischargedAt) }}</span>
            </DataListItem>
          </DataList>
        </CardContent>
      </Card>

      <!-- ── Monitoring chart ─────────────────────────────────────────────── -->
      <SectionCard title="Monitoring chart">
        <template #header-action>
          <Button
            v-if="!admission.dischargedAt"
            size="sm"
            variant="secondary"
            @click="openMonitorDialog"
          >
            <Plus class="size-4" />
            Add entry
          </Button>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-36">
                  Time
                </TableHead>
                <TableHead>Vitals</TableHead>
                <TableHead class="w-16">
                  GCS
                </TableHead>
                <TableHead class="w-44">
                  Ventilator
                </TableHead>
                <TableHead class="w-24">
                  Pressors
                </TableHead>
                <TableHead class="w-28">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="monitoringEntries.length === 0"
                :colspan="6"
              >
                <div class="flex flex-col items-center gap-2 py-8 text-center">
                  <Activity class="text-muted-foreground size-8" />
                  <p class="text-muted-foreground text-sm">
                    No monitoring entries yet.
                  </p>
                </div>
              </TableEmpty>
              <TableRow
                v-for="entry in monitoringEntries"
                :key="entry.id"
              >
                <TableCell class="text-sm text-muted-foreground">
                  {{ relativeTime(entry.recordedAt) }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ vitalsCompact(entry) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ entry.icuData?.scores?.gcs ?? '—' }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ ventCompact(entry) }}
                </TableCell>
                <TableCell class="text-sm">
                  <span v-if="pressorsCount(entry) > 0">
                    {{ pressorsCount(entry) }} drug{{ pressorsCount(entry) > 1 ? 's' : '' }}
                  </span>
                  <span
                    v-else
                    class="text-muted-foreground"
                  >—</span>
                </TableCell>
                <TableCell>
                  <Badge
                    v-if="entry.signedAt"
                    variant="success"
                    class="text-xs"
                  >
                    Signed
                  </Badge>
                  <Button
                    v-else
                    size="sm"
                    variant="outline"
                    @click="signEntry(entry.id)"
                  >
                    Sign
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>

    <!-- ── Discharge dialog ──────────────────────────────────────────────── -->
    <Dialog v-model:open="dischargeDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Discharge from ICU</DialogTitle>
          <DialogDescription>
            Select the discharge outcome for {{ patient.givenName }} {{ patient.familyName }}.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Outcome <span class="text-destructive">*</span></Label>
            <Select v-model="dischargeOutcome">
              <SelectTrigger>
                <SelectValue placeholder="Select outcome…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discharged_to_ward">
                  Discharged to ward
                </SelectItem>
                <SelectItem value="transferred">
                  Transferred
                </SelectItem>
                <SelectItem value="expired">
                  Expired
                </SelectItem>
                <SelectItem value="left_against_advice">
                  Left against advice
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
            variant="destructive"
            :disabled="!dischargeOutcome || dischargeLoading"
            @click="confirmDischarge"
          >
            Confirm discharge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ── Add monitoring entry dialog ───────────────────────────────────── -->
    <Dialog v-model:open="monitorDialogOpen">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add monitoring entry</DialogTitle>
          <DialogDescription>
            Record vitals, ventilator settings, pressors, and clinical scores.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6 py-2">
          <!-- Vitals section -->
          <div class="space-y-4">
            <p class="text-sm font-semibold">
              Vitals
            </p>
            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1.5">
                <Label for="m-bpsys">BP Systolic</Label>
                <Input
                  id="m-bpsys"
                  v-model="monitorForm.bpSys"
                  type="number"
                  placeholder="mmHg"
                  min="0"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-bpdia">BP Diastolic</Label>
                <Input
                  id="m-bpdia"
                  v-model="monitorForm.bpDia"
                  type="number"
                  placeholder="mmHg"
                  min="0"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-hr">Heart rate</Label>
                <Input
                  id="m-hr"
                  v-model="monitorForm.hr"
                  type="number"
                  placeholder="bpm"
                  min="0"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-spo2">SpO₂ (%)</Label>
                <Input
                  id="m-spo2"
                  v-model="monitorForm.spo2"
                  type="number"
                  placeholder="%"
                  min="0"
                  max="100"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-rr">Resp rate</Label>
                <Input
                  id="m-rr"
                  v-model="monitorForm.rr"
                  type="number"
                  placeholder="/min"
                  min="0"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-temp">Temp (°C)</Label>
                <Input
                  id="m-temp"
                  v-model="monitorForm.temp"
                  type="number"
                  placeholder="°C"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <!-- Ventilator section -->
          <div class="space-y-4">
            <p class="text-sm font-semibold">
              Ventilator
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label>Mode</Label>
                <Select v-model="monitorForm.ventMode">
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="mode in VENT_MODES"
                      :key="mode"
                      :value="mode"
                    >
                      {{ mode === 'none' ? 'None / Spontaneous' : mode }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1.5">
                <Label for="m-fio2">FiO₂ (%)</Label>
                <Input
                  id="m-fio2"
                  v-model="monitorForm.fio2"
                  type="number"
                  placeholder="%"
                  min="21"
                  max="100"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-peep">PEEP (cmH₂O)</Label>
                <Input
                  id="m-peep"
                  v-model="monitorForm.peep"
                  type="number"
                  placeholder="cmH₂O"
                  min="0"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-tv">Tidal volume (mL)</Label>
                <Input
                  id="m-tv"
                  v-model="monitorForm.tidalVolume"
                  type="number"
                  placeholder="mL"
                  min="0"
                />
              </div>
            </div>
          </div>

          <!-- Pressors section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">
                Vasopressors / inotropes
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="addPressorsRow"
              >
                <Plus class="size-3.5" />
                Add drug
              </Button>
            </div>
            <div
              v-for="(row, i) in pressorsRows"
              :key="i"
              class="flex items-end gap-2"
            >
              <div class="flex-1 space-y-1.5">
                <Label v-if="i === 0">Drug name</Label>
                <Input
                  v-model="row.drug"
                  placeholder="e.g. Noradrenaline"
                />
              </div>
              <div class="w-40 space-y-1.5">
                <Label v-if="i === 0">Dose (mcg/kg/min)</Label>
                <Input
                  v-model="row.dose"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="mcg/kg/min"
                />
              </div>
              <Button
                v-if="pressorsRows.length > 1"
                type="button"
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive"
                @click="removePressorsRow(i)"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Scores section -->
          <div class="space-y-4">
            <p class="text-sm font-semibold">
              Clinical scores
            </p>
            <div class="grid grid-cols-4 gap-3">
              <div class="space-y-1.5">
                <Label for="m-gcs">GCS (3–15)</Label>
                <Input
                  id="m-gcs"
                  v-model="monitorForm.gcs"
                  type="number"
                  min="3"
                  max="15"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-apache">APACHE II</Label>
                <Input
                  id="m-apache"
                  v-model="monitorForm.apache"
                  type="number"
                  min="0"
                  step="0.1"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-sofa">SOFA</Label>
                <Input
                  id="m-sofa"
                  v-model="monitorForm.sofa"
                  type="number"
                  min="0"
                  step="0.1"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="m-ramsay">Ramsay (1–6)</Label>
                <Input
                  id="m-ramsay"
                  v-model="monitorForm.ramsay"
                  type="number"
                  min="1"
                  max="6"
                />
              </div>
            </div>
          </div>

          <!-- Notes section -->
          <div class="space-y-1.5">
            <Label for="m-notes">Notes</Label>
            <Textarea
              id="m-notes"
              v-model="monitorForm.notes"
              placeholder="Clinical observations, interventions, plan…"
              :rows="3"
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
            :disabled="monitorLoading"
            @click="submitMonitorEntry"
          >
            Save entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>

  <!-- Not found state -->
  <div
    v-else
    class="flex items-center justify-center p-12"
  >
    <p class="text-muted-foreground text-sm">
      ICU admission not found. Redirecting…
    </p>
  </div>
</template>
