import type { MockSurgeryBooking } from './types'
import { todayAt, tomorrowAt, daysAgoAt } from './today'

// 6 surgery bookings — mix of scheduled, in_progress, completed, cancelled
export const SURGERY_BOOKINGS: MockSurgeryBooking[] = [
  // enc-010 pt-008 — Tonsillectomy today (in_progress)
  {
    id: 'surg-001',
    encounterId: 'enc-010',
    patientId: 'pt-008',
    orRoomId: 'unit-ot-1',
    procedureName: 'Tonsillectomy + Adenoidectomy',
    primarySurgeonUserId: 103, // Dr Rebecca Holmes (Pediatrics)
    anesthetistUserId: 101, // Dr Sarah Bennett acting as anaesthetist (demo)
    scrubNurseUserId: 104, // Karen Walsh
    scheduledAt: todayAt(9, 0),
    estimatedMinutes: 90,
    status: 'in_progress',
    startedAt: todayAt(9, 15),
  },
  // New booking — tomorrow (scheduled)
  {
    id: 'surg-002',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    orRoomId: 'unit-ot-2',
    procedureName: 'Coronary Artery Bypass Graft (CABG) ×3',
    primarySurgeonUserId: 102, // Dr Michael O'Connor (Cardiology)
    anesthetistUserId: 101,
    scrubNurseUserId: 105, // Daniel Ross
    scheduledAt: tomorrowAt(8, 0),
    estimatedMinutes: 240,
    status: 'confirmed',
  },
  // Completed — 5 days ago (pt-010, coronary angio / stent — same admission)
  {
    id: 'surg-003',
    encounterId: 'enc-009',
    patientId: 'pt-010',
    orRoomId: 'unit-ot-1',
    procedureName: 'Percutaneous Coronary Intervention (PCI) — LAD DES',
    primarySurgeonUserId: 102,
    anesthetistUserId: 101,
    scrubNurseUserId: 106, // Amelia Pierce
    scheduledAt: daysAgoAt(5, 13, 0),
    estimatedMinutes: 120,
    status: 'completed',
    startedAt: daysAgoAt(5, 13, 20),
    endedAt: daysAgoAt(5, 15, 10),
  },
  // Scheduled — tomorrow pt-007 (thyroidectomy after discharge, future)
  {
    id: 'surg-004',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    orRoomId: 'unit-ot-2',
    procedureName: 'Thyroid Biopsy — Fine Needle Aspiration',
    primarySurgeonUserId: 101, // Dr Sarah Bennett
    scrubNurseUserId: 107, // Jacob Hill
    scheduledAt: tomorrowAt(14, 0),
    estimatedMinutes: 30,
    status: 'scheduled',
  },
  // Cancelled — was for pt-004 last week
  {
    id: 'surg-005',
    encounterId: 'enc-007',
    patientId: 'pt-004',
    orRoomId: 'unit-ot-1',
    procedureName: 'Elective Carotid Endarterectomy',
    primarySurgeonUserId: 102,
    scheduledAt: daysAgoAt(2, 10, 0),
    estimatedMinutes: 120,
    status: 'cancelled',
  },
  // Completed — yesterday (appendectomy, for demo variety)
  {
    id: 'surg-006',
    encounterId: 'enc-010',
    patientId: 'pt-011', // Charlotte Taylor
    orRoomId: 'unit-ot-2',
    procedureName: 'Laparoscopic Appendicectomy',
    primarySurgeonUserId: 101,
    anesthetistUserId: 102,
    scrubNurseUserId: 104,
    scheduledAt: daysAgoAt(1, 11, 0),
    estimatedMinutes: 75,
    status: 'completed',
    startedAt: daysAgoAt(1, 11, 10),
    endedAt: daysAgoAt(1, 12, 30),
  },

  // Additional OT bookings for realistic pagination (client demo)
  { id: 'surg-007', encounterId: 'enc-015', patientId: 'pt-013', orRoomId: 'unit-ot-1', procedureName: 'Knee Arthroscopy', primarySurgeonUserId: 104, anesthetistUserId: 101, scrubNurseUserId: 105, scheduledAt: tomorrowAt(7, 30), estimatedMinutes: 60, status: 'scheduled' },
  { id: 'surg-008', encounterId: 'enc-016', patientId: 'pt-014', orRoomId: 'unit-ot-2', procedureName: 'Cataract Extraction + IOL', primarySurgeonUserId: 105, anesthetistUserId: 101, scrubNurseUserId: 106, scheduledAt: tomorrowAt(9, 0), estimatedMinutes: 45, status: 'confirmed' },
  { id: 'surg-009', encounterId: 'enc-017', patientId: 'pt-015', orRoomId: 'unit-ot-1', procedureName: 'Tonsillectomy', primarySurgeonUserId: 103, anesthetistUserId: 102, scrubNurseUserId: 104, scheduledAt: tomorrowAt(11, 0), estimatedMinutes: 50, status: 'scheduled' },
  { id: 'surg-010', encounterId: 'enc-018', patientId: 'pt-016', orRoomId: 'unit-ot-2', procedureName: 'Laparoscopic Cholecystectomy', primarySurgeonUserId: 106, anesthetistUserId: 101, scrubNurseUserId: 107, scheduledAt: tomorrowAt(13, 30), estimatedMinutes: 90, status: 'confirmed' },
  { id: 'surg-011', encounterId: 'enc-019', patientId: 'pt-017', orRoomId: 'unit-ot-1', procedureName: 'Total Hip Replacement', primarySurgeonUserId: 104, anesthetistUserId: 102, scrubNurseUserId: 105, scheduledAt: tomorrowAt(15, 0), estimatedMinutes: 180, status: 'scheduled' },
  { id: 'surg-012', encounterId: 'enc-020', patientId: 'pt-018', orRoomId: 'unit-ot-2', procedureName: 'Hernia Repair (Inguinal)', primarySurgeonUserId: 106, anesthetistUserId: 101, scrubNurseUserId: 104, scheduledAt: daysAgoAt(3, 10, 0), estimatedMinutes: 55, status: 'completed', startedAt: daysAgoAt(3, 10, 15), endedAt: daysAgoAt(3, 11, 20) },
  { id: 'surg-013', encounterId: 'enc-021', patientId: 'pt-019', orRoomId: 'unit-ot-1', procedureName: 'Thyroidectomy', primarySurgeonUserId: 101, anesthetistUserId: 102, scrubNurseUserId: 106, scheduledAt: daysAgoAt(4, 8, 0), estimatedMinutes: 120, status: 'completed', startedAt: daysAgoAt(4, 8, 20), endedAt: daysAgoAt(4, 10, 10) },
  { id: 'surg-014', encounterId: 'enc-022', patientId: 'pt-020', orRoomId: 'unit-ot-2', procedureName: 'Spinal Laminectomy L4-L5', primarySurgeonUserId: 105, anesthetistUserId: 101, scrubNurseUserId: 107, scheduledAt: tomorrowAt(8, 0), estimatedMinutes: 150, status: 'confirmed' },
]

export const surgeryBookingById = (id: string) => SURGERY_BOOKINGS.find(s => s.id === id)
export const surgeryBookingsForEncounter = (encounterId: string) =>
  SURGERY_BOOKINGS.filter(s => s.encounterId === encounterId)
export const activeSurgeries = () =>
  SURGERY_BOOKINGS.filter(s => s.status === 'in_progress')
export const upcomingSurgeries = () =>
  SURGERY_BOOKINGS.filter(s => ['scheduled', 'confirmed'].includes(s.status))
