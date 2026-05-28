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
useHead({ title: 'Donor Registry' })

const state = useMockState()

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Add donor dialog ──────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const submitting = ref(false)

const form = reactive({
  givenName: '',
  familyName: '',
  bloodGroup: '' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '',
  phone: '',
})

function openAddDialog() {
  form.givenName = ''
  form.familyName = ''
  form.bloodGroup = ''
  form.phone = ''
  dialogOpen.value = true
}

function submitDonor() {
  if (!form.givenName.trim() || !form.familyName.trim() || !form.bloodGroup || !form.phone.trim()) return
  submitting.value = true

  const newDonor = {
    id: `donor-${Date.now()}`,
    givenName: form.givenName.trim(),
    familyName: form.familyName.trim(),
    bloodGroup: form.bloodGroup,
    phone: form.phone.trim(),
    totalDonations: 0,
  }
  state.donors.push(newDonor)

  submitting.value = false
  dialogOpen.value = false
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Donor Registry"
        description="Registered blood donors"
      />
      <template #actions>
        <Button
          size="sm"
          @click="openAddDialog"
        >
          <Plus class="size-4" />
          Add donor
        </Button>
      </template>
    </PageHeader>

    <PageBody>
      <SectionCard title="All Donors">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Donated</TableHead>
                <TableHead class="text-right">
                  Donations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="state.donors.length === 0">
                No donors registered.
              </TableEmpty>
              <TableRow
                v-for="donor in state.donors"
                :key="donor.id"
              >
                <TableCell class="font-mono text-xs">
                  {{ donor.id }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ donor.givenName }} {{ donor.familyName }}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    class="text-xs"
                  >
                    {{ donor.bloodGroup }}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm">
                  {{ donor.phone }}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ fmtDate(donor.lastDonatedAt) }}
                </TableCell>
                <TableCell class="text-right text-sm">
                  {{ donor.totalDonations }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </PageBody>

    <!-- Add donor dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Donor</DialogTitle>
          <DialogDescription>
            Register a new blood donor.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="donor-given">Given name <span class="text-destructive">*</span></Label>
              <Input
                id="donor-given"
                v-model="form.givenName"
                placeholder="e.g. Rajesh"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="donor-family">Family name <span class="text-destructive">*</span></Label>
              <Input
                id="donor-family"
                v-model="form.familyName"
                placeholder="e.g. Kumar"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Blood group <span class="text-destructive">*</span></Label>
            <Select v-model="form.bloodGroup">
              <SelectTrigger>
                <SelectValue placeholder="Select blood group…" />
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
            <Label for="donor-phone">Phone <span class="text-destructive">*</span></Label>
            <Input
              id="donor-phone"
              v-model="form.phone"
              placeholder="+91-98765-43210"
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
            :disabled="submitting || !form.givenName.trim() || !form.familyName.trim() || !form.bloodGroup || !form.phone.trim()"
            @click="submitDonor"
          >
            Add donor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
