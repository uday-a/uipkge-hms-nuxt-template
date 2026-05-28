<script setup lang="ts">
import { Scissors, Play, Square, CheckSquare, ExternalLink, Activity, Stethoscope } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const bookingId = computed(() => route.params.id as string)

const booking = computed(() => state.surgeryBookings.find(b => b.id === bookingId.value))

watchEffect(() => {
  if (import.meta.client && booking.value === undefined) {
    navigateTo('/ot')
  }
})

useHead(() => ({
  title: booking.value ? `Surgery — ${booking.value.procedureName}` : 'Surgery Booking',
}))

// ─── Lookups ────────────────────────────────────────────────────────────────────

function staffName(userId?: number) {
  if (!userId) return '—'
  return state.staff.find(s => s.id === userId)?.name ?? `User #${userId}`
}

function patientName(patientId: string) {
  const p = state.patients.find(pt => pt.id === patientId)
  return p ? `${p.givenName} ${p.familyName}` : patientId
}

function roomName(roomId: string) {
  return state.units.find(u => u.id === roomId)?.name ?? roomId
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Status helpers ────────────────────────────────────────────────────────────

type BookingStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

function statusVariant(status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'scheduled') return 'outline'
  if (status === 'confirmed') return 'secondary'
  if (status === 'in_progress') return 'default'
  if (status === 'completed') return 'default'
  if (status === 'cancelled') return 'destructive'
  return 'outline'
}

function statusLabel(status: string) {
  return status.replace('_', ' ')
}

// ─── PAC + checklist + anesthesia ──────────────────────────────────────────────

const pac = computed(() => state.pacAssessments.find(p => p.surgeryBookingId === bookingId.value))
const checklist = computed(() => state.surgicalChecklists.find(c => c.surgeryBookingId === bookingId.value))
const anesRecord = computed(() => state.anesthesiaRecords.find(a => a.surgeryBookingId === bookingId.value))

function checklistPhaseStatus(phase: 'sign_in' | 'time_out' | 'sign_out') {
  if (!checklist.value) return 'pending'
  if (phase === 'sign_in') return checklist.value.signInCompletedAt ? 'completed' : 'pending'
  if (phase === 'time_out') return checklist.value.timeOutCompletedAt ? 'completed' : 'pending'
  if (phase === 'sign_out') return checklist.value.signOutCompletedAt ? 'completed' : 'pending'
  return 'pending'
}

// ─── Booking actions ────────────────────────────────────────────────────────────

function startSurgery() {
  if (!booking.value) return
  booking.value.status = 'in_progress'
  booking.value.startedAt = new Date().toISOString()
}

function completeSurgery() {
  if (!booking.value) return
  booking.value.status = 'completed'
  booking.value.endedAt = new Date().toISOString()
}

function cancelSurgery() {
  if (!booking.value) return
  booking.value.status = 'cancelled'
}

// ─── Reschedule dialog ──────────────────────────────────────────────────────────

const rescheduleOpen = ref(false)
const newDate = ref('')
const newTime = ref('')
const newOrRoomId = ref('')

function openReschedule() {
  if (!booking.value) return
  newDate.value = new Date(booking.value.scheduledAt).toISOString().slice(0, 10)
  newTime.value = new Date(booking.value.scheduledAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  newOrRoomId.value = booking.value.orRoomId
  rescheduleOpen.value = true
}

function saveReschedule() {
  if (!booking.value || !newDate.value || !newTime.value) return
  booking.value.scheduledAt = `${newDate.value}T${newTime.value}:00.000Z`
  booking.value.orRoomId = newOrRoomId.value || booking.value.orRoomId
  rescheduleOpen.value = false
}

const orRooms = computed(() => {
  const ot = state.units.filter(u => u.departmentId === 'dept-ot')
  if (ot.length) return ot
  return [
    { id: 'unit-ot-1', code: 'OT-1', name: 'Operating Room 1', departmentId: 'dept-ot' },
    { id: 'unit-ot-2', code: 'OT-2', name: 'Operating Room 2', departmentId: 'dept-ot' },
  ]
})

// ─── Op note ──────────────────────────────────────────────────────────────────

const opNoteText = ref('')
const opNoteSaved = ref(false)
const opNoteSignedNoteId = ref<string | null>(null)

// On mount, load existing operative note if any
onMounted(() => {
  if (!booking.value) return
  const existing = state.clinicalNotes.find(
    n => n.encounterId === booking.value!.encounterId && n.kind === 'operative',
  )
  if (existing) {
    opNoteText.value = typeof existing.content === 'string' ? existing.content : existing.content?.text ?? ''
    if (existing.status === 'signed') opNoteSignedNoteId.value = existing.id
  }
})

function saveOpNote() {
  if (!booking.value) return
  const existingIdx = state.clinicalNotes.findIndex(
    n => n.encounterId === booking.value!.encounterId && n.kind === 'operative',
  )
  if (existingIdx >= 0) {
    const note = state.clinicalNotes[existingIdx]!
    note.content = { text: opNoteText.value }
    opNoteSaved.value = true
  }
  else {
    const id = `cnote-op-${Date.now()}`
    state.clinicalNotes.push({
      id,
      encounterId: booking.value.encounterId,
      authorUserId: booking.value.primarySurgeonUserId,
      kind: 'operative',
      content: { text: opNoteText.value },
      status: 'draft',
    })
    opNoteSaved.value = true
  }
}

function signOpNote() {
  if (!booking.value) return
  const existing = state.clinicalNotes.find(
    n => n.encounterId === booking.value!.encounterId && n.kind === 'operative',
  )
  if (existing) {
    existing.status = 'signed'
    existing.signedAt = new Date().toISOString()
    existing.signedByUserId = booking.value.primarySurgeonUserId
    opNoteSignedNoteId.value = existing.id
  }
}
</script>

<template>
  <Page v-if="booking">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Scissors class="text-muted-foreground size-5" />
        <PageHeaderHeading
          :title="`Surgery — ${booking.procedureName}`"
          :description="`Booking #${booking.id}`"
        />
      </div>
      <template #actions>
        <Badge
          :variant="statusVariant(booking.status)"
          class="capitalize"
        >
          {{ statusLabel(booking.status) }}
        </Badge>
        <Button
          v-if="booking.status === 'scheduled' || booking.status === 'confirmed'"
          size="sm"
          class="gap-2"
          @click="startSurgery"
        >
          <Play class="size-4" />
          Start surgery
        </Button>
        <Button
          v-if="booking.status === 'in_progress'"
          size="sm"
          variant="secondary"
          class="gap-2"
          @click="completeSurgery"
        >
          <CheckSquare class="size-4" />
          Complete
        </Button>
        <Button
          v-if="booking.status !== 'completed' && booking.status !== 'cancelled'"
          size="sm"
          variant="destructive"
          class="gap-2"
          @click="cancelSurgery"
        >
          <Square class="size-4" />
          Cancel
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <Tabs default-value="overview">
        <TabsList class="mb-4">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="pac">
            PAC
          </TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist
          </TabsTrigger>
          <TabsTrigger value="anesthesia">
            Anesthesia
          </TabsTrigger>
          <TabsTrigger value="opnote">
            Op note
          </TabsTrigger>
        </TabsList>

        <!-- Overview -->
        <TabsContent value="overview">
          <SectionCard title="Booking details">
            <template #header-action>
              <Dialog v-model:open="rescheduleOpen">
                <DialogTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="booking.status !== 'scheduled' && booking.status !== 'confirmed'"
                    @click="openReschedule"
                  >
                    Edit / Reschedule
                  </Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reschedule surgery</DialogTitle>
                  </DialogHeader>
                  <div class="space-y-4 py-2">
                    <div class="grid gap-4 sm:grid-cols-2">
                      <div class="space-y-1.5">
                        <Label>Date</Label>
                        <Input
                          v-model="newDate"
                          type="date"
                        />
                      </div>
                      <div class="space-y-1.5">
                        <Label>Time</Label>
                        <Input
                          v-model="newTime"
                          type="time"
                        />
                      </div>
                    </div>
                    <div class="space-y-1.5">
                      <Label>OR Room</Label>
                      <Select v-model="newOrRoomId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="room in orRooms"
                            :key="room.id"
                            :value="room.id"
                          >
                            {{ room.name }}
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
                    <Button @click="saveReschedule">
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </template>
            <DataList>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Patient</span>
                <span class="text-sm font-medium">{{ patientName(booking.patientId) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Encounter</span>
                <span class="text-sm font-medium">{{ booking.encounterId }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">OR Room</span>
                <span class="text-sm font-medium">{{ roomName(booking.orRoomId) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Scheduled</span>
                <span class="text-sm font-medium">{{ formatDateTime(booking.scheduledAt) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Est. duration</span>
                <span class="text-sm font-medium">{{ booking.estimatedMinutes }} min</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Primary surgeon</span>
                <span class="text-sm font-medium">{{ staffName(booking.primarySurgeonUserId) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Anesthetist</span>
                <span class="text-sm font-medium">{{ staffName(booking.anesthetistUserId) }}</span>
              </DataListItem>
              <DataListItem>
                <span class="text-muted-foreground text-sm">Scrub nurse</span>
                <span class="text-sm font-medium">{{ staffName(booking.scrubNurseUserId) }}</span>
              </DataListItem>
              <DataListItem v-if="booking.startedAt">
                <span class="text-muted-foreground text-sm">Started at</span>
                <span class="text-sm font-medium">{{ formatDateTime(booking.startedAt) }}</span>
              </DataListItem>
              <DataListItem v-if="booking.endedAt">
                <span class="text-muted-foreground text-sm">Ended at</span>
                <span class="text-sm font-medium">{{ formatDateTime(booking.endedAt) }}</span>
              </DataListItem>
            </DataList>
          </SectionCard>
        </TabsContent>

        <!-- PAC -->
        <TabsContent value="pac">
          <SectionCard title="Pre-Anesthesia Checklist">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Stethoscope class="text-muted-foreground size-4" />
                <div>
                  <p class="text-sm font-medium">
                    PAC Assessment
                  </p>
                  <p class="text-muted-foreground text-xs">
                    Pre-operative anesthesia evaluation
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <Badge
                  v-if="pac"
                  :variant="pac.status === 'reviewed' ? 'default' : pac.status === 'completed' ? 'secondary' : 'outline'"
                  class="capitalize"
                >
                  {{ pac.status }}
                </Badge>
                <Badge
                  v-else
                  variant="outline"
                >
                  Not started
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  class="gap-2"
                  as-child
                >
                  <NuxtLink :to="`/pac/${booking.id}`">
                    <ExternalLink class="size-3.5" />
                    Open PAC editor
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <!-- Checklist -->
        <TabsContent value="checklist">
          <SectionCard title="WHO Surgical Safety Checklist">
            <div class="space-y-4">
              <!-- Sign-In -->
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p class="text-sm font-medium">
                    Sign-In
                  </p>
                  <p class="text-muted-foreground text-xs">
                    Before induction of anesthesia
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <Badge
                    :variant="checklistPhaseStatus('sign_in') === 'completed' ? 'default' : 'outline'"
                    class="capitalize"
                  >
                    {{ checklistPhaseStatus('sign_in') }}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    class="gap-2"
                    as-child
                  >
                    <NuxtLink :to="`/ot/bookings/${booking.id}/checklist?phase=sign_in`">
                      <CheckSquare class="size-3.5" />
                      Open
                    </NuxtLink>
                  </Button>
                </div>
              </div>

              <!-- Time-Out -->
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p class="text-sm font-medium">
                    Time-Out
                  </p>
                  <p class="text-muted-foreground text-xs">
                    Before skin incision
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <Badge
                    :variant="checklistPhaseStatus('time_out') === 'completed' ? 'default' : 'outline'"
                    class="capitalize"
                  >
                    {{ checklistPhaseStatus('time_out') }}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    class="gap-2"
                    as-child
                  >
                    <NuxtLink :to="`/ot/bookings/${booking.id}/checklist?phase=time_out`">
                      <CheckSquare class="size-3.5" />
                      Open
                    </NuxtLink>
                  </Button>
                </div>
              </div>

              <!-- Sign-Out -->
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p class="text-sm font-medium">
                    Sign-Out
                  </p>
                  <p class="text-muted-foreground text-xs">
                    Before any team member leaves the OR
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <Badge
                    :variant="checklistPhaseStatus('sign_out') === 'completed' ? 'default' : 'outline'"
                    class="capitalize"
                  >
                    {{ checklistPhaseStatus('sign_out') }}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    class="gap-2"
                    as-child
                  >
                    <NuxtLink :to="`/ot/bookings/${booking.id}/checklist?phase=sign_out`">
                      <CheckSquare class="size-3.5" />
                      Open
                    </NuxtLink>
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <!-- Anesthesia -->
        <TabsContent value="anesthesia">
          <SectionCard title="Anesthesia Record">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Activity class="text-muted-foreground size-4" />
                <div>
                  <p class="text-sm font-medium">
                    Anesthesia Record
                  </p>
                  <p class="text-muted-foreground text-xs">
                    Intraoperative anesthesia documentation
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <Badge
                  v-if="anesRecord"
                  :variant="anesRecord.endAt ? 'default' : 'secondary'"
                >
                  {{ anesRecord.endAt ? 'Completed' : 'In progress' }}
                </Badge>
                <Badge
                  v-else
                  variant="outline"
                >
                  Not started
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  class="gap-2"
                  as-child
                >
                  <NuxtLink :to="`/anesthesia/${booking.id}`">
                    <ExternalLink class="size-3.5" />
                    Open editor
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <!-- Op note -->
        <TabsContent value="opnote">
          <SectionCard title="Operative Note">
            <div
              v-if="opNoteSignedNoteId"
              class="space-y-4"
            >
              <div class="flex items-center gap-2">
                <Badge variant="default">
                  Signed
                </Badge>
                <span class="text-muted-foreground text-xs">This operative note has been signed.</span>
              </div>
              <div class="bg-muted/40 rounded-md border p-3 text-sm whitespace-pre-wrap">
                {{ opNoteText }}
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="opNoteSignedNoteId = null"
              >
                Amend
              </Button>
            </div>
            <div
              v-else
              class="space-y-4"
            >
              <Textarea
                v-model="opNoteText"
                placeholder="Operative findings, technique, complications, closure…"
                rows="8"
              />
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="saveOpNote"
                >
                  Save draft
                </Button>
                <Button
                  size="sm"
                  :disabled="!opNoteText.trim()"
                  @click="signOpNote"
                >
                  Sign note
                </Button>
              </div>
              <p
                v-if="opNoteSaved && !opNoteSignedNoteId"
                class="text-muted-foreground text-xs"
              >
                Draft saved.
              </p>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>
</template>
