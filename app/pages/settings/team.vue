<script setup lang="ts">
import { UserPlus, MoreHorizontal, Mail, Search } from 'lucide-vue-next'
import { Page, PageHeader, PageHeaderHeading, PageBody } from '@/components/ui/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Team · Settings' })

const members = [
  { id: '1', name: 'Sarah Connor', email: 'sarah@acme.com', role: 'owner', status: 'active', lastActive: '2m ago' },
  { id: '2', name: 'Marcus Rivera', email: 'marcus@acme.com', role: 'admin', status: 'active', lastActive: '14m ago' },
  { id: '3', name: 'Alice Chen', email: 'alice@acme.com', role: 'member', status: 'active', lastActive: '1h ago' },
  { id: '4', name: 'David Kim', email: 'david@acme.com', role: 'member', status: 'active', lastActive: '3h ago' },
  { id: '5', name: 'Eva Johnson', email: 'eva@acme.com', role: 'member', status: 'active', lastActive: 'Yesterday' },
  { id: '6', name: 'Frank Lee', email: 'frank@acme.com', role: 'billing', status: 'active', lastActive: '2d ago' },
  { id: '7', name: 'Olive Park', email: 'olive@acme.com', role: 'member', status: 'active', lastActive: '4d ago' },
  { id: '8', name: 'Marcus Tan', email: 'm.tan@acme.com', role: 'member', status: 'active', lastActive: '6d ago' },
]

const pending = [
  { email: 'priya.shah@acme.com', role: 'Member', invitedBy: 'Sarah Connor', expires: 'in 5 days' },
  { email: 'tom.bauer@acme.com', role: 'Admin', invitedBy: 'Marcus Rivera', expires: 'in 6 days' },
]

const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase()

function roleVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (role === 'owner' || role === 'admin') return 'default'
  if (role === 'developer' || role === 'analyst') return 'secondary'
  return 'outline'
}
</script>

<template>
  <Page>
    <PageHeader>
      <PageHeaderHeading
        title="Team"
        description="Members, roles, and invitations."
      />
    </PageHeader>
    <PageBody>
      <div class="space-y-6">
        <div class="flex items-center justify-between gap-4">
          <p class="text-muted-foreground text-sm">
            {{ members.length }} members · {{ pending.length }} pending invites · 1 owner
          </p>
          <Button class="gap-2">
            <UserPlus class="size-4" /> Invite member
          </Button>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative flex-1 max-w-sm">
            <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search by name or email…"
              class="pl-8 h-9"
            />
          </div>
        </div>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead class="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="members.length === 0">
                <div class="flex flex-col items-center gap-2 py-8 text-center">
                  <UserPlus class="text-muted-foreground size-8" />
                  <p class="text-muted-foreground text-sm">
                    No members yet.
                  </p>
                </div>
              </TableEmpty>
              <TableRow
                v-for="m in members"
                :key="m.id"
              >
                <TableCell>
                  <div class="flex items-center gap-3">
                    <Avatar class="size-8">
                      <AvatarFallback class="text-[10px] font-semibold">
                        {{ initials(m.name) }}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p class="text-sm font-medium">
                        {{ m.name }}
                      </p>
                      <p class="text-muted-foreground text-xs">
                        {{ m.email }}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="roleVariant(m.role)"
                    class="text-[10px] capitalize"
                  >
                    {{ m.role }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    class="text-[10px]"
                  >
                    {{ m.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ m.lastActive }}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7"
                      >
                        <MoreHorizontal class="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Change role…</DropdownMenuItem>
                      <DropdownMenuItem>View activity</DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive">
                        Remove from workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <Mail class="size-4" /> Pending invites
            </CardTitle>
            <CardDescription>Resend or revoke invitations that haven't been accepted yet.</CardDescription>
          </CardHeader>
          <CardContent class="divide-y">
            <div
              v-for="p in pending"
              :key="p.email"
              class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div class="space-y-0.5">
                <p class="text-sm font-medium">
                  {{ p.email }}
                </p>
                <p class="text-muted-foreground text-xs">
                  Invited as {{ p.role }} by {{ p.invitedBy }} · expires {{ p.expires }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                >
                  Resend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive"
                >
                  Revoke
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageBody>
  </Page>
</template>
