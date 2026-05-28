<script setup lang="ts">
import { Plus, Loader2 } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const encId = computed(() => route.params.encounterId as string)
const encounter = computed(() => state.encounters.find(e => e.id === encId.value))
const patient = computed(() => encounter.value ? state.patients.find(p => p.id === encounter.value!.patientId) : null)

watchEffect(() => {
  if (import.meta.client && encounter.value === undefined) {
    navigateTo('/wards')
  }
})

useHead(() => ({ title: patient.value ? `MAR — ${patient.value.givenName} ${patient.value.familyName}` : 'MAR' }))

// ─── Active med requests for this encounter ───────────────────────────────────

const medRequests = computed(() =>
  state.prescriptions.filter(rx => rx.encounterId === encId.value && rx.status === 'active'),
)

function drugForRequest(drugId: string) {
  return state.drugs.find(d => d.id === drugId)
}

function adminForRequest(rxId: string) {
  return state.medicationAdministrations
    .filter(m => m.medicationRequestId === rxId)
    .sort((a, b) => b.administeredAt.localeCompare(a.administeredAt))
}

// ─── Administer dialog ────────────────────────────────────────────────────────

interface AdminDialog {
  open: boolean
  rxId: string
  drugId: string
  doseValue: number
  doseUnit: string
  route: string
  requiresWitness: boolean
}

const adminDialog = reactive<AdminDialog>({
  open: false,
  rxId: '',
  drugId: '',
  doseValue: 0,
  doseUnit: '',
  route: '',
  requiresWitness: false,
})

const adminForm = reactive({
  dose: '',
  status: 'given' as 'given' | 'held' | 'refused' | 'omitted' | 'partial',
  site: '',
  notes: '',
  witnessUserId: '',
})

const submitting = ref(false)

function openAdminister(rxId: string) {
  const rx = state.prescriptions.find(p => p.id === rxId)
  if (!rx) return
  const drug = state.drugs.find(d => d.id === rx.drugId)
  const isControlled = drug?.schedule !== undefined

  adminDialog.open = true
  adminDialog.rxId = rxId
  adminDialog.drugId = rx.drugId
  adminDialog.doseValue = rx.doseValue
  adminDialog.doseUnit = rx.doseUnit
  adminDialog.route = rx.route
  adminDialog.requiresWitness = isControlled

  Object.assign(adminForm, { dose: String(rx.doseValue), status: 'given', site: '', notes: '', witnessUserId: '' })
}

async function confirmAdminister() {
  if (!adminForm.dose) return
  submitting.value = true
  await new Promise(r => setTimeout(r, 300))

  state.medicationAdministrations.push({
    id: `mar-${Date.now()}`,
    medicationRequestId: adminDialog.rxId,
    encounterId: encId.value,
    patientId: patient.value?.id ?? '',
    administeredAt: new Date().toISOString(),
    administeredByUserId: state.staff[0]?.id ?? 0,
    doseValue: Number(adminForm.dose),
    doseUnit: adminDialog.doseUnit,
    route: adminForm.site || adminDialog.route,
    status: adminForm.status,
    notes: adminForm.notes.trim() || undefined,
  })

  submitting.value = false
  adminDialog.open = false
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function adminStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'given') return 'default'
  if (status === 'held') return 'secondary'
  if (status === 'partial') return 'outline'
  return 'destructive'
}

function absTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function staffName(id?: number): string {
  if (!id) return '—'
  return state.staff.find(s => s.id === id)?.name ?? `User #${id}`
}

const nurses = computed(() => state.staff.filter(s => s.role === 'nurse'))
</script>

<template>
  <Page v-if="encounter && patient">
    <PageHeader>
      <PageHeaderHeading
        title="Medication Administration Record"
        :description="`${patient.givenName} ${patient.familyName} · ${patient.mrn}`"
      />
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
      <!-- Patient context -->
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
              <span class="text-muted-foreground text-sm">Encounter</span>
              <span class="font-mono text-sm">{{ encId }}</span>
            </DataListItem>
          </DataList>
        </CardContent>
      </Card>

      <!-- Empty state -->
      <div
        v-if="medRequests.length === 0"
        class="text-muted-foreground flex items-center justify-center py-12 text-sm"
      >
        No active medication orders for this encounter.
      </div>

      <!-- One section per active med request -->
      <section
        v-for="rx in medRequests"
        :key="rx.id"
        class="rounded-md border bg-card"
      >
        <header class="px-6 pt-6 pb-3">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold">
                {{ drugForRequest(rx.drugId)?.display ?? rx.drugId }}
              </h3>
              <p class="text-muted-foreground text-sm mt-0.5">
                {{ rx.doseValue }} {{ rx.doseUnit }} · {{ rx.route }} · {{ rx.frequencyText }}
                <Badge
                  v-if="rx.prn"
                  variant="outline"
                  class="ml-2 text-xs"
                >
                  PRN
                </Badge>
                <Badge
                  v-if="drugForRequest(rx.drugId)?.schedule"
                  variant="destructive"
                  class="ml-1 text-xs"
                >
                  Schedule {{ drugForRequest(rx.drugId)?.schedule }}
                </Badge>
              </p>
            </div>
            <Button
              size="sm"
              @click="openAdminister(rx.id)"
            >
              <Plus class="size-4" />
              Administer
            </Button>
          </div>
        </header>
        <div class="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-40">
                  Time
                </TableHead>
                <TableHead class="w-28">
                  Status
                </TableHead>
                <TableHead class="w-28">
                  Dose
                </TableHead>
                <TableHead class="w-24">
                  Route
                </TableHead>
                <TableHead>Notes</TableHead>
                <TableHead class="w-32">
                  By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="adminForRequest(rx.id).length === 0">
                No administrations recorded.
              </TableEmpty>
              <TableRow
                v-for="admin in adminForRequest(rx.id)"
                :key="admin.id"
              >
                <TableCell class="text-muted-foreground text-xs">
                  {{ absTime(admin.administeredAt) }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="adminStatusVariant(admin.status)"
                    class="capitalize text-xs"
                  >
                    {{ admin.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm">
                  {{ admin.doseValue }} {{ admin.doseUnit }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm capitalize">
                  {{ admin.route ?? '—' }}
                </TableCell>
                <TableCell class="text-muted-foreground max-w-xs truncate text-xs">
                  {{ admin.notes ?? '—' }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ staffName(admin.administeredByUserId) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </PageBody>

    <!-- Administer dialog -->
    <Dialog v-model:open="adminDialog.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record administration</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-1">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>Dose</Label>
              <Input
                v-model="adminForm.dose"
                type="number"
                step="0.1"
                :placeholder="String(adminDialog.doseValue)"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Status</Label>
              <Select v-model="adminForm.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="given">
                    Given
                  </SelectItem>
                  <SelectItem value="held">
                    Held
                  </SelectItem>
                  <SelectItem value="refused">
                    Refused
                  </SelectItem>
                  <SelectItem value="omitted">
                    Omitted
                  </SelectItem>
                  <SelectItem value="partial">
                    Partial
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Site / route</Label>
            <Input
              v-model="adminForm.site"
              :placeholder="adminDialog.route"
            />
          </div>

          <div
            v-if="adminDialog.requiresWitness"
            class="space-y-1.5"
          >
            <Label>Witness <span class="text-destructive">*</span></Label>
            <Select v-model="adminForm.witnessUserId">
              <SelectTrigger>
                <SelectValue placeholder="Select witness…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="n in nurses"
                  :key="n.id"
                  :value="String(n.id)"
                >
                  {{ n.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              v-model="adminForm.notes"
              placeholder="Any relevant notes…"
              :rows="2"
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
            :disabled="submitting || !adminForm.dose || (adminDialog.requiresWitness && !adminForm.witnessUserId)"
            @click="confirmAdminister"
          >
            <Loader2
              v-if="submitting"
              class="size-4 animate-spin"
            />
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
