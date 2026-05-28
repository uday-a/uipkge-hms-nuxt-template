<script setup lang="ts">
import { CheckSquare } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionCard } from '@/components/ui/section-card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Surgical Checklist' })

const route = useRoute()
const state = useMockState()

const bookingId = computed(() => route.params.id as string)
const initialPhase = computed(() => (route.query.phase as string) || 'sign_in')

const booking = computed(() => state.surgeryBookings.find(b => b.id === bookingId.value))

watchEffect(() => {
  if (import.meta.client && booking.value === undefined) {
    navigateTo('/ot')
  }
})

const activeTab = ref(initialPhase.value)

// ─── Checklist items per phase ─────────────────────────────────────────────────

const SIGN_IN_ITEMS = [
  { key: 'patientIdentityConfirmed', label: 'Patient identity confirmed' },
  { key: 'siteMarked', label: 'Surgical site marked' },
  { key: 'anaesthesiaChecked', label: 'Anesthesia safety check complete' },
  { key: 'pulseOximeter', label: 'Pulse oximeter on patient and functioning' },
  { key: 'knownAllergies', label: 'Known allergy reviewed' },
  { key: 'difficultAirway', label: 'Difficult airway / aspiration risk assessed' },
  { key: 'bloodLossRisk', label: 'Risk of >500 ml blood loss (>7 ml/kg in children) assessed' },
]

const TIME_OUT_ITEMS = [
  { key: 'introductionsDone', label: 'All team members introduced by name and role' },
  { key: 'patientNameSiteConfirmed', label: 'Patient name, procedure, site, and position confirmed' },
  { key: 'antibioticProphylaxis', label: 'Antibiotic prophylaxis given within last 60 minutes' },
  { key: 'essentialImagingDisplayed', label: 'Essential imaging displayed' },
  { key: 'criticalStepsDiscussed', label: 'Anticipated critical events reviewed' },
]

const SIGN_OUT_ITEMS = [
  { key: 'procedureNameRecorded', label: 'Name of procedure recorded' },
  { key: 'equipmentAccountedFor', label: 'Instrument, sponge, and needle counts correct (or not applicable)' },
  { key: 'specimenLabelled', label: 'Specimen labelled (including patient name)' },
  { key: 'anyEquipmentConcerns', label: 'Any equipment problems to be addressed' },
  { key: 'recoveryHandover', label: 'Key concerns for recovery and management of this patient reviewed' },
]

// ─── Reactive checklist state ──────────────────────────────────────────────────

// Find or create the checklist record
const checklist = computed(() => state.surgicalChecklists.find(c => c.surgeryBookingId === bookingId.value))

function ensureChecklist() {
  if (!checklist.value && booking.value) {
    state.surgicalChecklists.push({
      id: `sc-${Date.now()}`,
      surgeryBookingId: bookingId.value,
      patientId: booking.value.patientId,
      completedByUserId: booking.value.scrubNurseUserId ?? booking.value.primarySurgeonUserId,
      status: 'pending',
    })
  }
}

// Local reactive copies of item states
const signInChecks = reactive<Record<string, boolean>>({})
const timeOutChecks = reactive<Record<string, boolean>>({})
const signOutChecks = reactive<Record<string, boolean>>({})

const signInNotes = ref('')
const timeOutNotes = ref('')
const signOutNotes = ref('')

onMounted(() => {
  ensureChecklist()
  if (checklist.value) {
    for (const item of SIGN_IN_ITEMS) {
      signInChecks[item.key] = checklist.value.signInItems?.[item.key] ?? false
    }
    for (const item of TIME_OUT_ITEMS) {
      timeOutChecks[item.key] = checklist.value.timeOutItems?.[item.key] ?? false
    }
    for (const item of SIGN_OUT_ITEMS) {
      signOutChecks[item.key] = checklist.value.signOutItems?.[item.key] ?? false
    }
  }
  else {
    for (const item of SIGN_IN_ITEMS) signInChecks[item.key] = false
    for (const item of TIME_OUT_ITEMS) timeOutChecks[item.key] = false
    for (const item of SIGN_OUT_ITEMS) signOutChecks[item.key] = false
  }
})

// ─── Phase locking logic ────────────────────────────────────────────────────────

const signInDone = computed(() => !!checklist.value?.signInCompletedAt)
const timeOutDone = computed(() => !!checklist.value?.timeOutCompletedAt)

function isTabLocked(phase: 'sign_in' | 'time_out' | 'sign_out') {
  if (phase === 'time_out') return !signInDone.value
  if (phase === 'sign_out') return !timeOutDone.value
  return false
}

// ─── Complete phase ─────────────────────────────────────────────────────────────

function completePhase(phase: 'sign_in' | 'time_out' | 'sign_out') {
  ensureChecklist()
  const cl = checklist.value!
  const now = new Date().toISOString()

  if (phase === 'sign_in') {
    cl.signInItems = { ...signInChecks }
    cl.signInCompletedAt = now
    cl.status = 'sign_in_done'
    activeTab.value = 'time_out'
  }
  else if (phase === 'time_out') {
    cl.timeOutItems = { ...timeOutChecks }
    cl.timeOutCompletedAt = now
    cl.status = 'timeout_done'
    activeTab.value = 'sign_out'
  }
  else if (phase === 'sign_out') {
    cl.signOutItems = { ...signOutChecks }
    cl.signOutCompletedAt = now
    cl.status = 'completed'
  }
}
</script>

<template>
  <Page v-if="booking">
    <PageHeader>
      <div class="flex items-center gap-3">
        <CheckSquare class="text-muted-foreground size-5" />
        <PageHeaderHeading
          title="Surgical Safety Checklist"
          :description="`${booking.procedureName} — WHO 3-phase`"
        />
      </div>
      <template #actions>
        <Button
          variant="outline"
          size="sm"
          as-child
        >
          <NuxtLink :to="`/ot/bookings/${bookingId}`">
            Back to booking
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody class="max-w-2xl">
      <Tabs v-model="activeTab">
        <TabsList class="mb-4">
          <TabsTrigger value="sign_in">
            Sign-In
            <Badge
              v-if="signInDone"
              variant="default"
              class="ml-1.5 scale-75 text-[10px]"
            >
              Done
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="time_out"
            :disabled="isTabLocked('time_out')"
          >
            Time-Out
            <Badge
              v-if="timeOutDone"
              variant="default"
              class="ml-1.5 scale-75 text-[10px]"
            >
              Done
            </Badge>
            <Badge
              v-else-if="isTabLocked('time_out')"
              variant="outline"
              class="ml-1.5 scale-75 text-[10px]"
            >
              Locked
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="sign_out"
            :disabled="isTabLocked('sign_out')"
          >
            Sign-Out
            <Badge
              v-if="checklist?.signOutCompletedAt"
              variant="default"
              class="ml-1.5 scale-75 text-[10px]"
            >
              Done
            </Badge>
            <Badge
              v-else-if="isTabLocked('sign_out')"
              variant="outline"
              class="ml-1.5 scale-75 text-[10px]"
            >
              Locked
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- Sign-In -->
        <TabsContent value="sign_in">
          <SectionCard
            title="Sign-In"
            description="Completed before induction of anesthesia"
          >
            <div class="space-y-4">
              <div
                v-if="signInDone"
                class="flex items-center gap-2"
              >
                <Badge variant="default">
                  Completed
                </Badge>
                <span class="text-muted-foreground text-xs">
                  Signed at {{ new Date(checklist!.signInCompletedAt!).toLocaleString() }}
                </span>
              </div>

              <div class="space-y-4">
                <div
                  v-for="item in SIGN_IN_ITEMS"
                  :key="item.key"
                  class="flex items-start gap-3"
                >
                  <Checkbox
                    :id="`si-${item.key}`"
                    v-model="signInChecks[item.key]"
                    :disabled="signInDone"
                  />
                  <Label
                    :for="`si-${item.key}`"
                    class="cursor-pointer text-sm leading-snug"
                    :class="{ 'opacity-60': signInDone }"
                  >
                    {{ item.label }}
                  </Label>
                </div>
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs font-medium uppercase tracking-wide">Notes</Label>
                <Textarea
                  v-model="signInNotes"
                  :disabled="signInDone"
                  placeholder="Any notes for sign-in phase…"
                  rows="3"
                />
              </div>

              <Button
                v-if="!signInDone"
                @click="completePhase('sign_in')"
              >
                <CheckSquare class="size-4" />
                Complete Sign-In
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <!-- Time-Out -->
        <TabsContent value="time_out">
          <SectionCard
            title="Time-Out"
            description="Completed before skin incision"
          >
            <div class="space-y-4">
              <div
                v-if="timeOutDone"
                class="flex items-center gap-2"
              >
                <Badge variant="default">
                  Completed
                </Badge>
                <span class="text-muted-foreground text-xs">
                  Signed at {{ new Date(checklist!.timeOutCompletedAt!).toLocaleString() }}
                </span>
              </div>

              <div class="space-y-4">
                <div
                  v-for="item in TIME_OUT_ITEMS"
                  :key="item.key"
                  class="flex items-start gap-3"
                >
                  <Checkbox
                    :id="`to-${item.key}`"
                    v-model="timeOutChecks[item.key]"
                    :disabled="timeOutDone"
                  />
                  <Label
                    :for="`to-${item.key}`"
                    class="cursor-pointer text-sm leading-snug"
                    :class="{ 'opacity-60': timeOutDone }"
                  >
                    {{ item.label }}
                  </Label>
                </div>
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs font-medium uppercase tracking-wide">Notes</Label>
                <Textarea
                  v-model="timeOutNotes"
                  :disabled="timeOutDone"
                  placeholder="Any notes for time-out phase…"
                  rows="3"
                />
              </div>

              <Button
                v-if="!timeOutDone"
                @click="completePhase('time_out')"
              >
                <CheckSquare class="size-4" />
                Complete Time-Out
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <!-- Sign-Out -->
        <TabsContent value="sign_out">
          <SectionCard
            title="Sign-Out"
            description="Before any team member leaves the operating room"
          >
            <div class="space-y-4">
              <div
                v-if="checklist?.signOutCompletedAt"
                class="flex items-center gap-2"
              >
                <Badge variant="default">
                  Completed
                </Badge>
                <span class="text-muted-foreground text-xs">
                  Signed at {{ new Date(checklist!.signOutCompletedAt!).toLocaleString() }}
                </span>
              </div>

              <div class="space-y-4">
                <div
                  v-for="item in SIGN_OUT_ITEMS"
                  :key="item.key"
                  class="flex items-start gap-3"
                >
                  <Checkbox
                    :id="`so-${item.key}`"
                    v-model="signOutChecks[item.key]"
                    :disabled="!!checklist?.signOutCompletedAt"
                  />
                  <Label
                    :for="`so-${item.key}`"
                    class="cursor-pointer text-sm leading-snug"
                    :class="{ 'opacity-60': !!checklist?.signOutCompletedAt }"
                  >
                    {{ item.label }}
                  </Label>
                </div>
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs font-medium uppercase tracking-wide">Notes</Label>
                <Textarea
                  v-model="signOutNotes"
                  :disabled="!!checklist?.signOutCompletedAt"
                  placeholder="Any notes for sign-out phase…"
                  rows="3"
                />
              </div>

              <Button
                v-if="!checklist?.signOutCompletedAt"
                @click="completePhase('sign_out')"
              >
                <CheckSquare class="size-4" />
                Complete Sign-Out
              </Button>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageBody>
  </Page>
</template>
