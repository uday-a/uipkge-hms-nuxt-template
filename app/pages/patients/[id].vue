<script setup lang="ts">
import { Stethoscope, Calendar, Edit, ExternalLink, AlertCircle } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const patient = computed(() => state.patients.find(p => p.id === route.params.id))

// Redirect if patient not found
watchEffect(() => {
  if (import.meta.client && patient.value === undefined) {
    navigateTo('/patients')
  }
})

useHead(() => ({
  title: patient.value ? `${patient.value.givenName} ${patient.value.familyName}` : 'Patient',
}))

// ─── Age helper ──────────────────────────────────────────────────────────────

function age(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  const y = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? y - 1 : y
}

function ageLabel(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000)
  if (totalDays < 30) return `${totalDays}d`
  if (totalDays < 365) return `${Math.floor(totalDays / 30)}mo`
  return `${age(dob)}y`
}

function formatDob(dob: string): string {
  return new Date(dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Currency ────────────────────────────────────────────────────────────────

function rupees(cents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

// ─── Initials ────────────────────────────────────────────────────────────────

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

// ─── Staff lookup ────────────────────────────────────────────────────────────

function staffName(userId?: number): string {
  if (!userId) return '—'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}

// ─── Department lookup ───────────────────────────────────────────────────────

function deptName(deptId?: string): string {
  if (!deptId) return '—'
  return state.departments.find(d => d.id === deptId)?.name ?? deptId
}

// ─── Filtered sub-lists ──────────────────────────────────────────────────────

const ptId = computed(() => route.params.id as string)

const ptEncounters = computed(() =>
  state.encounters.filter(e => e.patientId === ptId.value)
    .sort((a, b) => (b.admissionAt ?? '').localeCompare(a.admissionAt ?? '')),
)

const ptAppointments = computed(() =>
  state.appointments.filter(a => a.patientId === ptId.value)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
)

const ptBills = computed(() =>
  state.bills.filter(b => b.patientId === ptId.value)
    .sort((a, b) => b.billNo.localeCompare(a.billNo)),
)

const ptAlerts = computed(() =>
  state.criticalAlerts.filter(a => a.patientId === ptId.value && !a.acknowledgedAt),
)

// ─── Badge variants ──────────────────────────────────────────────────────────

function encounterStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (status === 'in_progress') return 'default'
  if (status === 'arrived') return 'warning'
  if (status === 'finished') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'destructive'
  return 'outline'
}

function appointmentStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (status === 'completed') return 'success'
  if (status === 'arrived') return 'warning'
  if (status === 'booked') return 'default'
  if (status === 'cancelled' || status === 'no_show') return 'destructive'
  return 'outline'
}

function billStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (status === 'paid') return 'success'
  if (status === 'partially_paid') return 'warning'
  if (status === 'open') return 'default'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function sexVariant(sex: string): 'default' | 'secondary' | 'outline' | 'info' {
  if (sex === 'male') return 'info'
  if (sex === 'female') return 'default'
  return 'outline'
}

function encounterTypeLabel(type: string): string {
  const map: Record<string, string> = {
    outpatient: 'OPD',
    inpatient: 'IPD',
    emergency: 'ER',
    daycare: 'Daycare',
    telemedicine: 'Tele',
  }
  return map[type] ?? type
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function startOpdEncounter() {
  if (!patient.value) return
  const id = `enc-${Date.now()}`
  state.encounters.push({
    id,
    patientId: ptId.value,
    facilityId: state.facility.id,
    type: 'outpatient',
    status: 'planned',
    admissionAt: new Date().toISOString(),
  })
  navigateTo(`/encounters/${id}`)
}
</script>

<template>
  <Page v-if="patient">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{{ initials(patient.givenName, patient.familyName) }}</AvatarFallback>
        </Avatar>
        <PageHeaderHeading
          :title="`${patient.givenName} ${patient.familyName}`"
          :description="`MRN: ${patient.mrn} · ${patient.sex} · ${ageLabel(patient.dateOfBirth)}`"
        />
      </div>
      <template #actions>
        <Button
          size="sm"
          @click="startOpdEncounter"
        >
          <Stethoscope class="size-4" />
          Start OPD encounter
        </Button>
        <Button
          size="sm"
          variant="secondary"
          as-child
        >
          <NuxtLink :to="`/appointments/new?patient=${patient.id}`">
            <Calendar class="size-4" />
            Book appointment
          </NuxtLink>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled
        >
          <Edit class="size-4" />
          Edit
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <Tabs default-value="demographics">
        <TabsList>
          <TabsTrigger value="demographics">
            Demographics
          </TabsTrigger>
          <TabsTrigger value="encounters">
            Encounters
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ ptEncounters.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ ptAppointments.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bills">
            Bills
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ ptBills.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="allergies">
            Allergies &amp; alerts
            <Badge
              v-if="ptAlerts.length > 0"
              variant="destructive"
              class="ml-1 text-xs"
            >
              {{ ptAlerts.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- ── Demographics ─────────────────────────────────────────────────── -->
        <TabsContent value="demographics">
          <Card class="">
            <CardContent class="pt-6">
              <DataList>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">MRN</span>
                  <span class="font-mono text-sm">{{ patient.mrn }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Sex</span>
                  <Badge
                    :variant="sexVariant(patient.sex)"
                    class="capitalize"
                  >
                    {{ patient.sex }}
                  </Badge>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Date of birth</span>
                  <span class="text-sm">{{ formatDob(patient.dateOfBirth) }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Age</span>
                  <span class="text-sm">{{ ageLabel(patient.dateOfBirth) }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Phone</span>
                  <span class="text-sm">{{ patient.phone ?? '—' }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Email</span>
                  <span class="text-sm">{{ patient.email ?? '—' }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Address</span>
                  <span class="text-sm text-right max-w-xs">{{ patient.address ?? '—' }}</span>
                </DataListItem>
                <DataListItem>
                  <span class="text-muted-foreground text-sm">Allergies</span>
                  <span class="text-sm text-right max-w-xs">{{ patient.allergiesSummary ?? '—' }}</span>
                </DataListItem>
              </DataList>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- ── Encounters ───────────────────────────────────────────────────── -->
        <TabsContent value="encounters">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead class="w-20">
                    Type
                  </TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Attending</TableHead>
                  <TableHead class="w-32">
                    Status
                  </TableHead>
                  <TableHead class="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="ptEncounters.length === 0">
                  No encounters on record.
                </TableEmpty>
                <TableRow
                  v-for="enc in ptEncounters"
                  :key="enc.id"
                >
                  <TableCell class="text-sm text-muted-foreground">
                    {{ enc.admissionAt ? new Date(enc.admissionAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ encounterTypeLabel(enc.type) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ deptName(enc.departmentId) }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ staffName(enc.attendingUserId) }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="encounterStatusVariant(enc.status)"
                      class="capitalize text-xs"
                    >
                      {{ enc.status.replace('_', ' ') }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/encounters/${enc.id}`">
                        <ExternalLink class="size-4" />
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <!-- ── Appointments ─────────────────────────────────────────────────── -->
        <TabsContent value="appointments">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead class="w-32">
                    Status
                  </TableHead>
                  <TableHead class="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="ptAppointments.length === 0">
                  No appointments on record.
                </TableEmpty>
                <TableRow
                  v-for="appt in ptAppointments"
                  :key="appt.id"
                >
                  <TableCell class="text-sm text-muted-foreground">
                    {{ new Date(appt.scheduledAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) }}
                  </TableCell>
                  <TableCell class="text-sm">
                    {{ staffName(appt.doctorUserId) }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="appointmentStatusVariant(appt.status)"
                      class="capitalize text-xs"
                    >
                      {{ appt.status.replace('_', ' ') }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/appointments/${appt.id}`">
                        <ExternalLink class="size-4" />
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <!-- ── Bills ───────────────────────────────────────────────────────── -->
        <TabsContent value="bills">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead class="text-right">
                    Total
                  </TableHead>
                  <TableHead class="text-right">
                    Paid
                  </TableHead>
                  <TableHead class="text-right">
                    Balance
                  </TableHead>
                  <TableHead class="w-32">
                    Status
                  </TableHead>
                  <TableHead class="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="ptBills.length === 0">
                  No bills on record.
                </TableEmpty>
                <TableRow
                  v-for="bill in ptBills"
                  :key="bill.id"
                >
                  <TableCell class="font-mono text-xs text-muted-foreground">
                    {{ bill.billNo }}
                  </TableCell>
                  <TableCell class="text-right text-sm">
                    {{ rupees(bill.totalCents) }}
                  </TableCell>
                  <TableCell class="text-right text-sm text-muted-foreground">
                    {{ rupees(bill.paidCents) }}
                  </TableCell>
                  <TableCell class="text-right text-sm">
                    <span :class="bill.balanceCents > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'">
                      {{ rupees(bill.balanceCents) }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="billStatusVariant(bill.status)"
                      class="capitalize text-xs"
                    >
                      {{ bill.status.replace('_', ' ') }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/billing/invoices/${bill.id}`">
                        <ExternalLink class="size-4" />
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <!-- ── Allergies & alerts ──────────────────────────────────────────── -->
        <TabsContent value="allergies">
          <div class="space-y-4">
            <SectionCard title="Allergies" class="transition-shadow hover:shadow-sm">
              <p class="text-sm">
                {{ patient.allergiesSummary || 'No allergy information recorded.' }}
              </p>
            </SectionCard>

            <SectionCard
              title="Critical value alerts"
              :description="ptAlerts.length === 0 ? undefined : `${ptAlerts.length} unacknowledged`"
            >
              <div
                v-if="ptAlerts.length === 0"
                class="text-muted-foreground flex items-center gap-2 text-sm"
              >
                <AlertCircle class="size-4" />
                No open critical alerts for this patient.
              </div>
              <Table v-else>
                <TableHeader>
                  <TableRow>
                    <TableHead>Observation</TableHead>
                    <TableHead>Encounter</TableHead>
                    <TableHead>Triggered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="alert in ptAlerts"
                    :key="alert.id"
                  >
                    <TableCell class="text-sm">
                      {{
                        state.observations.find(o => o.id === alert.observationId)?.display
                          ?? alert.observationId
                      }}
                    </TableCell>
                    <TableCell class="font-mono text-xs text-muted-foreground">
                      {{ alert.encounterId }}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ new Date(alert.triggeredAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>

  <!-- Loading / not found state -->
  <div
    v-else
    class="flex items-center justify-center p-12"
  >
    <p class="text-muted-foreground text-sm">
      Patient not found. Redirecting…
    </p>
  </div>
</template>
