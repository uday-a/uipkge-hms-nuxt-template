<script setup lang="ts">
import { Stethoscope, X } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Pre-Anesthesia Checklist' })

const route = useRoute()
const state = useMockState()

const bookingId = computed(() => route.params.bookingId as string)
const booking = computed(() => state.surgeryBookings.find(b => b.id === bookingId.value))

watchEffect(() => {
  if (import.meta.client && booking.value === undefined) {
    navigateTo('/ot')
  }
})

// ─── Idempotent PAC creation ────────────────────────────────────────────────────

const pac = computed(() => state.pacAssessments.find(p => p.surgeryBookingId === bookingId.value))

onMounted(() => {
  if (!pac.value && booking.value) {
    state.pacAssessments.push({
      id: `pac-${Date.now()}`,
      surgeryBookingId: bookingId.value,
      patientId: booking.value.patientId,
      assessedByUserId: booking.value.anesthetistUserId ?? booking.value.primarySurgeonUserId,
      assessedAt: new Date().toISOString(),
      asa: 1,
      airwayMallampati: 1,
      fasting: false,
      consentSigned: false,
      status: 'draft',
    })
  }
})

// ─── Form refs bound to the PAC record directly ─────────────────────────────────

// We mutate the reactive state directly through pac.value
const asaOptions = [
  { value: 1, label: 'ASA I — Normal healthy' },
  { value: 2, label: 'ASA II — Mild systemic disease' },
  { value: 3, label: 'ASA III — Severe systemic disease' },
  { value: 4, label: 'ASA IV — Severe disease, constant threat to life' },
  { value: 5, label: 'ASA V — Moribund, not expected to survive without operation' },
  { value: 6, label: 'ASA VI — Brain-dead, organ donor' },
]

// Chip lists: comorbidities, medications, allergies
const comorbidityInput = ref('')
const comorbidities = ref<string[]>([])
const medicationInput = ref('')
const medications = ref<string[]>([])
const allergyInput = ref('')
const allergies = ref<string[]>([])

onMounted(() => {
  if (pac.value) {
    if (pac.value.currentMedications) {
      medications.value = pac.value.currentMedications.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (pac.value.allergies) {
      allergies.value = pac.value.allergies.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
})

function addChipFromRef(list: string[], inputRef: Ref<string>) {
  const v = inputRef.value.trim()
  if (v && !list.includes(v)) list.push(v)
  inputRef.value = ''
}

function removeChip(list: string[], value: string) {
  const idx = list.indexOf(value)
  if (idx >= 0) list.splice(idx, 1)
}

function addComorbidity() { addChipFromRef(comorbidities.value, comorbidityInput) }
function addMedication() { addChipFromRef(medications.value, medicationInput) }
function addAllergy() { addChipFromRef(allergies.value, allergyInput) }

function onComorbidityKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addComorbidity() }
}
function onMedicationKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addMedication() }
}
function onAllergyKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addAllergy() }
}

// ─── Lookups ────────────────────────────────────────────────────────────────────

function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function roomName(roomId: string) {
  return state.units.find(u => u.id === roomId)?.name ?? roomId
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Save / Sign ────────────────────────────────────────────────────────────────

function saveDraft() {
  if (!pac.value) return
  pac.value.currentMedications = medications.value.join(', ')
  pac.value.allergies = allergies.value.join(', ')
  pac.value.status = 'draft'
}

function signPac() {
  if (!pac.value) return
  saveDraft()
  pac.value.status = 'completed'
  pac.value.assessedAt = new Date().toISOString()
}

const isSigned = computed(() => pac.value?.status === 'completed' || pac.value?.status === 'reviewed')

function amend() {
  if (!pac.value) return
  pac.value.status = 'draft'
}
</script>

<template>
  <Page v-if="booking && pac">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Stethoscope class="text-muted-foreground size-5" />
        <PageHeaderHeading
          title="Pre-Anesthesia Checklist"
          :description="`${booking.procedureName}`"
        />
      </div>
      <template #actions>
        <Badge
          :variant="pac.status === 'reviewed' ? 'default' : pac.status === 'completed' ? 'secondary' : 'outline'"
          class="capitalize"
        >
          {{ pac.status }}
        </Badge>
        <Button
          v-if="isSigned"
          variant="outline"
          size="sm"
          @click="amend"
        >
          Amend
        </Button>
        <Button
          variant="outline"
          size="sm"
          as-child
        >
          <NuxtLink :to="`/ot/bookings/${bookingId}`">
            Back to booking
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody class="max-w-3xl space-y-6">
      <!-- Booking summary -->
      <SectionCard title="Booking Summary">
        <DataList>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Patient</span>
            <span class="text-sm font-medium">{{ patientName(booking.patientId) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Procedure</span>
            <span class="text-sm font-medium">{{ booking.procedureName }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">Scheduled</span>
            <span class="text-sm font-medium">{{ formatDateTime(booking.scheduledAt) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-muted-foreground text-sm">OR Room</span>
            <span class="text-sm font-medium">{{ roomName(booking.orRoomId) }}</span>
          </DataListItem>
        </DataList>
      </SectionCard>

      <!-- Assessment -->
      <SectionCard title="Assessment">
        <div class="space-y-4">
          <!-- ASA grade -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>ASA Physical Status <span class="text-destructive">*</span></Label>
              <Select
                :model-value="String(pac.asa)"
                :disabled="isSigned"
                @update:model-value="val => { if (pac) pac.asa = Number(val) as 1|2|3|4|5|6 }"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ASA grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in asaOptions"
                    :key="opt.value"
                    :value="String(opt.value)"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label>Mallampati Score</Label>
              <Select
                :model-value="String(pac.airwayMallampati)"
                :disabled="isSigned"
                @update:model-value="val => { if (pac) pac.airwayMallampati = Number(val) as 1|2|3|4 }"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    Class I — Full visibility of tonsils, uvula, soft palate
                  </SelectItem>
                  <SelectItem value="2">
                    Class II — Uvula, soft palate, upper tonsils visible
                  </SelectItem>
                  <SelectItem value="3">
                    Class III — Soft and hard palate, base of uvula visible
                  </SelectItem>
                  <SelectItem value="4">
                    Class IV — Only hard palate visible
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Comorbidities (chip list) -->
          <div class="space-y-1.5">
            <Label>Comorbidities</Label>
            <div
              v-if="!isSigned"
              class="flex gap-2"
            >
              <Input
                v-model="comorbidityInput"
                placeholder="Type comorbidity and press Enter"
                class="flex-1"
                @keydown="onComorbidityKeydown"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="addComorbidity()"
              >
                Add
              </Button>
            </div>
            <div
              v-if="comorbidities.length"
              class="flex flex-wrap gap-1.5 pt-1"
            >
              <Badge
                v-for="item in comorbidities"
                :key="item"
                variant="outline"
                class="gap-1 pr-0.5"
              >
                {{ item }}
                <Button
                  v-if="!isSigned"
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4 shrink-0 rounded-full"
                  type="button"
                  @click="removeChip(comorbidities, item)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          </div>

          <!-- Airway, Cardiac, Respiratory notes -->
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="space-y-1.5">
              <Label>Airway notes</Label>
              <Textarea
                v-model="pac.dentalNotes"
                :disabled="isSigned"
                placeholder="Dental, airway anatomy…"
                rows="3"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Cardiac notes</Label>
              <Textarea
                :disabled="isSigned"
                placeholder="Cardiac history, investigations…"
                rows="3"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Respiratory notes</Label>
              <Textarea
                :disabled="isSigned"
                placeholder="Lung function, CPAP, asthma…"
                rows="3"
              />
            </div>
          </div>

          <!-- Medications chip list -->
          <div class="space-y-1.5">
            <Label>Current medications</Label>
            <div
              v-if="!isSigned"
              class="flex gap-2"
            >
              <Input
                v-model="medicationInput"
                placeholder="Drug name and dose"
                class="flex-1"
                @keydown="onMedicationKeydown"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="addMedication()"
              >
                Add
              </Button>
            </div>
            <div
              v-if="medications.length"
              class="flex flex-wrap gap-1.5 pt-1"
            >
              <Badge
                v-for="med in medications"
                :key="med"
                variant="outline"
                class="gap-1 pr-0.5"
              >
                {{ med }}
                <Button
                  v-if="!isSigned"
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4 shrink-0 rounded-full"
                  type="button"
                  @click="removeChip(medications, med)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          </div>

          <!-- Allergies chip list -->
          <div class="space-y-1.5">
            <Label>Allergies</Label>
            <div
              v-if="!isSigned"
              class="flex gap-2"
            >
              <Input
                v-model="allergyInput"
                placeholder="Allergen + reaction"
                class="flex-1"
                @keydown="onAllergyKeydown"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="addAllergy()"
              >
                Add
              </Button>
            </div>
            <div
              v-if="allergies.length"
              class="flex flex-wrap gap-1.5 pt-1"
            >
              <Badge
                v-for="allergy in allergies"
                :key="allergy"
                variant="outline"
                class="gap-1 pr-0.5 border-destructive text-destructive"
              >
                {{ allergy }}
                <Button
                  v-if="!isSigned"
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4 shrink-0 rounded-full text-destructive hover:text-destructive"
                  type="button"
                  @click="removeChip(allergies, allergy)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          </div>

          <!-- NPO status -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Last oral intake (NPO from)</Label>
              <Input
                v-model="pac.fastingLastOralAt"
                type="datetime-local"
                :disabled="isSigned"
              />
            </div>
            <div class="flex items-center gap-3 pt-5">
              <Switch
                :model-value="pac.fasting"
                :disabled="isSigned"
                @update:model-value="val => { if (pac) pac.fasting = val }"
              />
              <Label>Patient is fasting / NBM</Label>
            </div>
          </div>

          <!-- Fitness for surgery -->
          <div class="flex items-center gap-3">
            <Switch
              :model-value="pac.consentSigned"
              :disabled="isSigned"
              @update:model-value="val => { if (pac) pac.consentSigned = val }"
            />
            <Label>Informed consent signed</Label>
          </div>

          <!-- Anesthesia plan -->
          <div class="space-y-1.5">
            <Label>Anesthesia plan</Label>
            <Textarea
              v-model="pac.anesthesiaPlan"
              :disabled="isSigned"
              placeholder="Technique, agents, monitoring plan…"
              rows="4"
            />
          </div>

          <!-- Pre-medications -->
          <div class="space-y-1.5">
            <Label>Pre-medications</Label>
            <Textarea
              v-model="pac.premedications"
              :disabled="isSigned"
              placeholder="Preoperative medications, timing…"
              rows="2"
            />
          </div>
        </div>
      </SectionCard>

      <!-- Footer actions -->
      <div
        v-if="!isSigned"
        class="flex items-center gap-3"
      >
        <Button
          variant="outline"
          @click="saveDraft"
        >
          Save draft
        </Button>
        <Button @click="signPac">
          Sign PAC
        </Button>
      </div>
    </PageBody>
  </Page>
</template>
