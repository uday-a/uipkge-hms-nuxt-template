<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
useHead({ title: 'Critical Alerts' })

const state = useMockState()

// ── Derived rows ──────────────────────────────────────────────────────────────

const openAlerts = computed(() =>
  state.criticalAlerts.filter(a => !a.acknowledgedAt),
)

const acknowledgedAlerts = computed(() =>
  state.criticalAlerts.filter(a => !!a.acknowledgedAt),
)

// ── Join helpers ──────────────────────────────────────────────────────────────

function observation(observationId: string) {
  return state.observations.find(o => o.id === observationId)
}

function patient(patientId: string) {
  return state.patients.find(p => p.id === patientId)
}

function encounter(encounterId: string) {
  return state.encounters.find(e => e.id === encounterId)
}

function staffMember(userId: number | undefined) {
  if (userId === undefined) return undefined
  return state.staff.find(s => s.id === userId)
}

function initials(given: string, family: string) {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function valueDisplay(observationId: string): string {
  const obs = observation(observationId)
  if (!obs) return '—'
  if (obs.valueNumeric !== undefined) {
    return `${obs.valueNumeric}${obs.unit ? ' ' + obs.unit : ''}`
  }
  return obs.valueString ?? '—'
}

// ── Acknowledge action ────────────────────────────────────────────────────────

// Use current persona's staff user as the acknowledging user (fallback to first staff)
const { current: currentPersona } = usePersona()

function resolveAcknowledgerUserId(): number {
  const personaRole = currentPersona.value
  const matched = state.staff.find(s => s.role === personaRole)
  return matched?.id ?? state.staff[0]?.id ?? 101
}

function acknowledgeAlert(alertId: string) {
  const alert = state.criticalAlerts.find(a => a.id === alertId)
  if (!alert || alert.acknowledgedAt) return
  alert.acknowledgedAt = new Date().toISOString()
  alert.acknowledgedByUserId = resolveAcknowledgerUserId()
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Critical alerts"
        description="Patient safety alerts awaiting acknowledgement."
      />
    </PageHeader>

    <PageBody>
      <Tabs default-value="open">
        <TabsList>
          <TabsTrigger value="open">
            Open
            <Badge
              variant="destructive"
              class="ml-1.5 tabular-nums"
            >
              {{ openAlerts.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged
            <Badge
              variant="secondary"
              class="ml-1.5 tabular-nums"
            >
              {{ acknowledgedAlerts.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- ── Open tab ──────────────────────────────────────────────────── -->
        <TabsContent value="open">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead class="w-44">
                    Value
                  </TableHead>
                  <TableHead class="w-36">
                    Interpretation
                  </TableHead>
                  <TableHead class="w-32">
                    Triggered
                  </TableHead>
                  <TableHead class="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="openAlerts.length === 0">
                  <div class="flex flex-col items-center gap-2 py-8 text-center">
                    <AlertTriangle class="text-muted-foreground size-8" />
                    <p class="text-muted-foreground text-sm">
                      No open critical alerts. All clear.
                    </p>
                  </div>
                </TableEmpty>
                <TableRow
                  v-for="alert in openAlerts"
                  :key="alert.id"
                  class="hover:bg-destructive/5"
                >
                  <!-- Patient -->
                  <TableCell>
                    <div
                      v-if="patient(alert.patientId)"
                      class="flex items-center gap-2"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-destructive/10 text-destructive text-[10px] font-semibold">
                          {{ initials(patient(alert.patientId)!.givenName, patient(alert.patientId)!.familyName) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium leading-none">
                          {{ patient(alert.patientId)!.givenName }} {{ patient(alert.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patient(alert.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-muted-foreground text-sm"
                    >Unknown</span>
                  </TableCell>

                  <!-- Test -->
                  <TableCell>
                    <p class="text-sm font-medium">
                      {{ observation(alert.observationId)?.display ?? alert.observationId }}
                    </p>
                    <p
                      v-if="encounter(alert.encounterId)"
                      class="text-muted-foreground text-xs capitalize"
                    >
                      {{ encounter(alert.encounterId)!.type }} · {{ encounter(alert.encounterId)!.status.replace('_', ' ') }}
                    </p>
                  </TableCell>

                  <!-- Value -->
                  <TableCell>
                    <span class="text-destructive font-semibold tabular-nums">
                      {{ valueDisplay(alert.observationId) }}
                    </span>
                    <p
                      v-if="observation(alert.observationId)?.referenceRangeText"
                      class="text-muted-foreground mt-0.5 text-xs"
                    >
                      Ref: {{ observation(alert.observationId)!.referenceRangeText }}
                    </p>
                  </TableCell>

                  <!-- Interpretation -->
                  <TableCell>
                    <Badge
                      variant="destructive"
                      class="capitalize"
                    >
                      {{ observation(alert.observationId)?.interpretation?.replace('_', ' ') ?? 'critical' }}
                    </Badge>
                  </TableCell>

                  <!-- Triggered -->
                  <TableCell class="text-muted-foreground text-sm tabular-nums">
                    {{ relativeTime(alert.triggeredAt) }}
                  </TableCell>

                  <!-- Action -->
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      @click="acknowledgeAlert(alert.id)"
                    >
                      Acknowledge
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <!-- ── Acknowledged tab ─────────────────────────────────────────── -->
        <TabsContent value="acknowledged">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead class="w-44">
                    Value
                  </TableHead>
                  <TableHead class="w-36">
                    Interpretation
                  </TableHead>
                  <TableHead class="w-44">
                    Acknowledged by
                  </TableHead>
                  <TableHead class="w-36">
                    Acknowledged at
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="acknowledgedAlerts.length === 0">
                  No acknowledged alerts yet.
                </TableEmpty>
                <TableRow
                  v-for="alert in acknowledgedAlerts"
                  :key="alert.id"
                >
                  <!-- Patient -->
                  <TableCell>
                    <div
                      v-if="patient(alert.patientId)"
                      class="flex items-center gap-2"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-secondary text-[10px] font-semibold">
                          {{ initials(patient(alert.patientId)!.givenName, patient(alert.patientId)!.familyName) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium leading-none">
                          {{ patient(alert.patientId)!.givenName }} {{ patient(alert.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patient(alert.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-muted-foreground text-sm"
                    >Unknown</span>
                  </TableCell>

                  <!-- Test -->
                  <TableCell>
                    <p class="text-sm font-medium">
                      {{ observation(alert.observationId)?.display ?? alert.observationId }}
                    </p>
                    <p
                      v-if="encounter(alert.encounterId)"
                      class="text-muted-foreground text-xs capitalize"
                    >
                      {{ encounter(alert.encounterId)!.type }} · {{ encounter(alert.encounterId)!.status.replace('_', ' ') }}
                    </p>
                  </TableCell>

                  <!-- Value -->
                  <TableCell>
                    <span class="text-muted-foreground font-semibold tabular-nums">
                      {{ valueDisplay(alert.observationId) }}
                    </span>
                    <p
                      v-if="observation(alert.observationId)?.referenceRangeText"
                      class="text-muted-foreground mt-0.5 text-xs"
                    >
                      Ref: {{ observation(alert.observationId)!.referenceRangeText }}
                    </p>
                  </TableCell>

                  <!-- Interpretation -->
                  <TableCell>
                    <Badge
                      variant="secondary"
                      class="capitalize"
                    >
                      {{ observation(alert.observationId)?.interpretation?.replace('_', ' ') ?? 'critical' }}
                    </Badge>
                  </TableCell>

                  <!-- Acknowledged by -->
                  <TableCell>
                    <div
                      v-if="staffMember(alert.acknowledgedByUserId)"
                      class="flex items-center gap-2"
                    >
                      <Avatar class="size-6">
                        <AvatarFallback class="bg-secondary text-[10px] font-semibold">
                          {{ initials(
                            staffMember(alert.acknowledgedByUserId)!.name.split(' ')[0] ?? '',
                            staffMember(alert.acknowledgedByUserId)!.name.split(' ').at(-1) ?? '',
                          ) }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-sm">{{ staffMember(alert.acknowledgedByUserId)!.name }}</span>
                    </div>
                    <span
                      v-else
                      class="text-muted-foreground text-sm"
                    >—</span>
                  </TableCell>

                  <!-- Acknowledged at -->
                  <TableCell class="text-muted-foreground text-sm tabular-nums">
                    {{ alert.acknowledgedAt ? formatDateTime(alert.acknowledgedAt) : '—' }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>
</template>
