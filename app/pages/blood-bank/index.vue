<script setup lang="ts">
import {
  Droplets,
  Users,
  AlertCircle,
  Clock,
  Plus,
  ChevronRight,
} from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { IconBox } from '@/components/ui/icon-box'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Blood Bank' })

const state = useMockState()

// ── Helpers ───────────────────────────────────────────────────────────────────

function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function donorName(donorId: string) {
  const d = state.donors.find(dn => dn.id === donorId)
  return d ? `${d.givenName} ${d.familyName}` : donorId
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function componentLabel(c: string) {
  const map: Record<string, string> = {
    whole_blood: 'Whole blood',
    prbc: 'PRBC',
    platelets: 'Platelets',
    plasma: 'Plasma',
    cryoprecipitate: 'Cryoprecipitate',
  }
  return map[c] ?? c
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

const availableUnits = computed(() => state.bloodUnits.filter(u => u.status === 'available'))
const activeDonors = computed(() => state.donors.filter(d => d.totalDonations > 0))
const pendingCrossmatch = computed(() => state.transfusionRequests.filter(r => r.status === 'pending_crossmatch'))
const expiringSoon = computed(() =>
  availableUnits.value.filter(u => daysUntil(u.expiresAt) <= 7),
)

// ── Blood group inventory ─────────────────────────────────────────────────────

const BLOOD_GROUPS: Array<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'> = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
]

const GROUP_TARGET = 10

function groupCounts(group: string) {
  const all = state.bloodUnits.filter(u => u.bloodGroup === group)
  const avail = all.filter(u => u.status === 'available')
  return { total: all.length, available: avail.length }
}

// ── Recent donations ──────────────────────────────────────────────────────────

const recentDonations = computed(() =>
  [...state.bloodUnits]
    .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
    .slice(0, 10),
)

// ── Open requests ─────────────────────────────────────────────────────────────

const openRequests = computed(() =>
  state.transfusionRequests.filter(r => r.status === 'pending_crossmatch' || r.status === 'crossmatched'),
)

// ── Badge helpers ─────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

function priorityVariant(priority: string): BadgeVariant {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'default'
  return 'secondary'
}

function requestStatusVariant(status: string): BadgeVariant {
  if (status === 'pending_crossmatch') return 'default'
  if (status === 'crossmatched') return 'secondary'
  if (status === 'issued') return 'default'
  if (status === 'cancelled') return 'destructive'
  if (status === 'returned') return 'secondary'
  return 'outline'
}

function requestStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_crossmatch: 'Pending crossmatch',
    crossmatched: 'Crossmatched',
    issued: 'Issued',
    returned: 'Returned',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Blood Bank"
        description="Inventory, donors and transfusion requests"
      />
      <template #actions>
        <Button
          size="sm"
          variant="outline"
          as-child
        >
          <NuxtLink to="/blood-bank/donors">
            <Users class="size-4" />
            Donors
          </NuxtLink>
        </Button>
        <Button
          size="sm"
          as-child
        >
          <NuxtLink to="/blood-bank/requests">
            <Plus class="size-4" />
            New request
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- KPI row -->
      <KpiGrid :columns="4">
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Available Units
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ availableUnits.length }}
                </p>
                <p class="text-muted-foreground mt-0.5 text-xs">
                  Across all blood groups
                </p>
              </div>
              <IconBox
                :icon="Droplets"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Active Donors
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ activeDonors.length }}
                </p>
                <p class="text-muted-foreground mt-0.5 text-xs">
                  Registered donors
                </p>
              </div>
              <IconBox
                :icon="Users"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Pending Crossmatch
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ pendingCrossmatch.length }}
                  </p>
                  <Badge
                    v-if="pendingCrossmatch.length > 0"
                    variant="warning"
                    class="text-xs"
                  >
                    Action needed
                  </Badge>
                </div>
              </div>
              <IconBox
                :icon="AlertCircle"
                variant="primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Expiring Soon
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ expiringSoon.length }}
                  </p>
                  <Badge
                    v-if="expiringSoon.length > 0"
                    variant="destructive"
                    class="text-xs"
                  >
                    &lt; 7 days
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
      </KpiGrid>

      <!-- Blood group inventory -->
      <SectionCard
        title="Inventory by Blood Group"
        description="Available units vs target of 10 per group"
      >
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card
            v-for="group in BLOOD_GROUPS"
            :key="group"
          >
            <CardContent class="pt-4">
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold">{{ group }}</span>
                <Badge
                  variant="outline"
                  class="text-xs"
                >
                  {{ groupCounts(group).available }} / {{ groupCounts(group).total }}
                </Badge>
              </div>
              <div class="mt-3">
                <Progress :model-value="Math.min(100, (groupCounts(group).available / GROUP_TARGET) * 100)" />
              </div>
              <p class="text-muted-foreground mt-1 text-xs">
                {{ groupCounts(group).available }} available
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionCard>

      <!-- Recent donations -->
      <SectionCard
        title="Recent Donations"
        description="Last 10 blood unit collections"
      >
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit ID</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="recentDonations.length === 0">
                No donations recorded.
              </TableEmpty>
              <TableRow
                v-for="unit in recentDonations"
                :key="unit.id"
              >
                <TableCell class="font-mono text-xs">
                  {{ unit.id }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ unit.bloodGroup }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ componentLabel(unit.component) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ donorName(unit.donorId) }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ fmtDate(unit.collectedAt) }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ fmtDate(unit.expiresAt) }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="unit.status === 'available' ? 'default' : unit.status === 'expired' || unit.status === 'discarded' ? 'destructive' : unit.status === 'reserved' ? 'secondary' : 'outline'"
                    class="text-xs capitalize"
                  >
                    {{ unit.status }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- Open requests -->
      <SectionCard
        title="Open Requests"
        description="Transfusion requests awaiting action"
      >
        <template #header-action>
          <Button
            size="sm"
            variant="outline"
            as-child
          >
            <NuxtLink to="/blood-bank/requests">
              View all
              <ChevronRight class="size-4" />
            </NuxtLink>
          </Button>
        </template>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="openRequests.length === 0">
                No open requests.
              </TableEmpty>
              <TableRow
                v-for="req in openRequests"
                :key="req.id"
              >
                <TableCell class="font-mono text-xs">
                  {{ req.id }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ patientName(req.patientId) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ req.bloodGroup }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ componentLabel(req.component) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ req.unitsRequested }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="priorityVariant(req.priority)"
                    class="capitalize text-xs"
                  >
                    {{ req.priority }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="requestStatusVariant(req.status)"
                    class="text-xs"
                  >
                    {{ requestStatusLabel(req.status) }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
