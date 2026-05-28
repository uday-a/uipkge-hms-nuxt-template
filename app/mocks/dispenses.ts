import type { MockMedicationDispense } from './types'
import { todayAt, daysAgoAt } from './today'

// 6 dispense events tied to prescriptions
export const DISPENSES: MockMedicationDispense[] = [
  {
    id: 'disp-001',
    medicationRequestId: 'rx-001',
    drugId: 'drug-004',
    batchId: 'batch-005', // Lisinopril 10 mg
    qtyDispensed: 30,
    dispensedAt: todayAt(9, 10),
    dispensedByUserId: 108, // Linda Foster
    patientId: 'pt-001',
    encounterId: 'enc-001',
  },
  {
    id: 'disp-002',
    medicationRequestId: 'rx-002',
    drugId: 'drug-001',
    batchId: 'batch-002', // Paracetamol 500 mg
    qtyDispensed: 28,
    dispensedAt: todayAt(9, 12),
    dispensedByUserId: 108,
    patientId: 'pt-001',
    encounterId: 'enc-001',
  },
  {
    id: 'disp-003',
    medicationRequestId: 'rx-003',
    drugId: 'drug-005',
    batchId: 'batch-007', // Metformin 500 mg
    qtyDispensed: 180,
    dispensedAt: todayAt(9, 40),
    dispensedByUserId: 109, // Robert Quinn
    patientId: 'pt-002',
    encounterId: 'enc-002',
  },
  {
    id: 'disp-004',
    medicationRequestId: 'rx-004',
    drugId: 'drug-006',
    batchId: 'batch-008', // Atorvastatin 40 mg
    qtyDispensed: 90,
    dispensedAt: todayAt(9, 42),
    dispensedByUserId: 109,
    patientId: 'pt-002',
    encounterId: 'enc-002',
  },
  {
    id: 'disp-005',
    medicationRequestId: 'rx-009',
    drugId: 'drug-011',
    batchId: 'batch-013', // Warfarin 5 mg
    qtyDispensed: 30,
    dispensedAt: daysAgoAt(1, 10, 30),
    dispensedByUserId: 108,
    patientId: 'pt-004',
    encounterId: 'enc-007',
  },
  {
    id: 'disp-006',
    medicationRequestId: 'rx-010',
    drugId: 'drug-006',
    batchId: 'batch-008', // Atorvastatin 40 mg
    qtyDispensed: 90,
    dispensedAt: daysAgoAt(1, 11, 35),
    dispensedByUserId: 109,
    patientId: 'pt-010',
    encounterId: 'enc-008',
  },
]

export const dispenseById = (id: string) => DISPENSES.find(d => d.id === id)
export const dispensesForEncounter = (encounterId: string) =>
  DISPENSES.filter(d => d.encounterId === encounterId)
