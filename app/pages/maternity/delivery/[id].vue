<script setup lang="ts">
import { ArrowLeft, Printer, Baby, Clock, Scale } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { SectionCard } from '@/components/ui/section-card'
import { DataList, DataListItem } from '@/components/ui/data-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const state = useMockState()

const deliveryId = computed(() => route.params.id as string)

const delivery = computed(() => state.deliveries.find(d => d.id === deliveryId.value))
const patient = computed(() => delivery.value ? state.patients.find(p => p.id === delivery.value!.patientId) : null)

watchEffect(() => {
  if (import.meta.client && !delivery.value) {
    navigateTo('/maternity')
  }
})

useHead(() => ({
  title: delivery.value ? `Delivery — ${patient.value?.givenName ?? ''} ${patient.value?.familyName ?? ''}` : 'Delivery Record',
}))

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function modeLabel(mode: string): string {
  const map: Record<string, string> = {
    svd: 'Spontaneous vaginal delivery',
    instrumental: 'Instrumental vaginal delivery',
    cs_elective: 'Caesarean section (elective)',
    cs_emergency: 'Caesarean section (emergency)',
  }
  return map[mode] ?? mode
}

function modeVariant(mode: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (mode === 'cs_emergency') return 'destructive'
  if (mode === 'instrumental') return 'secondary'
  if (mode === 'cs_elective') return 'outline'
  return 'default'
}

function apgarVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 9) return 'default'
  if (score >= 7) return 'secondary'
  return 'destructive'
}

function printRecord() {
  window.print()
}
</script>

<template>
  <Page v-if="delivery">
    <PageHeader>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          as-child
        >
          <NuxtLink to="/maternity">
            <ArrowLeft class="size-5" />
          </NuxtLink>
        </Button>
        <PageHeaderHeading
          :title="`${patient?.givenName ?? ''} ${patient?.familyName ?? ''}`"
          :description="`Delivery record · MRN ${patient?.mrn ?? '—'}`"
        />
      </div>
      <template #actions>
        <Button
          size="sm"
          variant="outline"
          @click="printRecord"
        >
          <Printer class="size-4" />
          Print
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <!-- Delivery summary -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock class="size-4" />
            Delivered at
          </div>
          <p class="text-lg font-semibold">
            {{ fmtDate(delivery.deliveredAt) }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ fmtTime(delivery.deliveredAt) }}
          </p>
        </div>
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Baby class="size-4" />
            Mode
          </div>
          <Badge
            :variant="modeVariant(delivery.mode)"
            class="text-xs mt-1"
          >
            {{ modeLabel(delivery.mode) }}
          </Badge>
        </div>
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Scale class="size-4" />
            Baby weight
          </div>
          <p class="text-lg font-semibold">
            {{ (delivery.babyWeightGrams / 1000).toFixed(2) }} kg
          </p>
        </div>
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Baby class="size-4" />
            Sex at birth
          </div>
          <p class="text-lg font-semibold capitalize">
            {{ delivery.babySexAtBirth }}
          </p>
        </div>
      </div>

      <!-- Apgar scores -->
      <SectionCard title="Apgar scores">
        <div class="flex gap-4">
          <div class="flex items-center gap-3 rounded-lg border px-4 py-3">
            <span class="text-sm text-muted-foreground">1 minute</span>
            <Badge :variant="apgarVariant(delivery.apgar1Min)">
              {{ delivery.apgar1Min }}
            </Badge>
          </div>
          <div class="flex items-center gap-3 rounded-lg border px-4 py-3">
            <span class="text-sm text-muted-foreground">5 minutes</span>
            <Badge :variant="apgarVariant(delivery.apgar5Min)">
              {{ delivery.apgar5Min }}
            </Badge>
          </div>
        </div>
      </SectionCard>

      <!-- Complications -->
      <SectionCard
        v-if="delivery.complications"
        title="Complications"
      >
        <p class="text-sm text-muted-foreground">
          {{ delivery.complications }}
        </p>
      </SectionCard>

      <!-- Full detail list -->
      <SectionCard title="Delivery details">
        <DataList>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Patient</span>
            <span class="text-sm font-medium">{{ patient?.givenName }} {{ patient?.familyName }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">MRN</span>
            <span class="text-sm font-mono">{{ patient?.mrn ?? '—' }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Date & time</span>
            <span class="text-sm">{{ fmtDate(delivery.deliveredAt) }} {{ fmtTime(delivery.deliveredAt) }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Mode of delivery</span>
            <Badge
              :variant="modeVariant(delivery.mode)"
              class="text-xs"
            >
              {{ modeLabel(delivery.mode) }}
            </Badge>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Baby sex</span>
            <span class="text-sm capitalize">{{ delivery.babySexAtBirth }}</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Baby weight</span>
            <span class="text-sm tabular-nums">{{ (delivery.babyWeightGrams / 1000).toFixed(2) }} kg</span>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Apgar 1 min</span>
            <Badge :variant="apgarVariant(delivery.apgar1Min)">
              {{ delivery.apgar1Min }}
            </Badge>
          </DataListItem>
          <DataListItem>
            <span class="text-sm text-muted-foreground">Apgar 5 min</span>
            <Badge :variant="apgarVariant(delivery.apgar5Min)">
              {{ delivery.apgar5Min }}
            </Badge>
          </DataListItem>
          <DataListItem v-if="delivery.complications">
            <span class="text-sm text-muted-foreground">Complications</span>
            <span class="text-sm">{{ delivery.complications }}</span>
          </DataListItem>
        </DataList>
      </SectionCard>
    </PageBody>
  </Page>
</template>
