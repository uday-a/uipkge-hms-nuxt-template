<script setup lang="ts">
import {
  UserPlus,
  CalendarDays,
  Receipt,
  Clock,
  BedDouble,
  ChevronRight,
  Users,
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
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Reception Dashboard' })

// ── helpers ────────────────────────────────────────────────────────────
function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
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
function fmtCents(cents: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100)
}

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

function billStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    open: 'destructive',
    partially_paid: 'warning',
    paid: 'success',
    draft: 'outline',
    cancelled: 'secondary',
  }
  return map[status] ?? 'secondary'
}

// ── mock state ─────────────────────────────────────────────────────────
const state = useMockState()

// Current receptionist — first staff member with role 'receptionist'
const me = computed(() => state.staff.find(s => s.role === 'receptionist')!)

const today = new Date()

// Convenience lookups
const patientById = (id: string) => state.patients.find(p => p.id === id)
const staffById = (id: number) => state.staff.find(s => s.id === id)

// ── KPI 1: Today's appointments ────────────────────────────────────────
const todayAppointments = computed(() =>
  state.appointments.filter(a => sameDay(new Date(a.scheduledAt), today)),
)

// ── KPI 2: Walk-ins waiting — arrived but no encounter yet ─────────────
const walkInsWaiting = computed(() =>
  state.appointments.filter((a) => {
    if (!sameDay(new Date(a.scheduledAt), today)) return false
    if (a.status !== 'arrived') return false
    // No encounter linked = not yet seen by a doctor
    return !a.encounterId
  }),
)

// ── KPI 3: Pending payments ────────────────────────────────────────────
const pendingBills = computed(() =>
  state.bills.filter(b => b.status === 'open' || b.status === 'partially_paid'),
)

// ── KPI 4: Beds available ──────────────────────────────────────────────
const activeBedAssignmentBedIds = computed(() =>
  new Set(
    state.bedAssignments
      .filter(ba => !ba.releasedAt)
      .map(ba => ba.bedId),
  ),
)

const availableBeds = computed(() =>
  state.beds.filter(
    b => b.status === 'available' && !activeBedAssignmentBedIds.value.has(b.id),
  ),
)

// ── Today's schedule (sorted by time) ─────────────────────────────────
const scheduleRows = computed(() =>
  [...todayAppointments.value].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  ),
)

// ── Mark arrived action ────────────────────────────────────────────────
function markArrived(apptId: string) {
  const appt = state.appointments.find(a => a.id === apptId)
  if (!appt || appt.status !== 'booked') return

  // Compute today's max token number and add 1
  const maxToken = todayAppointments.value
    .filter(a => a.tokenNumber !== undefined)
    .reduce((max, a) => Math.max(max, a.tokenNumber!), 0)

  appt.status = 'arrived'
  appt.tokenNumber = maxToken + 1

  // Create a new encounter for the arrival
  const newEncId = `enc-rx-${Date.now()}`
  state.encounters.push({
    id: newEncId,
    patientId: appt.patientId,
    facilityId: appt.facilityId,
    type: 'outpatient',
    status: 'arrived',
    departmentId: 'dept-opd',
    attendingUserId: appt.doctorUserId,
    admissionAt: new Date().toISOString(),
    reasonChiefComplaint: appt.reasonNote,
    appointmentId: appt.id,
  })
  appt.encounterId = newEncId
}

// ── Beds snapshot — group by unit, then aggregate statuses ─────────────
const bedSnapshot = computed(() => {
  // Only show inpatient-relevant units (exclude OT rooms)
  const relevantUnitIds = state.units
    .filter(u => !['dept-ot'].includes(u.departmentId))
    .map(u => u.id)

  return state.units
    .filter(u => relevantUnitIds.includes(u.id))
    .map((unit) => {
      const unitBeds = state.beds.filter(b => b.unitId === unit.id)
      const available = unitBeds.filter(b => b.status === 'available').length
      const occupied = unitBeds.filter(b => b.status === 'occupied').length
      const cleaning = unitBeds.filter(b => b.status === 'cleaning').length
      const total = unitBeds.length
      const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0
      return { unit, available, occupied, cleaning, total, occupancyPct }
    })
    .filter(row => row.total > 0)
})

// ── Walk-in register dialog ────────────────────────────────────────────
const walkInOpen = ref(false)
</script>

<template>
  <Page>
    <!-- ── Header ─────────────────────────────────────────────────────── -->
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
              :title="`${greeting()}, ${me.name.split(' ')[0]}`"
              description="Front desk — here's today's overview."
            />
            <div class="mt-1 flex items-center gap-2">
              <Badge variant="secondary">
                Receptionist
              </Badge>
              <span class="text-muted-foreground text-xs">
                {{ me.email }}
              </span>
            </div>
          </div>
        </div>

        <!-- Register walk-in dialog trigger -->
        <Dialog v-model:open="walkInOpen">
          <DialogTrigger as-child>
            <Button class="gap-2 self-start sm:self-auto">
              <UserPlus class="size-4" />
              Register Walk-in
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register Walk-in Patient</DialogTitle>
              <DialogDescription>
                Use this to check in a walk-in who doesn't have a prior appointment.
                For a full registration, use the Register Patient page.
              </DialogDescription>
            </DialogHeader>
            <div class="py-4 text-sm text-muted-foreground">
              Walk-in registration form goes here. Navigate to
              <NuxtLink
                to="/patients/new"
                class="text-primary underline underline-offset-2"
                @click="walkInOpen = false"
              >
                Register new patient
              </NuxtLink>
              for the full flow.
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                :as-child="true"
                @click="walkInOpen = false"
              >
                <NuxtLink to="/patients/new">
                  Go to Registration
                </NuxtLink>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- ── KPI row ───────────────────────────────────────────────────── -->
      <KpiGrid :columns="4">
        <!-- Today's appointments -->
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Today's Appointments
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ todayAppointments.length }}
                </p>
              </div>
              <IconBox :icon="CalendarDays" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              total scheduled today
            </p>
          </CardContent>
        </Card>

        <!-- Walk-ins waiting -->
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Walk-ins Waiting
                </p>
                <p class="mt-1 text-2xl font-bold">
                  {{ walkInsWaiting.length }}
                </p>
              </div>
              <IconBox :icon="Clock" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              arrived, no encounter yet
            </p>
          </CardContent>
        </Card>

        <!-- Pending payments -->
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Pending Payments
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ pendingBills.length }}
                  </p>
                  <Badge
                    v-if="pendingBills.length > 0"
                    variant="destructive"
                    class="text-xs"
                  >
                    Action needed
                  </Badge>
                </div>
              </div>
              <IconBox :icon="Receipt" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              open or partially paid
            </p>
          </CardContent>
        </Card>

        <!-- Beds available -->
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-muted-foreground text-sm font-medium">
                  Beds Available
                </p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-2xl font-bold">
                    {{ availableBeds.length }}
                  </p>
                  <Badge
                    v-if="availableBeds.length === 0"
                    variant="destructive"
                    class="text-xs"
                  >
                    Full
                  </Badge>
                </div>
              </div>
              <IconBox :icon="BedDouble" variant="primary" />
            </div>
            <p class="text-muted-foreground mt-1 text-xs">
              free beds, no active assignment
            </p>
          </CardContent>
        </Card>
      </KpiGrid>

      <!-- ── Today's schedule ──────────────────────────────────────────── -->
      <SectionCard title="Today's Appointments" class="transition-shadow hover:shadow-sm">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[80px]">
                  Time
                </TableHead>
                <TableHead>Patient</TableHead>
                <TableHead class="w-[180px]">
                  Doctor
                </TableHead>
                <TableHead class="w-[110px]">
                  Status
                </TableHead>
                <TableHead class="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="scheduleRows.length">
                <TableRow
                  v-for="appt in scheduleRows"
                  :key="appt.id"
                >
                  <!-- Time -->
                  <TableCell class="text-muted-foreground font-mono text-xs">
                    {{ fmtTime(appt.scheduledAt) }}
                  </TableCell>

                  <!-- Patient -->
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

                  <!-- Doctor -->
                  <TableCell class="text-muted-foreground text-sm">
                    {{ staffById(appt.doctorUserId)?.name ?? `Dr #${appt.doctorUserId}` }}
                  </TableCell>

                  <!-- Status -->
                  <TableCell>
                    <Badge
                      :variant="apptStatusVariant(appt.status)"
                      class="capitalize"
                    >
                      {{ appt.status.replace('_', ' ') }}
                    </Badge>
                  </TableCell>

                  <!-- Action -->
                  <TableCell>
                    <!-- booked → "Mark arrived" button -->
                    <Button
                      v-if="appt.status === 'booked'"
                      variant="outline"
                      size="sm"
                      class="h-7 px-2 text-xs"
                      @click="markArrived(appt.id)"
                    >
                      Mark arrived
                    </Button>

                    <!-- arrived → show token badge -->
                    <Badge
                      v-else-if="appt.status === 'arrived' && appt.tokenNumber"
                      variant="warning"
                      class="font-mono"
                    >
                      Token #{{ appt.tokenNumber }}
                    </Badge>

                    <!-- other statuses → open link -->
                    <Button
                      v-else-if="appt.status === 'completed' || appt.status === 'no_show'"
                      variant="ghost"
                      size="sm"
                      class="h-7 gap-1 px-2 text-xs"
                      :as-child="true"
                    >
                      <NuxtLink
                        :to="`/appointments/${appt.id}`"
                        class="flex items-center gap-1"
                      >
                        View
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
                No appointments scheduled for today.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Quick actions ─────────────────────────────────────────────── -->
      <div class="grid gap-4 md:grid-cols-3">
        <NuxtLink to="/patients/new">
          <Card class="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardContent class="flex items-center gap-4 pt-6">
              <IconBox
                :icon="Users"
                size="lg"
              />
              <div>
                <p class="text-sm font-semibold">
                  Register new patient
                </p>
                <p class="text-muted-foreground text-xs">
                  Create a patient record
                </p>
              </div>
            </CardContent>
          </Card>
        </NuxtLink>

        <NuxtLink to="/appointments">
          <Card class="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardContent class="flex items-center gap-4 pt-6">
              <IconBox
                :icon="CalendarDays"
                size="lg"
              />
              <div>
                <p class="text-sm font-semibold">
                  Book appointment
                </p>
                <p class="text-muted-foreground text-xs">
                  Schedule a new slot
                </p>
              </div>
            </CardContent>
          </Card>
        </NuxtLink>

        <NuxtLink to="/settings/billing">
          <Card class="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardContent class="flex items-center gap-4 pt-6">
              <IconBox
                :icon="Receipt"
                size="lg"
              />
              <div>
                <p class="text-sm font-semibold">
                  Take payment
                </p>
                <p class="text-muted-foreground text-xs">
                  Process billing & receipts
                </p>
              </div>
            </CardContent>
          </Card>
        </NuxtLink>
      </div>

      <!-- ── Pending payments ──────────────────────────────────────────── -->
      <SectionCard title="Pending Payments" class="transition-shadow hover:shadow-sm">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead class="w-[150px]">
                  Bill #
                </TableHead>
                <TableHead class="w-[100px] text-right">
                  Total
                </TableHead>
                <TableHead class="w-[100px] text-right">
                  Paid
                </TableHead>
                <TableHead class="w-[100px] text-right">
                  Balance
                </TableHead>
                <TableHead class="w-[90px]">
                  Status
                </TableHead>
                <TableHead class="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="pendingBills.length">
                <TableRow
                  v-for="bill in pendingBills"
                  :key="bill.id"
                >
                  <TableCell>
                    <div
                      v-if="patientById(bill.patientId)"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-secondary text-[10px] font-semibold">
                          {{ initials(`${patientById(bill.patientId)!.givenName} ${patientById(bill.patientId)!.familyName}`) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium leading-none">
                          {{ patientById(bill.patientId)!.givenName }} {{ patientById(bill.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patientById(bill.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-muted-foreground font-mono text-xs">
                    {{ bill.billNo }}
                  </TableCell>
                  <TableCell class="text-right text-sm">
                    {{ fmtCents(bill.totalCents) }}
                  </TableCell>
                  <TableCell class="text-muted-foreground text-right text-sm">
                    {{ fmtCents(bill.paidCents) }}
                  </TableCell>
                  <TableCell class="text-right text-sm font-semibold">
                    {{ fmtCents(bill.balanceCents) }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="billStatusVariant(bill.status)"
                      class="capitalize"
                    >
                      {{ bill.status.replace('_', ' ') }}
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
                        :to="`/billing/${bill.id}`"
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
                :colspan="7"
              >
                No outstanding payments.
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <!-- ── Beds snapshot ─────────────────────────────────────────────── -->
      <SectionCard title="Beds Snapshot" class="transition-shadow hover:shadow-sm">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="row in bedSnapshot"
            :key="row.unit.id"
            class="p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <BedDouble class="text-muted-foreground size-4" />
                <span class="text-sm font-medium">{{ row.unit.name }}</span>
              </div>
              <span class="text-muted-foreground font-mono text-xs">{{ row.unit.code }}</span>
            </div>

            <!-- Occupancy bar -->
            <Progress
              :model-value="row.occupancyPct"
              class="mb-3 h-1.5"
            />

            <!-- Counts -->
            <div class="flex items-center justify-between text-xs">
              <span class="flex items-center gap-1">
                <span class="bg-primary size-2 rounded-full inline-block" />
                <span class="text-muted-foreground">{{ row.available }} available</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="bg-destructive size-2 rounded-full inline-block" />
                <span class="text-muted-foreground">{{ row.occupied }} occupied</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="bg-muted-foreground size-2 rounded-full inline-block" />
                <span class="text-muted-foreground">{{ row.cleaning }} cleaning</span>
              </span>
            </div>
          </Card>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
