<script setup lang="ts">
import { Scissors, X } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/ui/section-card'
import { Badge } from '@/components/ui/badge'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Book Surgery' })

const state = useMockState()
const router = useRouter()
const route = useRoute()

// ─── Form state ────────────────────────────────────────────────────────────────

const patientId = ref('')
const encounterId = ref('')
const orRoomId = ref('')
const scheduledDate = ref(new Date().toISOString().slice(0, 10))
const scheduledTime = ref('09:00')
const estimatedMinutes = ref(60)
const primarySurgeonUserId = ref('')
const anesthetistUserId = ref('')
const scrubNurseUserId = ref('')
const procedureName = ref('')
const procedureCodes = ref<string[]>([])
const procedureCodeInput = ref('')
const notes = ref('')

// Prefill from OT calendar "click empty slot to book" (or direct links)
if (route.query.orRoomId) orRoomId.value = String(route.query.orRoomId)
if (route.query.date) scheduledDate.value = String(route.query.date)
if (route.query.time) scheduledTime.value = String(route.query.time)

// ─── Derived options ────────────────────────────────────────────────────────────

const orRooms = computed(() => {
  const ot = state.units.filter(u => u.departmentId === 'dept-ot')
  if (ot.length) return ot
  return [
    { id: 'unit-ot-1', code: 'OT-1', name: 'Operating Room 1', departmentId: 'dept-ot' },
    { id: 'unit-ot-2', code: 'OT-2', name: 'Operating Room 2', departmentId: 'dept-ot' },
  ]
})

const doctors = computed(() => state.staff.filter(s => s.role === 'doctor'))
const nurses = computed(() => state.staff.filter(s => s.role === 'nurse'))

// Patients with active encounters for typeahead
const patientOptions = computed(() =>
  state.patients.map(p => ({ id: p.id, label: `${p.givenName} ${p.familyName} — ${p.mrn}` })),
)

const encounterOptions = computed(() => {
  if (!patientId.value) return []
  return state.encounters
    .filter(e => e.patientId === patientId.value && ['planned', 'arrived', 'in_progress'].includes(e.status))
    .map(e => ({ id: e.id, label: `${e.id} — ${e.type} (${e.status})` }))
})

// ─── Procedure code chips ──────────────────────────────────────────────────────

function addCode() {
  const c = procedureCodeInput.value.trim()
  if (c && !procedureCodes.value.includes(c)) {
    procedureCodes.value.push(c)
  }
  procedureCodeInput.value = ''
}

function removeCode(code: string) {
  procedureCodes.value = procedureCodes.value.filter(c => c !== code)
}

function onCodeKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addCode()
  }
}

// ─── Submit ────────────────────────────────────────────────────────────────────

const submitError = ref('')

function submit() {
  submitError.value = ''

  if (!patientId.value) { submitError.value = 'Patient is required.'; return }
  if (!orRoomId.value) { submitError.value = 'OR room is required.'; return }
  if (!scheduledDate.value || !scheduledTime.value) { submitError.value = 'Date and time are required.'; return }
  if (!primarySurgeonUserId.value) { submitError.value = 'Primary surgeon is required.'; return }
  if (!procedureName.value.trim()) { submitError.value = 'Procedure name is required.'; return }

  const id = `surg-${Date.now()}`
  const scheduledAt = `${scheduledDate.value}T${scheduledTime.value}:00.000Z`

  state.surgeryBookings.push({
    id,
    encounterId: encounterId.value || `enc-placeholder-${Date.now()}`,
    patientId: patientId.value,
    orRoomId: orRoomId.value,
    procedureName: procedureName.value.trim(),
    primarySurgeonUserId: Number(primarySurgeonUserId.value),
    anesthetistUserId: anesthetistUserId.value ? Number(anesthetistUserId.value) : undefined,
    scrubNurseUserId: scrubNurseUserId.value ? Number(scrubNurseUserId.value) : undefined,
    scheduledAt,
    estimatedMinutes: Number(estimatedMinutes.value),
    status: 'scheduled',
  })

  router.push(`/ot/bookings/${id}`)
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Book Surgery"
        description="Schedule a new OT procedure."
      >
        <template #icon>
          <Scissors class="size-5" />
        </template>
      </PageHeaderHeading>
    </PageHeader>

    <PageBody class="max-w-3xl space-y-6">
      <!-- 1. Patient + Encounter -->
      <SectionCard title="Patient & Encounter">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label>Patient <span class="text-destructive">*</span></Label>
            <Select v-model="patientId">
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in patientOptions"
                  :key="opt.id"
                  :value="opt.id"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Linked encounter</Label>
            <Select
              v-model="encounterId"
              :disabled="!patientId"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select encounter (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in encounterOptions"
                  :key="opt.id"
                  :value="opt.id"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <!-- 2. Room + Timing -->
      <SectionCard title="Room & Timing">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-1.5 sm:col-span-2">
            <Label>OR Room <span class="text-destructive">*</span></Label>
            <Select v-model="orRoomId">
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="room in orRooms"
                  :key="room.id"
                  :value="room.id"
                >
                  {{ room.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Date <span class="text-destructive">*</span></Label>
            <Input
              v-model="scheduledDate"
              type="date"
            />
          </div>
          <div class="space-y-1.5">
            <Label>Time <span class="text-destructive">*</span></Label>
            <Input
              v-model="scheduledTime"
              type="time"
            />
          </div>
          <div class="space-y-1.5">
            <Label>Estimated duration (minutes)</Label>
            <Input
              v-model.number="estimatedMinutes"
              type="number"
              min="5"
              max="720"
              step="5"
            />
          </div>
        </div>
      </SectionCard>

      <!-- 3. Surgical team -->
      <SectionCard title="Surgical Team">
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-1.5">
            <Label>Primary surgeon <span class="text-destructive">*</span></Label>
            <Select v-model="primarySurgeonUserId">
              <SelectTrigger>
                <SelectValue placeholder="Select surgeon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="doc in doctors"
                  :key="doc.id"
                  :value="String(doc.id)"
                >
                  {{ doc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Anesthetist</Label>
            <Select v-model="anesthetistUserId">
              <SelectTrigger>
                <SelectValue placeholder="Select anesthetist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="doc in doctors"
                  :key="doc.id"
                  :value="String(doc.id)"
                >
                  {{ doc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Scrub nurse</Label>
            <Select v-model="scrubNurseUserId">
              <SelectTrigger>
                <SelectValue placeholder="Select nurse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="nurse in nurses"
                  :key="nurse.id"
                  :value="String(nurse.id)"
                >
                  {{ nurse.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <!-- 4. Procedure -->
      <SectionCard title="Procedure">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <Label>Procedure name <span class="text-destructive">*</span></Label>
            <Input
              v-model="procedureName"
              placeholder="e.g. Laparoscopic Cholecystectomy"
            />
          </div>
          <div class="space-y-1.5">
            <Label>ICD / Procedure codes</Label>
            <div class="flex gap-2">
              <Input
                v-model="procedureCodeInput"
                placeholder="Type code and press Enter"
                class="flex-1"
                @keydown="onCodeKeydown"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="addCode"
              >
                Add
              </Button>
            </div>
            <div
              v-if="procedureCodes.length"
              class="flex flex-wrap gap-1.5 pt-1"
            >
              <Badge
                v-for="code in procedureCodes"
                :key="code"
                variant="outline"
                class="gap-1 pr-0.5"
              >
                {{ code }}
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4 shrink-0 rounded-full"
                  type="button"
                  @click="removeCode(code)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- 5. Notes -->
      <SectionCard title="Notes">
        <Textarea
          v-model="notes"
          placeholder="Special instructions, patient considerations, equipment needs…"
          rows="4"
        />
      </SectionCard>

      <!-- Submit -->
      <div class="flex items-center gap-3">
        <Button
          type="button"
          @click="submit"
        >
          <Scissors class="mr-2 h-4 w-4" />
          Book surgery
        </Button>
        <Button
          variant="outline"
          as-child
        >
          <NuxtLink to="/ot">
            Cancel
          </NuxtLink>
        </Button>
        <p
          v-if="submitError"
          class="text-destructive text-sm"
        >
          {{ submitError }}
        </p>
      </div>
    </PageBody>
  </Page>
</template>
