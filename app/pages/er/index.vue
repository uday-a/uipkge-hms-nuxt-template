<script setup lang="ts">
import { Plus, ExternalLink } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ER_BAYS } from '~/mocks/er-visits'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Emergency Department' })

const state = useMockState()

const todayStr = new Date().toISOString().slice(0, 10)

const waitingVisits = computed(() =>
  state.erVisits
    .filter(v => v.status === 'waiting' || v.status === 'in_triage')
    .sort((a, b) => a.arrivedAt.localeCompare(b.arrivedAt)),
)

const inTreatmentVisits = computed(() =>
  state.erVisits
    .filter(v => v.status === 'in_treatment')
    .sort((a, b) => a.arrivedAt.localeCompare(b.arrivedAt)),
)

const dischargedTodayVisits = computed(() =>
  state.erVisits
    .filter(v => v.status === 'discharged' && v.arrivedAt.slice(0, 10) === todayStr)
    .sort((a, b) => a.arrivedAt.localeCompare(b.arrivedAt)),
)

function patientById(id: string) {
  return state.patients.find(p => p.id === id)
}

function initials(given: string, family: string): string {
  return `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase()
}

function triageVariant(level: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (level <= 2) return 'destructive'
  if (level === 3) return 'secondary'
  return 'outline'
}

function triageLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'ESI 1 — Resuscitation',
    2: 'ESI 2 — Emergent',
    3: 'ESI 3 — Urgent',
    4: 'ESI 4 — Less urgent',
    5: 'ESI 5 — Non-urgent',
  }
  return labels[level] ?? `ESI ${level}`
}

function bayLabel(bayId?: string): string {
  if (!bayId) return '—'
  const bay = ER_BAYS.find(b => b.id === bayId)
  return bay?.label ?? bayId
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Emergency Department"
        description="Real-time ED operations, triage, and patient flow."
      />
      <template #actions>
        <Button
          as-child
          size="sm"
        >
          <NuxtLink to="/er/new">
            <Plus class="size-4" />
            Register walk-in
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <Tabs default-value="waiting">
        <TabsList>
          <TabsTrigger value="waiting">
            Waiting
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ waitingVisits.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_treatment">
            In treatment
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ inTreatmentVisits.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="discharged">
            Discharged today
            <Badge
              variant="secondary"
              class="ml-1 text-xs"
            >
              {{ dischargedTodayVisits.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting">
          <div class="rounded-md border transition-shadow hover:shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-28">
                    Arrived
                  </TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead class="w-40">
                    Triage
                  </TableHead>
                  <TableHead>Chief complaint</TableHead>
                  <TableHead class="w-36">
                    Bay
                  </TableHead>
                  <TableHead class="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="waitingVisits.length === 0">
                  No patients waiting.
                </TableEmpty>
                <TableRow
                  v-for="visit in waitingVisits"
                  :key="visit.id"
                >
                  <TableCell class="text-sm text-muted-foreground tabular-nums">
                    {{ timeAgo(visit.arrivedAt) }}
                  </TableCell>
                  <TableCell>
                    <div
                      v-if="patientById(visit.patientId)"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-primary/10 text-primary text-[10px] font-semibold">
                          {{ initials(patientById(visit.patientId)!.givenName, patientById(visit.patientId)!.familyName) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium">
                          {{ patientById(visit.patientId)!.givenName }} {{ patientById(visit.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patientById(visit.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-muted-foreground text-xs"
                    >{{ visit.patientId }}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="triageVariant(visit.triageLevel)"
                      class="text-[11px]"
                    >
                      {{ triageLabel(visit.triageLevel) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground max-w-[240px] truncate">
                    {{ visit.chiefComplaint }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ bayLabel(visit.bayId) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/er/${visit.id}`">
                        <ExternalLink class="size-4" />
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="in_treatment">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-28">
                    Arrived
                  </TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead class="w-40">
                    Triage
                  </TableHead>
                  <TableHead>Chief complaint</TableHead>
                  <TableHead class="w-36">
                    Bay
                  </TableHead>
                  <TableHead class="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="inTreatmentVisits.length === 0">
                  No patients in treatment.
                </TableEmpty>
                <TableRow
                  v-for="visit in inTreatmentVisits"
                  :key="visit.id"
                >
                  <TableCell class="text-sm text-muted-foreground tabular-nums">
                    {{ timeAgo(visit.arrivedAt) }}
                  </TableCell>
                  <TableCell>
                    <div
                      v-if="patientById(visit.patientId)"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-primary/10 text-primary text-[10px] font-semibold">
                          {{ initials(patientById(visit.patientId)!.givenName, patientById(visit.patientId)!.familyName) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium">
                          {{ patientById(visit.patientId)!.givenName }} {{ patientById(visit.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patientById(visit.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-muted-foreground text-xs"
                    >{{ visit.patientId }}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="triageVariant(visit.triageLevel)"
                      class="text-[11px]"
                    >
                      {{ triageLabel(visit.triageLevel) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground max-w-[240px] truncate">
                    {{ visit.chiefComplaint }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ bayLabel(visit.bayId) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/er/${visit.id}`">
                        <ExternalLink class="size-4" />
                      </NuxtLink>
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="discharged">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-28">
                    Arrived
                  </TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead class="w-40">
                    Triage
                  </TableHead>
                  <TableHead>Chief complaint</TableHead>
                  <TableHead class="w-36">
                    Bay
                  </TableHead>
                  <TableHead class="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="dischargedTodayVisits.length === 0">
                  No discharges today.
                </TableEmpty>
                <TableRow
                  v-for="visit in dischargedTodayVisits"
                  :key="visit.id"
                >
                  <TableCell class="text-sm text-muted-foreground tabular-nums">
                    {{ timeAgo(visit.arrivedAt) }}
                  </TableCell>
                  <TableCell>
                    <div
                      v-if="patientById(visit.patientId)"
                      class="flex items-center gap-2.5"
                    >
                      <Avatar class="size-7">
                        <AvatarFallback class="bg-primary/10 text-primary text-[10px] font-semibold">
                          {{ initials(patientById(visit.patientId)!.givenName, patientById(visit.patientId)!.familyName) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium">
                          {{ patientById(visit.patientId)!.givenName }} {{ patientById(visit.patientId)!.familyName }}
                        </p>
                        <p class="text-muted-foreground text-xs">
                          {{ patientById(visit.patientId)!.mrn }}
                        </p>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-muted-foreground text-xs"
                    >{{ visit.patientId }}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="triageVariant(visit.triageLevel)"
                      class="text-[11px]"
                    >
                      {{ triageLabel(visit.triageLevel) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground max-w-[240px] truncate">
                    {{ visit.chiefComplaint }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ bayLabel(visit.bayId) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      as-child
                    >
                      <NuxtLink :to="`/er/${visit.id}`">
                        <ExternalLink class="size-4" />
                      </NuxtLink>
                    </Button>
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
