<script setup lang="ts">
import { Loader2, UserPlus } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Admit Patient' })

const state = useMockState()

// ─── Patient search ───────────────────────────────────────────────────────────

const patientQuery = ref('')
const selectedPatientId = ref('')

const patientSuggestions = computed(() => {
  const q = patientQuery.value.trim().toLowerCase()
  if (!q) return []
  return state.patients
    .filter(p =>
      `${p.givenName} ${p.familyName}`.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q),
    )
    .slice(0, 8)
})

const selectedPatient = computed(() => state.patients.find(p => p.id === selectedPatientId.value))

function selectPatient(id: string) {
  selectedPatientId.value = id
  const p = state.patients.find(pt => pt.id === id)
  if (p) patientQuery.value = `${p.givenName} ${p.familyName}`
}

function clearPatient() {
  selectedPatientId.value = ''
  patientQuery.value = ''
}

// ─── Encounter type ───────────────────────────────────────────────────────────

const encounterKind = ref<'new' | 'convert'>('new')

// ─── Department → Unit → Bed ──────────────────────────────────────────────────

const selectedDeptId = ref('')
const selectedUnitId = ref('')
const selectedBedId = ref('')

const ipdDepts = computed(() => state.departments.filter(d => ['ipd', 'er', 'icu'].includes(d.kind)))

const unitsForDept = computed(() =>
  selectedDeptId.value ? state.units.filter(u => u.departmentId === selectedDeptId.value) : [],
)

const availableBedsForUnit = computed(() =>
  selectedUnitId.value
    ? state.beds.filter((b) => {
        if (b.unitId !== selectedUnitId.value) return false
        if (b.status !== 'available') return false
        return !state.bedAssignments.some(a => a.bedId === b.id && !a.releasedAt)
      })
    : [],
)

watch(selectedDeptId, () => {
  selectedUnitId.value = ''
  selectedBedId.value = ''
})
watch(selectedUnitId, () => {
  selectedBedId.value = ''
})

// ─── Attending + Reason ───────────────────────────────────────────────────────

const attendingUserId = ref('')
const reasonChiefComplaint = ref('')

const doctors = computed(() => state.staff.filter(s => s.role === 'doctor'))

// ─── Submit ───────────────────────────────────────────────────────────────────

const submitting = ref(false)

const canSubmit = computed(() =>
  selectedPatientId.value
  && selectedDeptId.value
  && selectedUnitId.value
  && selectedBedId.value
  && attendingUserId.value
  && reasonChiefComplaint.value.trim(),
)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  await new Promise(r => setTimeout(r, 400))

  const encId = `enc-${Date.now()}`

  // Create encounter
  state.encounters.push({
    id: encId,
    patientId: selectedPatientId.value,
    facilityId: state.facility.id,
    type: 'inpatient',
    status: 'in_progress',
    departmentId: selectedDeptId.value,
    attendingUserId: Number(attendingUserId.value),
    admissionAt: new Date().toISOString(),
    bedId: selectedBedId.value,
    reasonChiefComplaint: reasonChiefComplaint.value.trim(),
  })

  // Mark bed occupied
  const bed = state.beds.find(b => b.id === selectedBedId.value)
  if (bed) bed.status = 'occupied'

  // Create bed assignment
  state.bedAssignments.push({
    id: `ba-${Date.now()}`,
    encounterId: encId,
    patientId: selectedPatientId.value,
    bedId: selectedBedId.value,
    facilityId: state.facility.id,
    unitId: selectedUnitId.value,
    assignedAt: new Date().toISOString(),
    reason: 'admission',
    assignedByUserId: Number(attendingUserId.value),
  })

  submitting.value = false
  await navigateTo(`/encounters/${encId}`)
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Admit Patient"
        description="Create an inpatient encounter and assign a bed."
      />
    </PageHeader>

    <PageBody>
      <div class="max-w-2xl space-y-4">
        <!-- 1. Patient selection -->
        <SectionCard title="Patient">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label>Search patient <span class="text-destructive">*</span></Label>
              <Input
                v-model="patientQuery"
                placeholder="Name or MRN…"
                :disabled="!!selectedPatientId"
              />
            </div>

            <!-- Suggestions -->
            <div
              v-if="patientSuggestions.length > 0 && !selectedPatientId"
              class="border-border bg-popover rounded-md border shadow-sm"
            >
              <Button
                v-for="p in patientSuggestions"
                :key="p.id"
                type="button"
                variant="ghost"
                class="h-auto w-full justify-start gap-2 px-3 py-2"
                @click="selectPatient(p.id)"
              >
                <span class="font-medium">{{ p.givenName }} {{ p.familyName }}</span>
                <span class="text-muted-foreground font-mono text-xs">{{ p.mrn }}</span>
              </Button>
            </div>

            <!-- Selected patient pill -->
            <div
              v-if="selectedPatient"
              class="flex items-center gap-2"
            >
              <Badge variant="secondary">
                {{ selectedPatient.givenName }} {{ selectedPatient.familyName }} · {{ selectedPatient.mrn }}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="clearPatient"
              >
                Clear
              </Button>
            </div>
          </div>
        </SectionCard>

        <!-- 2. Encounter type -->
        <SectionCard title="Encounter type">
          <RadioGroup
            v-model="encounterKind"
            orientation="horizontal"
          >
            <div class="flex items-center gap-2">
              <RadioGroupItem
                id="enc-new"
                value="new"
              />
              <Label
                for="enc-new"
                class="cursor-pointer"
              >
                New inpatient encounter
              </Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem
                id="enc-convert"
                value="convert"
              />
              <Label
                for="enc-convert"
                class="cursor-pointer"
              >
                Convert existing encounter
              </Label>
            </div>
          </RadioGroup>
        </SectionCard>

        <!-- 3. Department + Unit + Bed -->
        <SectionCard title="Department, unit &amp; bed">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="space-y-1.5">
              <Label>Department <span class="text-destructive">*</span></Label>
              <Select v-model="selectedDeptId">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="d in ipdDepts"
                    :key="d.id"
                    :value="d.id"
                  >
                    {{ d.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label>Unit <span class="text-destructive">*</span></Label>
              <Select
                v-model="selectedUnitId"
                :disabled="!selectedDeptId"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="u in unitsForDept"
                    :key="u.id"
                    :value="u.id"
                  >
                    {{ u.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label>Bed <span class="text-destructive">*</span></Label>
              <Select
                v-model="selectedBedId"
                :disabled="!selectedUnitId"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select available bed…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="b in availableBedsForUnit"
                    :key="b.id"
                    :value="b.id"
                  >
                    {{ b.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p
                v-if="selectedUnitId && availableBedsForUnit.length === 0"
                class="text-muted-foreground text-xs"
              >
                No available beds in this unit.
              </p>
            </div>
          </div>
        </SectionCard>

        <!-- 4. Attending + Reason -->
        <SectionCard title="Attending physician &amp; reason">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label>Attending physician <span class="text-destructive">*</span></Label>
              <Select v-model="attendingUserId">
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="d in doctors"
                    :key="d.id"
                    :value="String(d.id)"
                  >
                    {{ d.name }}
                    <span
                      v-if="d.specialty"
                      class="text-muted-foreground ml-1 text-xs"
                    >
                      · {{ d.specialty }}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label>Chief complaint / reason <span class="text-destructive">*</span></Label>
              <Textarea
                v-model="reasonChiefComplaint"
                placeholder="e.g. Chest pain with elevated troponin, rule out NSTEMI"
                :rows="3"
              />
            </div>
          </div>
        </SectionCard>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <Button
            :disabled="submitting || !canSubmit"
            @click="submit"
          >
            <Loader2
              v-if="submitting"
              class="size-4 animate-spin"
            />
            <UserPlus
              v-else
              class="size-4"
            />
            Admit patient
          </Button>
          <Button
            variant="ghost"
            as-child
          >
            <NuxtLink to="/wards">Cancel</NuxtLink>
          </Button>
        </div>
      </div>
    </PageBody>
  </Page>
</template>
