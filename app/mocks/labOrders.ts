import type { MockServiceRequest, MockLabSample } from './types'
import { todayAt, daysAgoAt } from './today'

// 8 lab service_requests across various funnel stages:
// draft → active (awaiting collection) → active (sample collected, awaiting result) → completed

export const LAB_ORDERS: MockServiceRequest[] = [
  // enc-003 — chest pain workup (stat troponin, pending collection)
  {
    id: 'labord-001',
    encounterId: 'enc-003',
    patientId: 'pt-003',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'TROPI',
    display: 'Troponin-I (high-sensitivity)',
    priority: 'stat',
    status: 'active',
    createdAt: todayAt(9, 35),
    catalogId: 'lc-008',
  },
  // enc-003 — CBC for chest pain
  {
    id: 'labord-002',
    encounterId: 'enc-003',
    patientId: 'pt-003',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'HGB',
    display: 'Complete Blood Count (CBC)',
    priority: 'urgent',
    status: 'active',
    createdAt: todayAt(9, 35),
    catalogId: 'lc-001',
  },
  // enc-004 — TSH for hypothyroid monitoring (sample collected, awaiting result)
  {
    id: 'labord-003',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    facilityId: 'fac-001',
    requesterUserId: 101,
    category: 'lab',
    code: 'TSH',
    display: 'Thyroid Stimulating Hormone (TSH)',
    priority: 'routine',
    status: 'active',
    createdAt: daysAgoAt(1, 8, 0),
    catalogId: 'lc-010',
  },
  // enc-005 — INR for pt-001 on warfarin-equivalent monitoring (completed — result available)
  {
    id: 'labord-004',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'INR',
    display: 'International Normalised Ratio (INR)',
    priority: 'urgent',
    status: 'completed',
    createdAt: daysAgoAt(2, 11, 30),
    catalogId: 'lc-009',
  },
  // enc-005 — Creatinine (routine renal function — completed)
  {
    id: 'labord-005',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'CREAT',
    display: 'Creatinine',
    priority: 'routine',
    status: 'completed',
    createdAt: daysAgoAt(2, 11, 30),
    catalogId: 'lc-006',
  },
  // enc-006 — Troponin stat for ER stroke workup (completed — critical value!)
  {
    id: 'labord-006',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'K',
    display: 'Potassium',
    priority: 'stat',
    status: 'completed',
    createdAt: todayAt(6, 20),
    catalogId: 'lc-005',
  },
  // enc-007 — INR for warfarin monitoring (completed — yesterday)
  {
    id: 'labord-007',
    encounterId: 'enc-007',
    patientId: 'pt-004',
    facilityId: 'fac-001',
    requesterUserId: 101,
    category: 'lab',
    code: 'INR',
    display: 'International Normalised Ratio (INR)',
    priority: 'routine',
    status: 'completed',
    createdAt: daysAgoAt(1, 10, 10),
    catalogId: 'lc-009',
  },
  // enc-002 — HbA1c (completed — today's diabetes visit)
  {
    id: 'labord-008',
    encounterId: 'enc-002',
    patientId: 'pt-002',
    facilityId: 'fac-001',
    requesterUserId: 101,
    category: 'lab',
    code: 'HBA1C',
    display: 'Glycated Haemoglobin (HbA1c)',
    priority: 'routine',
    status: 'completed',
    createdAt: daysAgoAt(7, 8, 0), // ordered 7 days ago, result back today
    catalogId: 'lc-011',
  },
  // enc-010 — WBC for post-op paeds (awaiting collection — no sample yet)
  {
    id: 'labord-009',
    encounterId: 'enc-010',
    patientId: 'pt-008',
    facilityId: 'fac-001',
    requesterUserId: 103,
    category: 'lab',
    code: 'WBC',
    display: 'White Blood Cell Count',
    priority: 'urgent',
    status: 'active',
    createdAt: todayAt(9, 0),
    catalogId: 'lc-002',
  },
  // enc-004 — Blood glucose monitoring for inpatient (awaiting collection — no sample yet)
  {
    id: 'labord-010',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    facilityId: 'fac-001',
    requesterUserId: 101,
    category: 'lab',
    code: 'GLUC',
    display: 'Blood Glucose (Fasting)',
    priority: 'routine',
    status: 'active',
    createdAt: todayAt(7, 30),
    catalogId: 'lc-007',
  },
  // enc-006 — Sodium check for ER stroke (sample collected, awaiting result)
  {
    id: 'labord-011',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'NA',
    display: 'Sodium',
    priority: 'stat',
    status: 'active',
    createdAt: todayAt(6, 22),
    catalogId: 'lc-004',
  },
  // enc-010 — Platelet count post-op paeds (sample collected, awaiting result)
  {
    id: 'labord-012',
    encounterId: 'enc-010',
    patientId: 'pt-008',
    facilityId: 'fac-001',
    requesterUserId: 103,
    category: 'lab',
    code: 'PLT',
    display: 'Platelet Count',
    priority: 'urgent',
    status: 'active',
    createdAt: todayAt(9, 5),
    catalogId: 'lc-003',
  },
  // enc-005 — Urine MC for ongoing inpatient (completed — result available)
  {
    id: 'labord-013',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    requesterUserId: 102,
    category: 'lab',
    code: 'URIN-MC',
    display: 'Urine Microscopy & Culture',
    priority: 'routine',
    status: 'completed',
    createdAt: daysAgoAt(1, 14, 0),
    catalogId: 'lc-012',
  },
]

export const LAB_SAMPLES: MockLabSample[] = [
  // labord-001 — awaiting collection (no collected/received timestamps yet)
  {
    id: 'samp-001',
    serviceRequestId: 'labord-001',
    patientId: 'pt-003',
    specimenType: 'blood',
    barcode: 'BC-2026-09351',
    collectedAt: undefined,
    collectedByUserId: undefined,
  },
  // labord-002 — collected, not yet received
  {
    id: 'samp-002',
    serviceRequestId: 'labord-002',
    patientId: 'pt-003',
    specimenType: 'blood',
    barcode: 'BC-2026-09352',
    collectedAt: todayAt(9, 45),
    collectedByUserId: 110,
  },
  // labord-003 — collected and received
  {
    id: 'samp-003',
    serviceRequestId: 'labord-003',
    patientId: 'pt-007',
    specimenType: 'blood',
    barcode: 'BC-2026-09200',
    collectedAt: daysAgoAt(1, 8, 15),
    collectedByUserId: 110,
    receivedAt: daysAgoAt(1, 8, 45),
  },
  // labord-004 — collected and received (completed)
  {
    id: 'samp-004',
    serviceRequestId: 'labord-004',
    patientId: 'pt-001',
    specimenType: 'blood',
    barcode: 'BC-2026-09101',
    collectedAt: daysAgoAt(2, 12, 0),
    collectedByUserId: 111,
    receivedAt: daysAgoAt(2, 12, 20),
  },
  // labord-005 — collected and received (completed)
  {
    id: 'samp-005',
    serviceRequestId: 'labord-005',
    patientId: 'pt-001',
    specimenType: 'blood',
    barcode: 'BC-2026-09102',
    collectedAt: daysAgoAt(2, 12, 0),
    collectedByUserId: 111,
    receivedAt: daysAgoAt(2, 12, 20),
  },
  // labord-006 — collected and received (ER, stat, completed)
  {
    id: 'samp-006',
    serviceRequestId: 'labord-006',
    patientId: 'pt-004',
    specimenType: 'blood',
    barcode: 'BC-2026-09400',
    collectedAt: todayAt(6, 25),
    collectedByUserId: 110,
    receivedAt: todayAt(6, 35),
  },
  // labord-007 — completed (yesterday INR)
  {
    id: 'samp-007',
    serviceRequestId: 'labord-007',
    patientId: 'pt-004',
    specimenType: 'blood',
    barcode: 'BC-2026-08991',
    collectedAt: daysAgoAt(1, 10, 15),
    collectedByUserId: 111,
    receivedAt: daysAgoAt(1, 10, 30),
  },
  // labord-008 — completed (HbA1c)
  {
    id: 'samp-008',
    serviceRequestId: 'labord-008',
    patientId: 'pt-002',
    specimenType: 'blood',
    barcode: 'BC-2026-08201',
    collectedAt: daysAgoAt(7, 8, 15),
    collectedByUserId: 110,
    receivedAt: daysAgoAt(7, 8, 30),
  },
  // labord-011 — collected, not yet received (awaiting result)
  {
    id: 'samp-009',
    serviceRequestId: 'labord-011',
    patientId: 'pt-004',
    specimenType: 'blood',
    barcode: 'BC-2026-09401',
    collectedAt: todayAt(6, 30),
    collectedByUserId: 110,
  },
  // labord-012 — collected, not yet received (awaiting result)
  {
    id: 'samp-010',
    serviceRequestId: 'labord-012',
    patientId: 'pt-008',
    specimenType: 'blood',
    barcode: 'BC-2026-09410',
    collectedAt: todayAt(9, 20),
    collectedByUserId: 111,
  },
  // labord-013 — collected and received (completed urine MC)
  {
    id: 'samp-011',
    serviceRequestId: 'labord-013',
    patientId: 'pt-001',
    specimenType: 'urine',
    barcode: 'BC-2026-09103',
    collectedAt: daysAgoAt(1, 14, 15),
    collectedByUserId: 111,
    receivedAt: daysAgoAt(1, 14, 40),
  },
]

export const labOrderById = (id: string) => LAB_ORDERS.find(o => o.id === id)
export const labOrdersForEncounter = (encounterId: string) =>
  LAB_ORDERS.filter(o => o.encounterId === encounterId)
export const sampleForOrder = (serviceRequestId: string) =>
  LAB_SAMPLES.find(s => s.serviceRequestId === serviceRequestId)
