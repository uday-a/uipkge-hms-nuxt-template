<script setup lang="ts">
import { Scan, Image, Play, CheckCircle2, ExternalLink } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataList, DataListItem } from '@/components/ui/data-list'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

// ─── Order lookup ─────────────────────────────────────────────────────────────

const order = computed(() =>
  state.radiologyOrders.find(o => o.id === route.params.id),
)

watchEffect(() => {
  if (import.meta.client && order.value === undefined) {
    navigateTo('/radiology/worklist')
  }
})

useHead(() => ({
  title: order.value ? `Radiology Order — ${order.value.display}` : 'Radiology Order',
}))

// ─── Related entities ─────────────────────────────────────────────────────────

const study = computed(() =>
  state.imagingStudies.find(s => s.serviceRequestId === route.params.id),
)

const report = computed(() =>
  state.diagnosticReports.find(
    r => r.category === 'radiology' && r.serviceRequestId === route.params.id,
  ),
)

const patient = computed(() =>
  state.patients.find(p => p.id === order.value?.patientId),
)

// ─── Accession number generator ───────────────────────────────────────────────
// Format: MH-RAD-YYYY-NNNNNN (6-digit zero-padded serial from timestamp)

function generateAccession(): string {
  const year = new Date().getFullYear()
  const serial = String(Date.now() % 1_000_000).padStart(6, '0')
  return `MH-RAD-${year}-${serial}`
}

// ─── Create study dialog ──────────────────────────────────────────────────────

const createStudyOpen = ref(false)
const studyForm = reactive({
  modality: order.value?.modality ?? '',
  bodyRegion: order.value?.bodyRegion ?? '',
  description: '',
})

// Pre-fill when order loads (SSR safety)
watch(order, (o) => {
  if (o && !studyForm.modality) studyForm.modality = o.modality ?? ''
  if (o && !studyForm.bodyRegion) studyForm.bodyRegion = o.bodyRegion ?? ''
}, { immediate: true })

function submitCreateStudy() {
  if (!order.value) return
  const newStudy = {
    id: `img-${Date.now()}`,
    serviceRequestId: order.value.id,
    patientId: order.value.patientId,
    facilityId: order.value.facilityId,
    accessionNumber: generateAccession(),
    modality: studyForm.modality as 'xr' | 'ct' | 'mri' | 'us' | 'dx' | 'mg' | 'nm' | 'pt' | 'er' | 'os' | 'xa',
    bodyRegion: studyForm.bodyRegion,
    description: studyForm.description || undefined,
    status: 'scheduled' as const,
    scheduledAt: new Date().toISOString(),
  }
  state.imagingStudies.push(newStudy)
  createStudyOpen.value = false
}

// ─── Study status transitions ─────────────────────────────────────────────────

function startStudy() {
  if (!study.value || study.value.status !== 'scheduled') return
  study.value.status = 'in_progress'
  study.value.startedAt = new Date().toISOString()
}

function completeStudy() {
  if (!study.value || study.value.status !== 'in_progress') return
  study.value.status = 'completed'
  study.value.completedAt = new Date().toISOString()
}

// ─── Report workflow ──────────────────────────────────────────────────────────

const reportConclusion = ref('')
const editableConclusion = ref('')

// Sync editable with loaded report
watch(report, (r) => {
  if (r) editableConclusion.value = r.conclusion ?? ''
}, { immediate: true })

function createDraftReport() {
  if (!order.value || !reportConclusion.value.trim()) return
  const me = state.staff.find(s => s.role === 'radiologist')
  const newReport = {
    id: `drep-rad-${Date.now()}`,
    serviceRequestId: order.value.id,
    encounterId: state.encounters.find(e =>
      e.patientId === order.value!.patientId,
    )?.id ?? '',
    patientId: order.value.patientId,
    category: 'radiology' as const,
    code: order.value.code,
    display: order.value.display,
    status: 'draft' as const,
    conclusion: reportConclusion.value.trim(),
    effectiveAt: new Date().toISOString(),
    imagingStudyId: study.value?.id,
    observationIds: [],
  }
  state.diagnosticReports.push(newReport)
  reportConclusion.value = ''
}

function saveDraft() {
  if (!report.value) return
  report.value.conclusion = editableConclusion.value
}

function signReport() {
  if (!report.value || report.value.status !== 'draft') return
  const me = state.staff.find(s => s.role === 'radiologist')
  report.value.status = 'final'
  report.value.issuedAt = new Date().toISOString()
  report.value.signedByUserId = me?.id
}

function amendReport() {
  if (!report.value || report.value.status !== 'final') return
  report.value.status = 'draft'
  editableConclusion.value = report.value.conclusion ?? ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function priorityVariant(priority: string): 'destructive' | 'warning' | 'outline' {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'warning'
  return 'outline'
}

function studyStatusVariant(status: string): 'default' | 'secondary' | 'success' | 'outline' {
  if (status === 'in_progress') return 'default'
  if (status === 'completed') return 'success'
  if (status === 'scheduled') return 'secondary'
  return 'outline'
}

const MODALITY_OPTIONS = [
  { value: 'xr', label: 'XR — X-Ray' },
  { value: 'ct', label: 'CT — Computed Tomography' },
  { value: 'mri', label: 'MRI — Magnetic Resonance Imaging' },
  { value: 'us', label: 'US — Ultrasound' },
  { value: 'xa', label: 'XA — Angiography' },
  { value: 'mg', label: 'MG — Mammography' },
  { value: 'nm', label: 'NM — Nuclear Medicine' },
  { value: 'pt', label: 'PT — PET Scan' },
]
</script>

<template>
  <Page v-if="order">
    <PageHeader>
      <PageHeaderHeading
        :title="`Radiology Order — ${order.display}`"
        :description="patient ? `${patient.givenName} ${patient.familyName} · ${patient.mrn}` : undefined"
      />
      <template #actions>
        <Badge
          :variant="priorityVariant(order.priority)"
          class="capitalize"
        >
          {{ order.priority }}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          as-child
        >
          <NuxtLink to="/radiology/worklist">
            Back to worklist
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <Tabs default-value="study">
        <TabsList>
          <TabsTrigger value="study">
            <Scan class="mr-1.5 size-3.5" />
            Study
          </TabsTrigger>
          <TabsTrigger value="report">
            <Image class="mr-1.5 size-3.5" />
            Report
            <Badge
              v-if="report"
              :variant="report.status === 'final' ? 'success' : 'secondary'"
              class="ml-1.5 text-xs capitalize"
            >
              {{ report.status }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- ── Study tab ──────────────────────────────────────────────────── -->
        <TabsContent value="study">
          <div class="space-y-4">
            <!-- No study yet -->
            <template v-if="!study">
              <Card>
                <CardContent class="flex flex-col items-center gap-4 py-10 text-center">
                  <div class="bg-muted flex size-12 items-center justify-center rounded-full">
                    <Scan class="text-muted-foreground size-6" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-medium">
                      No imaging study created yet
                    </p>
                    <p class="text-muted-foreground text-sm">
                      Create a study to begin scanning. Pre-filled from the order.
                    </p>
                  </div>

                  <Dialog v-model:open="createStudyOpen">
                    <DialogTrigger as-child>
                      <Button size="sm">
                        <Scan class="size-4" />
                        Create study
                      </Button>
                    </DialogTrigger>

                    <DialogContent class="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create imaging study</DialogTitle>
                        <DialogDescription>
                          Confirm modality and body region before scheduling.
                        </DialogDescription>
                      </DialogHeader>

                      <div class="space-y-4 py-2">
                        <!-- Modality -->
                        <div class="space-y-1.5">
                          <Label for="study-modality">Modality</Label>
                          <Select v-model="studyForm.modality">
                            <SelectTrigger id="study-modality">
                              <SelectValue placeholder="Select modality…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="opt in MODALITY_OPTIONS"
                                :key="opt.value"
                                :value="opt.value"
                              >
                                {{ opt.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <!-- Body region -->
                        <div class="space-y-1.5">
                          <Label for="study-region">Body region</Label>
                          <Input
                            id="study-region"
                            v-model="studyForm.bodyRegion"
                            placeholder="e.g. Chest, Brain, Abdomen"
                          />
                        </div>

                        <!-- Description -->
                        <div class="space-y-1.5">
                          <Label for="study-desc">Description <span class="text-muted-foreground font-normal">(optional)</span></Label>
                          <Textarea
                            id="study-desc"
                            v-model="studyForm.description"
                            placeholder="Clinical indication or technique notes…"
                            :rows="3"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <DialogClose as-child>
                          <Button variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          :disabled="!studyForm.modality || !studyForm.bodyRegion"
                          @click="submitCreateStudy"
                        >
                          Create study
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </template>

            <!-- Study exists -->
            <template v-else>
              <Card>
                <CardContent class="pt-6">
                  <DataList>
                    <DataListItem>
                      <span class="text-muted-foreground text-sm">Accession number</span>
                      <span class="font-mono text-sm font-semibold tracking-wide">{{ study.accessionNumber }}</span>
                    </DataListItem>
                    <DataListItem>
                      <span class="text-muted-foreground text-sm">Status</span>
                      <Badge
                        :variant="studyStatusVariant(study.status)"
                        class="capitalize"
                      >
                        {{ study.status.replace('_', ' ') }}
                      </Badge>
                    </DataListItem>
                    <DataListItem>
                      <span class="text-muted-foreground text-sm">Modality</span>
                      <span class="text-sm font-medium uppercase">{{ study.modality }}</span>
                    </DataListItem>
                    <DataListItem>
                      <span class="text-muted-foreground text-sm">Body region</span>
                      <span class="text-sm">{{ study.bodyRegion }}</span>
                    </DataListItem>
                    <DataListItem v-if="study.description">
                      <span class="text-muted-foreground text-sm">Description</span>
                      <span class="max-w-xs text-right text-sm">{{ study.description }}</span>
                    </DataListItem>
                    <DataListItem>
                      <span class="text-muted-foreground text-sm">Scheduled</span>
                      <span class="text-sm tabular-nums">{{ formatDateTime(study.scheduledAt) }}</span>
                    </DataListItem>
                    <DataListItem v-if="study.startedAt">
                      <span class="text-muted-foreground text-sm">Started</span>
                      <span class="text-sm tabular-nums">{{ formatDateTime(study.startedAt) }}</span>
                    </DataListItem>
                    <DataListItem v-if="study.completedAt">
                      <span class="text-muted-foreground text-sm">Completed</span>
                      <span class="text-sm tabular-nums">{{ formatDateTime(study.completedAt) }}</span>
                    </DataListItem>
                  </DataList>
                </CardContent>
              </Card>

              <!-- Actions row -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Start -->
                <Button
                  :disabled="study.status !== 'scheduled'"
                  size="sm"
                  @click="startStudy"
                >
                  <Play class="size-4" />
                  Start
                </Button>

                <!-- Complete -->
                <Button
                  :disabled="study.status !== 'in_progress'"
                  variant="secondary"
                  size="sm"
                  @click="completeStudy"
                >
                  <CheckCircle2 class="size-4" />
                  Complete
                </Button>

                <!-- View DICOM — always disabled, tooltip explains why -->
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <!-- Wrapping span required so Tooltip works on a disabled button -->
                      <span tabindex="0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <ExternalLink class="size-4" />
                          View DICOM
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      OHIF_VIEWER_URL not configured
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </template>
          </div>
        </TabsContent>

        <!-- ── Report tab ─────────────────────────────────────────────────── -->
        <TabsContent value="report">
          <div class="space-y-4">
            <!-- No report yet -->
            <template v-if="!report">
              <Card>
                <CardContent class="pt-6">
                  <div class="space-y-4">
                    <div class="space-y-1.5">
                      <Label for="report-conclusion">Conclusion</Label>
                      <Textarea
                        id="report-conclusion"
                        v-model="reportConclusion"
                        placeholder="Enter radiologist findings and impression…"
                        :rows="6"
                      />
                    </div>
                    <div class="flex justify-end">
                      <Button
                        size="sm"
                        :disabled="!reportConclusion.trim()"
                        @click="createDraftReport"
                      >
                        Create draft
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </template>

            <!-- Draft report -->
            <template v-else-if="report.status === 'draft'">
              <Card>
                <CardContent class="pt-6">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium">
                        Draft report
                      </p>
                      <Badge variant="secondary">
                        Draft
                      </Badge>
                    </div>
                    <div class="space-y-1.5">
                      <Label for="draft-conclusion">Conclusion</Label>
                      <Textarea
                        id="draft-conclusion"
                        v-model="editableConclusion"
                        :rows="6"
                      />
                    </div>
                    <div class="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        @click="saveDraft"
                      >
                        Save draft
                      </Button>
                      <Button
                        size="sm"
                        @click="signReport"
                      >
                        <CheckCircle2 class="size-4" />
                        Sign report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </template>

            <!-- Final (signed) report -->
            <template v-else-if="report.status === 'final'">
              <Card>
                <CardContent class="pt-6">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium">
                        Signed report
                      </p>
                      <Badge variant="success">
                        Final
                      </Badge>
                    </div>

                    <DataList>
                      <DataListItem>
                        <span class="text-muted-foreground text-sm">Signed at</span>
                        <span class="text-sm tabular-nums">{{ formatDateTime(report?.issuedAt) }}</span>
                      </DataListItem>
                      <DataListItem>
                        <span class="text-muted-foreground text-sm">Signed by</span>
                        <span class="text-sm">
                          {{ state.staff.find(s => s.id === report?.signedByUserId)?.name ?? '—' }}
                        </span>
                      </DataListItem>
                    </DataList>

                    <div>
                      <p class="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">
                        Conclusion
                      </p>
                      <p class="text-sm leading-relaxed whitespace-pre-wrap">
                        {{ report.conclusion }}
                      </p>
                    </div>

                    <div class="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        as-child
                      >
                        <NuxtLink :to="`/radiology/reports/${report.id}`">
                          <ExternalLink class="size-4" />
                          View printable report
                        </NuxtLink>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="amendReport"
                      >
                        Amend
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </template>
          </div>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>
</template>
