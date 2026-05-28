<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
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
useHead({ title: 'Transfusion Requests' })

const state = useMockState()

// ── Helpers ───────────────────────────────────────────────────────────────────

function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function componentLabel(c: string) {
  const map: Record<string, string> = {
    whole_blood: 'Whole blood',
    prbc: 'PRBC',
    platelets: 'Platelets',
    plasma: 'Plasma',
    cryoprecipitate: 'Cryoprecipitate',
  }
  return map[c] ?? c
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

function priorityVariant(priority: string): BadgeVariant {
  if (priority === 'stat') return 'destructive'
  if (priority === 'urgent') return 'default'
  return 'secondary'
}

function statusVariant(status: string): BadgeVariant {
  if (status === 'pending_crossmatch') return 'default'
  if (status === 'crossmatched') return 'secondary'
  if (status === 'issued') return 'default'
  if (status === 'cancelled') return 'destructive'
  if (status === 'returned') return 'secondary'
  return 'outline'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending_crossmatch: 'Pending crossmatch',
    crossmatched: 'Crossmatched',
    issued: 'Issued',
    returned: 'Returned',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

// ── New request dialog ────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const submitting = ref(false)

const form = reactive({
  patientId: '',
  encounterId: '',
  bloodGroup: '' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '',
  component: '' as 'whole_blood' | 'prbc' | 'platelets' | 'plasma' | 'cryoprecipitate' | '',
  unitsRequested: 1,
  priority: '' as 'routine' | 'urgent' | 'stat' | '',
})

function openAddDialog() {
  form.patientId = ''
  form.encounterId = ''
  form.bloodGroup = ''
  form.component = ''
  form.unitsRequested = 1
  form.priority = ''
  dialogOpen.value = true
}

function submitRequest() {
  if (!form.patientId || !form.encounterId || !form.bloodGroup || !form.component || form.unitsRequested < 1 || !form.priority) return
  submitting.value = true

  const newRequest = {
    id: `req-${Date.now()}`,
    patientId: form.patientId,
    encounterId: form.encounterId,
    bloodGroup: form.bloodGroup,
    component: form.component,
    unitsRequested: form.unitsRequested,
    priority: form.priority,
    requestedAt: new Date().toISOString(),
    requestedByUserId: 101,
    status: 'pending_crossmatch' as const,
  }
  state.transfusionRequests.push(newRequest)

  submitting.value = false
  dialogOpen.value = false
}

// When patient changes, auto-pick first active encounter
const activeEncountersForPatient = computed(() => {
  if (!form.patientId) return []
  return state.encounters.filter(e => e.patientId === form.patientId && ['arrived', 'in_progress'].includes(e.status))
})

watch(() => form.patientId, () => {
  const list = activeEncountersForPatient.value
  form.encounterId = list[0]?.id ?? ''
})
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Transfusion Requests"
        description="Cross-match and transfusion request management"
      />
      <template #actions>
        <Button
          size="sm"
          @click="openAddDialog"
        >
          <Plus class="size-4" />
          New request
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <SectionCard title="All Requests">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="state.transfusionRequests.length === 0">
                No transfusion requests.
              </TableEmpty>
              <TableRow
                v-for="req in state.transfusionRequests"
                :key="req.id"
              >
                <TableCell class="font-mono text-xs">
                  {{ req.id }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ patientName(req.patientId) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ req.bloodGroup }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ componentLabel(req.component) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ req.unitsRequested }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="priorityVariant(req.priority)"
                    class="capitalize text-xs"
                  >
                    {{ req.priority }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="statusVariant(req.status)"
                    class="text-xs"
                  >
                    {{ statusLabel(req.status) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ fmtDateTime(req.requestedAt) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>

    <!-- New request dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Transfusion Request</DialogTitle>
          <DialogDescription>
            Create a new cross-match / transfusion request.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Patient <span class="text-destructive">*</span></Label>
            <Select v-model="form.patientId">
              <SelectTrigger>
                <SelectValue placeholder="Select patient…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="p in state.patients"
                  :key="p.id"
                  :value="p.id"
                >
                  {{ p.givenName }} {{ p.familyName }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Encounter <span class="text-destructive">*</span></Label>
            <Select v-model="form.encounterId">
              <SelectTrigger>
                <SelectValue placeholder="Select encounter…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="e in activeEncountersForPatient"
                  :key="e.id"
                  :value="e.id"
                >
                  {{ e.id }} — {{ e.type }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Blood group <span class="text-destructive">*</span></Label>
              <Select v-model="form.bloodGroup">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">
                    A+
                  </SelectItem>
                  <SelectItem value="A-">
                    A-
                  </SelectItem>
                  <SelectItem value="B+">
                    B+
                  </SelectItem>
                  <SelectItem value="B-">
                    B-
                  </SelectItem>
                  <SelectItem value="AB+">
                    AB+
                  </SelectItem>
                  <SelectItem value="AB-">
                    AB-
                  </SelectItem>
                  <SelectItem value="O+">
                    O+
                  </SelectItem>
                  <SelectItem value="O-">
                    O-
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label>Component <span class="text-destructive">*</span></Label>
              <Select v-model="form.component">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whole_blood">
                    Whole blood
                  </SelectItem>
                  <SelectItem value="prbc">
                    PRBC
                  </SelectItem>
                  <SelectItem value="platelets">
                    Platelets
                  </SelectItem>
                  <SelectItem value="plasma">
                    Plasma
                  </SelectItem>
                  <SelectItem value="cryoprecipitate">
                    Cryoprecipitate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="req-units">Units requested <span class="text-destructive">*</span></Label>
              <Input
                id="req-units"
                v-model.number="form.unitsRequested"
                type="number"
                min="1"
              />
            </div>

            <div class="space-y-1.5">
              <Label>Priority <span class="text-destructive">*</span></Label>
              <Select v-model="form.priority">
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">
                    Routine
                  </SelectItem>
                  <SelectItem value="urgent">
                    Urgent
                  </SelectItem>
                  <SelectItem value="stat">
                    Stat
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            :disabled="submitting || !form.patientId || !form.encounterId || !form.bloodGroup || !form.component || form.unitsRequested < 1 || !form.priority"
            @click="submitRequest"
          >
            Create request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
