<script setup lang="ts">
import { Bed, PlayCircle, CheckCircle2 } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { DataList, DataListItem } from '@/components/ui/data-list'
import { ER_BAYS } from '~/mocks/er-visits'
import type { MockERVisit } from '~/mocks/er-visits'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const visitId = computed(() => route.params.id as string)
const visit = computed(() => state.erVisits.find(v => v.id === visitId.value))

watchEffect(() => {
  if (import.meta.client && visit.value === undefined) {
    navigateTo('/er')
  }
})

const patient = computed(() => {
  if (!visit.value) return null
  return state.patients.find(p => p.id === visit.value!.patientId) ?? null
})

useHead(() => ({
  title: visit.value ? `ER ${visit.value.id}` : 'ER Visit',
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function triageVariant(level: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (level <= 2) return 'destructive'
  if (level === 3) return 'secondary'
  return 'outline'
}

function triageLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'ESI 1 — Resuscitation',
    2: 'ESI 2 — Emergent',
    3: 'ESI 3 — Urgent',
    4: 'ESI 4 — Less urgent',
    5: 'ESI 5 — Non-urgent',
  }
  return labels[level] ?? `ESI ${level}`
}

function bayLabel(bayId?: string): string {
  if (!bayId) return '—'
  const bay = ER_BAYS.find(b => b.id === bayId)
  return bay?.label ?? bayId
}

function staffName(userId?: number): string {
  if (!userId) return '—'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}

function arrivalModeLabel(mode: string): string {
  const map: Record<string, string> = {
    walk_in: 'Walk-in',
    ambulance: 'Ambulance',
    transferred: 'Transferred',
  }
  return map[mode] ?? mode
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

// ─── Triage assessment form ──────────────────────────────────────────────────

const vitals = reactive({
  bpSys: '',
  bpDia: '',
  hr: '',
  rr: '',
  spo2: '',
  temp: '',
})

const painScore = ref<string>('')
const hpi = ref('')

// ─── Disposition ─────────────────────────────────────────────────────────────

const disposition = ref<string>(visit.value?.disposition ?? '')

watch(() => visit.value?.disposition, (val) => {
  if (val) disposition.value = val
})

const dispositionOptions = [
  { value: 'discharged', label: 'Discharge' },
  { value: 'admitted_ipd', label: 'Admit to IPD' },
  { value: 'admitted_icu', label: 'Admit to ICU' },
  { value: 'transferred', label: 'Transfer' },
  { value: 'lwbs', label: 'Left without being seen' },
]

function saveDisposition() {
  if (!visit.value || !disposition.value) return
  visit.value.disposition = disposition.value as MockERVisit['disposition']
  if (disposition.value === 'discharged') {
    visit.value.status = 'discharged'
  }
  else if (disposition.value === 'admitted_ipd' || disposition.value === 'admitted_icu') {
    visit.value.status = 'admitted'
  }
  else if (disposition.value === 'lwbs') {
    visit.value.status = 'left_without_seen'
  }
}

// ─── Assign to bay dialog ────────────────────────────────────────────────────

const assignBayOpen = ref(false)
const selectedBay = ref<string>('')

function openAssignBay() {
  selectedBay.value = visit.value?.bayId ?? ''
  assignBayOpen.value = true
}

function submitAssignBay() {
  if (!visit.value || !selectedBay.value) return
  visit.value.bayId = selectedBay.value
  assignBayOpen.value = false
}

// ─── Start treatment ─────────────────────────────────────────────────────────

function startTreatment() {
  if (!visit.value) return
  visit.value.status = 'in_treatment'
}

// ─── Discharge dialog ────────────────────────────────────────────────────────

const dischargeOpen = ref(false)
const dischargeNotes = ref('')

function openDischargeDialog() {
  dischargeNotes.value = visit.value?.notes ?? ''
  dischargeOpen.value = true
}

function submitDischarge() {
  if (!visit.value) return
  visit.value.status = 'discharged'
  visit.value.disposition = 'discharged'
  visit.value.notes = dischargeNotes.value.trim() || undefined
  dischargeOpen.value = false
}
</script>

<template>
  <Page v-if="visit">
    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <PageHeader>
      <div class="flex items-start gap-3">
        <Avatar
          v-if="patient"
          size="lg"
        >
          <AvatarFallback>{{ initials(patient.givenName, patient.familyName) }}</AvatarFallback>
        </Avatar>
        <div>
          <PageHeaderHeading
            :title="patient ? `${patient.givenName} ${patient.familyName}` : visit.patientId"
            :description="patient ? `MRN: ${patient.mrn}` : ''"
          />
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <Badge
              :variant="triageVariant(visit.triageLevel)"
              class="text-xs"
            >
              {{ triageLabel(visit.triageLevel) }}
            </Badge>
            <Badge
              variant="secondary"
              class="text-xs capitalize"
            >
              {{ visit.status.replace('_', ' ') }}
            </Badge>
            <span class="text-muted-foreground text-xs">
              {{ visit.chiefComplaint }}
            </span>
          </div>
        </div>
      </div>

      <template #actions>
        <Button
          v-if="!visit.bayId"
          size="sm"
          variant="outline"
          @click="openAssignBay"
        >
          <Bed class="size-4" />
          Assign to bay
        </Button>
        <Button
          v-if="visit.status === 'waiting' || visit.status === 'in_triage'"
          size="sm"
          @click="startTreatment"
        >
          <PlayCircle class="size-4" />
          Start treatment
        </Button>
        <Button
          v-if="visit.status !== 'discharged' && visit.status !== 'left_without_seen'"
          size="sm"
          variant="secondary"
          @click="openDischargeDialog"
        >
          <CheckCircle2 class="size-4" />
          Discharge
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4">
      <!-- ── Patient summary card ─────────────────────────────────────────── -->
      <Card>
        <CardContent class="pt-6">
          <DataList>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Patient</span>
              <span class="text-sm font-medium">
                {{ patient ? `${patient.givenName} ${patient.familyName}` : visit.patientId }}
              </span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">MRN</span>
              <span class="font-mono text-sm">{{ patient?.mrn ?? '—' }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Arrived</span>
              <span class="text-sm">{{ fmtDatetime(visit.arrivedAt) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Arrival mode</span>
              <Badge
                variant="outline"
                class="text-xs"
              >
                {{ arrivalModeLabel(visit.arrivalMode) }}
              </Badge>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Bay</span>
              <span class="text-sm">{{ bayLabel(visit.bayId) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Triage nurse</span>
              <span class="text-sm">{{ staffName(visit.triageNurseUserId) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Attending</span>
              <span class="text-sm">{{ staffName(visit.attendingUserId) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Chief complaint</span>
              <span class="text-sm text-right max-w-xs">{{ visit.chiefComplaint }}</span>
            </DataListItem>
          </DataList>
        </CardContent>
      </Card>

      <!-- ── Triage assessment ────────────────────────────────────────────── -->
      <SectionCard title="Triage assessment">
        <div class="space-y-4">
          <!-- Vitals -->
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="space-y-1.5">
              <Label for="bp-sys">BP systolic</Label>
              <Input
                id="bp-sys"
                v-model="vitals.bpSys"
                type="number"
                placeholder="mmHg"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="bp-dia">BP diastolic</Label>
              <Input
                id="bp-dia"
                v-model="vitals.bpDia"
                type="number"
                placeholder="mmHg"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="hr">Heart rate</Label>
              <Input
                id="hr"
                v-model="vitals.hr"
                type="number"
                placeholder="bpm"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="rr">Respiratory rate</Label>
              <Input
                id="rr"
                v-model="vitals.rr"
                type="number"
                placeholder="/min"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="spo2">SpO₂</Label>
              <Input
                id="spo2"
                v-model="vitals.spo2"
                type="number"
                placeholder="%"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="temp">Temperature</Label>
              <Input
                id="temp"
                v-model="vitals.temp"
                type="number"
                step="0.1"
                placeholder="°C"
              />
            </div>
          </div>

          <!-- Pain score -->
          <div class="space-y-1.5">
            <Label for="pain-score">Pain score (0–10)</Label>
            <Select v-model="painScore">
              <SelectTrigger id="pain-score">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="n in 11"
                  :key="n - 1"
                  :value="String(n - 1)"
                >
                  {{ n - 1 }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- HPI -->
          <div class="space-y-1.5">
            <Label for="hpi">Brief HPI</Label>
            <Textarea
              id="hpi"
              v-model="hpi"
              placeholder="History of presenting illness…"
              :rows="4"
            />
          </div>
        </div>
      </SectionCard>

      <!-- ── Disposition ──────────────────────────────────────────────────── -->
      <SectionCard title="Disposition">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <Label for="disposition-select">Disposition</Label>
            <Select v-model="disposition">
              <SelectTrigger id="disposition-select">
                <SelectValue placeholder="Select disposition…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in dispositionOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            :disabled="!disposition"
            @click="saveDisposition"
          >
            Save disposition
          </Button>
        </div>
      </SectionCard>
    </PageBody>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Assign to bay dialog                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="assignBayOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign to bay</DialogTitle>
          <DialogDescription>
            Select an available bay for this patient.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-1.5 py-2">
          <Label for="bay-select">Bay</Label>
          <Select v-model="selectedBay">
            <SelectTrigger id="bay-select">
              <SelectValue placeholder="Select bay…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="bay in ER_BAYS"
                :key="bay.id"
                :value="bay.id"
              >
                {{ bay.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!selectedBay"
            @click="submitAssignBay"
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Discharge dialog                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Dialog v-model:open="dischargeOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Discharge</DialogTitle>
          <DialogDescription>
            Record discharge instructions and complete this visit.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label for="discharge-notes">Discharge instructions</Label>
            <Textarea
              id="discharge-notes"
              v-model="dischargeNotes"
              placeholder="Medications, follow-up, return precautions…"
              :rows="4"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button @click="submitDischarge">
            Confirm discharge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>

  <!-- Loading / not found state -->
  <div
    v-else
    class="flex items-center justify-center p-12"
  >
    <p class="text-muted-foreground text-sm">
      ER visit not found. Redirecting…
    </p>
  </div>
</template>
