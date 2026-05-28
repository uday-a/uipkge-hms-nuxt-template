import { isoDate, iso, daysAgo, daysAgoAt, todayAt, hoursAgo, minutesAgo } from './today'
import type { MockANCRecord, MockLabour, MockDelivery } from './types'

// ── ANC records ──────────────────────────────────────────────────────────────

export const ANC_RECORDS: MockANCRecord[] = [
  {
    id: 'anc-001',
    patientId: 'pt-002',
    lmp: isoDate(daysAgo(270)),
    edd: isoDate(daysAgo(270 + 280)),
    gravidaPara: 'G2P1',
    visits: [
      { at: daysAgoAt(180, 9, 0), weeks: 12, weightKg: 58.0, bpSys: 118, bpDia: 76, fundalHeightCm: 12, fetalHr: 156, notes: 'Booking visit. Dating scan consistent with LMP. Low risk.' },
      { at: daysAgoAt(120, 10, 0), weeks: 20, weightKg: 60.5, bpSys: 116, bpDia: 74, fundalHeightCm: 20, fetalHr: 148, notes: 'Anomaly scan normal. Fetal movements felt.' },
      { at: daysAgoAt(60, 9, 30), weeks: 28, weightKg: 63.0, bpSys: 120, bpDia: 78, fundalHeightCm: 28, fetalHr: 152, notes: 'Glucose challenge test passed. Iron supplementation started.' },
    ],
    riskFactors: [],
  },
  {
    id: 'anc-002',
    patientId: 'pt-003',
    lmp: isoDate(daysAgo(290)),
    edd: isoDate(daysAgo(290 + 280)),
    gravidaPara: 'G1P0',
    visits: [
      { at: daysAgoAt(200, 9, 0), weeks: 12, weightKg: 55.0, bpSys: 112, bpDia: 72, fundalHeightCm: 11, fetalHr: 160, notes: 'Booking visit. Routine bloods done.' },
      { at: daysAgoAt(160, 10, 0), weeks: 18, weightKg: 57.0, bpSys: 114, bpDia: 74, fundalHeightCm: 18, fetalHr: 150, notes: 'Anomaly scan normal.' },
      { at: daysAgoAt(120, 9, 0), weeks: 24, weightKg: 59.5, bpSys: 116, bpDia: 76, fundalHeightCm: 24, fetalHr: 148, notes: 'OGTT — fasting 5.2, 2-hr 8.9. GDM diagnosed. Dietician review.' },
      { at: daysAgoAt(80, 9, 30), weeks: 30, weightKg: 62.0, bpSys: 118, bpDia: 76, fundalHeightCm: 30, fetalHr: 146, notes: 'GDM controlled on diet. Growth scan on track.' },
      { at: daysAgoAt(40, 9, 0), weeks: 36, weightKg: 64.5, bpSys: 122, bpDia: 78, fundalHeightCm: 34, fetalHr: 142, notes: 'Presentation cephalic. BP stable. Plan for SVD.' },
    ],
    riskFactors: ['Gestational diabetes mellitus'],
  },
  {
    id: 'anc-003',
    patientId: 'pt-005',
    lmp: isoDate(daysAgo(200)),
    edd: isoDate(daysAgo(200 + 280)),
    gravidaPara: 'G1P0',
    visits: [
      { at: daysAgoAt(170, 11, 0), weeks: 8, weightKg: 52.0, bpSys: 110, bpDia: 70, fundalHeightCm: 8, fetalHr: 162, notes: 'Teenage pregnancy. Social work referral made. BP normal.' },
    ],
    riskFactors: ['Teenage pregnancy'],
  },
  {
    id: 'anc-004',
    patientId: 'pt-007',
    lmp: isoDate(daysAgo(310)),
    edd: isoDate(daysAgo(310 + 280)),
    gravidaPara: 'G3P2',
    visits: [
      { at: daysAgoAt(240, 9, 0), weeks: 10, weightKg: 68.0, bpSys: 124, bpDia: 82, fundalHeightCm: 10, fetalHr: 158, notes: 'Booking visit. BMI 26. Advise low-dose aspirin.' },
      { at: daysAgoAt(200, 10, 0), weeks: 16, weightKg: 69.0, bpSys: 126, bpDia: 80, fundalHeightCm: 16, fetalHr: 152, notes: 'NIPT low risk. BP borderline.' },
      { at: daysAgoAt(160, 9, 0), weeks: 22, weightKg: 70.5, bpSys: 128, bpDia: 84, fundalHeightCm: 22, fetalHr: 148, notes: 'BP rising. UPCR negative. Continue monitoring.' },
      { at: daysAgoAt(120, 9, 30), weeks: 28, weightKg: 72.0, bpSys: 132, bpDia: 86, fundalHeightCm: 28, fetalHr: 146, notes: 'OGTT normal. BP elevated. Consider twice-weekly monitoring.' },
      { at: daysAgoAt(80, 10, 0), weeks: 32, weightKg: 73.5, bpSys: 136, bpDia: 88, fundalHeightCm: 32, fetalHr: 144, notes: 'Pre-eclampsia screening — UPCR 0.35. Fetal growth adequate.' },
      { at: daysAgoAt(50, 9, 0), weeks: 36, weightKg: 74.0, bpSys: 140, bpDia: 90, fundalHeightCm: 34, fetalHr: 140, notes: 'BP 140/90. Proteinuria +. Diagnosed pre-eclampsia. Plan for induction at 37w.' },
      { at: daysAgoAt(20, 9, 0), weeks: 38, weightKg: 74.5, bpSys: 142, bpDia: 92, fundalHeightCm: 36, fetalHr: 138, notes: 'Induction commenced. Cervix 2 cm.' },
    ],
    riskFactors: ['Advanced maternal age', 'Pre-eclampsia'],
  },
  {
    id: 'anc-005',
    patientId: 'pt-009',
    lmp: isoDate(daysAgo(240)),
    edd: isoDate(daysAgo(240 + 280)),
    gravidaPara: 'G1P0',
    visits: [
      { at: daysAgoAt(190, 9, 0), weeks: 10, weightKg: 56.0, bpSys: 114, bpDia: 74, fundalHeightCm: 10, fetalHr: 160, notes: 'Booking visit. Routine bloods normal.' },
      { at: daysAgoAt(140, 10, 0), weeks: 18, weightKg: 58.5, bpSys: 116, bpDia: 76, fundalHeightCm: 18, fetalHr: 152, notes: 'Anomaly scan normal. Fetal movements felt at 18w.' },
    ],
    riskFactors: [],
  },
  {
    id: 'anc-006',
    patientId: 'pt-011',
    lmp: isoDate(daysAgo(260)),
    edd: isoDate(daysAgo(260 + 280)),
    gravidaPara: 'G2P1',
    visits: [
      { at: daysAgoAt(200, 9, 0), weeks: 12, weightKg: 54.0, bpSys: 112, bpDia: 72, fundalHeightCm: 12, fetalHr: 158, notes: 'Booking visit. Hb 9.8 g/dL. Iron + folate started.' },
      { at: daysAgoAt(150, 10, 0), weeks: 20, weightKg: 56.5, bpSys: 114, bpDia: 74, fundalHeightCm: 20, fetalHr: 150, notes: 'Anomaly scan normal. Hb improved to 10.5.' },
      { at: daysAgoAt(100, 9, 30), weeks: 28, weightKg: 59.0, bpSys: 116, bpDia: 76, fundalHeightCm: 28, fetalHr: 148, notes: 'Glucose tolerance normal. Continue oral iron.' },
      { at: daysAgoAt(50, 9, 0), weeks: 36, weightKg: 61.0, bpSys: 118, bpDia: 76, fundalHeightCm: 34, fetalHr: 144, notes: 'Cephalic presentation. Hb 10.2. Plan for SVD.' },
    ],
    riskFactors: ['Anemia'],
  },
]

// ── Active labours ───────────────────────────────────────────────────────────

export const LABOURS: MockLabour[] = [
  {
    id: 'labr-001',
    patientId: 'pt-003',
    ancRecordId: 'anc-002',
    startedAt: iso(hoursAgo(4)),
    stage: 2,
    cervicalDilationCm: 8,
    partograph: [
      { at: iso(hoursAgo(4)), cervicalDilationCm: 3, contractionsPer10Min: 3, fetalHr: 148, bpSys: 122, bpDia: 78 },
      { at: iso(hoursAgo(3)), cervicalDilationCm: 4, contractionsPer10Min: 4, fetalHr: 146, bpSys: 124, bpDia: 80 },
      { at: iso(hoursAgo(2)), cervicalDilationCm: 5, contractionsPer10Min: 4, fetalHr: 144, bpSys: 126, bpDia: 82 },
      { at: iso(hoursAgo(1.5)), cervicalDilationCm: 6, contractionsPer10Min: 5, fetalHr: 142, bpSys: 128, bpDia: 82 },
      { at: iso(hoursAgo(1)), cervicalDilationCm: 7, contractionsPer10Min: 5, fetalHr: 140, bpSys: 130, bpDia: 84 },
      { at: iso(hoursAgo(0.5)), cervicalDilationCm: 8, contractionsPer10Min: 5, fetalHr: 138, bpSys: 132, bpDia: 86 },
    ],
    attendingObUserId: 101,
    status: 'in_progress',
  },
  {
    id: 'labr-002',
    patientId: 'pt-009',
    ancRecordId: 'anc-005',
    startedAt: iso(hoursAgo(2)),
    stage: 1,
    cervicalDilationCm: 4,
    partograph: [
      { at: iso(hoursAgo(2)), cervicalDilationCm: 2, contractionsPer10Min: 2, fetalHr: 152, bpSys: 118, bpDia: 76 },
      { at: iso(hoursAgo(1)), cervicalDilationCm: 3, contractionsPer10Min: 3, fetalHr: 150, bpSys: 120, bpDia: 78 },
      { at: iso(minutesAgo(30)), cervicalDilationCm: 4, contractionsPer10Min: 4, fetalHr: 148, bpSys: 122, bpDia: 78 },
    ],
    attendingObUserId: 103,
    status: 'in_progress',
  },
]

// ── Deliveries ───────────────────────────────────────────────────────────────

export const DELIVERIES: MockDelivery[] = [
  {
    id: 'deliv-001',
    labourId: undefined,
    patientId: 'pt-002',
    mode: 'svd',
    deliveredAt: daysAgoAt(2, 14, 30),
    babySexAtBirth: 'male',
    babyWeightGrams: 3200,
    apgar1Min: 9,
    apgar5Min: 10,
  },
  {
    id: 'deliv-002',
    labourId: undefined,
    patientId: 'pt-007',
    mode: 'cs_emergency',
    deliveredAt: daysAgoAt(5, 9, 0),
    babySexAtBirth: 'female',
    babyWeightGrams: 2800,
    apgar1Min: 7,
    apgar5Min: 9,
    complications: 'Pre-eclampsia with severe features. Emergency CS at 38 weeks. APGAR 7 at 1 min improved to 9 at 5 min.',
  },
  {
    id: 'deliv-003',
    labourId: undefined,
    patientId: 'pt-011',
    mode: 'svd',
    deliveredAt: daysAgoAt(1, 16, 0),
    babySexAtBirth: 'female',
    babyWeightGrams: 3100,
    apgar1Min: 9,
    apgar5Min: 10,
  },
  {
    id: 'deliv-004',
    labourId: undefined,
    patientId: 'pt-005',
    mode: 'instrumental',
    deliveredAt: daysAgoAt(3, 11, 15),
    babySexAtBirth: 'female',
    babyWeightGrams: 2900,
    apgar1Min: 8,
    apgar5Min: 9,
    complications: 'Shoulder dystocia. Vacuum-assisted delivery. Paediatric team present. No fracture.',
  },
]

export const ancRecordById = (id: string) => ANC_RECORDS.find(a => a.id === id)
export const ancRecordByPatient = (patientId: string) => ANC_RECORDS.find(a => a.patientId === patientId)
export const labourById = (id: string) => LABOURS.find(l => l.id === id)
export const deliveryById = (id: string) => DELIVERIES.find(d => d.id === id)
export const deliveriesByPatient = (patientId: string) => DELIVERIES.filter(d => d.patientId === patientId)
