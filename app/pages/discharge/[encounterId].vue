<script setup lang="ts">
import { CheckCircle2, Plus, Loader2, PenSquare, X } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const encId = computed(() => route.params.encounterId as string)
const encounter = computed(() => state.encounters.find(e => e.id === encId.value))
const patient = computed(() => encounter.value ? state.patients.find(p => p.id === encounter.value!.patientId) : null)

watchEffect(() => {
  if (import.meta.client && encounter.value === undefined) {
    navigateTo('/wards')
  }
})

useHead(() => ({ title: patient.value ? `Discharge — ${patient.value.givenName} ${patient.value.familyName}` : 'Discharge Summary' }))

// ─── Draft summary — create on mount if none exists ───────────────────────────

const summary = computed(() => state.dischargeSummaries.find(d => d.encounterId === encId.value))

onMounted(() => {
  if (!summary.value && encounter.value && patient.value) {
    state.dischargeSummaries.push({
      id: `ds-${Date.now()}`,
      encounterId: encId.value,
      patientId: patient.value.id,
      attendingUserId: encounter.value.attendingUserId ?? 0,
      admissionDate: encounter.value.admissionAt ? encounter.value.admissionAt.split('T')[0]! : new Date().toISOString().split('T')[0]!,
      primaryDiagnosis: '',
      secondaryDiagnoses: [],
      hospitalCourse: '',
      conditionAtDischarge: undefined,
      followUpInstructions: '',
      status: 'draft',
    })
  }
})

// ─── Local edit state mirroring the summary ───────────────────────────────────

const primaryDx = ref('')
const hospitalCourse = ref('')
const conditionAtDischarge = ref('')
const followUpInstructions = ref('')
const dietInstructions = ref('')
const activityInstructions = ref('')
const secondaryDiagnoses = ref<string[]>([])
const procedures = ref<string[]>([])

// ─── Meds at discharge ────────────────────────────────────────────────────────

interface MedRow { drugDisplay: string, dose: string, route: string, frequency: string }
const medsAtDischarge = ref<MedRow[]>([])

function copyFromActivePrescriptions() {
  const rxList = state.prescriptions.filter(
    rx => rx.encounterId === encId.value && rx.status === 'active',
  )
  medsAtDischarge.value = rxList.map((rx) => {
    const drug = state.drugs.find(d => d.id === rx.drugId)
    return {
      drugDisplay: drug?.display ?? rx.drugId,
      dose: `${rx.doseValue} ${rx.doseUnit}`,
      route: rx.route,
      frequency: rx.frequencyText,
    }
  })
}

// ─── Init form from existing summary ─────────────────────────────────────────

watch(
  summary,
  (s) => {
    if (!s) return
    primaryDx.value = s.primaryDiagnosis ?? ''
    hospitalCourse.value = s.hospitalCourse ?? ''
    conditionAtDischarge.value = s.conditionAtDischarge ?? ''
    followUpInstructions.value = s.followUpInstructions ?? ''
    secondaryDiagnoses.value = (s.secondaryDiagnoses ?? []).map(d => d.display)
  },
  { immediate: true },
)

// ─── Chip helpers ─────────────────────────────────────────────────────────────

const newSecondaryDx = ref('')
function addSecondaryDx() {
  const v = newSecondaryDx.value.trim()
  if (!v) return
  secondaryDiagnoses.value.push(v)
  newSecondaryDx.value = ''
}
function removeSecondaryDx(i: number) {
  secondaryDiagnoses.value.splice(i, 1)
}

const newProcedure = ref('')
function addProcedure() {
  const v = newProcedure.value.trim()
  if (!v) return
  procedures.value.push(v)
  newProcedure.value = ''
}
function removeProcedure(i: number) {
  procedures.value.splice(i, 1)
}

// ─── Save / sign ──────────────────────────────────────────────────────────────

const saving = ref(false)
const signing = ref(false)

function applyToSummary() {
  if (!summary.value) return
  summary.value.primaryDiagnosis = primaryDx.value
  summary.value.hospitalCourse = hospitalCourse.value
  summary.value.conditionAtDischarge = conditionAtDischarge.value as typeof summary.value.conditionAtDischarge
  summary.value.followUpInstructions = `${followUpInstructions.value}${dietInstructions.value ? `\nDiet: ${dietInstructions.value}` : ''}${activityInstructions.value ? `\nActivity: ${activityInstructions.value}` : ''}`
  summary.value.secondaryDiagnoses = secondaryDiagnoses.value.map(d => ({ display: d }))
}

async function saveDraft() {
  saving.value = true
  await new Promise(r => setTimeout(r, 300))
  applyToSummary()
  saving.value = false
}

async function signAndFinalize() {
  signing.value = true
  await new Promise(r => setTimeout(r, 400))
  applyToSummary()

  if (summary.value) {
    summary.value.status = 'signed'
    summary.value.signedAt = new Date().toISOString()
    summary.value.dischargeDate = new Date().toISOString().split('T')[0]
  }

  // Finish encounter
  if (encounter.value) {
    encounter.value.status = 'finished'
    encounter.value.dischargeAt = new Date().toISOString()
  }

  // Release bed assignment
  const assignment = state.bedAssignments.find(a => a.encounterId === encId.value && !a.releasedAt)
  if (assignment) {
    assignment.releasedAt = new Date().toISOString()
    const bed = state.beds.find(b => b.id === assignment.bedId)
    if (bed) bed.status = 'available'
  }

  signing.value = false
}

function amend() {
  if (summary.value) summary.value.status = 'amended'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function staffName(id?: number): string {
  if (!id) return '—'
  return state.staff.find(s => s.id === id)?.name ?? `User #${id}`
}

function formatDate(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const isReadOnly = computed(() => summary.value?.status === 'signed')
</script>

<template>
  <Page v-if="encounter && patient && summary">
    <PageHeader>
      <div class="flex items-center gap-3">
        <PenSquare class="text-muted-foreground size-5" />
        <PageHeaderHeading
          title="Discharge Summary"
          :description="`${patient.givenName} ${patient.familyName} · ${patient.mrn}`"
        />
        <Badge
          :variant="summary.status === 'signed' ? 'success' : summary.status === 'draft' ? 'secondary' : 'outline'"
          class="capitalize"
        >
          {{ summary.status }}
        </Badge>
      </div>
      <template
        v-if="isReadOnly"
        #actions
      >
        <Button
          variant="outline"
          size="sm"
          @click="amend"
        >
          Amend
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- Patient & admission (always read-only) -->
      <SectionCard title="Patient &amp; admission">
        <DataList>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Patient</span>
            <span class="text-sm">{{ patient.givenName }} {{ patient.familyName }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">MRN</span>
            <span class="font-mono text-sm">{{ patient.mrn }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Attending</span>
            <span class="text-sm">{{ staffName(encounter.attendingUserId) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Admission date</span>
            <span class="text-sm">{{ formatDate(summary.admissionDate) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Discharge date</span>
            <span class="text-sm">{{ formatDate(summary.dischargeDate) }}</span>
          </DataListItem>
        </DataList>
      </SectionCard>

      <!-- Diagnoses -->
      <SectionCard title="Final diagnoses">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <Label>Primary diagnosis</Label>
            <Input
              v-model="primaryDx"
              placeholder="e.g. NSTEMI — I21.4"
              :disabled="isReadOnly"
            />
          </div>

          <div class="space-y-1.5">
            <Label>Secondary diagnoses</Label>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="(dx, i) in secondaryDiagnoses"
                :key="i"
                variant="outline"
                class="gap-1"
              >
                {{ dx }}
                <Button
                  v-if="!isReadOnly"
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="ml-0.5 h-3.5 w-3.5 hover:text-destructive"
                  @click="removeSecondaryDx(i)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
            <div
              v-if="!isReadOnly"
              class="flex gap-2"
            >
              <Input
                v-model="newSecondaryDx"
                placeholder="Add secondary diagnosis…"
                class="max-w-sm"
                @keydown.enter.prevent="addSecondaryDx"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="addSecondaryDx"
              >
                <Plus class="size-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Procedures -->
      <SectionCard title="Procedures">
        <div class="space-y-1.5">
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="(proc, i) in procedures"
              :key="i"
              variant="outline"
              class="gap-1"
            >
              {{ proc }}
              <Button
                v-if="!isReadOnly"
                type="button"
                variant="ghost"
                size="icon"
                class="ml-0.5 h-3.5 w-3.5 hover:text-destructive"
                @click="removeProcedure(i)"
              >
                <X class="h-3 w-3" />
              </Button>
            </Badge>
            <span
              v-if="procedures.length === 0"
              class="text-muted-foreground text-sm"
            >None recorded.</span>
          </div>
          <div
            v-if="!isReadOnly"
            class="flex gap-2"
          >
            <Input
              v-model="newProcedure"
              placeholder="Add procedure…"
              class="max-w-sm"
              @keydown.enter.prevent="addProcedure"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="addProcedure"
            >
              <Plus class="size-4" />
              Add
            </Button>
          </div>
        </div>
      </SectionCard>

      <!-- Hospital course -->
      <SectionCard title="Hospital course">
        <Textarea
          v-model="hospitalCourse"
          placeholder="Summarise the patient's hospital course, treatments, response to treatment…"
          :rows="5"
          :disabled="isReadOnly"
        />
      </SectionCard>

      <!-- Condition at discharge -->
      <SectionCard title="Condition at discharge">
        <div class="max-w-xs">
          <Select
            v-model="conditionAtDischarge"
            :disabled="isReadOnly"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="improved">
                Improved
              </SelectItem>
              <SelectItem value="stable">
                Stable
              </SelectItem>
              <SelectItem value="unchanged">
                Unchanged
              </SelectItem>
              <SelectItem value="deteriorated">
                Deteriorated
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
      </SectionCard>

      <!-- Meds at discharge -->
      <SectionCard title="Medications at discharge">
        <template
          v-if="!isReadOnly"
          #header-action
        >
          <Button
            variant="outline"
            size="sm"
            @click="copyFromActivePrescriptions"
          >
            Copy from active Rx
          </Button>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead class="w-28">
                  Dose
                </TableHead>
                <TableHead class="w-24">
                  Route
                </TableHead>
                <TableHead>Frequency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="medsAtDischarge.length === 0">
                No medications added. Click "Copy from active Rx" to pre-fill.
              </TableEmpty>
              <TableRow
                v-for="(med, i) in medsAtDischarge"
                :key="i"
              >
                <TableCell class="text-sm">
                  {{ med.drugDisplay }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ med.dose }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm capitalize">
                  {{ med.route }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ med.frequency }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Follow-up / Diet / Activity -->
      <SectionCard title="Follow-up, diet &amp; activity">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <Label>Follow-up instructions</Label>
            <Textarea
              v-model="followUpInstructions"
              placeholder="e.g. Follow up with cardiology in 6 weeks…"
              :rows="2"
              :disabled="isReadOnly"
            />
          </div>
          <div class="space-y-1.5">
            <Label>Diet</Label>
            <Textarea
              v-model="dietInstructions"
              placeholder="e.g. Low sodium diet, avoid grapefruit…"
              :rows="2"
              :disabled="isReadOnly"
            />
          </div>
          <div class="space-y-1.5">
            <Label>Activity</Label>
            <Textarea
              v-model="activityInstructions"
              placeholder="e.g. Light walking only for 2 weeks, no lifting >5kg…"
              :rows="2"
              :disabled="isReadOnly"
            />
          </div>
        </div>
      </SectionCard>

      <!-- Footer actions -->
      <div
        v-if="!isReadOnly"
        class="flex items-center gap-3 pb-6"
      >
        <Button
          variant="outline"
          :disabled="saving"
          @click="saveDraft"
        >
          <Loader2
            v-if="saving"
            class="size-4 animate-spin"
          />
          Save draft
        </Button>
        <Button
          :disabled="signing || !primaryDx || !conditionAtDischarge"
          @click="signAndFinalize"
        >
          <Loader2
            v-if="signing"
            class="size-4 animate-spin"
          />
          <CheckCircle2
            v-else
            class="size-4"
          />
          Sign &amp; finalize
        </Button>
      </div>

      <!-- Signed notice -->
      <div
        v-else
        class="text-muted-foreground flex items-center gap-2 pb-6 text-sm"
      >
        <CheckCircle2 class="text-success size-4" />
        Signed {{ summary.signedAt ? new Date(summary.signedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '' }}
      </div>
    </PageBody>
  </Page>

  <div
    v-else
    class="flex items-center justify-center p-12"
  >
    <p class="text-muted-foreground text-sm">
      Encounter not found. Redirecting…
    </p>
  </div>
</template>
