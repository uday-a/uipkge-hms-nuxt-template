<script setup lang="ts">
import {
  AlertTriangle,
  Beaker,
  Clock,
  TestTubeDiagonal,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { IconBox } from '@/components/ui/icon-box'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BarChart } from '@/components/ui/charts/bar-chart'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Lab Dashboard' })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  )
}

function relativeTime(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(ms)
  if (abs < 60_000) return 'just now'
  const m = Math.round(abs / 60_000)
  if (m < 60) return ms < 0 ? `${m}m ago` : `in ${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return ms < 0 ? `${h}h ago` : `in ${h}h`
  return new Date(iso).toLocaleDateString()
}

// ─── Reactive store ───────────────────────────────────────────────────────────

const state = useMockState()

// ─── Current user (first lab_tech in staff) ───────────────────────────────────

const me = computed(() => state.staff.find(s => s.role === 'lab_tech'))
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

// ─── Patient name helper ──────────────────────────────────────────────────────

function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

// ─── KPI: Awaiting sample collection ─────────────────────────────────────────
// Active lab service_requests where no lab_sample has a collectedAt

const awaitingSample = computed(() =>
  state.labOrders.filter((order) => {
    if (order.category !== 'lab' || order.status !== 'active') return false
    const sample = state.labSamples.find(s => s.serviceRequestId === order.id)
    return !sample || !sample.collectedAt
  }),
)

// ─── KPI: Awaiting result entry ───────────────────────────────────────────────
// Active lab orders with sample collected but no diagnostic_report yet

const awaitingResult = computed(() =>
  state.labOrders.filter((order) => {
    if (order.category !== 'lab' || order.status !== 'active') return false
    const sample = state.labSamples.find(s => s.serviceRequestId === order.id)
    if (!sample?.collectedAt) return false
    return !state.diagnosticReports.some(r => r.serviceRequestId === order.id)
  }),
)

// ─── KPI: Reports to sign ─────────────────────────────────────────────────────
// Lab diagnostic_reports with status='draft'

const reportsToSign = computed(() =>
  state.diagnosticReports.filter(r => r.category === 'lab' && r.status === 'draft'),
)

// ─── KPI: Critical values today ──────────────────────────────────────────────

const now = new Date()

const criticalToday = computed(() =>
  state.criticalAlerts.filter(a => sameDay(new Date(a.triggeredAt), now)),
)

// ─── Worklist: Awaiting collection ───────────────────────────────────────────

const collectionWorklist = computed(() =>
  awaitingSample.value.map((order) => {
    const sample = state.labSamples.find(s => s.serviceRequestId === order.id)
    return { order, sample }
  }),
)

// ─── Worklist: Awaiting result entry ─────────────────────────────────────────

const resultWorklist = computed(() =>
  awaitingResult.value.map((order) => {
    const sample = state.labSamples.find(s => s.serviceRequestId === order.id)!
    return { order, sample }
  }),
)

// ─── Worklist: Reports to sign ────────────────────────────────────────────────

interface ReportSignRow {
  report: typeof state.diagnosticReports[number]
  order: typeof state.labOrders[number] | undefined
  interpretation: string
}

const signWorklist = computed<ReportSignRow[]>(() =>
  reportsToSign.value.map((report) => {
    const order = state.labOrders.find(o => o.id === report.serviceRequestId)
    // Derive interpretation from first observation in the report
    const obs = state.observations.find(o => report.observationIds.includes(o.id))
    const interpretation = obs?.interpretation ?? 'normal'
    return { report, order, interpretation }
  }),
)

// ─── Critical values table ────────────────────────────────────────────────────

interface CriticalRow {
  alert: typeof state.criticalAlerts[number]
  obs: typeof state.observations[number] | undefined
  order: typeof state.labOrders[number] | undefined
}

const criticalRows = computed<CriticalRow[]>(() =>
  criticalToday.value.map((alert) => {
    const obs = state.observations.find(o => o.id === alert.observationId)
    const order = obs?.serviceRequestId
      ? state.labOrders.find(o => o.id === obs.serviceRequestId)
      : undefined
    return { alert, obs, order }
  }),
)

// ─── Volume by hour today ─────────────────────────────────────────────────────
// Count lab observations whose effectiveAt falls today, bucketed by hour

const hourlyVolume = computed(() => {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ x: `${String(h).padStart(2, '0')}:00`, y: 0 }))
  state.observations.forEach((obs) => {
    if (!obs.serviceRequestId) return // skip vitals
    const d = new Date(obs.effectiveAt)
    if (!sameDay(d, now)) return
    buckets[d.getHours()]!.y += 1
  })
  return buckets
})

// ─── Badge helpers ────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

function priorityVariant(priority: string): BadgeVariant {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'warning'
  return 'secondary'
}

function interpretationVariant(interp: string): BadgeVariant {
  if (interp === 'critical_high' || interp === 'critical_low') return 'destructive'
  if (interp === 'high' || interp === 'low') return 'warning'
  if (interp === 'abnormal') return 'warning'
  if (interp === 'normal') return 'success'
  return 'secondary'
}

function interpretationLabel(interp: string) {
  return interp.replace('_', ' ')
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        :title="`${greeting}, ${me?.name ?? 'Lab Tech'}`"
        description="Lab operations"
      />
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- KPI row -->
      <KpiGrid :columns="4">
        <!-- Awaiting sample -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Awaiting Sample
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ awaitingSample.length }}
                </p>
                <p class="text-muted-foreground mt-0.5 text-xs">
                  Pending collection
                </p>
              </div>
              <IconBox
                :icon="TestTubeDiagonal"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Awaiting result -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Awaiting Result
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ awaitingResult.length }}
                </p>
                <p class="text-muted-foreground mt-0.5 text-xs">
                  Sample collected, result pending
                </p>
              </div>
              <IconBox
                :icon="Beaker"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Reports to sign -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Reports to Sign
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ reportsToSign.length }}
                  </p>
                  <Badge
                    v-if="reportsToSign.length > 0"
                    variant="warning"
                    class="text-xs"
                  >
                    Draft
                  </Badge>
                </div>
              </div>
              <IconBox
                :icon="Clock"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Critical values today -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Critical Values Today
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ criticalToday.length }}
                  </p>
                  <Badge
                    v-if="criticalToday.length > 0"
                    variant="destructive"
                    class="text-xs"
                  >
                    Alert
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

      <!-- Today's worklist — 3-column grid -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Awaiting collection -->
        <SectionCard title="Awaiting Collection" class="transition-shadow hover:shadow-sm">
          <template #header-action>
            <Badge variant="outline">
              {{ collectionWorklist.length }}
            </Badge>
          </template>

          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="collectionWorklist.length === 0">
                  <div class="py-6 text-center text-muted-foreground">
                    <p class="text-sm">
                      No samples awaiting collection.
                    </p>
                  </div>
                </TableEmpty>
                <TableRow
                  v-for="row in collectionWorklist"
                  :key="row.order.id"
                >
                  <TableCell class="text-sm font-medium">
                    {{ patientName(row.order.patientId) }}
                  </TableCell>
                  <TableCell class="text-muted-foreground max-w-[120px] truncate text-xs">
                    {{ row.order.display }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="priorityVariant(row.order.priority)"
                      class="capitalize text-xs"
                    >
                      {{ row.order.priority }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    {{ relativeTime(row.order.createdAt) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      class="text-xs"
                      as-child
                    >
                      <NuxtLink :to="`/lab/orders/${row.order.id}`">
                        Collect
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- Awaiting results -->
        <SectionCard title="Awaiting Results" class="transition-shadow hover:shadow-sm">
          <template #header-action>
            <Badge variant="outline">
              {{ resultWorklist.length }}
            </Badge>
          </template>

          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="resultWorklist.length === 0">
                  No samples awaiting result entry
                </TableEmpty>
                <TableRow
                  v-for="row in resultWorklist"
                  :key="row.order.id"
                >
                  <TableCell class="text-sm font-medium">
                    {{ patientName(row.order.patientId) }}
                  </TableCell>
                  <TableCell class="text-muted-foreground max-w-[100px] truncate text-xs">
                    {{ row.order.display }}
                  </TableCell>
                  <TableCell class="font-mono text-xs">
                    {{ row.sample?.barcode ?? '—' }}
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    {{ row.sample?.receivedAt ? relativeTime(row.sample.receivedAt) : (row.sample?.collectedAt ? relativeTime(row.sample.collectedAt) : '—') }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      class="text-xs"
                      as-child
                    >
                      <NuxtLink :to="`/lab/orders/${row.order.id}`">
                        Enter result
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- Reports to sign -->
        <SectionCard title="Reports to Sign" class="transition-shadow hover:shadow-sm">
          <template #header-action>
            <Badge
              :variant="reportsToSign.length > 0 ? 'warning' : 'outline'"
            >
              {{ reportsToSign.length }}
            </Badge>
          </template>

          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="signWorklist.length === 0">
                  No reports awaiting sign-off
                </TableEmpty>
                <TableRow
                  v-for="row in signWorklist"
                  :key="row.report.id"
                >
                  <TableCell class="text-sm font-medium">
                    {{ patientName(row.report.patientId) }}
                  </TableCell>
                  <TableCell class="text-muted-foreground max-w-[100px] truncate text-xs">
                    {{ row.report.display }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="interpretationVariant(row.interpretation)"
                      class="capitalize text-xs"
                    >
                      {{ interpretationLabel(row.interpretation) }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      class="text-xs"
                      as-child
                    >
                      <NuxtLink :to="`/lab/orders/${row.order?.id ?? row.report.serviceRequestId}`">
                        Open
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>

      <!-- Critical values reported today -->
      <SectionCard
        title="Critical Values Reported Today"
        description="Observations flagged critical_high or critical_low in the past 24 hours"
      >
        <template #header-action>
          <Badge :variant="criticalToday.length > 0 ? 'destructive' : 'secondary'">
            {{ criticalToday.length }} today
          </Badge>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Interpretation</TableHead>
                <TableHead>Acknowledged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="criticalRows.length === 0">
                No critical values reported today
              </TableEmpty>
              <TableRow
                v-for="row in criticalRows"
                :key="row.alert.id"
              >
                <TableCell class="text-muted-foreground text-xs">
                  {{ relativeTime(row.alert.triggeredAt) }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ patientName(row.alert.patientId) }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ row.obs?.display ?? '—' }}
                </TableCell>
                <TableCell class="text-sm font-semibold">
                  {{ row.obs?.valueNumeric !== undefined ? `${row.obs.valueNumeric} ${row.obs.unit ?? ''}`.trim() : (row.obs?.valueString ?? '—') }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="interpretationVariant(row.obs?.interpretation ?? 'normal')"
                    class="capitalize text-xs"
                  >
                    {{ interpretationLabel(row.obs?.interpretation ?? '—') }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="row.alert.acknowledgedAt ? 'success' : 'outline'"
                    class="text-xs"
                  >
                    {{ row.alert.acknowledgedAt ? 'Yes' : 'No' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Volume by hour today -->
      <SectionCard
        title="Volume by Hour Today"
        description="Lab observation count by hour (effectiveAt)"
      >
        <BarChart
          :data="hourlyVolume"
          x-field="x"
          y-field="y"
          :height="240"
        />
      </SectionCard>
    </PageBody>
  </Page>
</template>
