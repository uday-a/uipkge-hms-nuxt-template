import type { MockICUAdmission } from './types'
import { todayAt, daysAgoAt, yesterdayAt } from './today'

// 3 ICU admissions — 2 active + 1 discharged to ward
export const ICU_ADMISSIONS: MockICUAdmission[] = [
  // Active — pt-004 stroke (transferred from ER today)
  {
    id: 'icu-001',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    source: 'ER',
    indication: 'Acute ischaemic stroke — right MCA occlusion. Post-thrombectomy monitoring.',
    admittedAt: todayAt(8, 30),
    admittedByUserId: 102, // Dr Michael O'Connor
    intensivistUserId: 102,
    initialSeverity: 'severe',
    initialGcs: 13,
    dischargedAt: undefined,
    outcome: undefined,
  },
  // Active — pt-001 post-operative monitoring (CABG tomorrow, already in ICU step-down)
  {
    id: 'icu-002',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    source: 'ward',
    indication: 'Hypertensive urgency — close BP monitoring. Pre-operative optimisation for CABG.',
    admittedAt: daysAgoAt(1, 22, 0),
    admittedByUserId: 102,
    intensivistUserId: 102,
    initialSeverity: 'moderate',
    initialGcs: 15,
    dischargedAt: undefined,
    outcome: undefined,
  },
  // Discharged to ward — pt-010 post-PCI (5 days ago, 1 day ICU then to ward)
  {
    id: 'icu-003',
    encounterId: 'enc-009',
    patientId: 'pt-010',
    source: 'OT',
    indication: 'Post-PCI monitoring — haemodynamic stability, arrhythmia observation.',
    admittedAt: daysAgoAt(5, 15, 30),
    admittedByUserId: 102,
    intensivistUserId: 102,
    initialSeverity: 'mild',
    initialGcs: 15,
    dischargedAt: daysAgoAt(4, 12, 0),
    outcome: 'discharged_to_ward',
  },

  // Extra ICU admissions for pagination (client demo)
  { id: 'icu-004', encounterId: 'enc-025', patientId: 'pt-013', source: 'ER', indication: 'Severe sepsis — source control + vasopressors', admittedAt: todayAt(2, 15), admittedByUserId: 102, intensivistUserId: 108, initialSeverity: 'severe', initialGcs: 12 },
  { id: 'icu-005', encounterId: 'enc-026', patientId: 'pt-014', source: 'OT', indication: 'Post major abdominal surgery monitoring', admittedAt: yesterdayAt(18, 40), admittedByUserId: 106, intensivistUserId: 102, initialSeverity: 'moderate', initialGcs: 15, dischargedAt: todayAt(8, 0), outcome: 'discharged_to_ward' },
  { id: 'icu-006', encounterId: 'enc-027', patientId: 'pt-016', source: 'ER', indication: 'Status asthmaticus — non-invasive ventilation', admittedAt: todayAt(4, 10), admittedByUserId: 101, intensivistUserId: 108, initialSeverity: 'severe', initialGcs: 14 },
  { id: 'icu-007', encounterId: 'enc-028', patientId: 'pt-017', source: 'ward', indication: 'Acute respiratory failure — post arrest', admittedAt: daysAgoAt(2, 22, 0), admittedByUserId: 102, intensivistUserId: 108, initialSeverity: 'severe', initialGcs: 6 },
  { id: 'icu-008', encounterId: 'enc-029', patientId: 'pt-018', source: 'OT', indication: 'Post spinal surgery neuro monitoring', admittedAt: yesterdayAt(20, 30), admittedByUserId: 105, intensivistUserId: 102, initialSeverity: 'moderate', initialGcs: 15, dischargedAt: todayAt(11, 20), outcome: 'discharged_to_ward' },
]

export const icuAdmissionById = (id: string) => ICU_ADMISSIONS.find(i => i.id === id)
export const activeICUAdmissions = () => ICU_ADMISSIONS.filter(i => !i.dischargedAt)
export const icuAdmissionForEncounter = (encounterId: string) =>
  ICU_ADMISSIONS.find(i => i.encounterId === encounterId)
