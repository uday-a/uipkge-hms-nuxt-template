import type { MockDonor, MockBloodUnit, MockTransfusionRequest } from './types'
import { daysAgo, iso, daysAgoAt } from './today'

function expiresFrom(days: number): string {
  return iso(new Date(daysAgo(days).getTime() + 42 * 86_400_000))
}

// ── 12 donors ─────────────────────────────────────────────────────────────────
export const DONORS: MockDonor[] = [
  { id: 'donor-001', givenName: 'Rajesh', familyName: 'Kumar', bloodGroup: 'O+', phone: '+91-98765-43210', lastDonatedAt: iso(daysAgo(15)), totalDonations: 8 },
  { id: 'donor-002', givenName: 'Priya', familyName: 'Sharma', bloodGroup: 'A+', phone: '+91-98765-43211', lastDonatedAt: iso(daysAgo(30)), totalDonations: 5 },
  { id: 'donor-003', givenName: 'Amit', familyName: 'Singh', bloodGroup: 'B+', phone: '+91-98765-43212', lastDonatedAt: iso(daysAgo(45)), totalDonations: 12 },
  { id: 'donor-004', givenName: 'Sunita', familyName: 'Patel', bloodGroup: 'AB+', phone: '+91-98765-43213', lastDonatedAt: iso(daysAgo(60)), totalDonations: 3 },
  { id: 'donor-005', givenName: 'Vikram', familyName: 'Rao', bloodGroup: 'O-', phone: '+91-98765-43214', lastDonatedAt: iso(daysAgo(10)), totalDonations: 15 },
  { id: 'donor-006', givenName: 'Ananya', familyName: 'Gupta', bloodGroup: 'A-', phone: '+91-98765-43215', lastDonatedAt: iso(daysAgo(20)), totalDonations: 6 },
  { id: 'donor-007', givenName: 'Deepak', familyName: 'Mehta', bloodGroup: 'B-', phone: '+91-98765-43216', lastDonatedAt: iso(daysAgo(5)), totalDonations: 4 },
  { id: 'donor-008', givenName: 'Kavita', familyName: 'Reddy', bloodGroup: 'AB-', phone: '+91-98765-43217', lastDonatedAt: iso(daysAgo(90)), totalDonations: 2 },
  { id: 'donor-009', givenName: 'Ravi', familyName: 'Verma', bloodGroup: 'O+', phone: '+91-98765-43218', lastDonatedAt: iso(daysAgo(3)), totalDonations: 10 },
  { id: 'donor-010', givenName: 'Meena', familyName: 'Iyer', bloodGroup: 'A+', phone: '+91-98765-43219', totalDonations: 0 },
  { id: 'donor-011', givenName: 'Suresh', familyName: 'Nair', bloodGroup: 'B+', phone: '+91-98765-43220', lastDonatedAt: iso(daysAgo(25)), totalDonations: 7 },
  { id: 'donor-012', givenName: 'Fatima', familyName: 'Khan', bloodGroup: 'O-', phone: '+91-98765-43221', lastDonatedAt: iso(daysAgo(8)), totalDonations: 9 },
]

// ── 30 blood units ────────────────────────────────────────────────────────────
export const BLOOD_UNITS: MockBloodUnit[] = [
  // O+ (6)
  { id: 'BU-O+-01', bloodGroup: 'O+', collectedAt: iso(daysAgo(5)), expiresAt: expiresFrom(5), component: 'whole_blood', status: 'available', donorId: 'donor-001' },
  { id: 'BU-O+-02', bloodGroup: 'O+', collectedAt: iso(daysAgo(10)), expiresAt: expiresFrom(10), component: 'prbc', status: 'available', donorId: 'donor-001' },
  { id: 'BU-O+-03', bloodGroup: 'O+', collectedAt: iso(daysAgo(2)), expiresAt: expiresFrom(2), component: 'platelets', status: 'available', donorId: 'donor-009' },
  { id: 'BU-O+-04', bloodGroup: 'O+', collectedAt: iso(daysAgo(20)), expiresAt: expiresFrom(20), component: 'plasma', status: 'issued', donorId: 'donor-009' },
  { id: 'BU-O+-05', bloodGroup: 'O+', collectedAt: iso(daysAgo(8)), expiresAt: expiresFrom(8), component: 'prbc', status: 'reserved', donorId: 'donor-009' },
  { id: 'BU-O+-06', bloodGroup: 'O+', collectedAt: iso(daysAgo(15)), expiresAt: expiresFrom(15), component: 'whole_blood', status: 'available', donorId: 'donor-001' },

  // A+ (5)
  { id: 'BU-A+-01', bloodGroup: 'A+', collectedAt: iso(daysAgo(12)), expiresAt: expiresFrom(12), component: 'whole_blood', status: 'available', donorId: 'donor-002' },
  { id: 'BU-A+-02', bloodGroup: 'A+', collectedAt: iso(daysAgo(7)), expiresAt: expiresFrom(7), component: 'prbc', status: 'available', donorId: 'donor-002' },
  { id: 'BU-A+-03', bloodGroup: 'A+', collectedAt: iso(daysAgo(3)), expiresAt: expiresFrom(3), component: 'platelets', status: 'available', donorId: 'donor-002' },
  { id: 'BU-A+-04', bloodGroup: 'A+', collectedAt: iso(daysAgo(25)), expiresAt: expiresFrom(25), component: 'plasma', status: 'available', donorId: 'donor-010' },
  { id: 'BU-A+-05', bloodGroup: 'A+', collectedAt: iso(daysAgo(30)), expiresAt: expiresFrom(30), component: 'prbc', status: 'issued', donorId: 'donor-010' },

  // B+ (4)
  { id: 'BU-B+-01', bloodGroup: 'B+', collectedAt: iso(daysAgo(18)), expiresAt: expiresFrom(18), component: 'whole_blood', status: 'available', donorId: 'donor-003' },
  { id: 'BU-B+-02', bloodGroup: 'B+', collectedAt: iso(daysAgo(9)), expiresAt: expiresFrom(9), component: 'prbc', status: 'reserved', donorId: 'donor-003' },
  { id: 'BU-B+-03', bloodGroup: 'B+', collectedAt: iso(daysAgo(4)), expiresAt: expiresFrom(4), component: 'platelets', status: 'available', donorId: 'donor-011' },
  { id: 'BU-B+-04', bloodGroup: 'B+', collectedAt: iso(daysAgo(35)), expiresAt: expiresFrom(35), component: 'plasma', status: 'available', donorId: 'donor-011' },

  // AB+ (2)
  { id: 'BU-AB+-01', bloodGroup: 'AB+', collectedAt: iso(daysAgo(22)), expiresAt: expiresFrom(22), component: 'whole_blood', status: 'available', donorId: 'donor-004' },
  { id: 'BU-AB+-02', bloodGroup: 'AB+', collectedAt: iso(daysAgo(11)), expiresAt: expiresFrom(11), component: 'prbc', status: 'available', donorId: 'donor-004' },

  // O- (4)
  { id: 'BU-O--01', bloodGroup: 'O-', collectedAt: iso(daysAgo(6)), expiresAt: expiresFrom(6), component: 'whole_blood', status: 'available', donorId: 'donor-005' },
  { id: 'BU-O--02', bloodGroup: 'O-', collectedAt: iso(daysAgo(14)), expiresAt: expiresFrom(14), component: 'prbc', status: 'reserved', donorId: 'donor-005' },
  { id: 'BU-O--03', bloodGroup: 'O-', collectedAt: iso(daysAgo(1)), expiresAt: expiresFrom(1), component: 'platelets', status: 'available', donorId: 'donor-012' },
  { id: 'BU-O--04', bloodGroup: 'O-', collectedAt: iso(daysAgo(28)), expiresAt: expiresFrom(28), component: 'plasma', status: 'issued', donorId: 'donor-012' },

  // A- (3)
  { id: 'BU-A--01', bloodGroup: 'A-', collectedAt: iso(daysAgo(17)), expiresAt: expiresFrom(17), component: 'whole_blood', status: 'available', donorId: 'donor-006' },
  { id: 'BU-A--02', bloodGroup: 'A-', collectedAt: iso(daysAgo(13)), expiresAt: expiresFrom(13), component: 'prbc', status: 'available', donorId: 'donor-006' },
  { id: 'BU-A--03', bloodGroup: 'A-', collectedAt: iso(daysAgo(8)), expiresAt: expiresFrom(8), component: 'platelets', status: 'available', donorId: 'donor-006' },

  // B- (3)
  { id: 'BU-B--01', bloodGroup: 'B-', collectedAt: iso(daysAgo(21)), expiresAt: expiresFrom(21), component: 'whole_blood', status: 'available', donorId: 'donor-007' },
  { id: 'BU-B--02', bloodGroup: 'B-', collectedAt: iso(daysAgo(16)), expiresAt: expiresFrom(16), component: 'prbc', status: 'available', donorId: 'donor-007' },
  { id: 'BU-B--03', bloodGroup: 'B-', collectedAt: iso(daysAgo(50)), expiresAt: expiresFrom(50), component: 'plasma', status: 'expired', donorId: 'donor-007' },

  // AB- (3)
  { id: 'BU-AB--01', bloodGroup: 'AB-', collectedAt: iso(daysAgo(19)), expiresAt: expiresFrom(19), component: 'whole_blood', status: 'available', donorId: 'donor-008' },
  { id: 'BU-AB--02', bloodGroup: 'AB-', collectedAt: iso(daysAgo(40)), expiresAt: expiresFrom(40), component: 'prbc', status: 'discarded', donorId: 'donor-008' },
  { id: 'BU-AB--03', bloodGroup: 'AB-', collectedAt: iso(daysAgo(2)), expiresAt: expiresFrom(2), component: 'platelets', status: 'available', donorId: 'donor-008' },
]

// ── 5 transfusion requests ────────────────────────────────────────────────────
export const TRANSFUSION_REQUESTS: MockTransfusionRequest[] = [
  {
    id: 'req-001',
    patientId: 'pt-002',
    encounterId: 'enc-002',
    bloodGroup: 'A+',
    component: 'prbc',
    unitsRequested: 1,
    priority: 'routine',
    requestedAt: daysAgoAt(3, 9),
    requestedByUserId: 101,
    status: 'pending_crossmatch',
  },
  {
    id: 'req-002',
    patientId: 'pt-005',
    encounterId: 'enc-005',
    bloodGroup: 'O-',
    component: 'whole_blood',
    unitsRequested: 1,
    priority: 'urgent',
    requestedAt: daysAgoAt(2, 14),
    requestedByUserId: 102,
    status: 'crossmatched',
  },
  {
    id: 'req-003',
    patientId: 'pt-001',
    encounterId: 'enc-005',
    bloodGroup: 'O+',
    component: 'whole_blood',
    unitsRequested: 2,
    priority: 'stat',
    requestedAt: daysAgoAt(1, 11),
    requestedByUserId: 103,
    status: 'issued',
    unitsIssued: ['BU-O+-01', 'BU-O+-06'],
  },
  {
    id: 'req-004',
    patientId: 'pt-004',
    encounterId: 'enc-006',
    bloodGroup: 'AB+',
    component: 'plasma',
    unitsRequested: 1,
    priority: 'routine',
    requestedAt: daysAgoAt(4, 10),
    requestedByUserId: 101,
    status: 'pending_crossmatch',
  },
  {
    id: 'req-005',
    patientId: 'pt-003',
    encounterId: 'enc-003',
    bloodGroup: 'B+',
    component: 'platelets',
    unitsRequested: 1,
    priority: 'urgent',
    requestedAt: daysAgoAt(5, 16),
    requestedByUserId: 104,
    status: 'cancelled',
  },
]
