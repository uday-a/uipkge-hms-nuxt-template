<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent } from '@/components/ui/card'
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

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Register Patient' })

const state = useMockState()

const form = reactive({
  givenName: '',
  familyName: '',
  sex: '' as 'male' | 'female' | 'intersex' | 'unknown' | '',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  allergiesSummary: '',
})

const submitting = ref(false)

function nextMrn(): string {
  const year = new Date().getFullYear()
  const prefix = `MH-${year}-`
  const existing = state.patients
    .map(p => p.mrn)
    .filter(m => m.startsWith(prefix))
    .map(m => Number.parseInt(m.slice(prefix.length), 10))
    .filter(n => !Number.isNaN(n))
  const max = existing.length > 0 ? Math.max(...existing) : 0
  return `${prefix}${String(max + 1).padStart(6, '0')}`
}

async function submit() {
  if (!form.givenName || !form.familyName || !form.sex || !form.dateOfBirth) return
  submitting.value = true

  // Fake 400 ms latency so the spinner is visible
  await new Promise(r => setTimeout(r, 400))

  const id = `pt-${Date.now()}`
  const newPatient = {
    id,
    mrn: nextMrn(),
    givenName: form.givenName.trim(),
    familyName: form.familyName.trim(),
    sex: form.sex as 'male' | 'female' | 'intersex' | 'unknown',
    dateOfBirth: form.dateOfBirth,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
    allergiesSummary: form.allergiesSummary.trim() || undefined,
  }

  state.patients.push(newPatient)
  submitting.value = false
  await navigateTo(`/patients/${id}`)
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Register Patient"
        description="Add a new patient to the hospital registry."
      />
    </PageHeader>

    <PageBody>
      <div class="max-w-lg">
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="pt-6">
            <form
              class="space-y-4"
              @submit.prevent="submit"
            >
              <!-- Given name -->
              <div class="space-y-1.5">
                <Label for="givenName">Given name <span class="text-destructive">*</span></Label>
                <Input
                  id="givenName"
                  v-model="form.givenName"
                  placeholder="e.g. John"
                  required
                />
              </div>

              <!-- Family name -->
              <div class="space-y-1.5">
                <Label for="familyName">Family name <span class="text-destructive">*</span></Label>
                <Input
                  id="familyName"
                  v-model="form.familyName"
                  placeholder="e.g. Smith"
                  required
                />
              </div>

              <!-- Sex -->
              <div class="space-y-1.5">
                <Label>Sex <span class="text-destructive">*</span></Label>
                <Select v-model="form.sex">
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">
                      Male
                    </SelectItem>
                    <SelectItem value="female">
                      Female
                    </SelectItem>
                    <SelectItem value="intersex">
                      Intersex
                    </SelectItem>
                    <SelectItem value="unknown">
                      Unknown
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Date of birth -->
              <div class="space-y-1.5">
                <Label for="dob">Date of birth <span class="text-destructive">*</span></Label>
                <Input
                  id="dob"
                  v-model="form.dateOfBirth"
                  type="date"
                  required
                />
              </div>

              <!-- Phone -->
              <div class="space-y-1.5">
                <Label for="phone">Phone</Label>
                <Input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  placeholder="+1-555-0100"
                />
              </div>

              <!-- Email -->
              <div class="space-y-1.5">
                <Label for="email">Email <span class="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="patient@example.com"
                />
              </div>

              <!-- Address -->
              <div class="space-y-1.5">
                <Label for="address">Address <span class="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  id="address"
                  v-model="form.address"
                  placeholder="Street, City, State, ZIP"
                  :rows="2"
                />
              </div>

              <!-- Allergies summary -->
              <div class="space-y-1.5">
                <Label for="allergies">Allergies summary <span class="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  id="allergies"
                  v-model="form.allergiesSummary"
                  placeholder="e.g. Penicillin (rash), NKDA"
                  :rows="2"
                />
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  :disabled="submitting || !form.givenName || !form.familyName || !form.sex || !form.dateOfBirth"
                >
                  <Loader2
                    v-if="submitting"
                    class="size-4 animate-spin"
                  />
                  Register patient
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  as-child
                >
                  <NuxtLink to="/patients">Cancel</NuxtLink>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageBody>
  </Page>
</template>
