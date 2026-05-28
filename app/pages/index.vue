<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  Building2,
  ExternalLink,
  FlaskConical,
  Github,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  Lock,
  Pill,
  Play,
  Scan,
  Settings2,
  ShieldCheck,
  Stethoscope,
  TestTubeDiagonal,
  UserPlus,
  Zap,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconBox } from '@/components/ui/icon-box'
import { Badge } from '@/components/ui/badge'

definePageMeta({ auth: false, layout: false })

useHead({
  title: 'uipkge HMS Template — Open-source Hospital Management System',
  meta: [
    {
      name: 'description',
      content: 'Open-source Nuxt 4 hospital management system template built on the uipkge design system. Frontend-first, persona-aware workflows, realistic mock data.',
    },
  ],
})

// ── Persona showcase ──────────────────────────────────────────────────────────
const personas = [
  {
    icon: Settings2,
    label: 'Admin',
    description: 'Facility KPIs, audit log, ward census, system health overview.',
  },
  {
    icon: Stethoscope,
    label: 'Doctor',
    description: 'Today\'s queue, SOAP notes, prescriptions, critical lab results.',
  },
  {
    icon: HeartHandshake,
    label: 'Nurse',
    description: 'Ward roster, medication administration record, vitals charting.',
  },
  {
    icon: Pill,
    label: 'Pharmacist',
    description: 'Dispense queue, formulary management, drug batches, narcotic register.',
  },
  {
    icon: TestTubeDiagonal,
    label: 'Lab Tech',
    description: 'Sample collection, results entry, signed reports, critical value flags.',
  },
  {
    icon: Scan,
    label: 'Radiologist',
    description: 'Studies awaiting report, signed radiology reports, DICOM viewer stub.',
  },
  {
    icon: UserPlus,
    label: 'Receptionist',
    description: 'Appointments, patient registration, walk-in management, billing.',
  },
] as const

// ── Feature highlights ────────────────────────────────────────────────────────
const features = [
  {
    icon: LayoutDashboard,
    title: 'Persona-aware workflows',
    body: 'Seven distinct roles, each with a tailored dashboard and sidebar nav. Switch personas in one click.',
  },
  {
    icon: HeartPulse,
    title: 'Full clinical spine',
    body: 'Encounters, SOAP notes, prescriptions, lab orders, radiology, MAR, vitals, billing — all wired together.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit + RBAC built-in',
    body: 'Every mock action appends to a structured audit log. Role checks on every page route.',
  },
  {
    icon: Zap,
    title: 'uipkge design system',
    body: 'Built on the uipkge registry — shadcn-vue primitives, Reka UI headless layer, Tailwind v4 tokens.',
  },
  {
    icon: Activity,
    title: 'Mock-data first',
    body: 'Realistic in-memory dataset with 12 patients, 7 staff roles, encounters, orders, and billing. Real backend optional.',
  },
  {
    icon: Building2,
    title: 'Self-host friendly',
    body: 'Nuxt 4 + Nitro: deploy to Vercel, Cloudflare Workers, or any Node host. No vendor lock-in.',
  },
] as const
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <!-- ── Top nav ──────────────────────────────────────────────────────────── -->
    <header class="border-border/60 sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <HeartPulse class="text-primary size-5" />
          <span class="text-sm font-semibold tracking-tight">uipkge HMS</span>
          <Badge
            variant="secondary"
            class="text-[10px]"
          >
            Template
          </Badge>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            as-child
          >
            <a
              href="https://github.com/uday-a/uipkge-hms-nuxt-template"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-1.5"
            >
              <Github class="size-4" />
              GitHub
              <ExternalLink class="size-3 opacity-60" />
            </a>
          </Button>
          <Button
            size="sm"
            as-child
          >
            <NuxtLink to="/login">
              Try the demo
              <Play class="ml-1.5 size-3.5 fill-current" />
            </NuxtLink>
          </Button>
        </div>
      </div>
    </header>

    <!-- ── Main content ─────────────────────────────────────────────────────── -->
    <main>
      <div class="mx-auto max-w-6xl space-y-24 px-4 py-16">
        <!-- ── 1. Hero ───────────────────────────────────────────────────── -->
        <section class="flex flex-col items-center gap-6 text-center">
          <Badge
            variant="outline"
            class="gap-1.5 px-3 py-1 text-xs font-medium"
          >
            <HeartPulse class="text-primary size-3.5" />
            Open-source · Nuxt 4 · uipkge design system
          </Badge>

          <h1 class="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Hospital Management
            <span class="text-primary"> System Template</span>
          </h1>

          <p class="text-muted-foreground max-w-xl text-lg leading-relaxed">
            Open-source Nuxt 4 template for clinics and small hospitals. Built on the uipkge design system.
            Every department's workflow is a polished page backed by realistic mock data.
          </p>

          <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              as-child
            >
              <NuxtLink
                to="/login"
                class="flex items-center gap-2"
              >
                <Play class="size-4 fill-current" />
                Try the demo
              </NuxtLink>
            </Button>
            <Button
              variant="outline"
              size="lg"
              as-child
            >
              <a
                href="https://github.com/uday-a/uipkge-hms-nuxt-template"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2"
              >
                <Github class="size-4" />
                View on GitHub
                <ExternalLink class="size-3 opacity-60" />
              </a>
            </Button>
          </div>

          <p class="text-muted-foreground text-xs">
            Demo mode signs you in instantly — no account required.
          </p>
        </section>

        <!-- ── 2. Persona showcase ───────────────────────────────────────── -->
        <section>
          <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold tracking-tight">
              Seven personas, one template
            </h2>
            <p class="text-muted-foreground mt-2 text-sm">
              Use the persona switcher in the sidebar to tour each role's workflow without switching accounts.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <NuxtLink
              v-for="persona in personas"
              :key="persona.label"
              to="/login"
              class="group"
            >
              <Card class="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardContent class="flex flex-col items-start gap-3 p-4">
                  <IconBox
                    :icon="persona.icon"
                    variant="primary"
                    size="md"
                  />
                  <div>
                    <p class="text-sm font-semibold leading-none">
                      {{ persona.label }}
                    </p>
                    <p class="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                      {{ persona.description }}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </NuxtLink>
          </div>
        </section>

        <!-- ── 3. Features ───────────────────────────────────────────────── -->
        <section>
          <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold tracking-tight">
              Production-shaped from day one
            </h2>
            <p class="text-muted-foreground mt-2 text-sm">
              Not a proof-of-concept. Every page is a full workflow — ready to wire to a real backend.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="feature in features"
              :key="feature.title"
            >
              <CardHeader class="pb-2">
                <div class="flex items-center gap-3">
                  <IconBox
                    :icon="feature.icon"
                    variant="muted"
                    size="sm"
                  />
                  <CardTitle class="text-sm font-semibold">
                    {{ feature.title }}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-sm leading-relaxed">
                  {{ feature.body }}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <!-- ── 4. Tech stack callout ─────────────────────────────────────── -->
        <section class="border-border rounded-xl border px-6 py-8 text-center">
          <p class="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-widest">
            Built with
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <Badge
              v-for="tech in ['Nuxt 4', 'Vue 3', 'TypeScript', 'Tailwind v4', 'Reka UI', 'shadcn-vue', 'uipkge', 'Lucide icons']"
              :key="tech"
              variant="secondary"
              class="text-xs"
            >
              {{ tech }}
            </Badge>
          </div>
        </section>
      </div>
    </main>

    <!-- ── Footer ──────────────────────────────────────────────────────────── -->
    <footer class="border-border/60 border-t py-8">
      <div class="mx-auto max-w-6xl px-4">
        <div class="flex flex-col items-center gap-2 text-center">
          <div class="flex items-center gap-2">
            <HeartPulse class="text-primary size-4" />
            <span class="text-sm font-medium">uipkge HMS Template</span>
          </div>
          <p class="text-muted-foreground text-xs">
            Released under the MIT license.
            Built on <a
              href="https://uipkge.dev"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground underline underline-offset-2 transition-colors"
            >uipkge.dev</a>
            and <a
              href="https://nuxt.com"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground underline underline-offset-2 transition-colors"
            >Nuxt</a>.
          </p>
          <div class="mt-1 flex items-center gap-1 text-xs">
            <Lock class="text-muted-foreground size-3" />
            <span class="text-muted-foreground">Demo mode · no data leaves your browser</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
