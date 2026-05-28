<script setup lang="ts">
import { BedDouble, UserPlus } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Wards' })

const state = useMockState()

const unitsWithCounts = computed(() =>
  state.units.map((u) => {
    const beds = state.beds.filter(b => b.unitId === u.id)
    const occupied = beds.filter(b =>
      state.bedAssignments.some(a => a.bedId === b.id && !a.releasedAt),
    ).length
    const dept = state.departments.find(d => d.id === u.departmentId)
    const occupancyPct = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0
    return {
      ...u,
      totalBeds: beds.length,
      occupied,
      available: beds.length - occupied,
      deptName: dept?.name ?? '—',
      occupancyPct,
    }
  }),
)

function occupancyVariant(pct: number): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (pct >= 90) return 'destructive'
  if (pct >= 70) return 'warning'
  return 'success'
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Wards & Bed Management"
        description="Real-time bed occupancy, admissions, and ward operations."
      />
      <template #actions>
        <Button
          as-child
          size="sm"
        >
          <NuxtLink to="/admissions/new">
            <UserPlus class="size-4" />
            Admit patient
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="unit in unitsWithCounts"
          :key="unit.id"
          class="transition-shadow hover:shadow-md"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <CardTitle class="text-base">
                  {{ unit.name }}
                </CardTitle>
                <CardDescription class="mt-0.5">
                  {{ unit.deptName }} · {{ unit.totalBeds }} beds
                </CardDescription>
              </div>
              <BedDouble class="text-muted-foreground mt-0.5 size-5 shrink-0" />
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Occupancy bar -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">Occupancy</span>
                <span class="font-medium">{{ unit.occupancyPct }}%</span>
              </div>
              <Progress
                :model-value="unit.occupancyPct"
                class="h-2"
              />
            </div>

            <!-- Counts row -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-sm">
                <span class="text-muted-foreground">{{ unit.occupied }} occupied</span>
                <Badge :variant="unit.available > 0 ? 'success' : 'destructive'">
                  {{ unit.available }} available
                </Badge>
              </div>
              <Button
                as-child
                variant="outline"
                size="sm"
              >
                <NuxtLink :to="`/wards/${unit.id}`">Open</NuxtLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageBody>
  </Page>
</template>
