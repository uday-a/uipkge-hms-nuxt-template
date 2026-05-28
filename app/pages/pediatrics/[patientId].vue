<script setup lang="ts">
import { ArrowLeft, Syringe, Stethoscope, Ruler } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart } from '@/components/ui/charts'
import { GROWTH_MEASUREMENTS, IMMUNIZATIONS } from '~/mocks/pediatrics'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const patientId = computed(() => route.params.patientId as string)

const patient = computed(() => state.patients.find(p => p.id === patientId.value))

watchEffect(() => {
  if (import.meta.client && patient.value === undefined) {
    navigateTo('/pediatrics')
  }
})

useHead(() => ({
  title: patient.value ? `${patient.value.givenName} ${patient.value.familyName}` : 'Pediatric Patient',
}))

// ─── Age helpers ─────────────────────────────────────────────────────────────

function ageInYears(dob: string): number {
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
  return `${ageInYears(dob)}y`
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Growth data ─────────────────────────────────────────────────────────────

const growthRecords = computed(() =>
  GROWTH_MEASUREMENTS.filter(g => g.patientId === patientId.value)
    .sort((a, b) => a.ageMonths - b.ageMonths),
)

const heightChartData = computed(() =>
  growthRecords.value.map(g => ({
    age: g.ageMonths < 24 ? `${g.ageMonths}mo` : `${Math.floor(g.ageMonths / 12)}y`,
    height: g.heightCm,
  })),
)

const weightChartData = computed(() =>
  growthRecords.value.map(g => ({
    age: g.ageMonths < 24 ? `${g.ageMonths}mo` : `${Math.floor(g.ageMonths / 12)}y`,
    weight: g.weightKg,
  })),
)

// ─── Immunizations ───────────────────────────────────────────────────────────

const immunizations = computed(() =>
  IMMUNIZATIONS.filter(i => i.patientId === patientId.value)
    .sort((a, b) => {
      const aDate = a.givenAt ?? a.scheduledFor ?? ''
      const bDate = b.givenAt ?? b.scheduledFor ?? ''
      return aDate.localeCompare(bDate)
    }),
)

function immunizationStatus(i: typeof immunizations.value[number]): { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (i.givenAt) return { label: 'Given', variant: 'default' }
  if (!i.scheduledFor) return { label: 'Scheduled', variant: 'outline' }
  const today = new Date().toISOString().slice(0, 10)
  if (i.scheduledFor < today) return { label: 'Overdue', variant: 'destructive' }
  return { label: 'Due', variant: 'secondary' }
}

// ─── Encounters ──────────────────────────────────────────────────────────────

const ptEncounters = computed(() =>
  state.encounters.filter(e => e.patientId === patientId.value)
    .sort((a, b) => (b.admissionAt ?? '').localeCompare(a.admissionAt ?? '')),
)

function encounterStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (status === 'in_progress') return 'default'
  if (status === 'arrived') return 'warning'
  if (status === 'finished') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'destructive'
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

function staffName(userId?: number): string {
  if (!userId) return '—'
  return state.staff.find(u => u.id === userId)?.name ?? `User #${userId}`
}
</script>

<template>
  <Page v-if="patient">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          as-child
        >
          <NuxtLink to="/pediatrics">
            <ArrowLeft class="size-5" />
          </NuxtLink>
        </Button>
        <Avatar size="lg">
          <AvatarFallback>{{ initials(patient.givenName, patient.familyName) }}</AvatarFallback>
        </Avatar>
        <PageHeaderHeading
          :title="`${patient.givenName} ${patient.familyName}`"
          :description="`MRN: ${patient.mrn} · ${ageLabel(patient.dateOfBirth)} · Pediatric`"
        />
      </div>
    </PageHeader>

    <PageBody>
      <Tabs default-value="growth">
        <TabsList>
          <TabsTrigger value="growth">
            <Ruler class="mr-1 size-3.5" />
            Growth
          </TabsTrigger>
          <TabsTrigger value="immunizations">
            <Syringe class="mr-1 size-3.5" />
            Immunizations
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ immunizations.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="visits">
            <Stethoscope class="mr-1 size-3.5" />
            Visits
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ ptEncounters.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- ── Growth ───────────────────────────────────────────────────────── -->
        <TabsContent value="growth">
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SectionCard
                title="Height"
                description="Height over time"
              >
                <LineChart
                  :data="heightChartData"
                  x-field="age"
                  y-field="height"
                  :height="280"
                />
              </SectionCard>
              <SectionCard
                title="Weight"
                description="Weight over time"
              >
                <LineChart
                  :data="weightChartData"
                  x-field="age"
                  y-field="weight"
                  :height="280"
                />
              </SectionCard>
            </div>

            <SectionCard title="Growth measurements">
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead class="w-24">
                        Age
                      </TableHead>
                      <TableHead class="w-24 text-right">
                        Height
                      </TableHead>
                      <TableHead class="w-24 text-right">
                        Weight
                      </TableHead>
                      <TableHead class="w-24 text-right">
                        BMI
                      </TableHead>
                      <TableHead class="w-28 text-right">
                        Head circ.
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableEmpty v-if="growthRecords.length === 0">
                      No growth measurements on record.
                    </TableEmpty>
                    <TableRow
                      v-for="g in growthRecords"
                      :key="g.id"
                    >
                      <TableCell class="text-sm text-muted-foreground">
                        {{ formatDate(g.at) }}
                      </TableCell>
                      <TableCell class="text-sm">
                        {{ g.ageMonths < 24 ? `${g.ageMonths} mo` : `${Math.floor(g.ageMonths / 12)} y` }}
                      </TableCell>
                      <TableCell class="text-right text-sm tabular-nums">
                        {{ g.heightCm.toFixed(1) }} cm
                      </TableCell>
                      <TableCell class="text-right text-sm tabular-nums">
                        {{ g.weightKg.toFixed(1) }} kg
                      </TableCell>
                      <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                        {{ g.bmi.toFixed(1) }}
                      </TableCell>
                      <TableCell class="text-right text-sm tabular-nums text-muted-foreground">
                        {{ g.headCircumferenceCm ? `${g.headCircumferenceCm.toFixed(1)} cm` : '—' }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <!-- ── Immunizations ────────────────────────────────────────────────── -->
        <TabsContent value="immunizations">
          <div class="">
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaccine</TableHead>
                    <TableHead class="w-20">
                      Dose
                    </TableHead>
                    <TableHead class="w-28">
                      Status
                    </TableHead>
                    <TableHead class="w-36">
                      Date
                    </TableHead>
                    <TableHead>Batch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableEmpty v-if="immunizations.length === 0">
                    No immunization records on file.
                  </TableEmpty>
                  <TableRow
                    v-for="im in immunizations"
                    :key="im.id"
                  >
                    <TableCell class="text-sm font-medium">
                      {{ im.vaccineName }}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ im.doseNumber }}
                    </TableCell>
                    <TableCell>
                      <Badge
                        :variant="immunizationStatus(im).variant"
                        class="text-xs"
                      >
                        {{ immunizationStatus(im).label }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ im.givenAt ? formatDate(im.givenAt) : (im.scheduledFor ? formatDate(im.scheduledFor) : '—') }}
                    </TableCell>
                    <TableCell class="font-mono text-xs text-muted-foreground">
                      {{ im.batchNo ?? '—' }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <!-- ── Visits ───────────────────────────────────────────────────────── -->
        <TabsContent value="visits">
          <div class="">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableEmpty v-if="ptEncounters.length === 0">
                    No visits on record.
                  </TableEmpty>
                  <TableRow
                    v-for="enc in ptEncounters"
                    :key="enc.id"
                  >
                    <TableCell class="text-sm text-muted-foreground">
                      {{ enc.admissionAt ? formatDate(enc.admissionAt) : '—' }}
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
                      {{ state.departments.find(d => d.id === enc.departmentId)?.name ?? '—' }}
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
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>

  <!-- Not found -->
  <div
    v-else
    class="flex items-center justify-center p-12"
  >
    <p class="text-muted-foreground text-sm">
      Patient not found. Redirecting…
    </p>
  </div>
</template>
