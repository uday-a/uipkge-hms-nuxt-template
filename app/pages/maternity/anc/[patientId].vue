<script setup lang="ts">
import { ArrowLeft, Calendar, Ruler, Heart } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LineChart } from '@/components/ui/charts/line-chart'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const patientId = computed(() => route.params.patientId as string)

const patient = computed(() => state.patients.find(p => p.id === patientId.value))
const record = computed(() => state.ancRecords.find(a => a.patientId === patientId.value))

watchEffect(() => {
  if (import.meta.client && !record.value) {
    navigateTo('/maternity')
  }
})

useHead(() => ({
  title: record.value ? `ANC — ${patient.value?.givenName ?? ''} ${patient.value?.familyName ?? ''}` : 'ANC Record',
}))

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function weeksSinceLmp(lmp: string): number {
  const diff = Date.now() - new Date(lmp).getTime()
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

function riskVariant(risks: string[]): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (risks.some(r => r.toLowerCase().includes('pre-eclampsia') || r.toLowerCase().includes('severe'))) return 'destructive'
  if (risks.length > 0) return 'secondary'
  return 'outline'
}

// Chart data
const weightData = computed(() => {
  if (!record.value) return []
  return record.value.visits.map(v => ({
    x: `W${v.weeks}`,
    weight: v.weightKg,
  }))
})

const bpData = computed(() => {
  if (!record.value) return []
  return record.value.visits.map(v => ({
    x: `W${v.weeks}`,
    systolic: v.bpSys,
    diastolic: v.bpDia,
  }))
})
</script>

<template>
  <Page v-if="record">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          as-child
        >
          <NuxtLink to="/maternity">
            <ArrowLeft class="size-5" />
          </NuxtLink>
        </Button>
        <PageHeaderHeading
          :title="`${patient?.givenName ?? ''} ${patient?.familyName ?? ''}`"
          :description="`ANC record · MRN ${patient?.mrn ?? '—'}`"
        />
      </div>
    </PageHeader>

    <PageBody>
      <!-- Summary -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Calendar class="size-4 text-muted-foreground" />
              LMP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ fmtDate(record.lmp) }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Calendar class="size-4 text-muted-foreground" />
              EDD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ fmtDate(record.edd) }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Ruler class="size-4 text-muted-foreground" />
              G/P
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ record.gravidaPara }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Heart class="size-4 text-muted-foreground" />
              Gestational age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ weeksSinceLmp(record.lmp) }} weeks
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Risk factors -->
      <SectionCard title="Risk factors">
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="risk in record.riskFactors"
            :key="risk"
            :variant="riskVariant(record.riskFactors)"
          >
            {{ risk }}
          </Badge>
          <span
            v-if="record.riskFactors.length === 0"
            class="text-sm text-muted-foreground"
          >No risk factors identified.</span>
        </div>
      </SectionCard>

      <!-- Charts -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Weight trend">
          <LineChart
            :data="weightData"
            x-field="x"
            y-field="weight"
            :height="240"
          />
        </SectionCard>
        <SectionCard title="Blood pressure trend">
          <LineChart
            :data="bpData"
            x-field="x"
            :y-field="['systolic', 'diastolic']"
            :height="240"
          />
        </SectionCard>
      </div>

      <!-- Visits table -->
      <SectionCard title="Visits">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead class="w-20">
                  Weeks
                </TableHead>
                <TableHead class="w-24">
                  Weight
                </TableHead>
                <TableHead class="w-28">
                  BP
                </TableHead>
                <TableHead class="w-28">
                  Fundal Ht
                </TableHead>
                <TableHead class="w-24">
                  FHR
                </TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="visit in record.visits"
                :key="visit.at"
              >
                <TableCell class="text-sm text-muted-foreground">
                  {{ fmtDate(visit.at) }} {{ fmtTime(visit.at) }}
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ visit.weeks }}
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ visit.weightKg.toFixed(1) }} kg
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ visit.bpSys }}/{{ visit.bpDia }}
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ visit.fundalHeightCm ? `${visit.fundalHeightCm} cm` : '—' }}
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ visit.fetalHr ? `${visit.fetalHr} bpm` : '—' }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground max-w-sm">
                  {{ visit.notes ?? '—' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
