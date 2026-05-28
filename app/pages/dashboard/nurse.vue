<script setup lang="ts">
import {
  UserCheck,
  ClipboardList,
  Pill,
  LogOut,
  LayoutGrid,
  Clock,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Nurse Dashboard' })

// ── helpers ─────────────────────────────────────────────────────────────────
function relTime(iso: string | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function hoursAgo(iso: string | undefined): number {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / 3_600_000
}

// ── shift from current time ──────────────────────────────────────────────────
const now = new Date()
const currentHour = now.getHours()
const shiftName = currentHour >= 6 && currentHour < 14
  ? 'Morning'
  : currentHour >= 14 && currentHour < 22
    ? 'Afternoon'
    : 'Night'

// ── mock state ──────────────────────────────────────────────────────────────
const state = useMockState()

// ── nurse identity ───────────────────────────────────────────────────────────
const me = computed(() => state.staff.find(s => s.role === 'nurse')!)
const meInitials = computed(() => {
  if (!me.value) return 'N'
  return me.value.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

// ── ward: the first IPD unit that has an active bed assignment ───────────────
// Karen Walsh (id 104) is the first nurse. Assign her to Medical Ward A.
const myUnitId = 'unit-med-a'
const myUnit = computed(() => state.units.find(u => u.id === myUnitId))
const wardName = computed(() => myUnit.value?.name ?? 'Medical Ward A')

// ── patients on my ward (active bed assignments for my unit) ─────────────────
const wardBedIds = computed(() =>
  state.beds.filter(b => b.unitId === myUnitId).map(b => b.id),
)
const totalBeds = computed(() => wardBedIds.value.length)
const activeAssignments = computed(() =>
  state.bedAssignments.filter(
    ba => !ba.releasedAt && wardBedIds.value.includes(ba.bedId),
  ),
)
const patientCount = computed(() => activeAssignments.value.length)

// ── my patients enriched ─────────────────────────────────────────────────────
interface WardRow {
  encounterId: string
  bedLabel: string
  patient: { id: string, mrn: string, name: string }
  admittedAt: string
  lastVitalsAt: string | undefined
  painScore: number | undefined
}

const wardRows = computed<WardRow[]>(() =>
  activeAssignments.value.map((ba) => {
    const encounter = state.encounters.find(e => e.id === ba.encounterId)
    const patient = state.patients.find(p => p.id === ba.patientId)
    const bed = state.beds.find(b => b.id === ba.bedId)

    // latest nursing entry for this encounter
    const entries = state.nursingEntries
      .filter(ne => ne.encounterId === ba.encounterId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    const lastEntry = entries[0]

    return {
      encounterId: ba.encounterId,
      bedLabel: bed?.label ?? ba.bedId,
      patient: {
        id: patient?.id ?? ba.patientId,
        mrn: patient?.mrn ?? '',
        name: patient ? `${patient.givenName} ${patient.familyName}` : ba.patientId,
      },
      admittedAt: encounter?.admissionAt ?? ba.assignedAt,
      lastVitalsAt: lastEntry?.recordedAt,
      painScore: lastEntry?.painScore,
    }
  }),
)

// ── KPI: vitals overdue (last nursing entry > 4h ago for in_progress inpatient) ──
const vitalsOverdue = computed(() => {
  const inpatientInProgress = state.encounters.filter(
    e => e.status === 'in_progress' && (e.type === 'inpatient' || e.type === 'emergency' || e.type === 'daycare'),
  )
  return inpatientInProgress.filter((enc) => {
    const entries = state.nursingEntries
      .filter(ne => ne.encounterId === enc.id)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    const last = entries[0]
    return hoursAgo(last?.recordedAt) > 4
  }).length
})

// ── KPI: MAR doses due — active rx in inpatient encounters with no MAR in last 4h ──
const marDueCount = computed(() => {
  const inpatientEncIds = new Set(
    state.encounters
      .filter(e => e.status === 'in_progress' && (e.type === 'inpatient' || e.type === 'emergency' || e.type === 'daycare'))
      .map(e => e.id),
  )
  const activeRx = state.prescriptions.filter(
    rx => rx.status === 'active' && inpatientEncIds.has(rx.encounterId),
  )
  return activeRx.filter((rx) => {
    const admins = state.medicationAdministrations
      .filter(m => m.medicationRequestId === rx.id)
      .sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime())
    const last = admins[0]
    return hoursAgo(last?.administeredAt) > 4
  }).length
})

// ── KPI: discharge ready — encounters with a draft discharge summary ─────────
const dischargeReadyCount = computed(() =>
  state.dischargeSummaries.filter(ds => ds.status === 'draft').length,
)

// ── MAR due rows ─────────────────────────────────────────────────────────────
interface MarRow {
  encounterId: string
  patientName: string
  drugDisplay: string
  dose: string
  lastGiven: string | undefined
}

const marDueRows = computed<MarRow[]>(() => {
  const inpatientEncIds = new Set(
    state.encounters
      .filter(e => e.status === 'in_progress' && (e.type === 'inpatient' || e.type === 'emergency' || e.type === 'daycare'))
      .map(e => e.id),
  )
  const activeRx = state.prescriptions.filter(
    rx => rx.status === 'active' && inpatientEncIds.has(rx.encounterId),
  )
  return activeRx
    .map((rx) => {
      const admins = state.medicationAdministrations
        .filter(m => m.medicationRequestId === rx.id)
        .sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime())
      const last = admins[0]
      if (hoursAgo(last?.administeredAt) <= 3) return null
      const patient = state.patients.find(p => p.id === rx.patientId)
      const drug = state.drugs.find(d => d.id === rx.drugId)
      return {
        encounterId: rx.encounterId,
        patientName: patient ? `${patient.givenName} ${patient.familyName}` : rx.patientId,
        drugDisplay: drug?.display ?? rx.drugId,
        dose: `${rx.doseValue} ${rx.doseUnit} ${rx.route}`,
        lastGiven: last?.administeredAt,
      } satisfies MarRow
    })
    .filter((r): r is MarRow => r !== null)
})

// ── recent nursing entries (latest 10 across ward encounters) ────────────────
interface NursingRow {
  id: string
  encounterId: string
  recordedAt: string
  patientName: string
  vitals: string
  painScore: number | undefined
  signed: boolean
}

const wardEncounterIds = computed(() =>
  new Set(activeAssignments.value.map(ba => ba.encounterId)),
)

const recentNursingRows = computed<NursingRow[]>(() => {
  return state.nursingEntries
    .filter(ne => wardEncounterIds.value.has(ne.encounterId))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 10)
    .map((ne) => {
      const patient = state.patients.find(p => p.id === ne.patientId)
      const v = ne.vitals ?? {}
      const parts: string[] = []
      if (v.bpSys != null && v.bpDia != null) parts.push(`${v.bpSys}/${v.bpDia}`)
      if (v.hr != null) parts.push(`HR ${v.hr}`)
      if (v.t != null) parts.push(`${v.t}°C`)
      if (v.spo2 != null) parts.push(`SpO₂ ${v.spo2}%`)
      return {
        id: ne.id,
        encounterId: ne.encounterId,
        recordedAt: ne.recordedAt,
        patientName: patient ? `${patient.givenName} ${patient.familyName}` : ne.patientId,
        vitals: parts.join(' · ') || '—',
        painScore: ne.painScore,
        signed: !!ne.signedAt,
      }
    })
})

function signEntry(entryId: string) {
  const entry = state.nursingEntries.find(ne => ne.id === entryId)
  if (entry && !entry.signedAt) {
    entry.signedAt = new Date().toISOString()
  }
}

// ── pain score badge variant ─────────────────────────────────────────────────
function painVariant(score: number | undefined): 'outline' | 'secondary' | 'destructive' {
  if (score == null) return 'outline'
  if (score <= 3) return 'outline'
  if (score <= 6) return 'secondary'
  return 'destructive'
}

// ── first in_progress encounter for quick actions ────────────────────────────
const firstActiveEncounter = computed(() =>
  state.encounters.find(
    e => e.status === 'in_progress' && (e.type === 'inpatient' || e.type === 'emergency'),
  ),
)
</script>

<template>
  <Page>
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <PageHeader>
      <div class="flex items-center gap-3">
        <Avatar class="size-10">
          <AvatarFallback class="text-sm font-semibold">
            {{ meInitials }}
          </AvatarFallback>
        </Avatar>
        <PageHeaderHeading
          :title="`Good ${shiftName === 'Night' ? 'evening' : shiftName === 'Afternoon' ? 'afternoon' : 'morning'}, ${me?.name ?? 'Nurse'}`"
          :description="`${shiftName} shift · ${wardName}`"
        />
      </div>
    </PageHeader>

    <PageBody>
      <!-- ── KPI row ─────────────────────────────────────────────────────── -->
      <KpiGrid :columns="4">
        <DashboardKpiTile
          label="Patients on Ward"
          :value="`${patientCount} / ${totalBeds}`"
          :icon="UserCheck"
        >
          <Progress
            :model-value="totalBeds > 0 ? (patientCount / totalBeds) * 100 : 0"
            class="mt-3 h-1.5"
          />
        </DashboardKpiTile>

        <DashboardKpiTile
          label="Vitals Overdue"
          :value="String(vitalsOverdue)"
          :icon="Clock"
          :delta="vitalsOverdue > 0 ? `${vitalsOverdue} >4h` : undefined"
          :delta-tone="vitalsOverdue > 0 ? 'negative' : undefined"
        />

        <DashboardKpiTile
          label="MAR Doses Due"
          :value="String(marDueCount)"
          :icon="Pill"
          :delta="marDueCount > 0 ? `${marDueCount} pending` : undefined"
          :delta-tone="marDueCount > 0 ? 'negative' : undefined"
        />

        <DashboardKpiTile
          label="Discharge Ready"
          :value="String(dischargeReadyCount)"
          :icon="LogOut"
        />
      </KpiGrid>

      <!-- ── Ward roster ─────────────────────────────────────────────────── -->
      <SectionCard
        title="Ward Roster"
        description="Active patients on your ward today"
        class="transition-shadow hover:shadow-sm"
      >
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bed</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Admitted</TableHead>
                <TableHead>Last Vitals</TableHead>
                <TableHead>Pain</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="row in wardRows"
                :key="row.encounterId"
              >
                <TableCell class="font-mono text-xs">
                  {{ row.bedLabel }}
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Avatar class="size-7">
                      <AvatarFallback class="text-[10px]">
                        {{ row.patient.name.split(' ').map(w => w[0]).join('').slice(0, 2) }}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p class="text-sm font-medium leading-tight">
                        {{ row.patient.name }}
                      </p>
                      <p class="text-muted-foreground text-xs">
                        {{ row.patient.mrn }}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ relTime(row.admittedAt) }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ relTime(row.lastVitalsAt) }}
                </TableCell>
                <TableCell>
                  <Badge
                    v-if="row.painScore != null"
                    :variant="painVariant(row.painScore)"
                    class="tabular-nums"
                  >
                    {{ row.painScore }}/10
                  </Badge>
                  <span
                    v-else
                    class="text-muted-foreground text-xs"
                  >—</span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    as-child
                  >
                    <NuxtLink :to="`/encounters/${row.encounterId}`">
                      Open chart
                    </NuxtLink>
                  </Button>
                </TableCell>
              </TableRow>
              <TableEmpty v-if="wardRows.length === 0">
                No active patients on your ward.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── MAR due ─────────────────────────────────────────────────────── -->
      <SectionCard
        title="Medications Due"
        description="Active inpatient orders not given in the last 3 hours"
        class="transition-shadow hover:shadow-sm"
      >
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Last Given</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="row in marDueRows"
                :key="`${row.encounterId}-${row.drugDisplay}`"
              >
                <TableCell class="text-sm font-medium">
                  {{ row.patientName }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ row.drugDisplay }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ row.dose }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ row.lastGiven ? relTime(row.lastGiven) : '—' }}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    as-child
                  >
                    <NuxtLink :to="`/mar/${row.encounterId}`">
                      Administer
                    </NuxtLink>
                  </Button>
                </TableCell>
              </TableRow>
              <TableEmpty v-if="marDueRows.length === 0">
                No medications overdue.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Recent nursing entries ──────────────────────────────────────── -->
      <SectionCard
        title="Recent Nursing Entries"
        description="Latest 10 charted entries across your ward"
        class="transition-shadow hover:shadow-sm"
      >
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Vitals</TableHead>
                <TableHead>Pain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="row in recentNursingRows"
                :key="row.id"
              >
                <TableCell class="text-muted-foreground text-sm">
                  {{ relTime(row.recordedAt) }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ row.patientName }}
                </TableCell>
                <TableCell class="text-muted-foreground font-mono text-xs">
                  {{ row.vitals }}
                </TableCell>
                <TableCell>
                  <Badge
                    v-if="row.painScore != null"
                    :variant="painVariant(row.painScore)"
                    class="tabular-nums"
                  >
                    {{ row.painScore }}
                  </Badge>
                  <span
                    v-else
                    class="text-muted-foreground text-xs"
                  >—</span>
                </TableCell>
                <TableCell>
                  <Badge :variant="row.signed ? 'outline' : 'secondary'">
                    {{ row.signed ? 'Signed' : 'Draft' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    v-if="!row.signed"
                    variant="outline"
                    size="sm"
                    @click="signEntry(row.id)"
                  >
                    Sign
                  </Button>
                </TableCell>
              </TableRow>
              <TableEmpty v-if="recentNursingRows.length === 0">
                No nursing entries for your ward.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Quick actions ───────────────────────────────────────────────── -->
      <div class="grid grid-cols-3 gap-4">
        <!-- Nursing chart -->
        <Card class="hover:bg-muted/40 cursor-pointer transition-colors">
          <NuxtLink
            :to="firstActiveEncounter ? `/nursing-chart/${firstActiveEncounter.id}` : '/nursing-chart'"
            class="block"
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-3">
                <IconBox
                  :icon="ClipboardList"
                  variant="primary"
                  size="lg"
                />
                <div>
                  <CardTitle class="text-sm font-semibold">
                    Nursing Chart
                  </CardTitle>
                  <CardDescription class="text-xs">
                    Record vitals &amp; observations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </NuxtLink>
        </Card>

        <!-- MAR -->
        <Card class="hover:bg-muted/40 cursor-pointer transition-colors">
          <NuxtLink
            :to="firstActiveEncounter ? `/mar/${firstActiveEncounter.id}` : '/mar'"
            class="block"
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-3">
                <IconBox
                  :icon="Pill"
                  variant="primary"
                  size="lg"
                />
                <div>
                  <CardTitle class="text-sm font-semibold">
                    Medication Admin
                  </CardTitle>
                  <CardDescription class="text-xs">
                    Record &amp; review MAR entries
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </NuxtLink>
        </Card>

        <!-- Ward overview -->
        <Card class="hover:bg-muted/40 cursor-pointer transition-colors">
          <NuxtLink
            to="/dashboard"
            class="block"
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-3">
                <IconBox
                  :icon="LayoutGrid"
                  variant="muted"
                  size="lg"
                />
                <div>
                  <CardTitle class="text-sm font-semibold">
                    Ward Overview
                  </CardTitle>
                  <CardDescription class="text-xs">
                    Bed map &amp; occupancy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </NuxtLink>
        </Card>
      </div>
    </PageBody>
  </Page>
</template>
