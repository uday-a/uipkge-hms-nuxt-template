<script setup lang="ts">
import { Activity, Plus } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/ui/section-card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
useHead({ title: 'Anesthesia Record' })

const route = useRoute()
const state = useMockState()

const bookingId = computed(() => route.params.bookingId as string)
const booking = computed(() => state.surgeryBookings.find(b => b.id === bookingId.value))

watchEffect(() => {
  if (import.meta.client && booking.value === undefined) {
    navigateTo('/ot')
  }
})

// ─── Idempotent record creation ────────────────────────────────────────────────

const record = computed(() => state.anesthesiaRecords.find(a => a.surgeryBookingId === bookingId.value))

onMounted(() => {
  if (!record.value && booking.value) {
    state.anesthesiaRecords.push({
      id: `anes-${Date.now()}`,
      surgeryBookingId: bookingId.value,
      patientId: booking.value.patientId,
      anesthetistUserId: booking.value.anesthetistUserId ?? booking.value.primarySurgeonUserId,
      type: 'general',
      startAt: booking.value.startedAt ?? new Date().toISOString(),
      agents: [],
      intraopVitals: [],
    })
  }
})

// ─── Local form state ────────────────────────────────────────────────────────────

// Technique
const technique = ref('general')
const startTime = ref('')
const endTime = ref('')

// Intraop vitals rows
interface VitalsRow { time: string, bpSys: string, bpDia: string, hr: string, spo2: string, etco2: string }
const vitalsRows = ref<VitalsRow[]>([])

// Drugs rows
interface DrugRow { time: string, drug: string, dose: string, unit: string, route: string }
const drugRows = ref<DrugRow[]>([])

// Events rows
interface EventRow { time: string, kind: string, note: string }
const eventRows = ref<EventRow[]>([])

// Fluids
const fluidsIn = reactive({ crystalloidMl: '', colloidMl: '', bloodMl: '' })
const fluidsOut = reactive({ urineMl: '', bloodLossMl: '' })

const recoveryNotes = ref('')

const isSigned = ref(false)

onMounted(() => {
  if (record.value) {
    technique.value = record.value.type
    startTime.value = record.value.startAt ? record.value.startAt.slice(0, 16) : ''
    endTime.value = record.value.endAt ? record.value.endAt.slice(0, 16) : ''
    recoveryNotes.value = record.value.notes ?? ''

    vitalsRows.value = record.value.intraopVitals.map(v => ({
      time: v.at.slice(0, 16),
      bpSys: String(v.bpSys),
      bpDia: String(v.bpDia),
      hr: String(v.hr),
      spo2: String(v.spo2),
      etco2: v.etco2 !== undefined ? String(v.etco2) : '',
    }))

    drugRows.value = record.value.agents.map(a => ({
      time: a.at.slice(0, 16),
      drug: a.drug,
      dose: a.dose,
      unit: '',
      route: a.route,
    }))

    // Determine signed state: endAt and recoveryScore together imply "final"
    isSigned.value = !!(record.value.endAt && record.value.recoveryScore !== undefined)
  }
})

// ─── Row management ────────────────────────────────────────────────────────────

function addVitalsRow() {
  vitalsRows.value.push({ time: '', bpSys: '', bpDia: '', hr: '', spo2: '', etco2: '' })
}

function addDrugRow() {
  drugRows.value.push({ time: '', drug: '', dose: '', unit: 'mg', route: 'IV' })
}

function addEventRow() {
  eventRows.value.push({ time: '', kind: 'note', note: '' })
}

// ─── Save / Sign ────────────────────────────────────────────────────────────────

function saveRecord() {
  if (!record.value) return
  record.value.type = technique.value as 'general' | 'spinal' | 'epidural' | 'local' | 'combined'
  record.value.startAt = startTime.value ? new Date(startTime.value).toISOString() : record.value.startAt
  record.value.endAt = endTime.value ? new Date(endTime.value).toISOString() : undefined
  record.value.notes = recoveryNotes.value

  record.value.intraopVitals = vitalsRows.value
    .filter(r => r.time)
    .map(r => ({
      at: new Date(r.time).toISOString(),
      bpSys: Number(r.bpSys) || 0,
      bpDia: Number(r.bpDia) || 0,
      hr: Number(r.hr) || 0,
      spo2: Number(r.spo2) || 0,
      etco2: r.etco2 ? Number(r.etco2) : undefined,
    }))

  record.value.agents = drugRows.value
    .filter(r => r.drug)
    .map(r => ({
      drug: r.drug,
      dose: r.dose,
      route: r.route,
      at: r.time ? new Date(r.time).toISOString() : new Date().toISOString(),
    }))
}

function signRecord() {
  saveRecord()
  if (!record.value) return
  record.value.recoveryScore = 10
  isSigned.value = true
}

function amend() {
  isSigned.value = false
}
</script>

<template>
  <Page v-if="booking && record">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Activity class="text-muted-foreground size-5" />
        <PageHeaderHeading
          title="Anesthesia Record"
          :description="booking.procedureName"
        />
      </div>
      <template #actions>
        <Badge
          v-if="isSigned"
          variant="default"
        >
          Final
        </Badge>
        <Badge
          v-else
          variant="outline"
        >
          Draft
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

    <PageBody class="max-w-4xl space-y-6">
      <!-- Anesthesia technique + timing -->
      <SectionCard title="Anesthesia">
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-1.5">
            <Label>Technique</Label>
            <Select
              v-model="technique"
              :disabled="isSigned"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  General
                </SelectItem>
                <SelectItem value="spinal">
                  Spinal
                </SelectItem>
                <SelectItem value="epidural">
                  Epidural
                </SelectItem>
                <SelectItem value="combined">
                  Combined (CSE)
                </SelectItem>
                <SelectItem value="local">
                  MAC / Local
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Start time</Label>
            <Input
              v-model="startTime"
              type="datetime-local"
              :disabled="isSigned"
            />
          </div>
          <div class="space-y-1.5">
            <Label>End time</Label>
            <Input
              v-model="endTime"
              type="datetime-local"
              :disabled="isSigned"
            />
          </div>
        </div>
      </SectionCard>

      <!-- Intraop vitals -->
      <SectionCard title="Intraoperative Vitals">
        <template #header-action>
          <Button
            v-if="!isSigned"
            variant="outline"
            size="sm"
            class="gap-1.5"
            @click="addVitalsRow"
          >
            <Plus class="size-3.5" />
            Add row
          </Button>
        </template>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>BP Sys</TableHead>
                <TableHead>BP Dia</TableHead>
                <TableHead>HR</TableHead>
                <TableHead>SpO₂ %</TableHead>
                <TableHead>etCO₂</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="vitalsRows.length === 0">
                No vitals recorded yet. Click "Add row" to start.
              </TableEmpty>
              <TableRow
                v-for="(row, idx) in vitalsRows"
                :key="idx"
              >
                <TableCell>
                  <Input
                    v-model="row.time"
                    type="datetime-local"
                    class="h-8 text-xs"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.bpSys"
                    type="number"
                    class="h-8 w-20 text-xs"
                    placeholder="120"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.bpDia"
                    type="number"
                    class="h-8 w-20 text-xs"
                    placeholder="80"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.hr"
                    type="number"
                    class="h-8 w-20 text-xs"
                    placeholder="72"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.spo2"
                    type="number"
                    class="h-8 w-20 text-xs"
                    placeholder="98"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.etco2"
                    type="number"
                    class="h-8 w-20 text-xs"
                    placeholder="38"
                    :disabled="isSigned"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Drugs administered -->
      <SectionCard title="Drugs Administered">
        <template #header-action>
          <Button
            v-if="!isSigned"
            variant="outline"
            size="sm"
            class="gap-1.5"
            @click="addDrugRow"
          >
            <Plus class="size-3.5" />
            Add row
          </Button>
        </template>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Route</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="drugRows.length === 0">
                No drugs recorded yet.
              </TableEmpty>
              <TableRow
                v-for="(row, idx) in drugRows"
                :key="idx"
              >
                <TableCell>
                  <Input
                    v-model="row.time"
                    type="datetime-local"
                    class="h-8 text-xs"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.drug"
                    class="h-8 text-xs"
                    placeholder="Propofol"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.dose"
                    type="number"
                    class="h-8 w-20 text-xs"
                    placeholder="100"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.unit"
                    class="h-8 w-16 text-xs"
                    placeholder="mg"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="row.route"
                    class="h-8 w-24 text-xs"
                    placeholder="IV"
                    :disabled="isSigned"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Events -->
      <SectionCard title="Intraoperative Events">
        <template #header-action>
          <Button
            v-if="!isSigned"
            variant="outline"
            size="sm"
            class="gap-1.5"
            @click="addEventRow"
          >
            <Plus class="size-3.5" />
            Add event
          </Button>
        </template>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="eventRows.length === 0">
                No events recorded.
              </TableEmpty>
              <TableRow
                v-for="(row, idx) in eventRows"
                :key="idx"
              >
                <TableCell>
                  <Input
                    v-model="row.time"
                    type="datetime-local"
                    class="h-8 text-xs"
                    :disabled="isSigned"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    v-model="row.kind"
                    :disabled="isSigned"
                  >
                    <SelectTrigger class="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">
                        Note
                      </SelectItem>
                      <SelectItem value="complication">
                        Complication
                      </SelectItem>
                      <SelectItem value="intervention">
                        Intervention
                      </SelectItem>
                      <SelectItem value="vital_change">
                        Vital change
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell class="w-full">
                  <Input
                    v-model="row.note"
                    class="h-8 text-xs"
                    placeholder="Describe event…"
                    :disabled="isSigned"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Fluids -->
      <SectionCard title="Fluids">
        <div class="grid gap-6 sm:grid-cols-2">
          <div class="space-y-4">
            <p class="text-sm font-medium">
              Input
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div class="space-y-1">
                <Label class="text-xs">Crystalloid (ml)</Label>
                <Input
                  v-model="fluidsIn.crystalloidMl"
                  type="number"
                  class="h-8 text-xs"
                  placeholder="0"
                  :disabled="isSigned"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Colloid (ml)</Label>
                <Input
                  v-model="fluidsIn.colloidMl"
                  type="number"
                  class="h-8 text-xs"
                  placeholder="0"
                  :disabled="isSigned"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Blood (ml)</Label>
                <Input
                  v-model="fluidsIn.bloodMl"
                  type="number"
                  class="h-8 text-xs"
                  placeholder="0"
                  :disabled="isSigned"
                />
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <p class="text-sm font-medium">
              Output
            </p>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <Label class="text-xs">Urine output (ml)</Label>
                <Input
                  v-model="fluidsOut.urineMl"
                  type="number"
                  class="h-8 text-xs"
                  placeholder="0"
                  :disabled="isSigned"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Est. blood loss (ml)</Label>
                <Input
                  v-model="fluidsOut.bloodLossMl"
                  type="number"
                  class="h-8 text-xs"
                  placeholder="0"
                  :disabled="isSigned"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Recovery notes -->
      <SectionCard title="Recovery Notes">
        <Textarea
          v-model="recoveryNotes"
          :disabled="isSigned"
          placeholder="PACU handover, Aldrete score, special instructions…"
          rows="4"
        />
      </SectionCard>

      <!-- Footer actions -->
      <div
        v-if="!isSigned"
        class="flex items-center gap-3"
      >
        <Button
          variant="outline"
          @click="saveRecord"
        >
          Save
        </Button>
        <Button @click="signRecord">
          Sign record
        </Button>
      </div>
    </PageBody>
  </Page>
</template>
