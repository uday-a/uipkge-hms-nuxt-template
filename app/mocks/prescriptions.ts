import type { MockMedicationRequest } from './types'
import { todayAt, daysAgoAt } from './today'

// 12 prescription rows across active encounters
export const PRESCRIPTIONS: MockMedicationRequest[] = [
  // enc-001 (pt-001, finished OPD — hypertension)
  {
    id: 'rx-001',
    encounterId: 'enc-001',
    prescriberUserId: 101,
    patientId: 'pt-001',
    drugId: 'drug-004', // Lisinopril 10 mg
    doseValue: 10,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once daily',
    durationDays: 30,
    dispenseQty: 30,
    prn: false,
    instructions: 'Take in the morning. Monitor for dry cough.',
    status: 'active',
    signedAt: todayAt(8, 55),
  },
  // enc-001 (pt-001, finished OPD — paracetamol PRN)
  {
    id: 'rx-002',
    encounterId: 'enc-001',
    prescriberUserId: 101,
    patientId: 'pt-001',
    drugId: 'drug-001', // Paracetamol 500 mg
    doseValue: 500,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Every 6 hours as needed',
    durationDays: 7,
    dispenseQty: 28,
    prn: true,
    instructions: 'For pain or fever. Do not exceed 4 g/day.',
    status: 'active',
    signedAt: todayAt(8, 55),
  },
  // enc-002 (pt-002, finished OPD — diabetes)
  {
    id: 'rx-003',
    encounterId: 'enc-002',
    prescriberUserId: 101,
    patientId: 'pt-002',
    drugId: 'drug-005', // Metformin 500 mg
    doseValue: 500,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Twice daily with meals',
    durationDays: 90,
    dispenseQty: 180,
    prn: false,
    instructions: 'Take with food to minimise GI side effects.',
    status: 'active',
    signedAt: todayAt(9, 25),
  },
  // enc-002 (pt-002 — Atorvastatin)
  {
    id: 'rx-004',
    encounterId: 'enc-002',
    prescriberUserId: 101,
    patientId: 'pt-002',
    drugId: 'drug-006', // Atorvastatin 40 mg
    doseValue: 40,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once nightly',
    durationDays: 90,
    dispenseQty: 90,
    prn: false,
    instructions: 'Take at bedtime. Report unexplained muscle pain.',
    status: 'active',
    signedAt: todayAt(9, 25),
  },
  // enc-004 (pt-007, IPD hypothyroid crisis — in progress)
  {
    id: 'rx-005',
    encounterId: 'enc-004',
    prescriberUserId: 101,
    patientId: 'pt-007',
    drugId: 'drug-001', // Paracetamol (pain/fever in-patient)
    doseValue: 1000,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Every 6 hours',
    durationDays: 5,
    dispenseQty: 20,
    prn: false,
    status: 'active',
    signedAt: daysAgoAt(3, 15, 0),
  },
  // enc-004 (pt-007, IPD hypothyroid — Omeprazole GI protection, active)
  {
    id: 'rx-013',
    encounterId: 'enc-004',
    prescriberUserId: 101,
    patientId: 'pt-007',
    drugId: 'drug-008', // Omeprazole 20 mg
    doseValue: 20,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once daily before breakfast',
    durationDays: 14,
    dispenseQty: 14,
    prn: false,
    instructions: 'Gastroprotection during inpatient stay. Review need at discharge.',
    status: 'active',
    signedAt: daysAgoAt(3, 15, 30),
  },
  // enc-004 (pt-007, IPD hypothyroid — Amoxicillin for aspiration prophylaxis, active)
  {
    id: 'rx-014',
    encounterId: 'enc-004',
    prescriberUserId: 101,
    patientId: 'pt-007',
    drugId: 'drug-003', // Amoxicillin 500 mg
    doseValue: 500,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Three times daily',
    durationDays: 7,
    dispenseQty: 21,
    prn: false,
    instructions: 'Complete the full course. Take with food.',
    status: 'active',
    signedAt: daysAgoAt(3, 15, 30),
  },
  // enc-005 (pt-001, IPD hypertensive urgency)
  {
    id: 'rx-006',
    encounterId: 'enc-005',
    prescriberUserId: 102,
    patientId: 'pt-001',
    drugId: 'drug-004', // Lisinopril 10 mg (continue)
    doseValue: 10,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once daily',
    durationDays: 30,
    dispenseQty: 30,
    prn: false,
    status: 'active',
    signedAt: daysAgoAt(2, 12, 0),
  },
  // enc-005 (pt-001 — Aspirin for cardiac)
  {
    id: 'rx-007',
    encounterId: 'enc-005',
    prescriberUserId: 102,
    patientId: 'pt-001',
    drugId: 'drug-012', // Aspirin 100 mg
    doseValue: 100,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once daily',
    durationDays: 90,
    dispenseQty: 90,
    prn: false,
    instructions: 'Take with food.',
    status: 'active',
    signedAt: daysAgoAt(2, 12, 0),
  },
  // enc-006 (pt-004, ER stroke — Morphine PRN)
  {
    id: 'rx-008',
    encounterId: 'enc-006',
    prescriberUserId: 102,
    patientId: 'pt-004',
    drugId: 'drug-014', // Morphine 10 mg/mL injection
    doseValue: 2.5,
    doseUnit: 'mg',
    route: 'IV',
    frequencyText: 'Every 4 hours as needed for pain',
    durationDays: 2,
    dispenseQty: 10,
    prn: true,
    instructions: 'Titrate for pain score >5. Monitor respiratory rate.',
    status: 'active',
    signedAt: todayAt(7, 15),
  },
  // enc-007 (pt-004, OPD yesterday — Warfarin)
  {
    id: 'rx-009',
    encounterId: 'enc-007',
    prescriberUserId: 101,
    patientId: 'pt-004',
    drugId: 'drug-011', // Warfarin 5 mg
    doseValue: 5,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once daily at 18:00',
    durationDays: 30,
    dispenseQty: 30,
    prn: false,
    instructions: 'INR target 2.0–3.0. Avoid NSAIDs. No grapefruit.',
    status: 'completed',
    signedAt: daysAgoAt(1, 10, 20),
  },
  // enc-008 (pt-010, OPD yesterday — Atorvastatin)
  {
    id: 'rx-010',
    encounterId: 'enc-008',
    prescriberUserId: 101,
    patientId: 'pt-010',
    drugId: 'drug-006', // Atorvastatin 40 mg
    doseValue: 40,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once nightly',
    durationDays: 90,
    dispenseQty: 90,
    prn: false,
    status: 'active',
    signedAt: daysAgoAt(1, 11, 20),
  },
  // enc-009 (pt-010, IPD NSTEMI finished — Aspirin)
  {
    id: 'rx-011',
    encounterId: 'enc-009',
    prescriberUserId: 102,
    patientId: 'pt-010',
    drugId: 'drug-012', // Aspirin 100 mg
    doseValue: 100,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Once daily',
    durationDays: 365,
    dispenseQty: 30,
    prn: false,
    status: 'completed',
    signedAt: daysAgoAt(4, 9, 0),
  },
  // enc-009 (pt-010, IPD NSTEMI finished — Diazepam for procedure anxiety, cancelled)
  {
    id: 'rx-012',
    encounterId: 'enc-009',
    prescriberUserId: 102,
    patientId: 'pt-010',
    drugId: 'drug-013', // Diazepam 5 mg
    doseValue: 5,
    doseUnit: 'mg',
    route: 'oral',
    frequencyText: 'Single dose pre-procedure',
    durationDays: 1,
    dispenseQty: 1,
    prn: false,
    instructions: 'Give 30 min before coronary angiogram.',
    status: 'cancelled',
    signedAt: daysAgoAt(5, 11, 0),
  },
]

export const prescriptionById = (id: string) => PRESCRIPTIONS.find(p => p.id === id)
export const prescriptionsForEncounter = (encounterId: string) =>
  PRESCRIPTIONS.filter(p => p.encounterId === encounterId)
export const prescriptionsForPatient = (patientId: string) =>
  PRESCRIPTIONS.filter(p => p.patientId === patientId)
