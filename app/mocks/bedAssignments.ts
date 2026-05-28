import type { MockBedAssignment } from './types'
import { todayAt, daysAgoAt } from './today'

// 4 bed assignments — 3 active + 1 released (historical)
export const BED_ASSIGNMENTS: MockBedAssignment[] = [
  // Active — enc-004 pt-007 hypothyroid (Medical Ward A, bed 01)
  {
    id: 'ba-001',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    bedId: 'bed-med-a-01',
    facilityId: 'fac-001',
    unitId: 'unit-med-a',
    assignedAt: daysAgoAt(3, 14, 30),
    reason: 'admission',
    assignedByUserId: 114, // Jessica Stewart (reception)
  },
  // Active — enc-005 pt-001 hypertensive urgency (Medical Ward A, bed 02)
  {
    id: 'ba-002',
    encounterId: 'enc-005',
    patientId: 'pt-001',
    bedId: 'bed-med-a-02',
    facilityId: 'fac-001',
    unitId: 'unit-med-a',
    assignedAt: daysAgoAt(2, 11, 15),
    reason: 'admission',
    assignedByUserId: 115, // Olivia Park
  },
  // Active — enc-006 pt-004 ER stroke (ER Bay 1)
  {
    id: 'ba-003',
    encounterId: 'enc-006',
    patientId: 'pt-004',
    bedId: 'bed-er-01',
    facilityId: 'fac-001',
    unitId: 'unit-er',
    assignedAt: todayAt(6, 18),
    reason: 'admission',
    assignedByUserId: 114,
  },
  // Released — enc-009 pt-010 NSTEMI (discharged 4 days ago from Medical Ward B)
  {
    id: 'ba-004',
    encounterId: 'enc-009',
    patientId: 'pt-010',
    bedId: 'bed-med-b-01',
    facilityId: 'fac-001',
    unitId: 'unit-med-b',
    assignedAt: daysAgoAt(8, 16, 30),
    releasedAt: daysAgoAt(4, 10, 30),
    reason: 'discharge',
    assignedByUserId: 115,
  },
]

export const bedAssignmentById = (id: string) => BED_ASSIGNMENTS.find(b => b.id === id)
export const activeBedAssignments = () => BED_ASSIGNMENTS.filter(b => !b.releasedAt)
export const bedAssignmentForEncounter = (encounterId: string) =>
  BED_ASSIGNMENTS.find(b => b.encounterId === encounterId)
