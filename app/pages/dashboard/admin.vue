<script setup lang="ts">
import { h } from 'vue'
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Users,
  Wallet,
  ShieldCheck,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { IconBox } from '@/components/ui/icon-box'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/vue-table'
import { BarChart } from '@/components/ui/charts/bar-chart'
import { LineChart } from '@/components/ui/charts/line-chart'
import { PieChart } from '@/components/ui/charts/pie-chart'
import { Sparkline } from '@/components/ui/charts/sparkline'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Admin Dashboard' })

// ─── Data helpers ────────────────────────────────────────────────────────────

function sameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate()
  )
}

function usd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function relativeTime(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(ms)
  if (abs < 60_000) return ms < 0 ? 'just now' : 'now'
  const m = Math.round(abs / 60_000)
  if (m < 60) return ms < 0 ? `${m}m ago` : `in ${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return ms < 0 ? `${h}h ago` : `in ${h}h`
  return new Date(iso).toLocaleDateString('en-IN')
}

// ─── Reactive store ──────────────────────────────────────────────────────────

const state = useMockState()

// ─── DataTable columns for the dashboard tables (no filters/pagination) ──
const icuColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'patientId',
    header: 'Patient',
    cell: ({ row }) =>
      h('span', { class: 'text-sm font-medium truncate max-w-[90px] block' }, patientName(row.original.patientId)),
  },
  {
    accessorKey: 'indication',
    header: 'Indication',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground max-w-[140px] truncate text-xs block' }, row.original.indication),
  },
  {
    accessorKey: 'intensivistUserId',
    header: 'Intensivist',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground text-xs' }, intensivistName(row.original.intensivistUserId)),
  },
  {
    accessorKey: 'initialSeverity',
    header: 'Severity',
    cell: ({ row }) =>
      h(Badge, { variant: severityVariant(row.original.initialSeverity), class: 'capitalize text-xs' },
        () => row.original.initialSeverity ?? '—'),
  },
]

const criticalAlertsColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'patientId',
    header: 'Patient',
    cell: ({ row }) =>
      h('span', { class: 'text-sm font-medium truncate max-w-[90px] block' }, patientName(row.original.patientId)),
  },
  {
    accessorKey: 'observationId',
    header: 'Observation',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground max-w-[140px] truncate text-xs block' }, observationDisplay(row.original.observationId)),
  },
  {
    accessorKey: 'triggeredAt',
    header: 'Triggered',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground text-xs' }, relativeTime(row.original.triggeredAt)),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(Button, {
        variant: 'outline',
        size: 'sm',
        class: 'text-xs',
        onClick: () => acknowledgeAlert(row.original.id),
      }, () => 'Acknowledge'),
  },
]

// ─── KPIs ────────────────────────────────────────────────────────────────────

const totalPatients = computed(() => state.patients.length)

const admittedNow = computed(
  () => state.bedAssignments.filter(b => !b.releasedAt).length,
)

const bedsAvailable = computed(
  () =>
    state.beds.filter(
      b =>
        b.status === 'available'
        && !state.bedAssignments.some(a => a.bedId === b.id && !a.releasedAt),
    ).length,
)

const bedsTotal = computed(() => state.beds.length)

const now = new Date()

const todayRevenueCents = computed(() =>
  state.payments
    .filter(p => sameDay(new Date(p.receivedAt), now))
    .reduce((s, p) => s + p.amountCents, 0),
)

const openCriticalAlerts = computed(
  () => state.criticalAlerts.filter(c => !c.acknowledgedAt).length,
)

const icuCensus = computed(
  () => state.icuAdmissions.filter(a => !a.dischargedAt).length,
)

// ─── Trend: last 7 days (UTC-day bucketing matches sameDay helper) ────────────

const last7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - (6 - i))
  return d
})

const dayLabels = last7Days.map(d =>
  d.toLocaleDateString('en-IN', { weekday: 'short' }),
)

// --- Slightly dynamic demo data for charts (changes on every refresh for more "live" demo feel) ---
// Base values are realistic for a mid-sized hospital. Small random variation added on each load.
const generateDynamicTrend = (baseValues: number[], variation = 0.16) => {
  return last7Days.map((_, i) => {
    const base = baseValues[i] ?? 0
    const randomFactor = 1 + (Math.random() - 0.5) * variation
    return {
      x: dayLabels[i],
      y: Math.round(base * randomFactor),
    }
  })
}

const generatePatientFlowTrend = (admissionBases: number[], dischargeBases: number[], variation = 0.16) => {
  return last7Days.map((_, i) => {
    const admissionBase = admissionBases[i] ?? 0
    const dischargeBase = dischargeBases[i] ?? 0

    const admissionFactor = 1 + (Math.random() - 0.5) * variation
    const dischargeFactor = 1 + (Math.random() - 0.5) * variation

    return {
      x: dayLabels[i],
      Admissions: Math.round(admissionBase * admissionFactor),
      Discharges: Math.round(dischargeBase * dischargeFactor),
    }
  })
}

const admissionsBase = [17, 14, 22, 18, 26, 20, 15]
const dischargesBase = [15, 13, 19, 16, 22, 18, 12]
const revenueBase = [76200, 64500, 89500, 82100, 103800, 87100, 70200]

// SSR renders the deterministic base values (variation 0) so the server and
// the client's first paint agree — Math.random() at setup ran on both sides
// and produced different numbers, causing a hydration mismatch. The small
// random "live demo" variation is applied client-side in onMounted instead.
const patientFlowTrend = ref(generatePatientFlowTrend(admissionsBase, dischargesBase, 0))
const revenueTrend = ref(generateDynamicTrend(revenueBase, 0))

onMounted(() => {
  patientFlowTrend.value = generatePatientFlowTrend(admissionsBase, dischargesBase)
  revenueTrend.value = generateDynamicTrend(revenueBase)
})

const flowSeries = computed(() => {
  return [
    {
      name: 'Admissions',
      type: 'bar',
      barMaxWidth: 28,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: patientFlowTrend.value.map(d => d.Admissions),
    },
    {
      name: 'Discharges',
      type: 'bar',
      barMaxWidth: 28,
      itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      data: patientFlowTrend.value.map(d => d.Discharges),
    },
  ]
})

const flowOption = computed(() => ({
  series: flowSeries.value,
}))

// ─── Sparkline background data for KPIs (demo) ───────────────────────────────
const patientsSparkline = [22, 24, 25, 27, 28, 29, 30]
const admittedSparkline = [5, 4, 6, 5, 4, 3, 3]
const revenueSparkline = [120, 95, 140, 110, 165, 130, 166]
const alertsSparkline = [7, 6, 8, 5, 4, 3, 2]

// ─── Additional charts data (for richer admin view) ──────────────────────────
const bedStatusDistribution = computed(() => {
  const counts: Record<string, number> = {}
  state.beds.forEach((bed) => {
    counts[bed.status] = (counts[bed.status] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
})

const departmentPatientDistribution = computed(() => {
  const counts: Record<string, number> = {}

  const activeAssignments = state.bedAssignments.filter(a => !a.releasedAt)

  activeAssignments.forEach((assignment) => {
    const unit = state.units.find(u => u.id === assignment.unitId)
    if (!unit) return
    const department = state.departments.find(d => d.id === unit.departmentId)
    if (!department) return
    counts[department.name] = (counts[department.name] || 0) + 1
  })

  return Object.entries(counts)
    .map(([name, value]) => ({ x: name, y: value }))
    .sort((a, b) => b.y - a.y)
    .slice(0, 7)
})

const surgeryStatusData = computed(() => {
  const counts: Record<string, number> = {}

  state.surgeryBookings.forEach((booking) => {
    const label = booking.status
      .replace('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    counts[label] = (counts[label] || 0) + 1
  })

  // Order for nicer visual flow
  const order = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']
  return order
    .filter(status => counts[status])
    .map(status => ({
      x: status,
      y: counts[status],
    }))
})

// ─── ICU census ──────────────────────────────────────────────────────────────

const activeICUAdmissions = computed(
  () => state.icuAdmissions.filter(a => !a.dischargedAt),
)

function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function intensivistName(userId?: number) {
  if (!userId) return '—'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}

function severityVariant(severity?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (severity === 'severe') return 'destructive'
  if (severity === 'moderate') return 'default'
  return 'secondary'
}

// ─── Critical alerts ─────────────────────────────────────────────────────────

const openAlerts = computed(
  () => state.criticalAlerts.filter(c => !c.acknowledgedAt),
)

function observationDisplay(observationId: string) {
  const obs = state.observations.find(o => o.id === observationId)
  if (!obs) return observationId
  const val = obs.valueNumeric !== undefined
    ? `${obs.valueNumeric} ${obs.unit ?? ''}`.trim()
    : (obs.valueString ?? '—')
  return `${obs.display}: ${val}`
}

function acknowledgeAlert(alertId: string) {
  const alert = state.criticalAlerts.find(a => a.id === alertId)
  if (!alert) return
  alert.acknowledgedAt = new Date().toISOString()
  alert.acknowledgedByUserId = state.staff[0]?.id ?? 1
}

// ─── Audit health ─────────────────────────────────────────────────────────────

const recentAuditCount = computed(() => state.auditEvents.length)
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Admin Dashboard"
        description="Hospital operations overview"
      />
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- KPI row -->
      <KpiGrid :columns="4">
        <!-- Patients registered -->
        <Card class="relative transition-shadow hover:shadow-md overflow-hidden">
          <Sparkline
            :data="patientsSparkline"
            color="#3b82f6"
            class="absolute bottom-2 left-0 right-0 opacity-40 pointer-events-none"
          />
          <CardContent class="pt-6 relative z-10">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Patients Registered
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ totalPatients }}
                </p>
              </div>
              <IconBox
                :icon="Users"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Admitted now -->
        <Card class="relative transition-shadow hover:shadow-md overflow-hidden">
          <Sparkline
            :data="admittedSparkline"
            color="#10b981"
            class="absolute bottom-2 left-0 right-0 opacity-40 pointer-events-none"
          />
          <CardContent class="pt-6 relative z-10">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Admitted Now
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ admittedNow }}
                </p>
                <p class="text-muted-foreground mt-0.5 text-xs">
                  {{ admittedNow }} / {{ bedsTotal }} beds occupied · {{ bedsAvailable }} available
                </p>
              </div>
              <IconBox
                :icon="BedDouble"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Today revenue -->
        <Card class="relative transition-shadow hover:shadow-md overflow-hidden">
          <Sparkline
            :data="revenueSparkline"
            color="#8b5cf6"
            class="absolute bottom-2 left-0 right-0 opacity-40 pointer-events-none"
          />
          <CardContent class="pt-6 relative z-10">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Today's Revenue
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ usd(todayRevenueCents*10) }}
                </p>
              </div>
              <IconBox
                :icon="Wallet"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Critical alerts -->
        <Card class="relative transition-shadow hover:shadow-md overflow-hidden">
          <Sparkline
            :data="alertsSparkline"
            color="#ef4444"
            class="absolute bottom-2 left-0 right-0 opacity-40 pointer-events-none"
          />
          <CardContent class="pt-6 relative z-10">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Open Critical Alerts
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ openCriticalAlerts }}
                  </p>
                  <Badge
                    v-if="openCriticalAlerts > 0"
                    variant="destructive"
                    class="text-xs"
                  >
                    Action needed
                  </Badge>
                </div>
              </div>
              <IconBox
                :icon="AlertTriangle"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>
      </KpiGrid>

      <!-- Trend charts row -->
      <div class="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Admissions Trend"
          description="Admissions vs Discharges over the last 7 days"
        >
          <BarChart
            :data="patientFlowTrend"
            x-field="x"
            y-field="['Admissions', 'Discharges']"
            :height="240"
            :option="flowOption"
          />
          <div class="mt-2 text-right">
            <span class="text-[9px] text-muted-foreground/50">Demo data • Refreshes on reload</span>
          </div>
        </SectionCard>

        <SectionCard
          title="Revenue Trend"
          description="Daily revenue over the last 7 days"
        >
          <LineChart
            :data="revenueTrend"
            x-field="x"
            y-field="y"
            :height="240"
            :option="{
              tooltip: {
                valueFormatter: (val: number) => '$' + Number(val).toLocaleString('en-US'),
              },
            }"
          />
          <div class="mt-2 text-right">
            <span class="text-[9px] text-muted-foreground/50">Demo data • Refreshes on reload</span>
          </div>
        </SectionCard>
      </div>

      <!-- Additional Insights row -->
      <div class="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Current Inpatients by Department"
          description="Active inpatients grouped by department"
          content-class="p-2"
        >
          <BarChart
            :data="departmentPatientDistribution"
            x-field="x"
            y-field="y"
            :height="170"
            :option="{
              tooltip: { valueFormatter: (val: number) => val + ' patients' },
            }"
          />
          <div class="mt-1 text-right">
            <span class="text-[9px] text-muted-foreground/50">Demo data</span>
          </div>
        </SectionCard>

        <SectionCard
          title="Bed Status Distribution"
          description="Current bed inventory"
          content-class="p-2"
        >
          <PieChart
            :data="bedStatusDistribution"
            name-field="name"
            value-field="value"
            :height="170"
          />
          <div class="mt-1 text-right">
            <span class="text-[9px] text-muted-foreground/50">Demo data</span>
          </div>
        </SectionCard>

        <SectionCard
          title="Surgery Status Overview"
          description="Current operating theatre cases"
          content-class="p-2"
        >
          <BarChart
            :data="surgeryStatusData"
            x-field="x"
            y-field="y"
            :height="170"
            :option="{
              tooltip: { valueFormatter: (val: number) => val + ' cases' },
            }"
          />
          <div class="mt-1 text-right">
            <span class="text-[9px] text-muted-foreground/50">Demo data</span>
          </div>
        </SectionCard>
      </div>

      <!-- Operations row -->
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- ICU census -->
        <SectionCard title="ICU Census" class="transition-shadow hover:shadow-sm" content-class="p-0">
          <template #header-action>
            <Badge variant="outline">
              {{ icuCensus }} active
            </Badge>
          </template>

          <DataTable
            :columns="icuColumns"
            :data="activeICUAdmissions"
            hide-toolbar
            :enable-pagination="false"
            borderless="full"
            density="compact"
          />
        </SectionCard>

        <!-- Critical alerts -->
        <SectionCard title="Critical Alerts" class="transition-shadow hover:shadow-sm" content-class="p-0">
          <template #header-action>
            <Badge
              :variant="openAlerts.length > 0 ? 'destructive' : 'secondary'"
            >
              {{ openAlerts.length }} open
            </Badge>
          </template>

          <DataTable
            :columns="criticalAlertsColumns"
            :data="openAlerts"
            hide-toolbar
            :enable-pagination="false"
            borderless="full"
            density="compact"
          />
        </SectionCard>
      </div>

      <!-- System health -->
      <SectionCard
        title="System Health"
        description="Audit trail and append-only event log"
        class="transition-shadow hover:shadow-sm"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div class="flex items-center gap-2">
            <Activity class="text-muted-foreground size-4" />
            <span class="text-sm">
              Recent audit events:
              <span class="font-semibold">{{ recentAuditCount }}</span>
            </span>
          </div>

          <Separator
            orientation="vertical"
            class="hidden h-4 sm:block"
          />

          <div class="flex items-center gap-2">
            <ShieldCheck class="size-4 text-primary" />
            <span class="text-sm">
              Append-only chain: <span class="font-semibold text-primary">verified ✓</span>
            </span>
          </div>

          <div class="sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
            >
              Open audit log
            </Button>
          </div>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
