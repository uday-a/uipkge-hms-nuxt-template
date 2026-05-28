import type { MockMedicationAdministration } from './types'
import { todayAt, daysAgoAt } from './today'

// 8 MAR entries for IPD encounters
export const MEDICATION_ADMINISTRATIONS: MockMedicationAdministration[] = [
  // enc-004 pt-007 — Paracetamol 1g (rx-005)
  {
    id: 'mar-001',
    medicationRequestId: 'rx-005',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    administeredAt: daysAgoAt(3, 8, 0),
    administeredByUserId: 104, // Karen Walsh
    doseValue: 1000,
    doseUnit: 'mg',
    route: 'oral',
    status: 'given',
    notes: 'Given with breakfast.',
  },
  {
    id: 'mar-002',
    medicationRequestId: 'rx-005',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    administeredAt: daysAgoAt(3, 14, 0),
    administeredByUserId: 105, // Daniel Ross
    doseValue: 1000,
    doseUnit: 'mg',
    route: 'oral',
    status: 'given',
  },
  {
    id: 'mar-003',
    medicationRequestId: 'rx-005',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    administeredAt: daysAgoAt(3, 20, 0),
    administeredByUserId: 106, // Amelia Pierce
    doseValue: 1000,
    doseUnit: 'mg',
    route: 'oral',
    status: 'given',
  },
  // enc-005 pt-001 — Lisinopril 10 mg (rx-006)
  {
    id: 'mar-004',
    medicationRequestId: 'rx-006',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    administeredAt: daysAgoAt(2, 8, 0),
    administeredByUserId: 104,
    doseValue: 10,
    doseUnit: 'mg',
    route: 'oral',
    status: 'given',
  },
  {
    id: 'mar-005',
    medicationRequestId: 'rx-006',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    administeredAt: daysAgoAt(1, 8, 0),
    administeredByUserId: 107, // Jacob Hill
    doseValue: 10,
    doseUnit: 'mg',
    route: 'oral',
    status: 'given',
  },
  // enc-005 pt-001 — Aspirin 100 mg (rx-007) — one held (patient vomiting)
  {
    id: 'mar-006',
    medicationRequestId: 'rx-007',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    administeredAt: daysAgoAt(2, 8, 5),
    administeredByUserId: 104,
    doseValue: 100,
    doseUnit: 'mg',
    route: 'oral',
    status: 'given',
  },
  {
    id: 'mar-007',
    medicationRequestId: 'rx-007',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    administeredAt: daysAgoAt(1, 8, 5),
    administeredByUserId: 107,
    doseValue: 100,
    doseUnit: 'mg',
    route: 'oral',
    status: 'held',
    notes: 'Held — patient nauseous post morning vitals. Dr Bennett informed.',
  },
  // enc-006 pt-004 — Morphine 2.5 mg IV PRN (rx-008)
  {
    id: 'mar-008',
    medicationRequestId: 'rx-008',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    administeredAt: todayAt(7, 30),
    administeredByUserId: 105, // Daniel Ross
    doseValue: 2.5,
    doseUnit: 'mg',
    route: 'IV',
    status: 'given',
    notes: 'Pain score 6/10 on initial assessment. Given per protocol.',
  },
]

export const marById = (id: string) => MEDICATION_ADMINISTRATIONS.find(m => m.id === id)
export const marForEncounter = (encounterId: string) =>
  MEDICATION_ADMINISTRATIONS.filter(m => m.encounterId === encounterId)
export const marForRequest = (medicationRequestId: string) =>
  MEDICATION_ADMINISTRATIONS.filter(m => m.medicationRequestId === medicationRequestId)
