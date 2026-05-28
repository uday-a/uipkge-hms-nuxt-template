<script setup lang="ts">
import { Activity, CheckCircle2, PenSquare } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { Card, CardContent } from '@/components/ui/card'
import { DataList, DataListItem } from '@/components/ui/data-list'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const encId = computed(() => route.params.encounterId as string)
const encounter = computed(() => state.encounters.find(e => e.id === encId.value))
const patient = computed(() => encounter.value ? state.patients.find(p => p.id === encounter.value!.patientId) : null)
const assignment = computed(() => state.bedAssignments.find(a => a.encounterId === encId.value && !a.releasedAt))
const bed = computed(() => assignment.value ? state.beds.find(b => b.id === assignment.value!.bedId) : null)
const unit = computed(() => assignment.value ? state.units.find(u => u.id === assignment.value!.unitId) : null)

watchEffect(() => {
  if (import.meta.client && encounter.value === undefined) {
    navigateTo('/wards')
  }
})

useHead(() => ({ title: patient.value ? `Nursing Chart — ${patient.value.givenName} ${patient.value.familyName}` : 'Nursing Chart' }))

// ─── Entries sorted DESC ──────────────────────────────────────────────────────

const entries = computed(() =>
  state.nursingEntries
    .filter(n => n.encounterId === encId.value)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
)

// ─── Add entry form ───────────────────────────────────────────────────────────

const form = reactive({
  shift: 'morning' as 'morning' | 'afternoon' | 'night',
  painScore: '',
  bpSys: '',
  bpDia: '',
  hr: '',
  t: '',
  spo2: '',
  rr: '',
  poMl: '',
  ivMl: '',
  urineMl: '',
  stoolCount: '',
  notes: '',
})

const saving = ref(false)

async function saveEntry() {
  saving.value = true
  await new Promise(r => setTimeout(r, 300))

  state.nursingEntries.push({
    id: `ne-${Date.now()}`,
    encounterId: encId.value,
    patientId: patient.value?.id ?? '',
    recordedAt: new Date().toISOString(),
    recordedByUserId: state.staff[0]?.id ?? 0,
    shift: form.shift,
    vitals: {
      bpSys: form.bpSys ? Number(form.bpSys) : undefined,
      bpDia: form.bpDia ? Number(form.bpDia) : undefined,
      hr: form.hr ? Number(form.hr) : undefined,
      t: form.t ? Number(form.t) : undefined,
      spo2: form.spo2 ? Number(form.spo2) : undefined,
      rr: form.rr ? Number(form.rr) : undefined,
    },
    painScore: form.painScore ? Number(form.painScore) : undefined,
    intake: {
      poMl: form.poMl ? Number(form.poMl) : undefined,
      ivMl: form.ivMl ? Number(form.ivMl) : undefined,
    },
    output: {
      urineMl: form.urineMl ? Number(form.urineMl) : undefined,
      stoolCount: form.stoolCount ? Number(form.stoolCount) : undefined,
    },
    notes: form.notes.trim() || undefined,
    context: 'ward',
  })

  // Reset form
  Object.assign(form, {
    shift: 'morning', painScore: '', bpSys: '', bpDia: '', hr: '', t: '', spo2: '', rr: '',
    poMl: '', ivMl: '', urineMl: '', stoolCount: '', notes: '',
  })
  saving.value = false
}

function signEntry(entryId: string) {
  const entry = state.nursingEntries.find(n => n.id === entryId)
  if (entry && !entry.signedAt) entry.signedAt = new Date().toISOString()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function absTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function shiftVariant(shift: string): 'default' | 'secondary' | 'outline' {
  if (shift === 'morning') return 'default'
  if (shift === 'afternoon') return 'secondary'
  return 'outline'
}

function vitalsCompact(v?: Record<string, number | undefined>): string {
  if (!v) return '—'
  const parts: string[] = []
  if (v.bpSys && v.bpDia) parts.push(`${v.bpSys}/${v.bpDia}`)
  if (v.hr) parts.push(`HR ${v.hr}`)
  if (v.t) parts.push(`T ${v.t}°`)
  if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`)
  return parts.length ? parts.join(' · ') : '—'
}

function ioTotals(entry: typeof entries.value[0]): string {
  const inTotal = (entry.intake?.poMl ?? 0) + (entry.intake?.ivMl ?? 0)
  const outTotal = (entry.output?.urineMl ?? 0)
  if (!inTotal && !outTotal) return '—'
  return `In ${inTotal} / Out ${outTotal} mL`
}

function formatAdmitDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <Page v-if="encounter && patient">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Activity class="text-muted-foreground size-5" />
        <PageHeaderHeading
          title="Nursing Chart"
          :description="`${patient.givenName} ${patient.familyName} · ${patient.mrn}`"
        />
      </div>
      <template #actions>
        <Button
          as-child
          variant="outline"
          size="sm"
        >
          <NuxtLink :to="`/encounters/${encId}`">Open encounter</NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- Patient context card -->
      <Card>
        <CardContent class="pt-4">
          <DataList>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Patient</span>
              <span class="text-sm font-medium">{{ patient.givenName }} {{ patient.familyName }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">MRN</span>
              <span class="font-mono text-sm">{{ patient.mrn }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Ward / Bed</span>
              <span class="text-sm">{{ unit?.name ?? '—' }} · {{ bed?.label ?? '—' }}</span>
            </DataListItem>
            <DataListItem>
              <span class="text-muted-foreground text-sm">Admitted</span>
              <span class="text-sm">{{ formatAdmitDate(encounter.admissionAt) }}</span>
            </DataListItem>
          </DataList>
        </CardContent>
      </Card>

      <!-- Add entry form -->
      <SectionCard title="Add nursing entry">
        <template #header-action>
          <Badge variant="outline">
            Shift entry
          </Badge>
        </template>

        <div class="space-y-4">
          <!-- Shift + Pain -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div class="space-y-1.5">
              <Label>Shift</Label>
              <Select v-model="form.shift">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">
                    Morning
                  </SelectItem>
                  <SelectItem value="afternoon">
                    Afternoon
                  </SelectItem>
                  <SelectItem value="night">
                    Night
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label>Pain score (0–10)</Label>
              <Input
                v-model="form.painScore"
                type="number"
                min="0"
                max="10"
                placeholder="0"
              />
            </div>
          </div>

          <!-- Vitals -->
          <div>
            <p class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
              Vitals
            </p>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div class="space-y-1">
                <Label class="text-xs">BP Sys</Label>
                <Input
                  v-model="form.bpSys"
                  type="number"
                  placeholder="120"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">BP Dia</Label>
                <Input
                  v-model="form.bpDia"
                  type="number"
                  placeholder="80"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">HR (bpm)</Label>
                <Input
                  v-model="form.hr"
                  type="number"
                  placeholder="72"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Temp (°C)</Label>
                <Input
                  v-model="form.t"
                  type="number"
                  step="0.1"
                  placeholder="36.8"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">SpO₂ (%)</Label>
                <Input
                  v-model="form.spo2"
                  type="number"
                  placeholder="98"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">RR (br/min)</Label>
                <Input
                  v-model="form.rr"
                  type="number"
                  placeholder="16"
                />
              </div>
            </div>
          </div>

          <!-- I/O -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="space-y-1.5">
              <Label class="text-xs">PO intake (mL)</Label>
              <Input
                v-model="form.poMl"
                type="number"
                placeholder="0"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">IV intake (mL)</Label>
              <Input
                v-model="form.ivMl"
                type="number"
                placeholder="0"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Urine output (mL)</Label>
              <Input
                v-model="form.urineMl"
                type="number"
                placeholder="0"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Stool (count)</Label>
              <Input
                v-model="form.stoolCount"
                type="number"
                placeholder="0"
              />
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              v-model="form.notes"
              placeholder="Clinical observations, interventions, patient response…"
              :rows="2"
            />
          </div>

          <Button
            :disabled="saving"
            @click="saveEntry"
          >
            <PenSquare class="size-4" />
            Save entry
          </Button>
        </div>
      </SectionCard>

      <!-- Entries table -->
      <SectionCard
        title="Chart entries"
        :description="`${entries.length} entries`"
      >
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-40">
                  Time
                </TableHead>
                <TableHead class="w-28">
                  Shift
                </TableHead>
                <TableHead>Vitals</TableHead>
                <TableHead class="w-16">
                  Pain
                </TableHead>
                <TableHead class="w-44">
                  I/O
                </TableHead>
                <TableHead class="w-32">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="entries.length === 0">
                No entries yet. Add the first entry above.
              </TableEmpty>
              <TableRow
                v-for="entry in entries"
                :key="entry.id"
              >
                <TableCell class="text-muted-foreground text-xs">
                  <div>{{ relTime(entry.recordedAt) }}</div>
                  <div class="text-[11px]">
                    {{ absTime(entry.recordedAt) }}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="shiftVariant(entry.shift)"
                    class="capitalize text-xs"
                  >
                    {{ entry.shift }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground max-w-xs truncate text-xs">
                  {{ vitalsCompact(entry.vitals) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ entry.painScore ?? '—' }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ ioTotals(entry) }}
                </TableCell>
                <TableCell>
                  <div
                    v-if="entry.signedAt"
                    class="flex items-center gap-1"
                  >
                    <CheckCircle2 class="text-success size-3.5" />
                    <Badge
                      variant="success"
                      class="text-xs"
                    >
                      Signed
                    </Badge>
                  </div>
                  <Button
                    v-else
                    variant="outline"
                    size="sm"
                    class="text-xs"
                    @click="signEntry(entry.id)"
                  >
                    Sign
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>
  </Page>

  <div
    v-else
    class="flex items-center justify-center p-12"
  >
    <p class="text-muted-foreground text-sm">
      Encounter not found. Redirecting…
    </p>
  </div>
</template>
