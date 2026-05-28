<script setup lang="ts">
import { Printer, ExternalLink } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, DataListItem } from '@/components/ui/data-list'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

// ─── Report lookup ─────────────────────────────────────────────────────────

const report = computed(() =>
  state.diagnosticReports.find(r => r.id === route.params.id),
)

watchEffect(() => {
  if (!import.meta.client) return
  if (report.value === undefined) {
    navigateTo('/radiology/worklist')
  }
  else if (report.value.category !== 'radiology') {
    navigateTo(`/lab/reports/${route.params.id}`)
  }
})

useHead(() => ({
  title: report.value
    ? `Radiology Report — ${report.value.display}`
    : 'Radiology Report',
}))

// ─── Related entities ──────────────────────────────────────────────────────

const patient = computed(() =>
  state.patients.find(p => p.id === report.value?.patientId),
)

const study = computed(() =>
  state.imagingStudies.find(s => s.serviceRequestId === report.value?.serviceRequestId),
)

const signer = computed(() =>
  state.staff.find(s => s.id === report.value?.signedByUserId),
)

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ageLabel(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  const adjusted = m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? years - 1 : years
  return `${adjusted}y`
}

function doPrint() {
  if (import.meta.client) window.print()
}
</script>

<template>
  <Page v-if="report && patient">
    <!-- Print-hidden controls -->
    <PageHeader class="print:hidden">
      <PageHeaderHeading
        :title="`Radiology Report — ${report.display}`"
        :description="patient ? `${patient.givenName} ${patient.familyName} · ${patient.mrn}` : undefined"
      />
      <template #actions>
        <Button
          variant="outline"
          size="sm"
          as-child
        >
          <NuxtLink :to="`/radiology/orders/${report.serviceRequestId}`">
            <ExternalLink class="size-4" />
            Back to order
          </NuxtLink>
        </Button>
        <Button
          size="sm"
          class="print:hidden"
          @click="doPrint"
        >
          <Printer class="size-4" />
          Print
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- Report document -->
      <Card class="mx-auto max-w-3xl print:shadow-none print:border-none">
        <CardContent class="pt-8 pb-10 print:pt-0">
          <!-- Facility header (print-visible letterhead) -->
          <div class="mb-6 border-b pb-6">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-lg font-bold">
                  {{ state.facility.name }}
                </h1>
                <p class="text-muted-foreground text-sm">
                  Department of Radiology
                </p>
              </div>
              <div class="text-right">
                <Badge
                  v-if="report.status === 'final'"
                  variant="success"
                >
                  Final Report
                </Badge>
                <Badge
                  v-else
                  variant="secondary"
                  class="capitalize"
                >
                  {{ report.status }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Study / patient metadata -->
          <DataList class="mb-6">
            <DataListItem>
              <span class="text-muted-foreground text-sm font-medium">Patient</span>
              <span class="text-sm font-semibold">{{ patient.givenName }} {{ patient.familyName }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm font-medium">MRN</span>
              <span class="font-mono text-sm">{{ patient.mrn }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm font-medium">Date of birth</span>
              <span class="text-sm">
                {{ new Date(patient.dateOfBirth).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                ({{ ageLabel(patient.dateOfBirth) }})
              </span>
            </DataListItem>
            <DataListItem v-if="study">
              <span class="text-muted-foreground text-sm font-medium">Accession number</span>
              <span class="font-mono text-sm">{{ study.accessionNumber }}</span>
            </DataListItem>
            <DataListItem v-if="study">
              <span class="text-muted-foreground text-sm font-medium">Modality</span>
              <span class="text-sm font-medium uppercase">{{ study.modality }}</span>
            </DataListItem>
            <DataListItem v-if="study">
              <span class="text-muted-foreground text-sm font-medium">Body region</span>
              <span class="text-sm">{{ study.bodyRegion }}</span>
            </DataListItem>
            <DataListItem v-if="study?.completedAt">
              <span class="text-muted-foreground text-sm font-medium">Study completed</span>
              <span class="text-sm tabular-nums">{{ formatDateTime(study.completedAt) }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm font-medium">Report</span>
              <span class="text-sm">{{ report.display }}</span>
            </DataListItem>
            <DataListItem v-if="report.issuedAt">
              <span class="text-muted-foreground text-sm font-medium">Signed at</span>
              <span class="text-sm tabular-nums">{{ formatDateTime(report.issuedAt) }}</span>
            </DataListItem>
            <DataListItem v-if="signer">
              <span class="text-muted-foreground text-sm font-medium">Signed by</span>
              <span class="text-sm">{{ signer.name }}</span>
            </DataListItem>
          </DataList>

          <!-- Conclusion section -->
          <div class="space-y-4">
            <h2 class="text-sm font-semibold uppercase tracking-wide">
              Findings &amp; Impression
            </h2>
            <div class="bg-muted/40 rounded-md border p-4">
              <p class="text-sm leading-relaxed whitespace-pre-wrap">
                {{ report.conclusion ?? 'No conclusion recorded.' }}
              </p>
            </div>
          </div>

          <!-- Signature block -->
          <div
            v-if="signer && report.status === 'final'"
            class="mt-10 border-t pt-6"
          >
            <div class="flex justify-end">
              <div class="text-right">
                <p class="text-sm font-semibold">
                  {{ signer.name }}
                </p>
                <p class="text-muted-foreground text-xs">
                  {{ signer.specialty ?? 'Radiologist' }}
                </p>
                <p class="text-muted-foreground text-xs tabular-nums">
                  {{ formatDateTime(report.issuedAt) }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageBody>
  </Page>
</template>
