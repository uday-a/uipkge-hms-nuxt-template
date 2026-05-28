<script setup lang="ts">
import { ArrowLeft, Clock, Activity, Heart } from 'lucide-vue-next'
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
import { AreaChart } from '@/components/ui/charts/area-chart'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const labourId = computed(() => route.params.id as string)

const labour = computed(() => state.labours.find(l => l.id === labourId.value))
const patient = computed(() => labour.value ? state.patients.find(p => p.id === labour.value!.patientId) : null)

watchEffect(() => {
  if (import.meta.client && !labour.value) {
    navigateTo('/maternity')
  }
})

useHead(() => ({
  title: labour.value ? `Labour — ${patient.value?.givenName ?? ''} ${patient.value?.familyName ?? ''}` : 'Labour Record',
}))

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function stageLabel(stage: number): string {
  const map: Record<number, string> = { 1: 'Early labour', 2: 'Active / pushing', 3: 'Delivery', 4: 'Placenta' }
  return map[stage] ?? `Stage ${stage}`
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'in_progress') return 'default'
  if (status === 'cs_pending') return 'secondary'
  if (status === 'transferred') return 'destructive'
  return 'outline'
}

const attendingObName = computed(() => {
  if (!labour.value) return '—'
  return state.staff.find(u => u.id === labour.value!.attendingObUserId)?.name ?? `User #${labour.value!.attendingObUserId}`
})

// Partograph chart data
const dilationData = computed(() => {
  if (!labour.value) return []
  return labour.value.partograph.map(p => ({
    time: fmtTime(p.at),
    dilation: p.cervicalDilationCm,
  }))
})

const contractionData = computed(() => {
  if (!labour.value) return []
  return labour.value.partograph.map(p => ({
    time: fmtTime(p.at),
    contractions: p.contractionsPer10Min,
  }))
})

const fetalHrData = computed(() => {
  if (!labour.value) return []
  return labour.value.partograph.map(p => ({
    time: fmtTime(p.at),
    fhr: p.fetalHr,
  }))
})
</script>

<template>
  <Page v-if="labour">
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
          :description="`Labour record · MRN ${patient?.mrn ?? '—'}`"
        />
        <Badge
          :variant="statusVariant(labour.status)"
          class="mt-1 text-xs"
        >
          {{ labour.status === 'in_progress' ? 'In progress' : labour.status }}
        </Badge>
      </div>
    </PageHeader>

    <PageBody>
      <!-- Summary cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Clock class="size-4 text-muted-foreground" />
              Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ fmtDate(labour.startedAt) }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ fmtTime(labour.startedAt) }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Activity class="size-4 text-muted-foreground" />
              Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ stageLabel(labour.stage) }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Activity class="size-4 text-muted-foreground" />
              Dilation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ labour.cervicalDilationCm }} cm
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium flex items-center gap-2">
              <Heart class="size-4 text-muted-foreground" />
              Attending OB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">
              {{ attendingObName }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Partograph charts -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Cervical dilation">
          <LineChart
            :data="dilationData"
            x-field="time"
            y-field="dilation"
            :height="260"
          />
        </SectionCard>
        <SectionCard title="Contractions per 10 min">
          <AreaChart
            :data="contractionData"
            x-field="time"
            y-field="contractions"
            :height="260"
          />
        </SectionCard>
      </div>

      <SectionCard title="Fetal heart rate">
        <LineChart
          :data="fetalHrData"
          x-field="time"
          y-field="fhr"
          :height="240"
        />
      </SectionCard>

      <!-- Partograph table -->
      <SectionCard title="Partograph readings">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead class="w-28">
                  Dilation
                </TableHead>
                <TableHead class="w-36">
                  Contractions / 10 min
                </TableHead>
                <TableHead class="w-24">
                  FHR
                </TableHead>
                <TableHead class="w-28">
                  BP
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="entry in labour.partograph"
                :key="entry.at"
              >
                <TableCell class="text-sm text-muted-foreground">
                  {{ fmtTime(entry.at) }}
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ entry.cervicalDilationCm }} cm
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ entry.contractionsPer10Min }}
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ entry.fetalHr }} bpm
                </TableCell>
                <TableCell class="text-sm tabular-nums">
                  {{ entry.bpSys }}/{{ entry.bpDia }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>
  </Page>
</template>
