import type { MockDiagnosticReport } from './types'
import { todayAt, daysAgoAt } from './today'

// 6 diagnostic reports — 4 lab + 2 radiology, mix of signed + draft
export const DIAGNOSTIC_REPORTS: MockDiagnosticReport[] = [
  // drep-001 — Troponin critical high (draft — just resulted, not yet signed)
  {
    id: 'drep-001',
    serviceRequestId: 'labord-001',
    encounterId: 'enc-003',
    patientId: 'pt-003',
    category: 'lab',
    code: 'TROPI',
    display: 'Troponin-I Result',
    status: 'draft',
    conclusion: 'CRITICAL: Troponin-I 6842 ng/L (RR < 26). Consistent with myocardial injury. Requires urgent cardiology review.',
    effectiveAt: todayAt(12, 35),
    observationIds: ['obs-001'],
  },
  // drep-002 — CBC (draft — resulted, pending sign-off)
  {
    id: 'drep-002',
    serviceRequestId: 'labord-002',
    encounterId: 'enc-003',
    patientId: 'pt-003',
    category: 'lab',
    code: 'HGB',
    display: 'CBC Result',
    status: 'draft',
    conclusion: 'Haemoglobin within normal limits. No anaemia.',
    effectiveAt: todayAt(10, 30),
    observationIds: ['obs-002'],
  },
  // drep-003 — TSH critical high (final — signed)
  {
    id: 'drep-003',
    serviceRequestId: 'labord-003',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    category: 'lab',
    code: 'TSH',
    display: 'TSH Result',
    status: 'final',
    conclusion: 'TSH 68 mIU/L — markedly elevated. Consistent with severe primary hypothyroidism. Improvement from admission value of >100 mIU/L following IV Levothyroxine.',
    effectiveAt: daysAgoAt(1, 14, 0),
    issuedAt: daysAgoAt(1, 15, 30),
    signedByUserId: 110,
    observationIds: ['obs-003'],
  },
  // drep-004 — INR + Creatinine panel (final — signed)
  {
    id: 'drep-004',
    serviceRequestId: 'labord-004',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    category: 'lab',
    code: 'COAG-RENAL',
    display: 'Coagulation + Renal Panel',
    status: 'final',
    conclusion: 'INR 2.4 — within therapeutic range for anticoagulation. Creatinine 82 µmol/L — normal renal function.',
    effectiveAt: daysAgoAt(2, 14, 30),
    issuedAt: daysAgoAt(2, 16, 0),
    signedByUserId: 111,
    observationIds: ['obs-004', 'obs-005'],
  },
  // drep-005 — Potassium critical low (final — signed, triggered alert)
  {
    id: 'drep-005',
    serviceRequestId: 'labord-006',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    category: 'lab',
    code: 'K',
    display: 'Potassium Result',
    status: 'final',
    conclusion: 'CRITICAL: K+ 2.5 mmol/L — hypokalaemia. Immediate IV potassium replacement required. Monitor cardiac rhythm.',
    effectiveAt: todayAt(7, 10),
    issuedAt: todayAt(7, 15),
    signedByUserId: 110,
    observationIds: ['obs-006'],
  },
  // drep-006 — INR + HbA1c combined report (final)
  {
    id: 'drep-006',
    serviceRequestId: 'labord-007',
    encounterId: 'enc-007',
    patientId: 'pt-004',
    category: 'lab',
    code: 'INR',
    display: 'INR Result — Warfarin Monitoring',
    status: 'final',
    conclusion: 'INR 2.7 — therapeutic (target 2.0–3.0). Continue current Warfarin dose.',
    effectiveAt: daysAgoAt(1, 11, 0),
    issuedAt: daysAgoAt(1, 12, 0),
    signedByUserId: 111,
    observationIds: ['obs-007'],
  },
  // drep-007 — Urine MC (final — labord-013, enc-005)
  {
    id: 'drep-007',
    serviceRequestId: 'labord-013',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    category: 'lab',
    code: 'URIN-MC',
    display: 'Urine Microscopy & Culture',
    status: 'final',
    conclusion: 'No significant bacterial growth. Microscopy unremarkable. No urinary tract infection detected.',
    effectiveAt: daysAgoAt(1, 16, 30),
    issuedAt: daysAgoAt(1, 17, 0),
    signedByUserId: 110,
    observationIds: ['obs-013'],
  },
  // drep-008 — X-Ray Knee (final — radord-010, enc-007); radiology report
  {
    id: 'drep-008',
    serviceRequestId: 'radord-010',
    encounterId: 'enc-007',
    patientId: 'pt-004',
    category: 'radiology',
    code: 'XR-KNEE',
    display: 'X-Ray Knee Report',
    status: 'final',
    conclusion: 'Mild medial compartment osteoarthritis, bilateral. No acute fracture or dislocation. Recommend physiotherapy and orthopaedic review.',
    effectiveAt: daysAgoAt(1, 12, 30),
    issuedAt: daysAgoAt(1, 13, 0),
    signedByUserId: 111,
    observationIds: ['obs-015'],
    imagingStudyId: 'img-008',
  },
  // drep-009 — CT Brain (final — radord-003, enc-006); radiology report
  {
    id: 'drep-009',
    serviceRequestId: 'radord-003',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    category: 'radiology',
    code: 'CT-BRAIN',
    display: 'CT Brain Report',
    status: 'final',
    conclusion: 'No acute intracranial haemorrhage. No midline shift. Early ischaemic changes in left MCA territory — correlate clinically. Recommend urgent neurology review and MRI Brain.',
    effectiveAt: todayAt(7, 30),
    issuedAt: todayAt(8, 0),
    signedByUserId: 111,
    observationIds: [],
    imagingStudyId: 'img-003',
  },
]

export const reportById = (id: string) => DIAGNOSTIC_REPORTS.find(r => r.id === id)
export const reportsForEncounter = (encounterId: string) =>
  DIAGNOSTIC_REPORTS.filter(r => r.encounterId === encounterId)
export const reportsForPatient = (patientId: string) =>
  DIAGNOSTIC_REPORTS.filter(r => r.patientId === patientId)
