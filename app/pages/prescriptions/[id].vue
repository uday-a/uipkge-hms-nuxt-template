<script setup lang="ts">
import { Printer } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

// ── lookups ───────────────────────────────────────────────────────────────────
const rxId = computed(() => route.params.id as string)

const prescription = computed(() =>
  state.prescriptions.find(p => p.id === rxId.value),
)

// All active/completed Rx for the same encounter — shown as a single document
const encounterRx = computed(() => {
  if (!prescription.value) return []
  return state.prescriptions.filter(
    p =>
      p.encounterId === prescription.value!.encounterId
      && p.status !== 'cancelled',
  )
})

const patient = computed(() =>
  state.patients.find(p => p.id === prescription.value?.patientId),
)

const prescriber = computed(() =>
  state.staff.find(s => s.id === prescription.value?.prescriberUserId),
)

function drugById(id: string) {
  return state.drugs.find(d => d.id === id)
}

// ── age helper ────────────────────────────────────────────────────────────────
function calcAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const hadBirthday
    = now.getMonth() > birth.getMonth()
      || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  const age = hadBirthday ? years : years - 1
  if (age < 1) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
    return `${months}mo`
  }
  return `${age}y`
}

function fmtDateTime(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

function rxStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    draft: 'outline',
    completed: 'secondary',
    cancelled: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function doPrint() {
  if (import.meta.client) window.print()
}

useHead({
  title: computed(() =>
    prescription.value
      ? `Rx — ${patient.value?.givenName ?? ''} ${patient.value?.familyName ?? ''}`
      : 'Prescription',
  ),
})
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Prescription"
        description="Print-ready medication order document."
      />
      <template #actions>
        <Button
          class="print:hidden"
          @click="doPrint"
        >
          <Printer class="mr-1.5 size-3.5" />
          Print
        </Button>
      </template>
    </PageHeader>

    <PageBody class="space-y-6">
      <!-- Not found state -->
      <div
        v-if="!prescription"
        class="text-muted-foreground py-12 text-center text-sm"
      >
        Prescription <span class="font-mono">{{ rxId }}</span> not found.
      </div>

      <template v-else>
        <!-- ── Patient + prescriber header card ──────────────────────────── -->
        <Card>
          <CardContent class="pt-6">
            <div class="grid gap-6 sm:grid-cols-3">
              <!-- Patient -->
              <div class="space-y-1">
                <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Patient
                </p>
                <p class="text-base font-semibold">
                  {{ patient ? `${patient.givenName} ${patient.familyName}` : prescription.patientId }}
                </p>
                <p
                  v-if="patient"
                  class="text-muted-foreground text-sm"
                >
                  MRN: {{ patient.mrn }}
                  <span v-if="patient.dateOfBirth"> · Age: {{ calcAge(patient.dateOfBirth) }}</span>
                  <span class="ml-1 capitalize"> · {{ patient.sex }}</span>
                </p>
                <p
                  v-if="patient?.allergiesSummary"
                  class="text-destructive text-xs"
                >
                  Allergies: {{ patient.allergiesSummary }}
                </p>
              </div>

              <!-- Prescriber -->
              <div class="space-y-1">
                <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Prescriber
                </p>
                <p class="text-base font-semibold">
                  {{ prescriber?.name ?? `User #${prescription.prescriberUserId}` }}
                </p>
                <p
                  v-if="prescriber"
                  class="text-muted-foreground text-sm capitalize"
                >
                  {{ prescriber.role }}
                  <span v-if="prescriber.specialty"> · {{ prescriber.specialty }}</span>
                </p>
              </div>

              <!-- Date + encounter -->
              <div class="space-y-1">
                <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Date issued
                </p>
                <p class="text-base font-semibold">
                  {{ fmtDateTime(prescription.signedAt) }}
                </p>
                <p class="text-muted-foreground text-sm font-mono">
                  Encounter: {{ prescription.encounterId }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- ── Medications table ──────────────────────────────────────────── -->
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="encounterRx.length === 0"
                :colspan="9"
              >
                No medications on this prescription.
              </TableEmpty>
              <TableRow
                v-for="(rx, idx) in encounterRx"
                :key="rx.id"
              >
                <TableCell class="text-muted-foreground text-sm">
                  {{ idx + 1 }}
                </TableCell>
                <TableCell>
                  <div class="font-medium">
                    {{ drugById(rx.drugId)?.display ?? rx.drugId }}
                  </div>
                  <div class="text-muted-foreground text-xs italic">
                    {{ drugById(rx.drugId)?.genericName }}
                  </div>
                </TableCell>
                <TableCell class="text-sm">
                  {{ rx.doseValue }} {{ rx.doseUnit }}
                </TableCell>
                <TableCell class="text-sm uppercase">
                  {{ rx.route }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ rx.frequencyText }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ rx.durationDays }}d
                </TableCell>
                <TableCell class="text-sm">
                  {{ rx.dispenseQty }}
                </TableCell>
                <TableCell>
                  <Badge :variant="rxStatusVariant(rx.status)">
                    {{ rx.status }}
                  </Badge>
                  <Badge
                    v-if="rx.prn"
                    variant="outline"
                    class="ml-1"
                  >
                    PRN
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground max-w-48 text-xs">
                  {{ rx.instructions ?? '—' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- ── Print footer ───────────────────────────────────────────────── -->
        <div class="hidden border-t pt-4 print:block">
          <div class="flex justify-between text-xs text-gray-500">
            <span>Printed: {{ new Date().toLocaleString() }}</span>
            <span>Encounter: {{ prescription.encounterId }}</span>
            <span>Prescriber signature: _________________________</span>
          </div>
        </div>
      </template>
    </PageBody>
  </Page>
</template>

<style>
@media print {
  .print\:hidden {
    display: none !important;
  }
  .print\:block {
    display: block !important;
  }
}
</style>
