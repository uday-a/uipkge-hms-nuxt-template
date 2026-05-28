import { isoDate, daysAgo } from './today'

export interface MockGrowthMeasurement {
  id: string
  patientId: string
  at: string // YYYY-MM-DD
  ageMonths: number
  heightCm: number
  weightKg: number
  bmi: number
  headCircumferenceCm?: number // <2yr
}

export interface MockImmunization {
  id: string
  patientId: string
  vaccineName: string
  doseNumber: number
  givenAt?: string // YYYY-MM-DD; null = scheduled
  scheduledFor?: string // null when given
  administeredByUserId?: number
  batchNo?: string
}

// ── Growth measurements ──────────────────────────────────────────────────────

export const GROWTH_MEASUREMENTS: MockGrowthMeasurement[] = [
  // pt-012 Henry — newborn (12 days old)
  {
    id: 'gm-001',
    patientId: 'pt-012',
    at: isoDate(daysAgo(12)),
    ageMonths: 0,
    heightCm: 50.0,
    weightKg: 3.2,
    bmi: 12.8,
    headCircumferenceCm: 34.0,
  },
  {
    id: 'gm-002',
    patientId: 'pt-012',
    at: isoDate(daysAgo(5)),
    ageMonths: 0,
    heightCm: 50.5,
    weightKg: 3.4,
    bmi: 13.3,
    headCircumferenceCm: 35.0,
  },
  {
    id: 'gm-003',
    patientId: 'pt-012',
    at: isoDate(daysAgo(2)),
    ageMonths: 0,
    heightCm: 51.0,
    weightKg: 3.6,
    bmi: 13.8,
    headCircumferenceCm: 35.5,
  },

  // pt-006 Liam — 4 years old
  {
    id: 'gm-004',
    patientId: 'pt-006',
    at: '2022-02-09',
    ageMonths: 6,
    heightCm: 67.0,
    weightKg: 7.5,
    bmi: 16.7,
  },
  {
    id: 'gm-005',
    patientId: 'pt-006',
    at: '2022-08-09',
    ageMonths: 12,
    heightCm: 76.0,
    weightKg: 10.0,
    bmi: 17.3,
  },
  {
    id: 'gm-006',
    patientId: 'pt-006',
    at: '2023-02-09',
    ageMonths: 18,
    heightCm: 83.0,
    weightKg: 12.0,
    bmi: 17.4,
  },
  {
    id: 'gm-007',
    patientId: 'pt-006',
    at: '2023-08-09',
    ageMonths: 24,
    heightCm: 89.0,
    weightKg: 13.5,
    bmi: 17.0,
  },
  {
    id: 'gm-008',
    patientId: 'pt-006',
    at: '2024-08-09',
    ageMonths: 36,
    heightCm: 96.0,
    weightKg: 15.0,
    bmi: 16.3,
  },
  {
    id: 'gm-009',
    patientId: 'pt-006',
    at: '2025-08-09',
    ageMonths: 48,
    heightCm: 103.0,
    weightKg: 17.0,
    bmi: 16.0,
  },

  // pt-008 Lucas — 10 years old
  {
    id: 'gm-010',
    patientId: 'pt-008',
    at: '2020-12-01',
    ageMonths: 60,
    heightCm: 110.0,
    weightKg: 18.0,
    bmi: 14.9,
  },
  {
    id: 'gm-011',
    patientId: 'pt-008',
    at: '2021-12-01',
    ageMonths: 72,
    heightCm: 116.0,
    weightKg: 20.0,
    bmi: 14.9,
  },
  {
    id: 'gm-012',
    patientId: 'pt-008',
    at: '2022-12-01',
    ageMonths: 84,
    heightCm: 122.0,
    weightKg: 23.0,
    bmi: 15.5,
  },
  {
    id: 'gm-013',
    patientId: 'pt-008',
    at: '2023-12-01',
    ageMonths: 96,
    heightCm: 128.0,
    weightKg: 26.0,
    bmi: 15.9,
  },
  {
    id: 'gm-014',
    patientId: 'pt-008',
    at: '2024-12-01',
    ageMonths: 108,
    heightCm: 134.0,
    weightKg: 29.0,
    bmi: 16.1,
  },
  {
    id: 'gm-015',
    patientId: 'pt-008',
    at: '2025-12-01',
    ageMonths: 120,
    heightCm: 140.0,
    weightKg: 32.0,
    bmi: 16.3,
  },
]

// ── Immunizations ────────────────────────────────────────────────────────────

export const IMMUNIZATIONS: MockImmunization[] = [
  // pt-012 Henry — newborn
  { id: 'im-001', patientId: 'pt-012', vaccineName: 'BCG', doseNumber: 1, givenAt: isoDate(daysAgo(12)), administeredByUserId: 101, batchNo: 'BCG-26A001' },
  { id: 'im-002', patientId: 'pt-012', vaccineName: 'Hep B', doseNumber: 1, givenAt: isoDate(daysAgo(12)), administeredByUserId: 101, batchNo: 'HEP-26B102' },
  { id: 'im-003', patientId: 'pt-012', vaccineName: 'OPV', doseNumber: 0, givenAt: isoDate(daysAgo(12)), administeredByUserId: 101, batchNo: 'OPV-26C003' },
  { id: 'im-004', patientId: 'pt-012', vaccineName: 'Hep B', doseNumber: 2, scheduledFor: '2026-06-26' },
  { id: 'im-005', patientId: 'pt-012', vaccineName: 'OPV', doseNumber: 1, scheduledFor: '2026-06-26' },
  { id: 'im-006', patientId: 'pt-012', vaccineName: 'DPT', doseNumber: 1, scheduledFor: '2026-06-26' },
  { id: 'im-007', patientId: 'pt-012', vaccineName: 'OPV', doseNumber: 2, scheduledFor: '2026-07-24' },
  { id: 'im-008', patientId: 'pt-012', vaccineName: 'DPT', doseNumber: 2, scheduledFor: '2026-07-24' },
  { id: 'im-009', patientId: 'pt-012', vaccineName: 'OPV', doseNumber: 3, scheduledFor: '2026-08-21' },
  { id: 'im-010', patientId: 'pt-012', vaccineName: 'DPT', doseNumber: 3, scheduledFor: '2026-08-21' },
  { id: 'im-011', patientId: 'pt-012', vaccineName: 'MMR', doseNumber: 1, scheduledFor: '2027-02-09' },

  // pt-006 Liam — 4 years
  { id: 'im-101', patientId: 'pt-006', vaccineName: 'BCG', doseNumber: 1, givenAt: '2021-08-09', administeredByUserId: 101, batchNo: 'BCG-21A055' },
  { id: 'im-102', patientId: 'pt-006', vaccineName: 'Hep B', doseNumber: 1, givenAt: '2021-08-09', administeredByUserId: 101, batchNo: 'HEP-21B012' },
  { id: 'im-103', patientId: 'pt-006', vaccineName: 'Hep B', doseNumber: 2, givenAt: '2021-10-20', administeredByUserId: 101, batchNo: 'HEP-21B013' },
  { id: 'im-104', patientId: 'pt-006', vaccineName: 'Hep B', doseNumber: 3, givenAt: '2022-02-09', administeredByUserId: 101, batchNo: 'HEP-21B014' },
  { id: 'im-105', patientId: 'pt-006', vaccineName: 'OPV', doseNumber: 0, givenAt: '2021-08-09', administeredByUserId: 101, batchNo: 'OPV-21C001' },
  { id: 'im-106', patientId: 'pt-006', vaccineName: 'OPV', doseNumber: 1, givenAt: '2021-10-20', administeredByUserId: 101, batchNo: 'OPV-21C002' },
  { id: 'im-107', patientId: 'pt-006', vaccineName: 'OPV', doseNumber: 2, givenAt: '2021-11-17', administeredByUserId: 101, batchNo: 'OPV-21C003' },
  { id: 'im-108', patientId: 'pt-006', vaccineName: 'OPV', doseNumber: 3, givenAt: '2021-12-15', administeredByUserId: 101, batchNo: 'OPV-21C004' },
  { id: 'im-109', patientId: 'pt-006', vaccineName: 'DPT', doseNumber: 1, givenAt: '2021-10-20', administeredByUserId: 101, batchNo: 'DPT-21D011' },
  { id: 'im-110', patientId: 'pt-006', vaccineName: 'DPT', doseNumber: 2, givenAt: '2021-11-17', administeredByUserId: 101, batchNo: 'DPT-21D012' },
  { id: 'im-111', patientId: 'pt-006', vaccineName: 'DPT', doseNumber: 3, givenAt: '2021-12-15', administeredByUserId: 101, batchNo: 'DPT-21D013' },
  { id: 'im-112', patientId: 'pt-006', vaccineName: 'DPT', doseNumber: 4, givenAt: '2023-02-09', administeredByUserId: 101, batchNo: 'DPT-22D014' },
  { id: 'im-113', patientId: 'pt-006', vaccineName: 'MMR', doseNumber: 1, givenAt: '2022-05-09', administeredByUserId: 101, batchNo: 'MMR-22E001' },
  { id: 'im-114', patientId: 'pt-006', vaccineName: 'MMR', doseNumber: 2, givenAt: '2023-02-09', administeredByUserId: 101, batchNo: 'MMR-23E002' },
  { id: 'im-115', patientId: 'pt-006', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2022-10-01', administeredByUserId: 101, batchNo: 'FLU-22F001' },
  { id: 'im-116', patientId: 'pt-006', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2023-10-01', administeredByUserId: 101, batchNo: 'FLU-23F002' },
  { id: 'im-117', patientId: 'pt-006', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2024-10-01', administeredByUserId: 101, batchNo: 'FLU-24F003' },
  { id: 'im-118', patientId: 'pt-006', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2025-10-01', administeredByUserId: 101, batchNo: 'FLU-25F004' },
  { id: 'im-119', patientId: 'pt-006', vaccineName: 'Influenza', doseNumber: 1, scheduledFor: '2026-10-01' },

  // pt-008 Lucas — 10 years
  { id: 'im-201', patientId: 'pt-008', vaccineName: 'BCG', doseNumber: 1, givenAt: '2015-12-01', administeredByUserId: 101, batchNo: 'BCG-15A001' },
  { id: 'im-202', patientId: 'pt-008', vaccineName: 'Hep B', doseNumber: 1, givenAt: '2015-12-01', administeredByUserId: 101, batchNo: 'HEP-15B001' },
  { id: 'im-203', patientId: 'pt-008', vaccineName: 'Hep B', doseNumber: 2, givenAt: '2016-01-12', administeredByUserId: 101, batchNo: 'HEP-15B002' },
  { id: 'im-204', patientId: 'pt-008', vaccineName: 'Hep B', doseNumber: 3, givenAt: '2016-06-01', administeredByUserId: 101, batchNo: 'HEP-15B003' },
  { id: 'im-205', patientId: 'pt-008', vaccineName: 'OPV', doseNumber: 0, givenAt: '2015-12-01', administeredByUserId: 101, batchNo: 'OPV-15C001' },
  { id: 'im-206', patientId: 'pt-008', vaccineName: 'OPV', doseNumber: 1, givenAt: '2016-01-12', administeredByUserId: 101, batchNo: 'OPV-15C002' },
  { id: 'im-207', patientId: 'pt-008', vaccineName: 'OPV', doseNumber: 2, givenAt: '2016-02-09', administeredByUserId: 101, batchNo: 'OPV-15C003' },
  { id: 'im-208', patientId: 'pt-008', vaccineName: 'OPV', doseNumber: 3, givenAt: '2016-03-08', administeredByUserId: 101, batchNo: 'OPV-15C004' },
  { id: 'im-209', patientId: 'pt-008', vaccineName: 'DPT', doseNumber: 1, givenAt: '2016-01-12', administeredByUserId: 101, batchNo: 'DPT-15D001' },
  { id: 'im-210', patientId: 'pt-008', vaccineName: 'DPT', doseNumber: 2, givenAt: '2016-02-09', administeredByUserId: 101, batchNo: 'DPT-15D002' },
  { id: 'im-211', patientId: 'pt-008', vaccineName: 'DPT', doseNumber: 3, givenAt: '2016-03-08', administeredByUserId: 101, batchNo: 'DPT-15D003' },
  { id: 'im-212', patientId: 'pt-008', vaccineName: 'DPT', doseNumber: 4, givenAt: '2017-06-01', administeredByUserId: 101, batchNo: 'DPT-16D004' },
  { id: 'im-213', patientId: 'pt-008', vaccineName: 'DPT', doseNumber: 5, givenAt: '2020-12-01', administeredByUserId: 101, batchNo: 'DPT-20D005' },
  { id: 'im-214', patientId: 'pt-008', vaccineName: 'MMR', doseNumber: 1, givenAt: '2016-09-01', administeredByUserId: 101, batchNo: 'MMR-16E001' },
  { id: 'im-215', patientId: 'pt-008', vaccineName: 'MMR', doseNumber: 2, givenAt: '2020-12-01', administeredByUserId: 101, batchNo: 'MMR-20E002' },
  { id: 'im-216', patientId: 'pt-008', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2021-10-01', administeredByUserId: 101, batchNo: 'FLU-21F001' },
  { id: 'im-217', patientId: 'pt-008', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2022-10-01', administeredByUserId: 101, batchNo: 'FLU-22F001' },
  { id: 'im-218', patientId: 'pt-008', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2023-10-01', administeredByUserId: 101, batchNo: 'FLU-23F001' },
  { id: 'im-219', patientId: 'pt-008', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2024-10-01', administeredByUserId: 101, batchNo: 'FLU-24F001' },
  { id: 'im-220', patientId: 'pt-008', vaccineName: 'Influenza', doseNumber: 1, givenAt: '2025-10-01', administeredByUserId: 101, batchNo: 'FLU-25F001' },
  { id: 'im-221', patientId: 'pt-008', vaccineName: 'HPV', doseNumber: 1, scheduledFor: '2026-06-01' },
  { id: 'im-222', patientId: 'pt-008', vaccineName: 'HPV', doseNumber: 2, scheduledFor: '2026-12-01' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export const growthForPatient = (patientId: string) =>
  GROWTH_MEASUREMENTS.filter(g => g.patientId === patientId).sort((a, b) => a.ageMonths - b.ageMonths)

export const immunizationsForPatient = (patientId: string) =>
  IMMUNIZATIONS.filter(i => i.patientId === patientId).sort((a, b) => {
    const aDate = a.givenAt ?? a.scheduledFor ?? ''
    const bDate = b.givenAt ?? b.scheduledFor ?? ''
    return aDate.localeCompare(bDate)
  })
