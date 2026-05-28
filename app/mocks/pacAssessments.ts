import type { MockPACAssessment } from './types'
import { todayAt, daysAgoAt } from './today'

// 3 pre-anaesthesia / pre-operative assessment checklists
export const PAC_ASSESSMENTS: MockPACAssessment[] = [
  // surg-001 — tonsillectomy today (completed — done yesterday)
  {
    id: 'pac-001',
    surgeryBookingId: 'surg-001',
    patientId: 'pt-008',
    assessedByUserId: 101, // Dr Sarah Bennett
    assessedAt: daysAgoAt(1, 15, 0),
    asa: 1,
    airwayMallampati: 1,
    dentalNotes: 'Primary dentition — no loose teeth identified.',
    allergies: 'Amoxicillin (urticaria)',
    currentMedications: 'None',
    fasting: true,
    fastingLastOralAt: todayAt(0, 0),
    consentSigned: true,
    consentSignedAt: daysAgoAt(1, 15, 30),
    anesthesiaPlan: 'General anaesthesia — LMA. Induction: Propofol 3 mg/kg. Maintenance: Sevoflurane. Paediatric dosing per weight (32 kg).',
    premedications: 'Midazolam 0.3 mg/kg oral (given 30 min pre-op)',
    status: 'reviewed',
  },
  // surg-002 — CABG tomorrow (completed — done today)
  {
    id: 'pac-002',
    surgeryBookingId: 'surg-002',
    patientId: 'pt-001',
    assessedByUserId: 101,
    assessedAt: todayAt(11, 0),
    asa: 3,
    airwayMallampati: 2,
    dentalNotes: 'Upper denture — removed pre-op. No loose teeth.',
    allergies: 'Penicillin (rash), Sulfa drugs (anaphylaxis)',
    currentMedications: 'Lisinopril 10 mg OD, Aspirin 100 mg OD (stopped 7 days pre-op)',
    fasting: false, // NBM starts tonight
    consentSigned: true,
    consentSignedAt: todayAt(11, 45),
    anesthesiaPlan: 'General anaesthesia — ETT. Cardiopulmonary bypass planned. TEE monitoring. RSI with Rocuronium. TIVA Propofol + Remifentanil. Epidural post-op for analgesia.',
    premedications: 'Temazepam 10 mg nocte, Omeprazole 40 mg IV pre-op',
    status: 'completed',
  },
  // surg-004 — thyroid biopsy tomorrow (draft — not yet fully assessed)
  {
    id: 'pac-003',
    surgeryBookingId: 'surg-004',
    patientId: 'pt-007',
    assessedByUserId: 101,
    assessedAt: todayAt(14, 0),
    asa: 2,
    airwayMallampati: 1,
    allergies: 'Ibuprofen (asthma exacerbation)',
    currentMedications: 'Levothyroxine 100 mcg OD',
    fasting: false,
    consentSigned: false,
    anesthesiaPlan: 'Local anaesthetic — Lidocaine 1% with adrenaline. Sedation with Midazolam 1 mg IV if anxious.',
    status: 'draft',
  },
]

export const pacAssessmentById = (id: string) => PAC_ASSESSMENTS.find(p => p.id === id)
export const pacForSurgery = (surgeryBookingId: string) =>
  PAC_ASSESSMENTS.find(p => p.surgeryBookingId === surgeryBookingId)
