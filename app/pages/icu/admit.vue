<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Admit to ICU' })

const state = useMockState()

// ── Patient typeahead ─────────────────────────────────────────────────────────

const patientQuery = ref('')
const patientDropdownOpen = ref(false)
const selectedPatient = ref<(typeof state.patients)[0] | null>(null)

const filteredPatients = computed(() => {
  const q = patientQuery.value.trim().toLowerCase()
  if (!q) return state.patients.slice(0, 8)
  return state.patients.filter(p =>
    `${p.givenName} ${p.familyName}`.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q),
  ).slice(0, 8)
})

function selectPatient(p: (typeof state.patients)[0]) {
  selectedPatient.value = p
  patientQuery.value = `${p.givenName} ${p.familyName}`
  patientDropdownOpen.value = false
  form.patientId = p.id
}

function onPatientInput() {
  patientDropdownOpen.value = true
  selectedPatient.value = null
  form.patientId = ''
}

function closeDropdownDelayed() {
  setTimeout(() => {
    patientDropdownOpen.value = false
  }, 150)
}

// ── Form ──────────────────────────────────────────────────────────────────────

const form = reactive({
  patientId: '',
  encounterId: '',
  source: '' as 'OT' | 'ER' | 'ward' | 'external_transfer' | '',
  indication: '',
  initialSeverity: '' as 'mild' | 'moderate' | 'severe' | '',
  initialGcs: '' as string,
  initialApache: '' as string,
  initialSofa: '' as string,
  intensivistUserId: '' as string,
})

// Doctors + admins as intensivists
const intensivists = computed(() =>
  state.staff.filter(s => s.role === 'doctor' || s.role === 'admin'),
)

const submitting = ref(false)

const isValid = computed(() =>
  form.patientId
  && form.source
  && form.indication.trim().length >= 8
  && form.initialSeverity
  && form.intensivistUserId,
)

async function submit() {
  if (!isValid.value) return
  submitting.value = true

  await new Promise(r => setTimeout(r, 350))

  const id = `icu-${Date.now()}`
  state.icuAdmissions.push({
    id,
    encounterId: form.encounterId.trim() || `enc-icu-${Date.now()}`,
    patientId: form.patientId,
    source: form.source as 'OT' | 'ER' | 'ward' | 'external_transfer',
    indication: form.indication.trim(),
    admittedAt: new Date().toISOString(),
    admittedByUserId: 100, // current admin/on-call user (Adam Boyle)
    intensivistUserId: Number(form.intensivistUserId),
    initialSeverity: form.initialSeverity as 'mild' | 'moderate' | 'severe',
    initialGcs: form.initialGcs ? Number(form.initialGcs) : undefined,
    dischargedAt: undefined,
    outcome: undefined,
  })

  submitting.value = false
  await navigateTo(`/icu/${id}`)
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Admit to ICU"
        description="Create a new ICU admission record."
      />
    </PageHeader>

    <PageBody>
      <div class="max-w-lg">
        <Card>
          <CardContent class="pt-6">
            <form
              class="space-y-4"
              @submit.prevent="submit"
            >
              <!-- Patient typeahead -->
              <div class="relative space-y-1.5">
                <Label for="patient-search">
                  Patient <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="patient-search"
                  v-model="patientQuery"
                  autocomplete="off"
                  placeholder="Search by name or MRN…"
                  @input="onPatientInput"
                  @focus="patientDropdownOpen = true"
                  @blur="closeDropdownDelayed"
                />
                <div
                  v-if="patientDropdownOpen && filteredPatients.length > 0"
                  class="bg-popover border shadow-md rounded-md absolute z-10 w-full mt-1 overflow-hidden"
                >
                  <Button
                    v-for="p in filteredPatients"
                    :key="p.id"
                    type="button"
                    variant="ghost"
                    class="h-auto w-full justify-start px-3 py-2 flex-col items-start gap-0.5"
                    @mousedown.prevent="selectPatient(p)"
                  >
                    <span class="text-sm font-medium">{{ p.givenName }} {{ p.familyName }}</span>
                    <span class="text-muted-foreground text-xs font-mono">{{ p.mrn }}</span>
                  </Button>
                </div>
                <p
                  v-if="selectedPatient"
                  class="text-muted-foreground text-xs"
                >
                  Selected: <span class="font-mono">{{ selectedPatient.mrn }}</span>
                </p>
              </div>

              <!-- Encounter ID -->
              <div class="space-y-1.5">
                <Label for="encounter-id">
                  Encounter ID
                  <span class="text-muted-foreground text-xs font-normal">(optional — leave blank to auto-generate)</span>
                </Label>
                <Input
                  id="encounter-id"
                  v-model="form.encounterId"
                  placeholder="e.g. enc-006"
                />
              </div>

              <!-- Source -->
              <div class="space-y-1.5">
                <Label>Source <span class="text-destructive">*</span></Label>
                <Select v-model="form.source">
                  <SelectTrigger>
                    <SelectValue placeholder="Where was the patient before ICU?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OT">
                      OT — Operating Theatre
                    </SelectItem>
                    <SelectItem value="ER">
                      ER — Emergency
                    </SelectItem>
                    <SelectItem value="ward">
                      Ward
                    </SelectItem>
                    <SelectItem value="external_transfer">
                      External Transfer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Indication -->
              <div class="space-y-1.5">
                <Label for="indication">
                  Indication <span class="text-destructive">*</span>
                  <span class="text-muted-foreground text-xs font-normal">(min 8 chars)</span>
                </Label>
                <Textarea
                  id="indication"
                  v-model="form.indication"
                  placeholder="Clinical reason for ICU admission…"
                  :rows="3"
                />
              </div>

              <!-- Initial severity -->
              <div class="space-y-1.5">
                <Label>Initial severity <span class="text-destructive">*</span></Label>
                <Select v-model="form.initialSeverity">
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">
                      Mild
                    </SelectItem>
                    <SelectItem value="moderate">
                      Moderate
                    </SelectItem>
                    <SelectItem value="severe">
                      Severe
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Scores row -->
              <div class="grid grid-cols-3 gap-3">
                <!-- GCS -->
                <div class="space-y-1.5">
                  <Label for="initial-gcs">GCS (3–15)</Label>
                  <Input
                    id="initial-gcs"
                    v-model="form.initialGcs"
                    type="number"
                    min="3"
                    max="15"
                    placeholder="e.g. 13"
                  />
                </div>

                <!-- APACHE II -->
                <div class="space-y-1.5">
                  <Label for="initial-apache">APACHE II</Label>
                  <Input
                    id="initial-apache"
                    v-model="form.initialApache"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 18"
                  />
                </div>

                <!-- SOFA -->
                <div class="space-y-1.5">
                  <Label for="initial-sofa">SOFA</Label>
                  <Input
                    id="initial-sofa"
                    v-model="form.initialSofa"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 6"
                  />
                </div>
              </div>

              <!-- Intensivist -->
              <div class="space-y-1.5">
                <Label>Intensivist <span class="text-destructive">*</span></Label>
                <Select v-model="form.intensivistUserId">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign intensivist…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="s in intensivists"
                      :key="String(s.id)"
                      :value="String(s.id)"
                    >
                      {{ s.name }}
                      <span class="text-muted-foreground capitalize">· {{ s.role }}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  :disabled="submitting || !isValid"
                >
                  <Loader2
                    v-if="submitting"
                    class="size-4 animate-spin"
                  />
                  Admit patient
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  as-child
                >
                  <NuxtLink to="/icu">Cancel</NuxtLink>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageBody>
  </Page>
</template>
