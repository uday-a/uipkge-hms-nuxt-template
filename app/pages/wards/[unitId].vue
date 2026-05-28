<script setup lang="ts">
import { BedDouble, ArrowRightLeft, ExternalLink } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const unitId = computed(() => route.params.unitId as string)

const unit = computed(() => state.units.find(u => u.id === unitId.value))
const dept = computed(() => state.departments.find(d => d.id === unit.value?.departmentId))

watchEffect(() => {
  if (import.meta.client && unit.value === undefined) {
    navigateTo('/wards')
  }
})

useHead(() => ({ title: unit.value ? unit.value.name : 'Ward' }))

// ─── Bed rows ────────────────────────────────────────────────────────────────

const bedRows = computed(() => {
  const beds = state.beds.filter(b => b.unitId === unitId.value)
  return beds.map((bed) => {
    const assignment = state.bedAssignments.find(a => a.bedId === bed.id && !a.releasedAt)
    const patient = assignment ? state.patients.find(p => p.id === assignment.patientId) : null
    const encounter = assignment ? state.encounters.find(e => e.id === assignment.encounterId) : null
    return { bed, assignment, patient, encounter }
  })
})

// ─── Transfer dialog ─────────────────────────────────────────────────────────

const transferDialog = ref(false)
const transferTarget = ref<{ bedId: string, assignmentId: string, encounterId: string } | null>(null)
const transferToBedId = ref('')

const availableBeds = computed(() =>
  state.beds.filter(b => b.status === 'available' && b.id !== transferTarget.value?.bedId),
)

function openTransfer(bedId: string, assignmentId: string, encounterId: string) {
  transferTarget.value = { bedId, assignmentId, encounterId }
  transferToBedId.value = ''
  transferDialog.value = true
}

function confirmTransfer() {
  if (!transferTarget.value || !transferToBedId.value) return

  // Release old assignment
  const oldAssignment = state.bedAssignments.find(a => a.id === transferTarget.value!.assignmentId)
  if (oldAssignment) oldAssignment.releasedAt = new Date().toISOString()

  // Mark old bed available, new bed occupied
  const oldBed = state.beds.find(b => b.id === transferTarget.value!.bedId)
  if (oldBed) oldBed.status = 'available'

  const newBed = state.beds.find(b => b.id === transferToBedId.value)
  if (newBed) newBed.status = 'occupied'

  // Create new assignment
  const newUnit = state.units.find(u => u.id === newBed?.unitId)
  state.bedAssignments.push({
    id: `ba-${Date.now()}`,
    encounterId: transferTarget.value.encounterId,
    patientId: oldAssignment?.patientId ?? '',
    bedId: transferToBedId.value,
    facilityId: state.facility.id,
    unitId: newUnit?.id ?? unitId.value,
    assignedAt: new Date().toISOString(),
    reason: 'transfer',
    assignedByUserId: state.staff[0]?.id ?? 0,
  })

  // Update encounter bed
  const enc = state.encounters.find(e => e.id === transferTarget.value!.encounterId)
  if (enc) enc.bedId = transferToBedId.value

  transferDialog.value = false
}

// ─── Badge variant for bed status ────────────────────────────────────────────

function bedStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
  if (status === 'available') return 'outline'
  if (status === 'occupied') return 'secondary'
  if (status === 'cleaning') return 'secondary'
  if (status === 'maintenance' || status === 'blocked') return 'destructive'
  return 'outline'
}

// ─── Relative time ───────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<template>
  <Page v-if="unit">
    <PageHeader>
      <div class="flex items-center gap-3">
        <BedDouble class="text-muted-foreground size-6" />
        <PageHeaderHeading
          :title="unit.name"
          :description="dept?.name"
        />
        <Badge
          variant="secondary"
          class="text-xs"
        >
          {{ unit.code }}
        </Badge>
      </div>
      <template #actions>
        <Button
          as-child
          size="sm"
          variant="outline"
        >
          <NuxtLink to="/wards">All wards</NuxtLink>
        </Button>
        <Button
          as-child
          size="sm"
        >
          <NuxtLink to="/admissions/new">
            <ArrowRightLeft class="size-4" />
            Admit to unit
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-36">
                Bed
              </TableHead>
              <TableHead class="w-32">
                Status
              </TableHead>
              <TableHead>Occupant</TableHead>
              <TableHead class="w-32">
                Admitted
              </TableHead>
              <TableHead class="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="bedRows.length === 0">
              No beds found for this unit.
            </TableEmpty>
            <TableRow
              v-for="row in bedRows"
              :key="row.bed.id"
            >
              <TableCell class="font-medium text-sm">
                {{ row.bed.label }}
              </TableCell>
              <TableCell>
                <Badge
                  :variant="bedStatusVariant(row.bed.status)"
                  class="capitalize text-xs"
                >
                  {{ row.bed.status }}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  v-if="row.patient"
                  class="text-sm"
                >
                  {{ row.patient.givenName }} {{ row.patient.familyName }}
                  <span class="text-muted-foreground ml-1 font-mono text-xs">{{ row.patient.mrn }}</span>
                </span>
                <span
                  v-else
                  class="text-muted-foreground text-sm"
                >—</span>
              </TableCell>
              <TableCell class="text-muted-foreground text-sm">
                <span v-if="row.assignment">
                  {{ relTime(row.assignment.assignedAt) }}
                </span>
                <span v-else>—</span>
              </TableCell>
              <TableCell>
                <!-- Actions when occupied -->
                <DropdownMenu v-if="row.assignment && row.encounter">
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      ···
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      @click="openTransfer(row.bed.id, row.assignment.id, row.encounter.id)"
                    >
                      <ArrowRightLeft class="size-4" />
                      Transfer
                    </DropdownMenuItem>
                    <DropdownMenuItem as-child>
                      <NuxtLink :to="`/encounters/${row.encounter.id}`">
                        <ExternalLink class="size-4" />
                        Open encounter
                      </NuxtLink>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem as-child>
                      <NuxtLink :to="`/discharge/${row.encounter.id}`">
                        Discharge
                      </NuxtLink>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </PageBody>

    <!-- Transfer Dialog -->
    <Dialog v-model:open="transferDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer patient</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Transfer to bed</Label>
            <Select v-model="transferToBedId">
              <SelectTrigger>
                <SelectValue placeholder="Select available bed…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="b in availableBeds"
                  :key="b.id"
                  :value="b.id"
                >
                  {{ b.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="!transferToBedId"
            @click="confirmTransfer"
          >
            Confirm transfer
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
      Unit not found. Redirecting…
    </p>
  </div>
</template>
