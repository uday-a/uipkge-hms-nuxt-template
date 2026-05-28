<script setup lang="ts">
import { Search, X, Loader2, Stethoscope, Ambulance, Footprints } from 'lucide-vue-next'
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

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Register Walk-in' })

const router = useRouter()
const state = useMockState()

// ─── Patient step ─────────────────────────────────────────────────────────────

const patientQuery = ref('')
const selectedPatientId = ref<string | null>(null)
const isWalkIn = ref(false)

const patientResults = computed(() => {
  const q = patientQuery.value.trim().toLowerCase()
  if (!q) return []
  return state.patients
    .filter((p) => {
      const full = `${p.givenName} ${p.familyName}`.toLowerCase()
      return full.includes(q) || p.mrn.toLowerCase().includes(q)
    })
    .slice(0, 6)
})

const selectedPatient = computed(() =>
  selectedPatientId.value ? state.patients.find(p => p.id === selectedPatientId.value) : null,
)

function selectPatient(id: string) {
  selectedPatientId.value = id
  patientQuery.value = ''
  isWalkIn.value = false
}

function clearPatient() {
  selectedPatientId.value = null
  patientQuery.value = ''
}

// Walk-in fields
const walkIn = reactive({
  givenName: '',
  familyName: '',
  sex: '' as 'male' | 'female' | 'intersex' | 'unknown' | '',
  dateOfBirth: '',
})

// ─── Complaint & triage ───────────────────────────────────────────────────────

const chiefComplaint = ref('')
const triageLevel = ref<string>('')
const arrivalMode = ref<string>('')

const triageOptions = [
  { value: '1', label: 'ESI 1 — Resuscitation' },
  { value: '2', label: 'ESI 2 — Emergent' },
  { value: '3', label: 'ESI 3 — Urgent' },
  { value: '4', label: 'ESI 4 — Less urgent' },
  { value: '5', label: 'ESI 5 — Non-urgent' },
]

const arrivalModeOptions = [
  { value: 'walk_in', label: 'Walk-in', icon: Footprints },
  { value: 'ambulance', label: 'Ambulance', icon: Ambulance },
  { value: 'transferred', label: 'Transferred', icon: Stethoscope },
]

// ─── Submit ───────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'saving' | 'done'
const submitState = ref<SubmitState>('idle')

const isValid = computed(() => {
  const hasPatient = selectedPatientId.value !== null || (isWalkIn.value && !!walkIn.givenName.trim() && !!walkIn.familyName.trim() && !!walkIn.sex && !!walkIn.dateOfBirth)
  return hasPatient && !!chiefComplaint.value.trim() && !!triageLevel.value && !!arrivalMode.value
})

function submit() {
  if (!isValid.value) return
  submitState.value = 'saving'

  setTimeout(() => {
    let patientId = selectedPatientId.value

    if (!patientId && isWalkIn.value) {
      const newPatient = {
        id: `pt-walkin-${Date.now()}`,
        mrn: `MRN-W-${Date.now().toString().slice(-6)}`,
        givenName: walkIn.givenName.trim(),
        familyName: walkIn.familyName.trim(),
        sex: walkIn.sex as 'male' | 'female' | 'intersex' | 'unknown',
        dateOfBirth: walkIn.dateOfBirth,
      }
      state.patients.push(newPatient)
      patientId = newPatient.id
    }

    if (!patientId) return

    const newId = `er-${Date.now()}`
    state.erVisits.push({
      id: newId,
      patientId,
      arrivedAt: new Date().toISOString(),
      chiefComplaint: chiefComplaint.value.trim(),
      triageLevel: Number(triageLevel.value) as 1 | 2 | 3 | 4 | 5,
      triageNurseUserId: 104,
      status: 'waiting',
      arrivalMode: arrivalMode.value as 'walk_in' | 'ambulance' | 'transferred',
    })

    submitState.value = 'done'
    setTimeout(() => {
      router.push(`/er/${newId}`)
    }, 600)
  }, 400)
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Register Walk-in"
        description="Register a new patient for ER triage."
      />
      <template #actions>
        <Button
          variant="outline"
          as-child
          size="sm"
        >
          <NuxtLink to="/er">
            Cancel
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-4 max-w-2xl">
      <!-- Step 1: Patient -->
      <SectionCard title="Patient">
        <template #header-action>
          <Badge
            v-if="selectedPatient || isWalkIn"
            variant="secondary"
            class="text-[11px]"
          >
            Selected
          </Badge>
        </template>

        <!-- Selected existing patient -->
        <div
          v-if="selectedPatient"
          class="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div class="flex items-center gap-3">
            <Avatar class="size-9">
              <AvatarFallback class="bg-primary/10 text-primary text-xs font-semibold">
                {{ initials(`${selectedPatient.givenName} ${selectedPatient.familyName}`) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <p class="text-sm font-medium">
                {{ selectedPatient.givenName }} {{ selectedPatient.familyName }}
              </p>
              <p class="text-muted-foreground text-xs">
                {{ selectedPatient.mrn }}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground h-7 text-xs"
            @click="clearPatient"
          >
            <X class="mr-1 size-3" />
            Change
          </Button>
        </div>

        <!-- Walk-in selected -->
        <div
          v-else-if="isWalkIn"
          class="space-y-4"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">
              Walk-in registration
            </p>
            <Button
              variant="ghost"
              size="sm"
              class="text-muted-foreground h-7 text-xs"
              @click="isWalkIn = false"
            >
              <X class="mr-1 size-3" />
              Cancel walk-in
            </Button>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="wi-given">Given name <span class="text-destructive">*</span></Label>
              <Input
                id="wi-given"
                v-model="walkIn.givenName"
                placeholder="e.g. Jane"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="wi-family">Family name <span class="text-destructive">*</span></Label>
              <Input
                id="wi-family"
                v-model="walkIn.familyName"
                placeholder="e.g. Doe"
              />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="wi-sex">Sex <span class="text-destructive">*</span></Label>
              <Select v-model="walkIn.sex">
                <SelectTrigger id="wi-sex">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">
                    Male
                  </SelectItem>
                  <SelectItem value="female">
                    Female
                  </SelectItem>
                  <SelectItem value="intersex">
                    Intersex
                  </SelectItem>
                  <SelectItem value="unknown">
                    Unknown
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="wi-dob">Date of birth <span class="text-destructive">*</span></Label>
              <Input
                id="wi-dob"
                v-model="walkIn.dateOfBirth"
                type="date"
              />
            </div>
          </div>
        </div>

        <!-- Search / walk-in choice -->
        <div
          v-else
          class="space-y-3"
        >
          <Label>Search patient</Label>
          <div class="relative">
            <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              v-model="patientQuery"
              placeholder="Name or MRN…"
              class="pl-8"
            />
          </div>

          <Card
            v-if="patientResults.length > 0"
            class="overflow-hidden py-1"
          >
            <CardContent class="p-0">
              <Button
                v-for="p in patientResults"
                :key="p.id"
                type="button"
                variant="ghost"
                class="h-auto w-full justify-start gap-3 px-3 py-2"
                @click="selectPatient(p.id)"
              >
                <Avatar class="size-7">
                  <AvatarFallback class="bg-primary/10 text-primary text-[10px] font-semibold">
                    {{ initials(`${p.givenName} ${p.familyName}`) }}
                  </AvatarFallback>
                </Avatar>
                <div class="text-left">
                  <p class="text-sm font-medium">
                    {{ p.givenName }} {{ p.familyName }}
                  </p>
                  <p class="text-muted-foreground text-xs">
                    {{ p.mrn }}
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>

          <p
            v-else-if="patientQuery.length > 0"
            class="text-muted-foreground text-xs"
          >
            No patients found for "{{ patientQuery }}"
          </p>

          <div class="pt-1">
            <Button
              variant="outline"
              size="sm"
              @click="isWalkIn = true"
            >
              <Footprints class="mr-1 size-3.5" />
              Register as walk-in
            </Button>
          </div>
        </div>
      </SectionCard>

      <!-- Step 2: Chief complaint -->
      <SectionCard title="Chief complaint">
        <div class="space-y-2">
          <Label for="chief-complaint">Complaint <span class="text-destructive">*</span></Label>
          <Textarea
            id="chief-complaint"
            v-model="chiefComplaint"
            placeholder="e.g. Chest pain, shortness of breath, laceration…"
            :rows="3"
          />
        </div>
      </SectionCard>

      <!-- Step 3: Triage -->
      <SectionCard title="Triage">
        <div class="space-y-2">
          <Label for="triage-select">Triage level <span class="text-destructive">*</span></Label>
          <Select v-model="triageLevel">
            <SelectTrigger id="triage-select">
              <SelectValue placeholder="Select ESI level…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in triageOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <!-- Step 4: Arrival mode -->
      <SectionCard title="Arrival mode">
        <div class="space-y-2">
          <Label for="arrival-mode">Mode <span class="text-destructive">*</span></Label>
          <Select v-model="arrivalMode">
            <SelectTrigger id="arrival-mode">
              <SelectValue placeholder="Select mode…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in arrivalModeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                <span class="flex items-center gap-2">
                  <component
                    :is="opt.icon"
                    class="size-3.5"
                  />
                  {{ opt.label }}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <!-- Submit -->
      <div class="flex items-center gap-3 pt-2">
        <Button
          :disabled="!isValid || submitState !== 'idle'"
          class="min-w-[140px] gap-2"
          @click="submit"
        >
          <Loader2
            v-if="submitState === 'saving'"
            class="size-4 animate-spin"
          />
          <span v-if="submitState === 'done'">Registered!</span>
          <span v-else-if="submitState === 'saving'">Registering…</span>
          <span v-else>Register</span>
        </Button>
        <p
          v-if="submitState === 'done'"
          class="text-muted-foreground text-sm"
        >
          Opening triage record…
        </p>
      </div>
    </PageBody>
  </Page>
</template>
