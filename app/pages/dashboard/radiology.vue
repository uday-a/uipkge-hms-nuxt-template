<script setup lang="ts">
import { Scan, Image, FileText, Clock } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { SectionCard } from '@/components/ui/section-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import DashboardKpiTile from '@/components/blocks/DashboardKpiTile.vue'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Radiology Dashboard' })

const state = useMockState()

// --- Me: first staff with role === 'radiologist'
const me = computed(() => state.staff.find(s => s.role === 'radiologist')!)

// --- Today boundaries (date-only comparison)
const todayStr = computed(() => new Date().toISOString().slice(0, 10))

function isToday(iso: string | undefined): boolean {
  if (!iso) return false
  return iso.slice(0, 10) === todayStr.value
}

// --- KPI 1: Studies awaiting report
// imaging_studies with status='completed' that have no final/draft radiology diagnostic report
const studiesAwaitingReport = computed(() =>
  state.imagingStudies.filter((img) => {
    if (img.status !== 'completed') return false
    const hasReport = state.diagnosticReports.some(
      r => r.category === 'radiology' && r.serviceRequestId === img.serviceRequestId,
    )
    return !hasReport
  }),
)

// --- KPI 2: Studies in progress
const studiesInProgress = computed(() =>
  state.imagingStudies.filter(s => s.status === 'in_progress'),
)

// --- KPI 3: Reports signed today (radiology category, final, signed today)
const reportsSignedToday = computed(() =>
  state.diagnosticReports.filter(
    r => r.category === 'radiology' && r.status === 'final' && isToday(r.issuedAt),
  ),
)

// --- KPI 4: Total studies today (any study that completed or started today)
const studiesToday = computed(() =>
  state.imagingStudies.filter(
    img => isToday(img.completedAt) || isToday(img.startedAt) || isToday(img.scheduledAt),
  ),
)

// --- Worklist 1: Orders without an imaging study yet (awaiting study creation)
const ordersAwaitingStudy = computed(() =>
  state.radiologyOrders.filter((ord) => {
    const hasStudy = state.imagingStudies.some(s => s.serviceRequestId === ord.id)
    return !hasStudy && ord.status === 'active'
  }),
)

// --- Worklist 2: In-progress imaging studies
const worklistInProgress = computed(() => studiesInProgress.value)

// --- Worklist 3: Completed studies awaiting report
const worklistAwaitingReport = computed(() => studiesAwaitingReport.value)

// --- Recent signed radiology reports (last 8 final radiology reports)
const recentReports = computed(() => {
  return state.diagnosticReports
    .filter(r => r.category === 'radiology' && r.status === 'final')
    .sort((a, b) => {
      const tA = a.issuedAt ?? a.effectiveAt
      const tB = b.issuedAt ?? b.effectiveAt
      return tB.localeCompare(tA)
    })
    .slice(0, 8)
})

// --- Modality distribution (from all imaging studies — today)
const modalityDistribution = computed(() => {
  const counts: Record<string, number> = {}
  for (const img of studiesToday.value) {
    counts[img.modality.toUpperCase()] = (counts[img.modality.toUpperCase()] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([modality, count]) => ({ modality, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
})

// --- Helpers

function patientName(patientId: string): string {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function orderForStudy(study: typeof state.imagingStudies[number]) {
  return state.radiologyOrders.find(o => o.id === study.serviceRequestId)
}

function studyForOrder(orderId: string) {
  return state.imagingStudies.find(s => s.serviceRequestId === orderId)
}

// Relative time — e.g. "2 h ago", "just now"
function relativeTime(iso: string | undefined): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// Modality badge variant
function modalityVariant(
  modality: string,
): 'default' | 'secondary' | 'outline' {
  const m = modality.toLowerCase()
  if (m === 'ct' || m === 'mri') return 'secondary'
  return 'outline'
}

// Priority badge variant
function priorityVariant(
  priority: string,
): 'default' | 'destructive' | 'warning' | 'secondary' | 'outline' {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'warning'
  return 'outline'
}

// Greeting
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <Page>
    <!-- 1. Header -->
    <PageHeader>
      <PageHeaderHeading
        :title="`${greeting}, ${me?.name ?? 'Dr.'}`"
        description="Radiology reading room"
      />
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- 2. KPI Row -->
      <KpiGrid :columns="4">
        <DashboardKpiTile
          label="Awaiting Report"
          :value="String(studiesAwaitingReport.length)"
          :icon="FileText"
        />
        <DashboardKpiTile
          label="In Progress"
          :value="String(studiesInProgress.length)"
          :icon="Scan"
        />
        <DashboardKpiTile
          label="Reports Signed Today"
          :value="String(reportsSignedToday.length)"
          :icon="Image"
        />
        <DashboardKpiTile
          label="Total Today"
          :value="String(studiesToday.length)"
          :icon="Clock"
        />
      </KpiGrid>

      <!-- 3. Worklist grid -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Awaiting study -->
        <SectionCard
          title="Awaiting Study"
          :description="`${ordersAwaitingStudy.length} order(s)`"
          class="transition-shadow hover:shadow-sm"
        >
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty
                  v-if="ordersAwaitingStudy.length === 0"
                  :colspan="5"
                >
                  No orders awaiting study
                </TableEmpty>
                <TableRow
                  v-for="ord in ordersAwaitingStudy"
                  :key="ord.id"
                >
                  <TableCell class="font-medium">
                    {{ patientName(ord.patientId) }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="modalityVariant(ord.modality ?? '')">
                      {{ (ord.modality ?? '—').toUpperCase() }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ ord.bodyRegion ?? '—' }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="priorityVariant(ord.priority)">
                      {{ ord.priority }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/radiology/orders/${ord.id}`">Open</NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- In progress -->
        <SectionCard
          title="In Progress"
          :description="`${worklistInProgress.length} active`"
          class="transition-shadow hover:shadow-sm"
        >
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty
                  v-if="worklistInProgress.length === 0"
                  :colspan="5"
                >
                  No studies in progress
                </TableEmpty>
                <TableRow
                  v-for="img in worklistInProgress"
                  :key="img.id"
                >
                  <TableCell class="font-medium">
                    {{ patientName(img.patientId) }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="modalityVariant(img.modality)">
                      {{ img.modality.toUpperCase() }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ img.bodyRegion }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="priorityVariant(orderForStudy(img)?.priority ?? 'routine')">
                      {{ orderForStudy(img)?.priority ?? 'routine' }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/radiology/orders/${img.serviceRequestId}`">Open</NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- Awaiting report -->
        <SectionCard
          title="Awaiting Report"
          :description="`${worklistAwaitingReport.length} completed`"
          class="transition-shadow hover:shadow-sm"
        >
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty
                  v-if="worklistAwaitingReport.length === 0"
                  :colspan="5"
                >
                  No studies awaiting report
                </TableEmpty>
                <TableRow
                  v-for="img in worklistAwaitingReport"
                  :key="img.id"
                >
                  <TableCell class="font-medium">
                    {{ patientName(img.patientId) }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="modalityVariant(img.modality)">
                      {{ img.modality.toUpperCase() }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ img.bodyRegion }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="priorityVariant(orderForStudy(img)?.priority ?? 'routine')">
                      {{ orderForStudy(img)?.priority ?? 'routine' }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/radiology/orders/${img.serviceRequestId}`">Open</NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>

      <!-- 4. Recent signed reports + Modality distribution side by side -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Recent signed reports (spans 2 cols) -->
        <SectionCard
          title="Recent Signed Reports"
          description="Last 8 final radiology reports"
          class="lg:col-span-2 transition-shadow hover:shadow-sm"
        >
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Study</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty
                  v-if="recentReports.length === 0"
                  :colspan="5"
                >
                  No signed reports yet
                </TableEmpty>
                <TableRow
                  v-for="rep in recentReports"
                  :key="rep.id"
                >
                  <TableCell class="font-medium">
                    {{ patientName(rep.patientId) }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      v-if="studyForOrder(rep.serviceRequestId)"
                      :variant="modalityVariant(studyForOrder(rep.serviceRequestId)!.modality)"
                    >
                      {{ studyForOrder(rep.serviceRequestId)!.modality.toUpperCase() }}
                    </Badge>
                    <span
                      v-else
                      class="text-muted-foreground text-sm"
                    >—</span>
                  </TableCell>
                  <TableCell class="text-muted-foreground max-w-[200px] truncate text-sm">
                    {{ rep.display }}
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm tabular-nums">
                    {{ relativeTime(rep.issuedAt) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/radiology/reports/${rep.id}`">View</NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- 5. Modality distribution today -->
        <SectionCard
          title="Modality Mix Today"
          :description="`${studiesToday.length} total studies`"
          class="transition-shadow hover:shadow-sm"
        >
          <div
            v-if="modalityDistribution.length === 0"
            class="text-muted-foreground flex h-32 items-center justify-center text-sm"
          >
            No studies today
          </div>
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="item in modalityDistribution"
              :key="item.modality"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ item.modality }}</span>
                <span class="text-muted-foreground tabular-nums">{{ item.count }}</span>
              </div>
              <Progress
                :model-value="item.pct"
                class="h-2"
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </PageBody>
  </Page>
</template>
