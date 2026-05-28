import type { MockCriticalAlert } from './types'
import { todayAt, daysAgoAt } from './today'

// 5 critical alerts — 3 unacknowledged + 2 acknowledged
// Tied to critical observations: obs-001 (Troponin), obs-003 (TSH), obs-006 (K+)
export const CRITICAL_ALERTS: MockCriticalAlert[] = [
  // Unacknowledged — Troponin critical high (obs-001, enc-003 pt-003)
  {
    id: 'alert-001',
    observationId: 'obs-001',
    patientId: 'pt-003',
    encounterId: 'enc-003',
    facilityId: 'fac-001',
    triggeredAt: todayAt(12, 36),
    acknowledgedAt: undefined,
    acknowledgedByUserId: undefined,
  },
  // Unacknowledged — Potassium critical low (obs-006, enc-006 pt-004)
  {
    id: 'alert-002',
    observationId: 'obs-006',
    patientId: 'pt-004',
    encounterId: 'enc-006',
    facilityId: 'fac-001',
    triggeredAt: todayAt(7, 12),
    acknowledgedAt: undefined,
    acknowledgedByUserId: undefined,
  },
  // Unacknowledged — Temperature low enc-004 pt-007 (obs-012, hypothermia)
  {
    id: 'alert-003',
    observationId: 'obs-012',
    patientId: 'pt-007',
    encounterId: 'enc-004',
    facilityId: 'fac-001',
    triggeredAt: daysAgoAt(3, 15, 5),
    acknowledgedAt: undefined,
    acknowledgedByUserId: undefined,
  },
  // Acknowledged — TSH critical high (obs-003, enc-004 pt-007)
  {
    id: 'alert-004',
    observationId: 'obs-003',
    patientId: 'pt-007',
    encounterId: 'enc-004',
    facilityId: 'fac-001',
    triggeredAt: daysAgoAt(1, 14, 5),
    acknowledgedAt: daysAgoAt(1, 14, 20),
    acknowledgedByUserId: 101, // Dr Sarah Bennett
  },
  // Acknowledged — SpO2 low enc-006 (obs-011, pt-004 ER)
  {
    id: 'alert-005',
    observationId: 'obs-011',
    patientId: 'pt-004',
    encounterId: 'enc-006',
    facilityId: 'fac-001',
    triggeredAt: todayAt(6, 21),
    acknowledgedAt: todayAt(6, 30),
    acknowledgedByUserId: 102, // Dr Michael O'Connor
  },
]

export const criticalAlertById = (id: string) => CRITICAL_ALERTS.find(a => a.id === id)
export const unacknowledgedAlerts = () => CRITICAL_ALERTS.filter(a => !a.acknowledgedAt)
export const alertsForPatient = (patientId: string) =>
  CRITICAL_ALERTS.filter(a => a.patientId === patientId)
