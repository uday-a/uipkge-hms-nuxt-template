<script setup lang="ts">
import {
  ClipboardList,
  FileEdit,
  Pill,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { IconBox } from '@/components/ui/icon-box'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Doctor Dashboard' })

// ── helpers ───────────────────────────────────────────────────────────
function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}
function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString('en-GB')
}
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
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
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── mock state ────────────────────────────────────────────────────────
const state = useMockState()

// Current doctor — first staff member with role 'doctor'
const me = computed(() => state.staff.find(s => s.role === 'doctor')!)
// Family name derived by stripping "Dr " prefix
const familyName = computed(() => me.value.name.replace(/^Dr\s+/i, '').split(' ').at(-1) ?? '')

// Convenience lookups
const patientById = (id: string) => state.patients.find(p => p.id === id)
const drugById = (id: string) => state.drugs.find(d => d.id === id)
const observationById = (id: string) => state.observations.find(o => o.id === id)

// ── section 1: KPI counts ─────────────────────────────────────────────
const today = new Date()

const todayQueue = computed(() =>
  state.appointments.filter(
    a =>
      a.doctorUserId === me.value.id
      && sameDay(new Date(a.scheduledAt), today)
      && (a.status === 'booked' || a.status === 'arrived'),
  ),
)

const draftNotes = computed(() =>
  state.clinicalNotes.filter(
    n => n.authorUserId === me.value.id && n.status === 'draft',
  ),
)

// Active Rx that have NOT been fully dispensed
const pendingRx = computed(() => {
  const myActiveRx = state.prescriptions.filter(
    p => p.prescriberUserId === me.value.id && p.status === 'active',
  )
  // A prescription is "fully dispensed" when sum of its dispenses >= dispenseQty
  return myActiveRx.filter((rx) => {
    const totalDispensed = state.dispenses
      .filter(d => d.medicationRequestId === rx.id)
      .reduce((sum, d) => sum + d.qtyDispensed, 0)
    return totalDispensed < rx.dispenseQty
  })
})

// Patient IDs that have had an encounter with this doctor
const myPatientIds = computed(() =>
  new Set(
    state.encounters
      .filter(e => e.attendingUserId === me.value.id)
      .map(e => e.patientId),
  ),
)

const criticalForMyPatients = computed(() =>
  state.criticalAlerts.filter(a => myPatientIds.value.has(a.patientId)),
)

// ── section 2: today's schedule ───────────────────────────────────────
const todayAppointments = computed(() =>
  state.appointments
    .filter(
      a =>
        a.doctorUserId === me.value.id
        && sameDay(new Date(a.scheduledAt), today),
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
)

// ── section 3: active encounters ─────────────────────────────────────
const activeEncounters = computed(() =>
  state.encounters.filter(
    e =>
      e.attendingUserId === me.value.id
      && (e.status === 'in_progress' || e.status === 'arrived'),
  ),
)

// ── section 4: recent prescriptions (last 5) ─────────────────────────
const recentRx = computed(() => {
  const mine = state.prescriptions.filter(
    p => p.prescriberUserId === me.value.id,
  )
  // Sort by signedAt desc; fall back to array order
  return [...mine]
    .sort((a, b) => {
      const ta = a.signedAt ? new Date(a.signedAt).getTime() : 0
      const tb = b.signedAt ? new Date(b.signedAt).getTime() : 0
      return tb - ta
    })
    .slice(0, 5)
})

// ── section 5: recent clinical notes (last 5) ─────────────────────────
const recentNotes = computed(() => {
  const mine = state.clinicalNotes.filter(
    n => n.authorUserId === me.value.id,
  )
  return [...mine]
    .sort((a, b) => {
      const ta = a.signedAt ? new Date(a.signedAt).getTime() : 0
      const tb = b.signedAt ? new Date(b.signedAt).getTime() : 0
      return tb - ta
    })
    .slice(0, 5)
})

// ── section 6: critical lab values for my patients ────────────────────
const criticalRows = computed(() =>
  criticalForMyPatients.value.map((alert) => {
    const obs = observationById(alert.observationId)
    const patient = patientById(alert.patientId)
    // Find the diagnostic report that contains this observation
    const report = state.diagnosticReports.find(
      r => r.observationIds.includes(alert.observationId),
    )
    return { alert, obs, patient, report }
  }),
)

// ── badge helpers ─────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

function apptStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    booked: 'info',
    arrived: 'warning',
    completed: 'success',
    cancelled: 'outline',
    no_show: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function encounterTypeVariant(type: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    outpatient: 'info',
    inpatient: 'warning',
    emergency: 'destructive',
    daycare: 'secondary',
    telemedicine: 'outline',
  }
  return map[type] ?? 'secondary'
}

function rxStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    draft: 'outline',
    completed: 'secondary',
    cancelled: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function noteKindVariant(kind: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    soap: 'info',
    progress: 'warning',
    discharge: 'secondary',
    free: 'outline',
    anesthesia: 'default',
    operative: 'default',
  }
  return map[kind] ?? 'secondary'
}

function noteStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    draft: 'outline',
    signed: 'success',
    amended: 'warning',
    superseded: 'secondary',
  }
  return map[status] ?? 'secondary'
}
</script>

<template>
  <Page>
    <!-- ── Greeting header ───────────────────────────────────────────── -->
    <PageHeader>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <Avatar class="size-12">
            <AvatarFallback class="bg-primary/10 text-primary text-sm font-semibold">
              {{ initials(me.name) }}
            </AvatarFallback>
          </Avatar>
          <div>
            <PageHeaderHeading
              :title="`${greeting()}, Dr ${familyName}`"
              description="Here's your clinical overview for today."
            />
            <div class="mt-1 flex items-center gap-2">
              <Badge variant="secondary">
                {{ me.specialty ?? me.role }}
              </Badge>
              <span class="text-muted-foreground text-xs">
                {{ me.email }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- ── KPI row ─────────────────────────────────────────────────── -->
      <KpiGrid :columns="4">
        <!-- Today's queue -->
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Today's Queue
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ todayQueue.length }}
                </p>
              </div>
              <IconBox :icon="ClipboardList" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              booked or arrived
            </p>
          </CardContent>
        </Card>

        <!-- Draft notes -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Draft Notes
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ draftNotes.length }}
                </p>
              </div>
              <IconBox :icon="FileEdit" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              awaiting signature
            </p>
          </CardContent>
        </Card>

        <!-- Pending Rx -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Pending Rx
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ pendingRx.length }}
                </p>
              </div>
              <IconBox :icon="Pill" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              active, not fully dispensed
            </p>
          </CardContent>
        </Card>

        <!-- Critical results -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Critical Results
                </p>
                <p class="mt-1 text-2xl font-bold text-destructive">
                  {{ criticalForMyPatients.length }}
                </p>
              </div>
              <IconBox :icon="AlertTriangle" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              on my patients
            </p>
          </CardContent>
        </Card>
      </KpiGrid>

      <!-- ── Today's schedule ─────────────────────────────────────────── -->
      <SectionCard title="Today's Appointments" class="transition-shadow hover:shadow-sm">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[90px]">
                  Time
                </TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead class="w-[100px]">
                  Status
                </TableHead>
                <TableHead class="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="todayAppointments.length">
                <TableRow
                  v-for="appt in todayAppointments"
                  :key="appt.id"
                >
                  <TableCell class="text-muted-foreground text-xs font-mono">
                    {{ fmtTime(appt.scheduledAt) }}
                  </TableCell>
                  <TableCell>
                    <div
                      v-if="patientById(appt.patientId)"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-secondary text-[10px] font-semibold">
                          {{ initials(`${patientById(appt.patientId)!.givenName} ${patientById(appt.patientId)!.familyName}`) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium leading-none">
                          {{ patientById(appt.patientId)!.givenName }} {{ patientById(appt.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patientById(appt.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-muted-foreground max-w-[200px] truncate text-xs">
                    {{ appt.reasonNote ?? '—' }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="apptStatusVariant(appt.status)"
                      class="capitalize"
                    >
                      {{ appt.status.replace('_', ' ') }}
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
                        :to="appt.encounterId ? `/encounters/${appt.encounterId}` : `/appointments/${appt.id}`"
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
                <div class="py-6 text-center text-muted-foreground">
                  <p class="text-sm">
                    No appointments scheduled for today.
                  </p>
                </div>
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Active encounters ─────────────────────────────────────────── -->
      <SectionCard title="Active Encounters" class="transition-shadow hover:shadow-sm">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead class="w-[110px]">
                  Type
                </TableHead>
                <TableHead class="w-[120px]">
                  Started
                </TableHead>
                <TableHead class="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="activeEncounters.length">
                <TableRow
                  v-for="enc in activeEncounters"
                  :key="enc.id"
                >
                  <TableCell>
                    <div
                      v-if="patientById(enc.patientId)"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-secondary text-[10px] font-semibold">
                          {{ initials(`${patientById(enc.patientId)!.givenName} ${patientById(enc.patientId)!.familyName}`) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium leading-none">
                          {{ patientById(enc.patientId)!.givenName }} {{ patientById(enc.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patientById(enc.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="encounterTypeVariant(enc.type)"
                      class="capitalize"
                    >
                      {{ enc.type }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    {{ enc.admissionAt ? relTime(enc.admissionAt) : '—' }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-7 gap-1 px-2 text-xs"
                      :as-child="true"
                    >
                      <NuxtLink
                        :to="`/encounters/${enc.id}`"
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
                :colspan="4"
              >
                No active encounters.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Recent Rx + Recent Notes (2-col) ─────────────────────────── -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Recent prescriptions -->
        <SectionCard title="Recent Prescriptions" class="transition-shadow hover:shadow-sm">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug</TableHead>
                  <TableHead class="w-[90px]">
                    Dose
                  </TableHead>
                  <TableHead class="w-[90px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="recentRx.length">
                  <TableRow
                    v-for="rx in recentRx"
                    :key="rx.id"
                  >
                    <TableCell>
                      <p class="text-sm font-medium leading-none">
                        {{ drugById(rx.drugId)?.display ?? rx.drugId }}
                      </p>
                      <p class="text-muted-foreground text-xs">
                        {{ rx.frequencyText }}
                      </p>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-xs">
                      {{ rx.doseValue }} {{ rx.doseUnit }}
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
                  :colspan="3"
                >
                  No prescriptions found.
                </TableEmpty>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- Recent clinical notes -->
        <SectionCard title="Recent Clinical Notes" class="transition-shadow hover:shadow-sm">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encounter</TableHead>
                  <TableHead class="w-[80px]">
                    Kind
                  </TableHead>
                  <TableHead class="w-[80px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="recentNotes.length">
                  <TableRow
                    v-for="note in recentNotes"
                    :key="note.id"
                  >
                    <TableCell>
                      <p class="text-xs font-mono">
                        {{ note.encounterId }}
                      </p>
                      <p
                        v-if="note.signedAt"
                        class="text-muted-foreground text-xs"
                      >
                        {{ relTime(note.signedAt) }}
                      </p>
                      <p
                        v-else
                        class="text-muted-foreground text-xs"
                      >
                        unsigned
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        :variant="noteKindVariant(note.kind)"
                        class="capitalize"
                      >
                        {{ note.kind }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        :variant="noteStatusVariant(note.status)"
                        class="capitalize"
                      >
                        {{ note.status }}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </template>
                <TableEmpty
                  v-else
                  :colspan="3"
                >
                  No notes found.
                </TableEmpty>
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>

      <!-- ── Critical lab values ─────────────────────────────────────── -->
      <SectionCard title="Critical Lab Values for My Patients" class="transition-shadow hover:shadow-sm">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead class="w-[130px]">
                  Value
                </TableHead>
                <TableHead class="w-[110px]">
                  Triggered
                </TableHead>
                <TableHead class="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="criticalRows.length">
                <TableRow
                  v-for="row in criticalRows"
                  :key="row.alert.id"
                >
                  <TableCell>
                    <div
                      v-if="row.patient"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-destructive/10 text-destructive text-[10px] font-semibold">
                          {{ initials(`${row.patient.givenName} ${row.patient.familyName}`) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium leading-none">
                          {{ row.patient.givenName }} {{ row.patient.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ row.patient.mrn }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ row.obs?.display ?? row.alert.observationId }}
                  </TableCell>
                  <TableCell>
                    <span
                      v-if="row.obs"
                      class="text-destructive text-sm font-semibold"
                    >
                      {{ row.obs.valueNumeric ?? row.obs.valueString }}
                      <span
                        v-if="row.obs.unit"
                        class="text-destructive/70 text-xs font-normal"
                      >
                        {{ row.obs.unit }}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    {{ relTime(row.alert.triggeredAt) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-7 gap-1 px-2 text-xs"
                      :as-child="true"
                    >
                      <NuxtLink
                        :to="row.report ? `/lab/reports/${row.report.id}` : `/lab/reports`"
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
                No critical lab values for your patients.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
