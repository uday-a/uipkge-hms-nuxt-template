<script setup lang="ts">
import { Printer } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const route = useRoute()
const id = route.params.id as string
const state = useMockState()

// ── Print helper ──────────────────────────────────────────────────────────────

function printReport() {
  if (import.meta.client) {
    window.print()
  }
}

// ── Load data ─────────────────────────────────────────────────────────────────

const report = computed(() => state.diagnosticReports.find(r => r.id === id))
const patient = computed(() => report.value ? state.patients.find(p => p.id === report.value!.patientId) : undefined)
const observations = computed(() =>
  report.value
    ? state.observations.filter(o => report.value!.observationIds.includes(o.id))
    : [],
)
const signer = computed(() =>
  report.value?.signedByUserId
    ? state.staff.find(s => s.id === report.value!.signedByUserId)
    : undefined,
)

useHead({ title: computed(() => report.value ? `Lab Report — ${report.value.display}` : 'Lab Report') })

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info'

function interpretationVariant(interp: string | undefined): BadgeVariant {
  if (interp === 'critical_high' || interp === 'critical_low') return 'destructive'
  if (interp === 'high' || interp === 'low') return 'warning'
  if (interp === 'normal') return 'success'
  return 'secondary'
}

function interpretationLabel(interp: string | undefined): string {
  return (interp ?? '—').replace('_', ' ')
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        :title="report ? report.display : 'Lab Report'"
        :description="patient ? `${patient.givenName} ${patient.familyName} · ${patient.mrn}` : undefined"
      />
      <template #actions>
        <Button
          variant="outline"
          size="sm"
          class="print:hidden"
          @click="printReport"
        >
          <Printer class="mr-2 size-4" />
          Print
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- Not found -->
      <div
        v-if="!report"
        class="text-muted-foreground py-12 text-center text-sm"
      >
        Report not found.
      </div>

      <template v-else>
        <!-- Header metadata -->
        <SectionCard title="Report details">
          <DataList>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Patient</span>
              <span class="text-sm font-medium">
                {{ patient ? `${patient.givenName} ${patient.familyName}` : '—' }}
              </span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">MRN</span>
              <span class="font-mono text-sm">{{ patient?.mrn ?? '—' }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Facility</span>
              <span class="text-sm font-medium">{{ state.facility.name }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Effective date</span>
              <span class="text-sm">{{ formatDate(report.effectiveAt) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Issued at</span>
              <span class="text-sm">{{ formatDate(report.issuedAt) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Signed by</span>
              <span class="text-sm font-medium">{{ signer?.name ?? '—' }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Status</span>
              <Badge
                :variant="report.status === 'final' ? 'success' : report.status === 'draft' ? 'warning' : 'secondary'"
              >
                {{ report.status }}
              </Badge>
            </DataListItem>
          </DataList>
        </SectionCard>

        <!-- Results table -->
        <SectionCard title="Results">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead class="w-36">
                    Value
                  </TableHead>
                  <TableHead class="w-40">
                    Reference range
                  </TableHead>
                  <TableHead class="w-36">
                    Interpretation
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="observations.length === 0">
                  No observations recorded.
                </TableEmpty>
                <TableRow
                  v-for="obs in observations"
                  :key="obs.id"
                >
                  <TableCell>
                    <p class="text-sm font-medium">
                      {{ obs.display }}
                    </p>
                    <p class="text-muted-foreground font-mono text-xs">
                      {{ obs.code }}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      :class="[
                        'text-sm font-semibold',
                        (obs.interpretation === 'critical_high' || obs.interpretation === 'critical_low')
                          ? 'text-destructive'
                          : '',
                      ]"
                    >
                      {{ obs.valueNumeric !== undefined ? obs.valueNumeric : (obs.valueString ?? '—') }}
                    </span>
                    <span
                      v-if="obs.unit"
                      class="text-muted-foreground ml-1 text-xs"
                    >
                      {{ obs.unit }}
                    </span>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ obs.referenceRangeText ?? '—' }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="interpretationVariant(obs.interpretation)">
                      {{ interpretationLabel(obs.interpretation) }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <!-- Conclusion -->
        <SectionCard
          v-if="report.conclusion"
          title="Conclusion"
        >
          <p class="text-sm leading-relaxed whitespace-pre-line">
            {{ report.conclusion }}
          </p>
        </SectionCard>

        <!-- Signature line (print only) -->
        <div class="hidden print:block mt-12 border-t pt-6 text-sm">
          <div class="flex justify-between">
            <div>
              <p class="font-medium">
                {{ signer?.name ?? 'Authorised Signatory' }}
              </p>
              <p class="text-muted-foreground">
                {{ signer?.role ?? '' }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium">
                {{ state.facility.name }}
              </p>
              <p class="text-muted-foreground">
                {{ formatDate(report.issuedAt) }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </PageBody>
  </Page>
</template>
