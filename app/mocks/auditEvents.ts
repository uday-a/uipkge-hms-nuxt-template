import type { MockAuditEvent } from './types'
import { todayAt, daysAgoAt, minutesAgo } from './today'

// 40 audit events — realistic recent activity for the audit page
export const AUDIT_EVENTS: MockAuditEvent[] = [
  // ── MOST RECENT ────────────────────────────────────────────────────────
  { id: 1, occurredAt: minutesAgo(2).toISOString(), actorUserId: 110, actorRole: 'lab_tech', action: 'result.created', resourceType: 'Observation', resourceId: 'obs-001', patientId: 'pt-003' },
  { id: 2, occurredAt: minutesAgo(4).toISOString(), actorUserId: 104, actorRole: 'nurse', action: 'nursing_entry.signed', resourceType: 'NursingEntry', resourceId: 'ne-011', patientId: 'pt-004' },
  { id: 3, occurredAt: minutesAgo(8).toISOString(), actorUserId: 102, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-007', patientId: 'pt-004' },
  { id: 4, occurredAt: minutesAgo(12).toISOString(), actorUserId: 105, actorRole: 'nurse', action: 'mar.given', resourceType: 'MedAdministration', resourceId: 'mar-008', patientId: 'pt-004' },
  { id: 5, occurredAt: minutesAgo(18).toISOString(), actorUserId: 114, actorRole: 'receptionist', action: 'bed.assigned', resourceType: 'BedAssignment', resourceId: 'ba-003', patientId: 'pt-004' },
  { id: 6, occurredAt: todayAt(9, 42), actorUserId: 109, actorRole: 'pharmacist', action: 'dispense.completed', resourceType: 'Dispense', resourceId: 'disp-004', patientId: 'pt-002' },
  { id: 7, occurredAt: todayAt(9, 40), actorUserId: 109, actorRole: 'pharmacist', action: 'dispense.completed', resourceType: 'Dispense', resourceId: 'disp-003', patientId: 'pt-002' },
  { id: 8, occurredAt: todayAt(9, 32), actorUserId: 102, actorRole: 'doctor', action: 'service_request.created', resourceType: 'ServiceRequest', resourceId: 'radord-001', patientId: 'pt-003' },
  { id: 9, occurredAt: todayAt(9, 32), actorUserId: 102, actorRole: 'doctor', action: 'service_request.created', resourceType: 'ServiceRequest', resourceId: 'radord-002', patientId: 'pt-003' },
  { id: 10, occurredAt: todayAt(9, 25), actorUserId: 101, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-002', patientId: 'pt-002' },
  { id: 11, occurredAt: todayAt(9, 10), actorUserId: 108, actorRole: 'pharmacist', action: 'dispense.completed', resourceType: 'Dispense', resourceId: 'disp-001', patientId: 'pt-001' },
  { id: 12, occurredAt: todayAt(9, 5), actorUserId: 114, actorRole: 'receptionist', action: 'payment.received', resourceType: 'Payment', resourceId: 'pay-001', patientId: 'pt-001' },
  { id: 13, occurredAt: todayAt(9, 0), actorUserId: 114, actorRole: 'receptionist', action: 'bill.finalized', resourceType: 'Bill', resourceId: 'bill-001', patientId: 'pt-001' },
  { id: 14, occurredAt: todayAt(8, 55), actorUserId: 101, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-001', patientId: 'pt-001' },
  { id: 15, occurredAt: todayAt(8, 30), actorUserId: 114, actorRole: 'receptionist', action: 'appointment.updated', resourceType: 'Appointment', resourceId: 'appt-001', patientId: 'pt-001' },
  { id: 16, occurredAt: todayAt(7, 30), actorUserId: 114, actorRole: 'receptionist', action: 'bill.created', resourceType: 'Bill', resourceId: 'bill-005', patientId: 'pt-004' },
  { id: 17, occurredAt: todayAt(7, 15), actorUserId: 102, actorRole: 'doctor', action: 'prescription.signed', resourceType: 'MedRequest', resourceId: 'rx-008', patientId: 'pt-004' },
  { id: 18, occurredAt: todayAt(7, 0), actorUserId: 102, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-007', patientId: 'pt-004' },
  { id: 19, occurredAt: todayAt(6, 35), actorUserId: 105, actorRole: 'nurse', action: 'nursing_entry.signed', resourceType: 'NursingEntry', resourceId: 'ne-011', patientId: 'pt-004' },
  { id: 20, occurredAt: todayAt(6, 20), actorUserId: 102, actorRole: 'doctor', action: 'encounter.created', resourceType: 'Encounter', resourceId: 'enc-006', patientId: 'pt-004' },
  // ── YESTERDAY ──────────────────────────────────────────────────────────
  { id: 21, occurredAt: daysAgoAt(1, 15, 30), actorUserId: 110, actorRole: 'lab_tech', action: 'report.signed', resourceType: 'DiagnosticReport', resourceId: 'drep-003', patientId: 'pt-007' },
  { id: 22, occurredAt: daysAgoAt(1, 14, 20), actorUserId: 101, actorRole: 'doctor', action: 'alert.acknowledged', resourceType: 'CriticalAlert', resourceId: 'alert-004', patientId: 'pt-007' },
  { id: 23, occurredAt: daysAgoAt(1, 12, 0), actorUserId: 111, actorRole: 'lab_tech', action: 'report.signed', resourceType: 'DiagnosticReport', resourceId: 'drep-006', patientId: 'pt-004' },
  { id: 24, occurredAt: daysAgoAt(1, 11, 35), actorUserId: 109, actorRole: 'pharmacist', action: 'dispense.completed', resourceType: 'Dispense', resourceId: 'disp-006', patientId: 'pt-010' },
  { id: 25, occurredAt: daysAgoAt(1, 11, 20), actorUserId: 101, actorRole: 'doctor', action: 'prescription.signed', resourceType: 'MedRequest', resourceId: 'rx-010', patientId: 'pt-010' },
  { id: 26, occurredAt: daysAgoAt(1, 11, 0), actorUserId: 101, actorRole: 'doctor', action: 'encounter.updated', resourceType: 'Encounter', resourceId: 'enc-008', patientId: 'pt-010' },
  { id: 27, occurredAt: daysAgoAt(1, 10, 30), actorUserId: 108, actorRole: 'pharmacist', action: 'dispense.completed', resourceType: 'Dispense', resourceId: 'disp-005', patientId: 'pt-004' },
  { id: 28, occurredAt: daysAgoAt(1, 10, 25), actorUserId: 101, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-008', patientId: 'pt-004' },
  { id: 29, occurredAt: daysAgoAt(1, 10, 20), actorUserId: 101, actorRole: 'doctor', action: 'prescription.signed', resourceType: 'MedRequest', resourceId: 'rx-009', patientId: 'pt-004' },
  { id: 30, occurredAt: daysAgoAt(1, 10, 0), actorUserId: 114, actorRole: 'receptionist', action: 'appointment.updated', resourceType: 'Appointment', resourceId: 'appt-017', patientId: 'pt-004' },
  // ── 2–5 DAYS AGO ───────────────────────────────────────────────────────
  { id: 31, occurredAt: daysAgoAt(2, 16, 0), actorUserId: 111, actorRole: 'lab_tech', action: 'report.signed', resourceType: 'DiagnosticReport', resourceId: 'drep-004', patientId: 'pt-001' },
  { id: 32, occurredAt: daysAgoAt(2, 14, 30), actorUserId: 102, actorRole: 'doctor', action: 'service_request.created', resourceType: 'ServiceRequest', resourceId: 'labord-004', patientId: 'pt-001' },
  { id: 33, occurredAt: daysAgoAt(2, 12, 30), actorUserId: 115, actorRole: 'receptionist', action: 'payment.received', resourceType: 'Payment', resourceId: 'pay-004', patientId: 'pt-001' },
  { id: 34, occurredAt: daysAgoAt(2, 12, 0), actorUserId: 102, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-006', patientId: 'pt-001' },
  { id: 35, occurredAt: daysAgoAt(3, 16, 0), actorUserId: 101, actorRole: 'doctor', action: 'note.signed', resourceType: 'ClinicalNote', resourceId: 'note-004', patientId: 'pt-007' },
  { id: 36, occurredAt: daysAgoAt(3, 14, 30), actorUserId: 114, actorRole: 'receptionist', action: 'bed.assigned', resourceType: 'BedAssignment', resourceId: 'ba-001', patientId: 'pt-007' },
  { id: 37, occurredAt: daysAgoAt(4, 10, 0), actorUserId: 115, actorRole: 'receptionist', action: 'payment.received', resourceType: 'Payment', resourceId: 'pay-002', patientId: 'pt-010' },
  { id: 38, occurredAt: daysAgoAt(4, 9, 45), actorUserId: 115, actorRole: 'receptionist', action: 'bill.finalized', resourceType: 'Bill', resourceId: 'bill-002', patientId: 'pt-010' },
  { id: 39, occurredAt: daysAgoAt(4, 9, 30), actorUserId: 102, actorRole: 'doctor', action: 'discharge_summary.signed', resourceType: 'DischargeSummary', resourceId: 'ds-002', patientId: 'pt-010' },
  { id: 40, occurredAt: daysAgoAt(5, 15, 30), actorUserId: 102, actorRole: 'doctor', action: 'surgery.completed', resourceType: 'SurgeryBooking', resourceId: 'surg-003', patientId: 'pt-010' },
]

export const auditEventById = (id: number) => AUDIT_EVENTS.find(e => e.id === id)
export const auditEventsForPatient = (patientId: string) =>
  AUDIT_EVENTS.filter(e => e.patientId === patientId)
export const auditEventsForActor = (actorUserId: number) =>
  AUDIT_EVENTS.filter(e => e.actorUserId === actorUserId)
