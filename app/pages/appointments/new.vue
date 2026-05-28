<script setup lang="ts">
import { Search, X, CalendarDays, Clock, Stethoscope, FileText, Loader2 } from 'lucide-vue-next'
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
useHead({ title: 'Book Appointment' })

const route = useRoute()
const router = useRouter()
const state = useMockState()

// ─── Patient step ─────────────────────────────────────────────────────────────

const patientQuery = ref('')
const selectedPatientId = ref<string | null>(null)

// Pre-fill from ?patient=<id>
onMounted(() => {
  const pid = route.query.patient as string | undefined
  if (pid && state.patients.find(p => p.id === pid)) {
    selectedPatientId.value = pid
  }
})

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
}

function clearPatient() {
  selectedPatientId.value = null
  patientQuery.value = ''
}

// ─── Doctor step ──────────────────────────────────────────────────────────────

const doctors = computed(() => state.staff.filter(s => s.role === 'doctor'))
const selectedDoctorId = ref<string>('')

// ─── Date & time ─────────────────────────────────────────────────────────────

// Default: tomorrow at 09:00
const defaultDt = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  // Format as datetime-local value: YYYY-MM-DDTHH:MM
  return d.toISOString().slice(0, 16)
})()

const scheduledAt = ref(defaultDt)
const slotMinutes = ref('20')

// ─── Reason ───────────────────────────────────────────────────────────────────

const reasonNote = ref('')

// ─── Submit ───────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'saving' | 'done'
const submitState = ref<SubmitState>('idle')

const isValid = computed(() =>
  !!selectedPatientId.value
  && !!selectedDoctorId.value
  && !!scheduledAt.value,
)

function submit() {
  if (!isValid.value) return
  submitState.value = 'saving'

  // Small artificial delay for interactive feel
  setTimeout(() => {
    const newId = `appt-new-${Date.now()}`
    state.appointments.push({
      id: newId,
      patientId: selectedPatientId.value!,
      doctorUserId: Number(selectedDoctorId.value),
      facilityId: state.facility.id,
      scheduledAt: new Date(scheduledAt.value).toISOString(),
      slotMinutes: Number(slotMinutes.value),
      status: 'booked',
      reasonNote: reasonNote.value || undefined,
    })

    submitState.value = 'done'

    const chosenDate = scheduledAt.value.slice(0, 10)
    setTimeout(() => {
      router.push(`/appointments?date=${chosenDate}`)
    }, 800)
  }, 400)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Book Appointment"
        description="Schedule a new outpatient appointment."
      />
      <template #actions>
        <Button
          variant="outline"
          as-child
        >
          <NuxtLink to="/appointments">
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
            v-if="selectedPatient"
            variant="secondary"
            class="text-[11px]"
          >
            Selected
          </Badge>
        </template>

        <!-- Selected patient card -->
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

        <!-- Search input -->
        <div
          v-else
          class="space-y-1.5"
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

          <!-- Results dropdown -->
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
        </div>
      </SectionCard>

      <!-- Step 2: Doctor -->
      <SectionCard title="Doctor">
        <template #header-action>
          <Stethoscope class="text-muted-foreground size-4" />
        </template>
        <div class="space-y-1.5">
          <Label for="doctor-select">Attending doctor</Label>
          <Select
            v-model="selectedDoctorId"
          >
            <SelectTrigger
              id="doctor-select"
              class="w-full"
            >
              <SelectValue placeholder="Select a doctor…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="doc in doctors"
                :key="doc.id"
                :value="String(doc.id)"
              >
                <span class="flex flex-col">
                  <span>{{ doc.name }}</span>
                  <span
                    v-if="doc.specialty"
                    class="text-muted-foreground text-xs"
                  >{{ doc.specialty }}</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <!-- Step 3: Date & time -->
      <SectionCard title="Date & Time">
        <template #header-action>
          <CalendarDays class="text-muted-foreground size-4" />
        </template>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label for="scheduled-at">Date & time</Label>
            <Input
              id="scheduled-at"
              v-model="scheduledAt"
              type="datetime-local"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="slot-minutes">
              <span class="flex items-center gap-1.5">
                <Clock class="size-3.5" />
                Slot duration
              </span>
            </Label>
            <Select v-model="slotMinutes">
              <SelectTrigger id="slot-minutes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">
                  15 minutes
                </SelectItem>
                <SelectItem value="20">
                  20 minutes
                </SelectItem>
                <SelectItem value="30">
                  30 minutes
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <!-- Step 4: Reason -->
      <SectionCard title="Reason">
        <template #header-action>
          <FileText class="text-muted-foreground size-4" />
        </template>
        <div class="space-y-1.5">
          <Label for="reason-note">Chief complaint / reason (optional)</Label>
          <Textarea
            id="reason-note"
            v-model="reasonNote"
            placeholder="e.g. Follow-up for hypertension management"
            :rows="3"
          />
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
          <span v-if="submitState === 'done'">Booked!</span>
          <span v-else-if="submitState === 'saving'">Booking…</span>
          <span v-else>Book appointment</span>
        </Button>
        <p
          v-if="submitState === 'done'"
          class="text-muted-foreground text-sm"
        >
          Redirecting to appointments…
        </p>
      </div>
    </PageBody>
  </Page>
</template>
