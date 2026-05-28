// Persona switcher — the HMS template centers on seven role personas.
// Each persona has its own sidebar nav, default dashboard route, and icon.
// The current persona is persisted to localStorage (client only) so the
// user's last role selection survives page reloads without a backend.

import type { Component } from 'vue'
import {
  AlertTriangle,
  Baby,
  BedDouble,
  BookOpen,
  CalendarDays,
  Droplet,
  Heart,
  HeartHandshake,
  HeartPulse,
  ListChecks,
  Package,
  Pill,
  Receipt,
  Scan,
  Scissors,
  Settings2,
  Siren,
  Stethoscope,
  TestTubeDiagonal,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-vue-next'

// All lucide icons referenced in sidebar items must be listed here.
// This map lets template code resolve icon names to components at runtime
// without storing component refs inside the `as const` persona array.
export const HMS_ICONS: Record<string, Component> = {
  // Persona icons
  Settings2,
  Stethoscope,
  HeartHandshake,
  Pill,
  TestTubeDiagonal,
  Scan,
  UserPlus,
  // Sidebar item icons — shared across personas
  Users,
  CalendarDays,
  ListChecks,
  BedDouble,
  Scissors,
  HeartPulse,
  Receipt,
  AlertTriangle,
  Package,
  BookOpen,
  Siren,
  Baby,
  Heart,
  Droplet,
  Warehouse,
}

export type PersonaKey
  = | 'admin'
    | 'doctor'
    | 'nurse'
    | 'pharmacist'
    | 'lab_tech'
    | 'radiologist'
    | 'receptionist'

export interface NavSubItem {
  title: string
  url: string
}

export interface NavItem {
  title: string
  url: string
  icon: string // key in HMS_ICONS
  items?: NavSubItem[]
}

export interface PersonaConfig {
  key: PersonaKey
  label: string
  icon: string // key in HMS_ICONS
  defaultRoute: string
  navItems: NavItem[]
}

export const PERSONAS: readonly PersonaConfig[] = [
  {
    key: 'admin',
    label: 'Admin',
    icon: 'Settings2',
    defaultRoute: '/dashboard/admin',
    navItems: [
      { title: 'Patients', url: '/patients', icon: 'Users' },
      { title: 'Appointments', url: '/appointments', icon: 'CalendarDays' },
      { title: 'Queue', url: '/queue', icon: 'ListChecks' },
      { title: 'Emergency', url: '/er', icon: 'Siren' },
      { title: 'Wards', url: '/wards', icon: 'BedDouble' },
      { title: 'OT Calendar', url: '/ot', icon: 'Scissors' },
      { title: 'ICU', url: '/icu', icon: 'HeartPulse' },
      { title: 'Maternity', url: '/maternity', icon: 'Heart' },
      { title: 'Pediatrics', url: '/pediatrics', icon: 'Baby' },
      { title: 'Pharmacy', url: '/pharmacy/queue', icon: 'Pill' },
      { title: 'Lab', url: '/lab/worklist', icon: 'TestTubeDiagonal' },
      { title: 'Radiology', url: '/radiology/worklist', icon: 'Scan' },
      { title: 'Blood Bank', url: '/blood-bank', icon: 'Droplet' },
      { title: 'Billing', url: '/billing', icon: 'Receipt' },
      { title: 'Critical Alerts', url: '/alerts/critical', icon: 'AlertTriangle' },
      {
        title: 'Admin',
        url: '/admin/services',
        icon: 'Settings2',
        items: [
          { title: 'Services', url: '/admin/services' },
          { title: 'Drugs & Batches', url: '/admin/drugs' },
          { title: 'Lab Catalog', url: '/admin/lab-catalog' },
          { title: 'Inventory', url: '/inventory' },
          { title: 'Schedules', url: '/admin/schedules' },
          { title: 'OR Rooms', url: '/admin/or-rooms' },
          { title: 'Wards & Beds', url: '/admin/wards' },
          { title: 'Audit Log', url: '/admin/audit' },
        ],
      },
    ],
  },
  {
    key: 'doctor',
    label: 'Doctor',
    icon: 'Stethoscope',
    defaultRoute: '/dashboard/doctor',
    navItems: [
      { title: 'My Queue', url: '/queue', icon: 'ListChecks' },
      { title: 'Patients', url: '/patients', icon: 'Users' },
      { title: 'Appointments', url: '/appointments', icon: 'CalendarDays' },
      { title: 'Emergency', url: '/er', icon: 'Siren' },
      { title: 'Maternity', url: '/maternity', icon: 'Heart' },
      { title: 'Pediatrics', url: '/pediatrics', icon: 'Baby' },
      { title: 'Lab', url: '/lab/worklist', icon: 'TestTubeDiagonal' },
      { title: 'Radiology', url: '/radiology/worklist', icon: 'Scan' },
      { title: 'Blood Bank', url: '/blood-bank', icon: 'Droplet' },
      { title: 'Critical Alerts', url: '/alerts/critical', icon: 'AlertTriangle' },
    ],
  },
  {
    key: 'nurse',
    label: 'Nurse',
    icon: 'HeartHandshake',
    defaultRoute: '/dashboard/nurse',
    navItems: [
      { title: 'My Wards', url: '/wards', icon: 'BedDouble' },
      { title: 'Patients', url: '/patients', icon: 'Users' },
      { title: 'Queue', url: '/queue', icon: 'ListChecks' },
      { title: 'ER Triage', url: '/er', icon: 'Siren' },
      { title: 'Maternity', url: '/maternity', icon: 'Heart' },
      { title: 'Pediatrics', url: '/pediatrics', icon: 'Baby' },
      { title: 'Blood Bank', url: '/blood-bank/requests', icon: 'Droplet' },
      { title: 'Critical Alerts', url: '/alerts/critical', icon: 'AlertTriangle' },
    ],
  },
  {
    key: 'pharmacist',
    label: 'Pharmacist',
    icon: 'Pill',
    defaultRoute: '/dashboard/pharmacist',
    navItems: [
      { title: 'Dispense Queue', url: '/pharmacy/queue', icon: 'Pill' },
      { title: 'Drugs & Batches', url: '/admin/drugs', icon: 'Package' },
      { title: 'Inventory', url: '/inventory', icon: 'Warehouse' },
      { title: 'Patients', url: '/patients', icon: 'Users' },
    ],
  },
  {
    key: 'lab_tech',
    label: 'Lab Tech',
    icon: 'TestTubeDiagonal',
    defaultRoute: '/dashboard/lab',
    navItems: [
      { title: 'Lab Worklist', url: '/lab/worklist', icon: 'TestTubeDiagonal' },
      { title: 'Lab Catalog', url: '/admin/lab-catalog', icon: 'BookOpen' },
      { title: 'Blood Bank', url: '/blood-bank', icon: 'Droplet' },
      { title: 'Critical Alerts', url: '/alerts/critical', icon: 'AlertTriangle' },
      { title: 'Patients', url: '/patients', icon: 'Users' },
    ],
  },
  {
    key: 'radiologist',
    label: 'Radiologist',
    icon: 'Scan',
    defaultRoute: '/dashboard/radiology',
    navItems: [
      { title: 'Radiology Worklist', url: '/radiology/worklist', icon: 'Scan' },
      { title: 'Patients', url: '/patients', icon: 'Users' },
      { title: 'Critical Alerts', url: '/alerts/critical', icon: 'AlertTriangle' },
    ],
  },
  {
    key: 'receptionist',
    label: 'Receptionist',
    icon: 'UserPlus',
    defaultRoute: '/dashboard/reception',
    navItems: [
      { title: 'Today\'s Schedule', url: '/appointments', icon: 'CalendarDays' },
      { title: 'Register Patient', url: '/patients/new', icon: 'UserPlus' },
      { title: 'Admit Patient', url: '/admissions/new', icon: 'BedDouble' },
      { title: 'ER Walk-in', url: '/er/new', icon: 'Siren' },
      { title: 'Patients', url: '/patients', icon: 'Users' },
      { title: 'Billing', url: '/billing', icon: 'Receipt' },
    ],
  },
] as const

const STORAGE_KEY = 'hms-persona'

export function usePersona() {
  const current = useState<PersonaKey>('hms-persona', () => 'admin')

  // Load from localStorage on client mount. useState shares state across
  // the component tree so this only needs to run once per page load.
  // We defer to onMounted so the server and client agree on the initial
  // value during hydration and avoid a mismatch warning.
  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem(STORAGE_KEY) as PersonaKey | null
      if (saved && PERSONAS.find(p => p.key === saved)) {
        current.value = saved
      }
    })
  }

  function set(key: PersonaKey) {
    current.value = key
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, key)
  }

  const config = computed(() => PERSONAS.find(p => p.key === current.value) ?? PERSONAS[0]!)

  function getIconComponent(name: string): Component | undefined {
    return HMS_ICONS[name]
  }

  return { current, set, config, personas: PERSONAS, getIconComponent }
}
