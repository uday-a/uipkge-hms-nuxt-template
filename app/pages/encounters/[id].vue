<script setup lang="ts">
import {
  Stethoscope,
  Pill,
  FlaskConical,
  Scan,
  Receipt,
  PenSquare,
  Save,
  CheckCircle2,
  Plus,
  BedDouble,
  Loader2,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type {
  MockClinicalNote,
  MockMedicationRequest,
  MockServiceRequest,
  MockNursingEntry,
  MockMedicationAdministration,
  MockBill,
  MockBedAssignment,
} from '~/mocks/types'

// ── page meta ────────────────────────────────────────────────────────────────
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Encounter' })

const route = useRoute()
const router = useRouter()
const encounterId = route.params.id as string

// ── state ────────────────────────────────────────────────────────────────────
const state = useMockState()

// ── entity lookups ────────────────────────────────────────────────────────────
const encounter = computed(() => state.encounters.find(e => e.id === encounterId))
const patient = computed(() =>
  encounter.value ? state.patients.find(p => p.id === encounter.value!.patientId) : undefined,
)
const attending = computed(() =>
  encounter.value?.attendingUserId
    ? state.staff.find(s => s.id === encounter.value!.attendingUserId)
    : undefined,
)
const department = computed(() =>
  encounter.value?.departmentId
    ? state.departments.find(d => d.id === encounter.value!.departmentId)
    : undefined,
)

// ── SOAP notes ────────────────────────────────────────────────────────────────
const myNotes = computed(() =>
  state.clinicalNotes.filter(n => n.encounterId === encounterId && n.status !== 'superseded'),
)
const draftNote = computed(() => myNotes.value.find(n => n.status === 'draft'))
const signedNote = computed(() => myNotes.value.find(n => n.status === 'signed'))

// ── prescriptions ────────────────────────────────────────────────────────────
const myRx = computed(() => state.prescriptions.filter(r => r.encounterId === encounterId))

// ── diagnostics ──────────────────────────────────────────────────────────────
const diagOrders = computed(() => [
  ...state.labOrders.filter(s => s.encounterId === encounterId),
  ...state.radiologyOrders.filter(s => s.encounterId === encounterId),
])
const diagReports = computed(() =>
  state.diagnosticReports.filter(r => r.encounterId === encounterId),
)

// ── bill ──────────────────────────────────────────────────────────────────────
const bill = computed(() => state.bills.find(b => b.encounterId === encounterId))

// ── inpatient data ────────────────────────────────────────────────────────────
const currentBedAssignment = computed(() =>
  state.bedAssignments.find(ba => ba.encounterId === encounterId && !ba.releasedAt),
)
const currentBed = computed(() =>
  currentBedAssignment.value
    ? state.beds.find(b => b.id === currentBedAssignment.value!.bedId)
    : undefined,
)
const currentUnit = computed(() =>
  currentBedAssignment.value
    ? state.units.find(u => u.id === currentBedAssignment.value!.unitId)
    : undefined,
)
const nursingEntries = computed(() =>
  [...state.nursingEntries.filter(n => n.encounterId === encounterId)].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  ),
)
const latestNursingEntries = computed(() => nursingEntries.value.slice(0, 5))
const marRows = computed(() => {
  const activeRx = myRx.value.filter(r => r.status === 'active')
  return activeRx.map((rx) => {
    const drug = state.drugs.find(d => d.id === rx.drugId)
    const lastAdmin = [...state.medicationAdministrations]
      .filter(m => m.medicationRequestId === rx.id)
      .sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime())[0]
    return { rx, drug, lastAdmin }
  })
})

// ── helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(' ')
    .filter(p => p.length > 0)
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function rupees(cents: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function truncate(s: string | undefined, len = 60) {
  if (!s) return '—'
  return s.length > len ? s.slice(0, len) + '…' : s
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

function encounterStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    planned: 'outline',
    arrived: 'outline',
    in_progress: 'secondary',
    finished: 'default',
    cancelled: 'destructive',
    no_show: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function rxStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    draft: 'outline',
    active: 'default',
    completed: 'secondary',
    cancelled: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function orderPriorityVariant(priority: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    routine: 'secondary',
    urgent: 'warning',
    stat: 'destructive',
  }
  return map[priority] ?? 'secondary'
}

function orderStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    draft: 'outline',
    active: 'info',
    completed: 'default',
    cancelled: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function reportStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    draft: 'outline',
    final: 'default',
    amended: 'warning',
    superseded: 'secondary',
  }
  return map[status] ?? 'secondary'
}

function marStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    given: 'default',
    held: 'warning',
    refused: 'destructive',
    omitted: 'destructive',
    partial: 'secondary',
  }
  return map[status] ?? 'secondary'
}

// ── encounter state machine ───────────────────────────────────────────────────
function markArrived() {
  const enc = state.encounters.find(e => e.id === encounterId)
  if (enc) enc.status = 'arrived'
}

function startConsult() {
  const enc = state.encounters.find(e => e.id === encounterId)
  if (enc) enc.status = 'in_progress'
}

function finishEncounter() {
  const enc = state.encounters.find(e => e.id === encounterId)
  if (enc) {
    enc.status = 'finished'
    enc.dischargeAt = new Date().toISOString()
  }
}

function cancelEncounter() {
  const enc = state.encounters.find(e => e.id === encounterId)
  if (enc) enc.status = 'cancelled'
}

// ── SOAP note logic ───────────────────────────────────────────────────────────
const savedIndicator = ref(false)
let saveTimer: ReturnType<typeof setTimeout> | null = null

function startSoapNote() {
  const doctor = state.staff.find(s => s.role === 'doctor')
  const note: MockClinicalNote = {
    id: `note-${uid()}`,
    encounterId,
    authorUserId: doctor?.id ?? 101,
    kind: 'soap',
    status: 'draft',
    content: { subjective: '', objective: '', assessment: '', plan: '', diagnoses: [] },
  }
  state.clinicalNotes.push(note)
}

function onSoapInput() {
  // Show "Saved" indicator briefly (debounced)
  savedIndicator.value = false
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    savedIndicator.value = true
    setTimeout(() => {
      savedIndicator.value = false
    }, 2000)
  }, 600)
}

// Diagnoses chip management
const diagnosisInput = ref('')
function addDiagnosis() {
  const text = diagnosisInput.value.trim()
  if (!text || !draftNote.value) return
  if (!draftNote.value.content.diagnoses) draftNote.value.content.diagnoses = []
  draftNote.value.content.diagnoses.push({ code: '', display: text })
  diagnosisInput.value = ''
}
function removeDiagnosis(idx: number) {
  if (!draftNote.value) return
  draftNote.value.content.diagnoses.splice(idx, 1)
}

// Sign note
const signingNote = ref(false)
async function signNote() {
  if (!draftNote.value) return
  signingNote.value = true
  await new Promise(r => setTimeout(r, 800))
  const doctor = state.staff.find(s => s.role === 'doctor')
  draftNote.value.status = 'signed'
  draftNote.value.signedAt = new Date().toISOString()
  draftNote.value.signedByUserId = doctor?.id ?? 101
  signingNote.value = false
}

// Amend note
function amendNote() {
  if (!signedNote.value) return
  const prevId = signedNote.value.id
  const doctor = state.staff.find(s => s.role === 'doctor')
  // Mark old as superseded
  signedNote.value.status = 'superseded'
  // Create new draft copying old content
  const newNote: MockClinicalNote = {
    id: `note-${uid()}`,
    encounterId,
    authorUserId: doctor?.id ?? 101,
    kind: 'soap',
    status: 'draft',
    content: JSON.parse(JSON.stringify(signedNote.value.content)),
    // @ts-expect-error — previousVersionId is not in MockClinicalNote; safe for mock use
    previousVersionId: prevId,
  }
  state.clinicalNotes.push(newNote)
}

const signedByStaff = computed(() =>
  signedNote.value?.signedByUserId
    ? state.staff.find(s => s.id === signedNote.value!.signedByUserId)
    : undefined,
)

// ── Prescription dialog ───────────────────────────────────────────────────────
const showRxDialog = ref(false)
const rxForm = reactive({
  drugId: '',
  doseValue: '',
  doseUnit: 'mg',
  route: 'oral',
  frequencyText: '',
  durationDays: '',
  dispenseQty: '',
  prn: false,
  instructions: '',
})

function resetRxForm() {
  rxForm.drugId = ''
  rxForm.doseValue = ''
  rxForm.doseUnit = 'mg'
  rxForm.route = 'oral'
  rxForm.frequencyText = ''
  rxForm.durationDays = ''
  rxForm.dispenseQty = ''
  rxForm.prn = false
  rxForm.instructions = ''
}

function addMedication() {
  if (!rxForm.drugId || !rxForm.doseValue || !rxForm.frequencyText) return
  const doctor = state.staff.find(s => s.role === 'doctor')
  const rx: MockMedicationRequest = {
    id: `rx-${uid()}`,
    encounterId,
    prescriberUserId: doctor?.id ?? 101,
    patientId: encounter.value?.patientId ?? '',
    drugId: rxForm.drugId,
    doseValue: Number(rxForm.doseValue),
    doseUnit: rxForm.doseUnit,
    route: rxForm.route,
    frequencyText: rxForm.frequencyText,
    durationDays: Number(rxForm.durationDays) || 7,
    dispenseQty: Number(rxForm.dispenseQty) || 1,
    prn: rxForm.prn,
    instructions: rxForm.instructions || undefined,
    status: 'draft',
  }
  state.prescriptions.push(rx)
  showRxDialog.value = false
  resetRxForm()
}

// Sign prescriptions
function signAllRx() {
  const drafts = myRx.value.filter(r => r.status === 'draft')
  drafts.forEach((rx) => {
    const target = state.prescriptions.find(r => r.id === rx.id)
    if (target) {
      target.status = 'active'
      target.signedAt = new Date().toISOString()
    }
  })
}

const hasDraftRx = computed(() => myRx.value.some(r => r.status === 'draft'))

// ── Lab order dialog ──────────────────────────────────────────────────────────
const showLabDialog = ref(false)
const labForm = reactive({
  catalogId: '',
  priority: 'routine',
  note: '',
})

function resetLabForm() {
  labForm.catalogId = ''
  labForm.priority = 'routine'
  labForm.note = ''
}

function addLabOrder() {
  if (!labForm.catalogId) return
  const catalogItem = state.labCatalog.find(l => l.id === labForm.catalogId)
  if (!catalogItem) return
  const doctor = state.staff.find(s => s.role === 'doctor')
  const order: MockServiceRequest = {
    id: `labord-${uid()}`,
    encounterId,
    patientId: encounter.value?.patientId ?? '',
    facilityId: encounter.value?.facilityId ?? 'fac-001',
    requesterUserId: doctor?.id ?? 101,
    category: 'lab',
    code: catalogItem.code,
    display: catalogItem.display,
    priority: labForm.priority as 'routine' | 'urgent' | 'stat',
    status: 'active',
    createdAt: new Date().toISOString(),
    catalogId: labForm.catalogId,
  }
  state.labOrders.push(order)
  showLabDialog.value = false
  resetLabForm()
}

// ── Radiology order dialog ────────────────────────────────────────────────────
const showRadDialog = ref(false)
const radForm = reactive({
  modality: 'xr',
  bodyRegion: '',
  description: '',
  priority: 'routine',
})

function resetRadForm() {
  radForm.modality = 'xr'
  radForm.bodyRegion = ''
  radForm.description = ''
  radForm.priority = 'routine'
}

function addRadOrder() {
  if (!radForm.bodyRegion) return
  const doctor = state.staff.find(s => s.role === 'doctor')
  const modalityLabels: Record<string, string> = {
    xr: 'X-Ray',
    ct: 'CT',
    mri: 'MRI',
    us: 'Ultrasound',
  }
  const order: MockServiceRequest = {
    id: `radord-${uid()}`,
    encounterId,
    patientId: encounter.value?.patientId ?? '',
    facilityId: encounter.value?.facilityId ?? 'fac-001',
    requesterUserId: doctor?.id ?? 101,
    category: 'radiology',
    code: `${radForm.modality.toUpperCase()}-${radForm.bodyRegion.toUpperCase().replace(/\s+/g, '-')}`,
    display: `${modalityLabels[radForm.modality] ?? radForm.modality.toUpperCase()} — ${radForm.bodyRegion}`,
    priority: radForm.priority as 'routine' | 'urgent' | 'stat',
    status: 'active',
    createdAt: new Date().toISOString(),
    modality: radForm.modality,
    bodyRegion: radForm.bodyRegion,
  }
  state.radiologyOrders.push(order)
  showRadDialog.value = false
  resetRadForm()
}

// ── Nursing entry dialog ──────────────────────────────────────────────────────
const showNursingDialog = ref(false)
const nursingForm = reactive({
  shift: 'morning',
  bpSys: '',
  bpDia: '',
  hr: '',
  t: '',
  spo2: '',
  painScore: '',
  notes: '',
})

function resetNursingForm() {
  nursingForm.shift = 'morning'
  nursingForm.bpSys = ''
  nursingForm.bpDia = ''
  nursingForm.hr = ''
  nursingForm.t = ''
  nursingForm.spo2 = ''
  nursingForm.painScore = ''
  nursingForm.notes = ''
}

function addNursingEntry() {
  const nurse = state.staff.find(s => s.role === 'nurse')
  const entry: MockNursingEntry = {
    id: `ne-${uid()}`,
    encounterId,
    patientId: encounter.value?.patientId ?? '',
    recordedAt: new Date().toISOString(),
    recordedByUserId: nurse?.id ?? 104,
    shift: nursingForm.shift as 'morning' | 'afternoon' | 'night',
    vitals: {
      bpSys: nursingForm.bpSys ? Number(nursingForm.bpSys) : undefined,
      bpDia: nursingForm.bpDia ? Number(nursingForm.bpDia) : undefined,
      hr: nursingForm.hr ? Number(nursingForm.hr) : undefined,
      t: nursingForm.t ? Number(nursingForm.t) : undefined,
      spo2: nursingForm.spo2 ? Number(nursingForm.spo2) : undefined,
    },
    painScore: nursingForm.painScore ? Number(nursingForm.painScore) : undefined,
    notes: nursingForm.notes || undefined,
    context: 'ward',
  }
  state.nursingEntries.push(entry)
  showNursingDialog.value = false
  resetNursingForm()
}

// ── MAR dialog ────────────────────────────────────────────────────────────────
const showMarDialog = ref(false)
const marDialogRxId = ref('')
const marForm = reactive({
  doseValue: '',
  doseUnit: 'mg',
  status: 'given',
  notes: '',
})

function openMarDialog(rxId: string) {
  marDialogRxId.value = rxId
  const rx = myRx.value.find(r => r.id === rxId)
  if (rx) {
    marForm.doseValue = String(rx.doseValue)
    marForm.doseUnit = rx.doseUnit
  }
  marForm.status = 'given'
  marForm.notes = ''
  showMarDialog.value = true
}

function addMarEntry() {
  const nurse = state.staff.find(s => s.role === 'nurse')
  const admin: MockMedicationAdministration = {
    id: `mar-${uid()}`,
    medicationRequestId: marDialogRxId.value,
    encounterId,
    patientId: encounter.value?.patientId ?? '',
    administeredAt: new Date().toISOString(),
    administeredByUserId: nurse?.id ?? 104,
    doseValue: Number(marForm.doseValue),
    doseUnit: marForm.doseUnit,
    status: marForm.status as MockMedicationAdministration['status'],
    notes: marForm.notes || undefined,
  }
  state.medicationAdministrations.push(admin)
  showMarDialog.value = false
}

// ── Transfer bed dialog ────────────────────────────────────────────────────────
const showTransferDialog = ref(false)
const transferBedId = ref('')

function availableBeds() {
  return state.beds.filter(b => b.status === 'available')
}

function transferBed() {
  if (!transferBedId.value) return
  const assignment = state.bedAssignments.find(
    ba => ba.encounterId === encounterId && !ba.releasedAt,
  )
  if (assignment) {
    // Release old bed
    assignment.releasedAt = new Date().toISOString()
    // Free old bed status
    const oldBed = state.beds.find(b => b.id === assignment.bedId)
    if (oldBed) oldBed.status = 'cleaning'
  }
  // Assign new bed
  const newBed = state.beds.find(b => b.id === transferBedId.value)
  if (!newBed) return
  const doctor = state.staff.find(s => s.role === 'doctor')

  const newAssignment: MockBedAssignment = {
    id: `ba-${uid()}`,
    encounterId,
    patientId: encounter.value?.patientId ?? '',
    bedId: transferBedId.value,
    facilityId: encounter.value?.facilityId ?? 'fac-001',
    unitId: newBed.unitId,
    assignedAt: new Date().toISOString(),
    reason: 'transfer',
    assignedByUserId: doctor?.id ?? 101,
  }
  state.bedAssignments.push(newAssignment)
  newBed.status = 'occupied'
  // Also update encounter bedId
  const enc = state.encounters.find(e => e.id === encounterId)
  if (enc) enc.bedId = transferBedId.value
  showTransferDialog.value = false
  transferBedId.value = ''
}

// ── Bill management ───────────────────────────────────────────────────────────
function createBill() {
  const enc = encounter.value
  if (!enc) return
  const newBill: MockBill = {
    id: `bill-${uid()}`,
    encounterId,
    billNo: `BILL-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
    patientId: enc.patientId,
    facilityId: enc.facilityId,
    subtotalCents: 0,
    taxTotalCents: 0,
    discountCents: 0,
    totalCents: 0,
    paidCents: 0,
    balanceCents: 0,
    status: 'draft',
  }
  state.bills.push(newBill)
  router.push(`/billing/${newBill.id}`)
}

// ── Derived display values ────────────────────────────────────────────────────
const patientFullName = computed(() =>
  patient.value ? `${patient.value.givenName} ${patient.value.familyName}` : encounterId,
)

const encounterDescription = computed(() => {
  const type = encounter.value?.type ?? 'encounter'
  const dept = department.value?.name ?? 'Unknown Department'
  return `${type.charAt(0).toUpperCase() + type.slice(1)} encounter · ${dept}`
})

const isInpatient = computed(
  () => encounter.value?.type === 'inpatient' || encounter.value?.type === 'emergency',
)

const showBillSection = computed(() =>
  ['in_progress', 'finished'].includes(encounter.value?.status ?? ''),
)
</script>

<template>
  <Page v-if="encounter && patient">
    <!-- ── Page header ──────────────────────────────────────────────────────── -->
    <PageHeader>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <!-- Patient identity -->
        <div class="flex items-center gap-3">
          <Avatar class="size-11">
            <AvatarFallback class="bg-primary/10 text-primary text-sm font-semibold">
              {{ initials(patientFullName) }}
            </AvatarFallback>
          </Avatar>
          <div>
            <PageHeaderHeading
              :title="patientFullName"
              :description="`${encounterDescription} · `"
            />
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <span class="text-muted-foreground font-mono text-xs">{{ patient.mrn }}</span>
              <Badge
                :variant="encounterStatusVariant(encounter.status)"
                class="capitalize"
              >
                {{ encounter.status.replace('_', ' ') }}
              </Badge>
              <Badge
                variant="outline"
                class="capitalize"
              >
                {{ encounter.type }}
              </Badge>
              <Badge
                v-if="department"
                variant="secondary"
              >
                {{ department.name }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- State-machine action buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="encounter.status === 'planned'"
            variant="outline"
            size="sm"
            @click="markArrived"
          >
            Mark Arrived
          </Button>
          <Button
            v-if="encounter.status === 'arrived'"
            variant="default"
            size="sm"
            @click="startConsult"
          >
            <Stethoscope class="mr-1.5 size-4" />
            Start Consult
          </Button>
          <Button
            v-if="encounter.status === 'in_progress'"
            variant="default"
            size="sm"
            @click="finishEncounter"
          >
            <CheckCircle2 class="mr-1.5 size-4" />
            Finish Encounter
          </Button>
          <Button
            v-if="!['finished', 'cancelled', 'no_show'].includes(encounter.status)"
            variant="destructive"
            size="sm"
            @click="cancelEncounter"
          >
            Cancel
          </Button>
        </div>
      </div>

      <!-- Chief complaint -->
      <div
        v-if="encounter.reasonChiefComplaint"
        class="bg-muted/50 mt-3 rounded-md px-3 py-2"
      >
        <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Chief complaint: </span>
        <span class="text-sm">{{ encounter.reasonChiefComplaint }}</span>
      </div>

      <!-- Attending info -->
      <div
        v-if="attending"
        class="mt-2 flex items-center gap-1.5"
      >
        <Stethoscope class="text-muted-foreground size-3.5" />
        <span class="text-muted-foreground text-xs">Attending: {{ attending.name }}</span>
        <span
          v-if="attending.specialty"
          class="text-muted-foreground text-xs"
        >· {{ attending.specialty }}</span>
      </div>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- ── SectionCard #1: SOAP Note ──────────────────────────────────────── -->
      <SectionCard title="Clinical Note">
        <template #header-action>
          <div class="flex items-center gap-2">
            <PenSquare class="text-muted-foreground size-4" />
            <span
              v-if="savedIndicator"
              class="text-muted-foreground flex items-center gap-1 text-xs"
            >
              <Save class="size-3" />
              Saved
            </span>
          </div>
        </template>

        <!-- No note yet -->
        <div
          v-if="!draftNote && !signedNote"
          class="flex flex-col items-center justify-center py-10 text-center"
        >
          <PenSquare class="text-muted-foreground mb-3 size-8" />
          <p class="text-muted-foreground mb-4 text-sm">
            No clinical note for this encounter yet.
          </p>
          <Button @click="startSoapNote">
            <Plus class="mr-1.5 size-4" />
            Start SOAP Note
          </Button>
        </div>

        <!-- Draft editor -->
        <div
          v-else-if="draftNote"
          class="space-y-4"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <!-- Subjective -->
            <div class="space-y-1.5">
              <Label>Subjective</Label>
              <Textarea
                v-model="draftNote.content.subjective"
                placeholder="What the patient reports…"
                class="min-h-[100px] resize-none"
                @input="onSoapInput"
              />
            </div>
            <!-- Objective -->
            <div class="space-y-1.5">
              <Label>Objective</Label>
              <Textarea
                v-model="draftNote.content.objective"
                placeholder="Examination findings, vitals, investigations…"
                class="min-h-[100px] resize-none"
                @input="onSoapInput"
              />
            </div>
            <!-- Assessment -->
            <div class="space-y-1.5">
              <Label>Assessment</Label>
              <Textarea
                v-model="draftNote.content.assessment"
                placeholder="Diagnosis / differential…"
                class="min-h-[100px] resize-none"
                @input="onSoapInput"
              />
            </div>
            <!-- Plan -->
            <div class="space-y-1.5">
              <Label>Plan</Label>
              <Textarea
                v-model="draftNote.content.plan"
                placeholder="Management plan, follow-up…"
                class="min-h-[100px] resize-none"
                @input="onSoapInput"
              />
            </div>
          </div>

          <!-- Diagnoses (ICD-10) chip section -->
          <div class="space-y-1.5">
            <Label>Diagnoses (ICD-10)</Label>
            <div class="flex flex-wrap gap-1.5 empty:hidden">
              <Badge
                v-for="(diag, idx) in draftNote.content.diagnoses ?? []"
                :key="idx"
                variant="outline"
                class="gap-1 pr-1"
              >
                {{ diag.display || diag.code }}
                <Button
                  variant="ghost"
                  size="icon"
                  class="ml-0.5 size-4 opacity-70 hover:opacity-100 hover:text-destructive"
                  @click="removeDiagnosis(idx as number)"
                >
                  <X class="size-3" />
                </Button>
              </Badge>
            </div>
            <div class="flex gap-2">
              <Input
                v-model="diagnosisInput"
                placeholder="e.g. J18.9 Pneumonia, unspecified"
                class="max-w-xs"
                @keydown.enter.prevent="addDiagnosis"
              />
              <Button
                variant="outline"
                size="sm"
                @click="addDiagnosis"
              >
                <Plus class="mr-1 size-3.5" />
                Add
              </Button>
            </div>
          </div>

          <!-- Sign button -->
          <div class="flex justify-end">
            <Button
              :disabled="signingNote"
              @click="signNote"
            >
              <Loader2
                v-if="signingNote"
                class="mr-1.5 size-4 animate-spin"
              />
              <CheckCircle2
                v-else
                class="mr-1.5 size-4"
              />
              {{ signingNote ? 'Signing…' : 'Sign Note' }}
            </Button>
          </div>
        </div>

        <!-- Signed read-only view -->
        <div
          v-else-if="signedNote"
          class="space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Badge variant="default">
                Signed
              </Badge>
              <span
                v-if="signedByStaff"
                class="text-muted-foreground text-xs"
              >
                by {{ signedByStaff.name }}
                <span v-if="signedNote.signedAt">at {{ fmtTime(signedNote.signedAt) }}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="amendNote"
            >
              <PenSquare class="mr-1.5 size-3.5" />
              Amend
            </Button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div
              v-for="field in ['subjective', 'objective', 'assessment', 'plan']"
              :key="field"
              class="space-y-1"
            >
              <p class="text-xs font-semibold uppercase tracking-wide capitalize text-muted-foreground">
                {{ field }}
              </p>
              <p class="bg-muted/40 rounded-md px-3 py-2 text-sm leading-relaxed">
                {{ signedNote.content[field] || '—' }}
              </p>
            </div>
          </div>

          <!-- Diagnoses read-only chips -->
          <div
            v-if="signedNote.content.diagnoses?.length"
            class="space-y-1.5"
          >
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Diagnoses
            </p>
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="(diag, idx) in signedNote.content.diagnoses"
                :key="idx"
                variant="secondary"
              >
                {{ diag.display || diag.code }}
              </Badge>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- ── SectionCard #2: Prescriptions ──────────────────────────────────── -->
      <SectionCard title="Prescriptions">
        <template #header-action>
          <div class="flex items-center gap-2">
            <Button
              v-if="hasDraftRx"
              variant="outline"
              size="sm"
              @click="signAllRx"
            >
              <CheckCircle2 class="mr-1.5 size-3.5" />
              Sign All Drafts
            </Button>
            <Button
              size="sm"
              @click="showRxDialog = true"
            >
              <Plus class="mr-1.5 size-3.5" />
              Add Medication
            </Button>
          </div>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead class="w-[120px]">
                  Dose
                </TableHead>
                <TableHead class="w-[120px]">
                  Route
                </TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead class="w-[80px]">
                  Duration
                </TableHead>
                <TableHead class="w-[60px]">
                  Qty
                </TableHead>
                <TableHead class="w-[100px]">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="myRx.length">
                <TableRow
                  v-for="rx in myRx"
                  :key="rx.id"
                >
                  <TableCell>
                    <p class="text-sm font-medium leading-none">
                      {{ state.drugs.find(d => d.id === rx.drugId)?.display ?? rx.drugId }}
                    </p>
                    <p
                      v-if="rx.instructions"
                      class="text-muted-foreground mt-0.5 text-xs"
                    >
                      {{ truncate(rx.instructions, 50) }}
                    </p>
                    <Badge
                      v-if="rx.prn"
                      variant="outline"
                      class="mt-0.5 h-4 px-1 text-[10px]"
                    >
                      PRN
                    </Badge>
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ rx.doseValue }} {{ rx.doseUnit }}
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm capitalize">
                    {{ rx.route }}
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ rx.frequencyText }}
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ rx.durationDays }}d
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ rx.dispenseQty }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="rxStatusVariant(rx.status)"
                      class="capitalize"
                    >
                      {{ rx.status }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </template>
              <TableEmpty
                v-else
                :colspan="7"
              >
                No prescriptions for this encounter.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── SectionCard #3: Diagnostics ────────────────────────────────────── -->
      <SectionCard title="Diagnostics">
        <template #header-action>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="showLabDialog = true"
            >
              <FlaskConical class="mr-1.5 size-3.5" />
              Order Lab
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="showRadDialog = true"
            >
              <Scan class="mr-1.5 size-3.5" />
              Order Radiology
            </Button>
          </div>
        </template>

        <Tabs default-value="orders">
          <TabsList class="mb-4">
            <TabsTrigger value="orders">
              Orders
              <Badge
                v-if="diagOrders.length"
                variant="secondary"
                class="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {{ diagOrders.length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              <Badge
                v-if="diagReports.length"
                variant="secondary"
                class="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {{ diagReports.length }}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <!-- Orders table -->
          <TabsContent value="orders">
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-[100px]">
                      Category
                    </TableHead>
                    <TableHead>Test / Study</TableHead>
                    <TableHead class="w-[100px]">
                      Priority
                    </TableHead>
                    <TableHead class="w-[100px]">
                      Status
                    </TableHead>
                    <TableHead class="w-[70px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <template v-if="diagOrders.length">
                    <TableRow
                      v-for="order in diagOrders"
                      :key="order.id"
                    >
                      <TableCell>
                        <Badge
                          :variant="order.category === 'lab' ? 'info' : 'secondary'"
                          class="capitalize"
                        >
                          {{ order.category }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p class="text-sm font-medium">
                          {{ order.display }}
                        </p>
                        <p
                          v-if="order.bodyRegion"
                          class="text-muted-foreground text-xs"
                        >
                          {{ order.bodyRegion }}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          :variant="orderPriorityVariant(order.priority)"
                          class="capitalize"
                        >
                          {{ order.priority }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          :variant="orderStatusVariant(order.status)"
                          class="capitalize"
                        >
                          {{ order.status }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-7 gap-1 px-2 text-xs"
                          :as-child="true"
                        >
                          <NuxtLink
                            :to="order.category === 'lab' ? `/lab/orders/${order.id}` : `/radiology/orders/${order.id}`"
                            class="flex items-center gap-1"
                          >
                            Open
                            <ChevronRight class="size-3" />
                          </NuxtLink>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </template>
                  <TableEmpty
                    v-else
                    :colspan="5"
                  >
                    No diagnostic orders.
                  </TableEmpty>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <!-- Reports table -->
          <TabsContent value="reports">
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-[100px]">
                      Category
                    </TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead>Conclusion</TableHead>
                    <TableHead class="w-[100px]">
                      Status
                    </TableHead>
                    <TableHead class="w-[70px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <template v-if="diagReports.length">
                    <TableRow
                      v-for="report in diagReports"
                      :key="report.id"
                    >
                      <TableCell>
                        <Badge
                          :variant="report.category === 'lab' ? 'info' : 'secondary'"
                          class="capitalize"
                        >
                          {{ report.category }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p class="text-sm font-medium">
                          {{ report.display }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ fmtDateTime(report.effectiveAt) }}
                        </p>
                      </TableCell>
                      <TableCell class="text-muted-foreground max-w-[240px] text-xs">
                        {{ truncate(report.conclusion, 80) }}
                      </TableCell>
                      <TableCell>
                        <Badge
                          :variant="reportStatusVariant(report.status)"
                          class="capitalize"
                        >
                          {{ report.status }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-7 gap-1 px-2 text-xs"
                          :as-child="true"
                        >
                          <NuxtLink
                            :to="`/lab/reports/${report.id}`"
                            class="flex items-center gap-1"
                          >
                            View
                            <ExternalLink class="size-3" />
                          </NuxtLink>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </template>
                  <TableEmpty
                    v-else
                    :colspan="5"
                  >
                    No diagnostic reports yet.
                  </TableEmpty>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </SectionCard>

      <!-- ── SectionCard #4: Inpatient Panel ───────────────────────────────── -->
      <template v-if="isInpatient">
        <SectionCard title="Inpatient Panel">
          <template #header-action>
            <BedDouble class="text-muted-foreground size-4" />
          </template>

          <div class="space-y-6">
            <!-- Current bed -->
            <div>
              <div class="mb-3 flex items-center justify-between">
                <h4 class="text-sm font-semibold">
                  Current Bed
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  @click="showTransferDialog = true"
                >
                  <BedDouble class="mr-1.5 size-3.5" />
                  Transfer Bed
                </Button>
              </div>
              <DataList v-if="currentBed">
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Bed</span>
                  <span class="text-sm font-medium">{{ currentBed.label }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Unit</span>
                  <span class="text-sm font-medium">{{ currentUnit?.name ?? '—' }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Status</span>
                  <Badge
                    variant="secondary"
                    class="capitalize"
                  >
                    {{ currentBed.status }}
                  </Badge>
                </DataListItem>
                <DataListItem v-if="currentBedAssignment">
                  <span class="text-muted-foreground text-sm">Assigned</span>
                  <span class="text-sm">{{ fmtDateTime(currentBedAssignment.assignedAt) }}</span>
                </DataListItem>
              </DataList>
              <p
                v-else
                class="text-muted-foreground text-sm"
              >
                No bed assigned.
              </p>
            </div>

            <!-- Nursing chart -->
            <div>
              <div class="mb-3 flex items-center justify-between">
                <h4 class="text-sm font-semibold">
                  Nursing Chart
                  <span class="text-muted-foreground ml-1 text-xs font-normal">(latest 5)</span>
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  @click="showNursingDialog = true"
                >
                  <Plus class="mr-1.5 size-3.5" />
                  Add Entry
                </Button>
              </div>
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="w-[130px]">
                        Time
                      </TableHead>
                      <TableHead class="w-[90px]">
                        Shift
                      </TableHead>
                      <TableHead>BP / HR / T</TableHead>
                      <TableHead class="w-[70px]">
                        Pain
                      </TableHead>
                      <TableHead class="w-[80px]">
                        Signed
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <template v-if="latestNursingEntries.length">
                      <TableRow
                        v-for="entry in latestNursingEntries"
                        :key="entry.id"
                      >
                        <TableCell class="text-muted-foreground text-xs font-mono">
                          {{ fmtDateTime(entry.recordedAt) }}
                        </TableCell>
                        <TableCell class="capitalize text-xs">
                          {{ entry.shift }}
                        </TableCell>
                        <TableCell class="text-sm font-mono">
                          <span v-if="entry.vitals?.bpSys">
                            {{ entry.vitals.bpSys }}/{{ entry.vitals.bpDia }}
                            <span class="text-muted-foreground text-xs"> · </span>
                            {{ entry.vitals.hr }}
                            <span class="text-muted-foreground text-xs"> · </span>
                            {{ entry.vitals.t }}°C
                          </span>
                          <span
                            v-else
                            class="text-muted-foreground"
                          >—</span>
                        </TableCell>
                        <TableCell>
                          <span
                            v-if="entry.painScore !== undefined"
                            class="text-sm"
                            :class="(entry.painScore ?? 0) >= 7 ? 'text-destructive font-semibold' : (entry.painScore ?? 0) >= 4 ? 'text-warning font-medium' : 'text-muted-foreground'"
                          >
                            {{ entry.painScore }}/10
                          </span>
                          <span
                            v-else
                            class="text-muted-foreground text-sm"
                          >—</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            v-if="entry.signedAt"
                            variant="default"
                            class="text-[10px]"
                          >
                            signed
                          </Badge>
                          <Badge
                            v-else
                            variant="outline"
                            class="text-[10px]"
                          >
                            draft
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </template>
                    <TableEmpty
                      v-else
                      :colspan="5"
                    >
                      No nursing entries recorded.
                    </TableEmpty>
                  </TableBody>
                </Table>
              </div>
            </div>

            <!-- MAR -->
            <div>
              <div class="mb-3 flex items-center justify-between">
                <h4 class="text-sm font-semibold">
                  Medication Administration Record (MAR)
                </h4>
              </div>
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drug</TableHead>
                      <TableHead class="w-[120px]">
                        Dose
                      </TableHead>
                      <TableHead class="w-[120px]">
                        Last Given
                      </TableHead>
                      <TableHead class="w-[100px]">
                        Last Status
                      </TableHead>
                      <TableHead class="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <template v-if="marRows.length">
                      <TableRow
                        v-for="row in marRows"
                        :key="row.rx.id"
                      >
                        <TableCell>
                          <p class="text-sm font-medium">
                            {{ row.drug?.display ?? row.rx.drugId }}
                          </p>
                          <p class="text-muted-foreground text-xs">
                            {{ row.rx.frequencyText }}
                          </p>
                        </TableCell>
                        <TableCell class="text-sm">
                          {{ row.rx.doseValue }} {{ row.rx.doseUnit }}
                        </TableCell>
                        <TableCell class="text-muted-foreground text-xs">
                          {{ row.lastAdmin ? fmtDateTime(row.lastAdmin.administeredAt) : 'Not given' }}
                        </TableCell>
                        <TableCell>
                          <Badge
                            v-if="row.lastAdmin"
                            :variant="marStatusVariant(row.lastAdmin.status)"
                            class="capitalize"
                          >
                            {{ row.lastAdmin.status }}
                          </Badge>
                          <span
                            v-else
                            class="text-muted-foreground text-xs"
                          >—</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            class="h-7 px-2 text-xs"
                            @click="openMarDialog(row.rx.id)"
                          >
                            Administer
                          </Button>
                        </TableCell>
                      </TableRow>
                    </template>
                    <TableEmpty
                      v-else
                      :colspan="5"
                    >
                      No active medications for MAR.
                    </TableEmpty>
                  </TableBody>
                </Table>
              </div>
            </div>

            <!-- Discharge editor link -->
            <div class="flex justify-end border-t pt-4">
              <Button
                variant="outline"
                :as-child="true"
              >
                <NuxtLink
                  :to="`/discharge/${encounterId}`"
                  class="flex items-center gap-1.5"
                >
                  Open Full Discharge Editor
                  <ChevronRight class="size-4" />
                </NuxtLink>
              </Button>
            </div>
          </div>
        </SectionCard>
      </template>

      <!-- ── SectionCard #5: Bill ───────────────────────────────────────────── -->
      <template v-if="showBillSection">
        <SectionCard title="Billing">
          <template #header-action>
            <Receipt class="text-muted-foreground size-4" />
          </template>

          <!-- Bill exists -->
          <div
            v-if="bill"
            class="space-y-4"
          >
            <div class="flex items-center gap-2">
              <Badge
                variant="secondary"
                class="capitalize"
              >
                {{ bill.status.replace('_', ' ') }}
              </Badge>
              <span class="text-muted-foreground text-xs font-mono">{{ bill.billNo }}</span>
            </div>

            <DataList>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Subtotal</span>
                <span class="text-sm">{{ rupees(bill.subtotalCents) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Tax</span>
                <span class="text-sm">{{ rupees(bill.taxTotalCents) }}</span>
              </DataListItem>
              <DataListItem v-if="bill.discountCents > 0">
                <span class="text-muted-foreground text-sm">Discount</span>
                <span class="text-destructive text-sm">- {{ rupees(bill.discountCents) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="font-semibold text-sm">Total</span>
                <span class="font-semibold text-sm">{{ rupees(bill.totalCents) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Paid</span>
                <span class="text-success text-sm">{{ rupees(bill.paidCents) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="font-semibold text-sm">Balance</span>
                <span
                  class="font-semibold text-sm"
                  :class="bill.balanceCents > 0 ? 'text-destructive' : 'text-success'"
                >
                  {{ rupees(bill.balanceCents) }}
                </span>
              </DataListItem>
            </DataList>

            <div class="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                :as-child="true"
              >
                <NuxtLink
                  :to="`/billing/${bill.id}`"
                  class="flex items-center gap-1.5"
                >
                  <Receipt class="size-3.5" />
                  Open Bill
                  <ExternalLink class="size-3" />
                </NuxtLink>
              </Button>
            </div>
          </div>

          <!-- No bill yet -->
          <div
            v-else
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <Receipt class="text-muted-foreground mb-3 size-8" />
            <p class="text-muted-foreground mb-4 text-sm">
              No bill created for this encounter.
            </p>
            <Button @click="createBill">
              <Plus class="mr-1.5 size-4" />
              Create Bill
            </Button>
          </div>
        </SectionCard>
      </template>
    </PageBody>

    <!-- ═══════════════ DIALOGS ═══════════════ -->

    <!-- Add Medication dialog -->
    <Dialog v-model:open="showRxDialog">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Pill class="size-4" />
            Add Medication
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <!-- Drug select -->
          <div class="space-y-1.5">
            <Label>Drug</Label>
            <Select v-model="rxForm.drugId">
              <SelectTrigger>
                <SelectValue placeholder="Select a drug…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="drug in state.drugs"
                  :key="drug.id"
                  :value="drug.id"
                >
                  <div class="flex items-center gap-2">
                    {{ drug.display }}
                    <Badge
                      v-if="drug.schedule"
                      variant="destructive"
                      class="h-4 px-1 text-[10px]"
                    >
                      S{{ drug.schedule }}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Dose row -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Dose</Label>
              <Input
                v-model="rxForm.doseValue"
                type="number"
                placeholder="e.g. 500"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Unit</Label>
              <Input
                v-model="rxForm.doseUnit"
                placeholder="mg / mL / IU"
              />
            </div>
          </div>

          <!-- Route -->
          <div class="space-y-1.5">
            <Label>Route</Label>
            <Select v-model="rxForm.route">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oral">
                  Oral
                </SelectItem>
                <SelectItem value="iv">
                  IV
                </SelectItem>
                <SelectItem value="im">
                  IM
                </SelectItem>
                <SelectItem value="topical">
                  Topical
                </SelectItem>
                <SelectItem value="sublingual">
                  Sublingual
                </SelectItem>
                <SelectItem value="inhaled">
                  Inhaled
                </SelectItem>
                <SelectItem value="sc">
                  Subcutaneous
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Frequency -->
          <div class="space-y-1.5">
            <Label>Frequency</Label>
            <Input
              v-model="rxForm.frequencyText"
              placeholder="e.g. BID, TID, q6h"
            />
          </div>

          <!-- Duration + Qty -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Duration (days)</Label>
              <Input
                v-model="rxForm.durationDays"
                type="number"
                placeholder="7"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Dispense Qty</Label>
              <Input
                v-model="rxForm.dispenseQty"
                type="number"
                placeholder="30"
              />
            </div>
          </div>

          <!-- PRN checkbox -->
          <div class="flex items-center gap-2">
            <Checkbox
              id="prn-check"
              v-model:checked="rxForm.prn"
            />
            <Label
              for="prn-check"
              class="cursor-pointer"
            >
              PRN (as needed)
            </Label>
          </div>

          <!-- Instructions -->
          <div class="space-y-1.5">
            <Label>Instructions <span class="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              v-model="rxForm.instructions"
              placeholder="Special administration instructions…"
              class="min-h-[60px] resize-none"
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
            :disabled="!rxForm.drugId || !rxForm.doseValue || !rxForm.frequencyText"
            @click="addMedication"
          >
            Add Medication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Order Lab dialog -->
    <Dialog v-model:open="showLabDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <FlaskConical class="size-4" />
            Order Lab Test
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Test</Label>
            <Select v-model="labForm.catalogId">
              <SelectTrigger>
                <SelectValue placeholder="Select a test…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="item in state.labCatalog"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.display }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Priority</Label>
            <Select v-model="labForm.priority">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">
                  Routine
                </SelectItem>
                <SelectItem value="urgent">
                  Urgent
                </SelectItem>
                <SelectItem value="stat">
                  STAT
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Note <span class="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              v-model="labForm.note"
              placeholder="Clinical context for the lab…"
              class="min-h-[60px] resize-none"
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
            :disabled="!labForm.catalogId"
            @click="addLabOrder"
          >
            Place Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Order Radiology dialog -->
    <Dialog v-model:open="showRadDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Scan class="size-4" />
            Order Radiology Study
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Modality</Label>
            <Select v-model="radForm.modality">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xr">
                  X-Ray
                </SelectItem>
                <SelectItem value="ct">
                  CT Scan
                </SelectItem>
                <SelectItem value="mri">
                  MRI
                </SelectItem>
                <SelectItem value="us">
                  Ultrasound
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Body Region</Label>
            <Input
              v-model="radForm.bodyRegion"
              placeholder="e.g. Chest, Brain, Abdomen"
            />
          </div>

          <div class="space-y-1.5">
            <Label>Description <span class="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              v-model="radForm.description"
              placeholder="Clinical indication…"
              class="min-h-[60px] resize-none"
            />
          </div>

          <div class="space-y-1.5">
            <Label>Priority</Label>
            <Select v-model="radForm.priority">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">
                  Routine
                </SelectItem>
                <SelectItem value="urgent">
                  Urgent
                </SelectItem>
                <SelectItem value="stat">
                  STAT
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
            :disabled="!radForm.bodyRegion"
            @click="addRadOrder"
          >
            Place Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Nursing entry dialog -->
    <Dialog v-model:open="showNursingDialog">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Nursing Entry</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Shift</Label>
            <Select v-model="nursingForm.shift">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">
                  Morning
                </SelectItem>
                <SelectItem value="afternoon">
                  Afternoon
                </SelectItem>
                <SelectItem value="night">
                  Night
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label>BP Sys</Label>
              <Input
                v-model="nursingForm.bpSys"
                type="number"
                placeholder="120"
              />
            </div>
            <div class="space-y-1.5">
              <Label>BP Dia</Label>
              <Input
                v-model="nursingForm.bpDia"
                type="number"
                placeholder="80"
              />
            </div>
            <div class="space-y-1.5">
              <Label>HR (bpm)</Label>
              <Input
                v-model="nursingForm.hr"
                type="number"
                placeholder="72"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Temp (°C)</Label>
              <Input
                v-model="nursingForm.t"
                type="number"
                step="0.1"
                placeholder="37.0"
              />
            </div>
            <div class="space-y-1.5">
              <Label>SpO2 (%)</Label>
              <Input
                v-model="nursingForm.spo2"
                type="number"
                placeholder="98"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Pain Score (0–10)</Label>
            <Input
              v-model="nursingForm.painScore"
              type="number"
              min="0"
              max="10"
              placeholder="0"
            />
          </div>

          <div class="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              v-model="nursingForm.notes"
              placeholder="Observations, interventions…"
              class="min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button @click="addNursingEntry">
            Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- MAR Administer dialog -->
    <Dialog v-model:open="showMarDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Administration</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Dose Given</Label>
              <Input
                v-model="marForm.doseValue"
                type="number"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Unit</Label>
              <Input v-model="marForm.doseUnit" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Status</Label>
            <Select v-model="marForm.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="given">
                  Given
                </SelectItem>
                <SelectItem value="held">
                  Held
                </SelectItem>
                <SelectItem value="refused">
                  Refused
                </SelectItem>
                <SelectItem value="omitted">
                  Omitted
                </SelectItem>
                <SelectItem value="partial">
                  Partial
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Notes <span class="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              v-model="marForm.notes"
              placeholder="Reason for hold, patient reaction…"
              class="min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button @click="addMarEntry">
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Transfer Bed dialog -->
    <Dialog v-model:open="showTransferDialog">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <BedDouble class="size-4" />
            Transfer Bed
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>New Bed</Label>
            <Select v-model="transferBedId">
              <SelectTrigger>
                <SelectValue placeholder="Select an available bed…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="bed in availableBeds()"
                  :key="bed.id"
                  :value="bed.id"
                >
                  {{ bed.label }}
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
            :disabled="!transferBedId"
            @click="transferBed"
          >
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>

  <!-- Not found state -->
  <Page v-else>
    <PageHeader>
      <PageHeaderHeading
        title="Encounter not found"
        :description="`No encounter with ID '${encounterId}' exists.`"
      />
    </PageHeader>
    <PageBody>
      <Button
        variant="outline"
        :as-child="true"
      >
        <NuxtLink to="/dashboard">
          Back to Dashboard
        </NuxtLink>
      </Button>
    </PageBody>
  </Page>
</template>
