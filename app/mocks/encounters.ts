import type { MockEncounter } from './types'
import { todayAt, daysAgoAt } from './today'

// 10 encounters:
//   enc-001  OPD finished   pt-001  Dr Bennett
//   enc-002  OPD finished   pt-002  Dr Bennett
//   enc-003  OPD in_progress pt-003  Dr O'Connor
//   enc-004  IPD in_progress pt-007  Dr Bennett  (Medical Ward A, bed-01)
//   enc-005  IPD in_progress pt-001  Dr O'Connor (Medical Ward A, bed-02)
//   enc-006  Emergency in_progress pt-004  Dr O'Connor  (ER Bay 1)
//   enc-007  OPD finished   pt-004  Dr Bennett  (yesterday)
//   enc-008  OPD finished   pt-010  Dr Bennett  (yesterday)
//   enc-009  IPD finished   pt-010  Dr O'Connor (discharged)
//   enc-010  Daycare in_progress pt-008 Dr Holmes (peds)

export const ENCOUNTERS: MockEncounter[] = [
  {
    id: 'enc-001',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    type: 'outpatient',
    status: 'finished',
    departmentId: 'dept-opd',
    attendingUserId: 101,
    admissionAt: todayAt(8, 35),
    dischargeAt: todayAt(8, 55),
    reasonChiefComplaint: 'Follow-up hypertension management',
    appointmentId: 'appt-001',
  },
  {
    id: 'enc-002',
    patientId: 'pt-002',
    facilityId: 'fac-001',
    type: 'outpatient',
    status: 'finished',
    departmentId: 'dept-opd',
    attendingUserId: 101,
    admissionAt: todayAt(9, 5),
    dischargeAt: todayAt(9, 25),
    reasonChiefComplaint: 'Routine diabetes check',
    appointmentId: 'appt-002',
  },
  {
    id: 'enc-003',
    patientId: 'pt-003',
    facilityId: 'fac-001',
    type: 'outpatient',
    status: 'in_progress',
    departmentId: 'dept-opd',
    attendingUserId: 102,
    admissionAt: todayAt(9, 32),
    reasonChiefComplaint: 'Chest pain — evaluate for ACS',
    appointmentId: 'appt-003',
  },
  {
    id: 'enc-004',
    patientId: 'pt-007',
    facilityId: 'fac-001',
    type: 'inpatient',
    status: 'in_progress',
    departmentId: 'dept-ipd-med',
    attendingUserId: 101,
    admissionAt: daysAgoAt(3, 14, 30),
    bedId: 'bed-med-a-01',
    reasonChiefComplaint: 'Hypothyroid crisis — myxedema',
  },
  {
    id: 'enc-005',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    type: 'inpatient',
    status: 'in_progress',
    departmentId: 'dept-ipd-med',
    attendingUserId: 102,
    admissionAt: daysAgoAt(2, 11, 0),
    bedId: 'bed-med-a-02',
    reasonChiefComplaint: 'Hypertensive urgency with chest tightness',
  },
  {
    id: 'enc-006',
    patientId: 'pt-004',
    facilityId: 'fac-001',
    type: 'emergency',
    status: 'in_progress',
    departmentId: 'dept-er',
    attendingUserId: 102,
    admissionAt: todayAt(6, 15),
    bedId: 'bed-er-01',
    reasonChiefComplaint: 'Acute stroke — left-sided weakness, onset 05:30',
  },
  {
    id: 'enc-007',
    patientId: 'pt-004',
    facilityId: 'fac-001',
    type: 'outpatient',
    status: 'finished',
    departmentId: 'dept-opd',
    attendingUserId: 101,
    admissionAt: daysAgoAt(1, 10, 5),
    dischargeAt: daysAgoAt(1, 10, 25),
    reasonChiefComplaint: 'Routine INR check — warfarin monitoring',
    appointmentId: 'appt-017',
  },
  {
    id: 'enc-008',
    patientId: 'pt-010',
    facilityId: 'fac-001',
    type: 'outpatient',
    status: 'finished',
    departmentId: 'dept-opd',
    attendingUserId: 101,
    admissionAt: daysAgoAt(1, 11, 5),
    dischargeAt: daysAgoAt(1, 11, 25),
    reasonChiefComplaint: 'Blood pressure and lipid panel review',
    appointmentId: 'appt-018',
  },
  {
    id: 'enc-009',
    patientId: 'pt-010',
    facilityId: 'fac-001',
    type: 'inpatient',
    status: 'finished',
    departmentId: 'dept-ipd-med',
    attendingUserId: 102,
    admissionAt: daysAgoAt(8, 16, 0),
    dischargeAt: daysAgoAt(4, 10, 0),
    bedId: 'bed-med-b-01',
    reasonChiefComplaint: 'NSTEMI — elevated troponin, chest pain',
  },
  {
    id: 'enc-010',
    patientId: 'pt-008',
    facilityId: 'fac-001',
    type: 'daycare',
    status: 'in_progress',
    departmentId: 'dept-ipd-peds',
    attendingUserId: 103,
    admissionAt: todayAt(8, 0),
    bedId: 'bed-peds-a-01',
    reasonChiefComplaint: 'Day procedure — tonsillectomy',
  },
]

export const encounterById = (id: string) => ENCOUNTERS.find(e => e.id === id)
export const encountersForPatient = (patientId: string) =>
  ENCOUNTERS.filter(e => e.patientId === patientId)
export const activeEncounters = () =>
  ENCOUNTERS.filter(e => ['arrived', 'in_progress'].includes(e.status))
