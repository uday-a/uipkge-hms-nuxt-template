import type { MockAnesthesiaRecord } from './types'
import { todayAt, daysAgoAt } from './today'

// 2 anaesthesia records (one in-progress, one completed)
export const ANESTHESIA_RECORDS: MockAnesthesiaRecord[] = [
  // surg-001 — tonsillectomy today (in progress, GA)
  {
    id: 'anes-001',
    surgeryBookingId: 'surg-001',
    patientId: 'pt-008',
    anesthetistUserId: 101, // Dr Sarah Bennett
    type: 'general',
    startAt: todayAt(9, 15),
    endAt: undefined, // still in progress
    agents: [
      { drug: 'Propofol', dose: '100 mg', route: 'IV', at: todayAt(9, 16) },
      { drug: 'Sevoflurane', dose: '2% inspired', route: 'inhalation', at: todayAt(9, 18) },
      { drug: 'Fentanyl', dose: '25 mcg', route: 'IV', at: todayAt(9, 16) },
      { drug: 'Rocuronium', dose: '15 mg', route: 'IV', at: todayAt(9, 17) },
    ],
    intraopVitals: [
      { at: todayAt(9, 20), bpSys: 96, bpDia: 58, hr: 84, spo2: 99, etco2: 38 },
      { at: todayAt(9, 35), bpSys: 94, bpDia: 56, hr: 82, spo2: 99, etco2: 37 },
      { at: todayAt(9, 50), bpSys: 98, bpDia: 60, hr: 86, spo2: 100, etco2: 38 },
      { at: todayAt(10, 5), bpSys: 100, bpDia: 62, hr: 84, spo2: 99, etco2: 38 },
    ],
    complications: undefined,
    recoveryScore: undefined, // not yet in recovery
    notes: 'Paediatric case, 32 kg, 10 years. LMA size 2.5 — clean insertion first attempt. Airway maintained. Throat pack in situ.',
  },
  // surg-003 — PCI completed 5 days ago (sedation/monitored anaesthesia care)
  {
    id: 'anes-002',
    surgeryBookingId: 'surg-003',
    patientId: 'pt-010',
    anesthetistUserId: 101,
    type: 'local',
    startAt: daysAgoAt(5, 13, 20),
    endAt: daysAgoAt(5, 15, 0),
    agents: [
      { drug: 'Midazolam', dose: '2 mg', route: 'IV', at: daysAgoAt(5, 13, 22) },
      { drug: 'Fentanyl', dose: '50 mcg', route: 'IV', at: daysAgoAt(5, 13, 22) },
      { drug: 'Heparin', dose: '70 IU/kg', route: 'IV', at: daysAgoAt(5, 13, 30) },
    ],
    intraopVitals: [
      { at: daysAgoAt(5, 13, 30), bpSys: 148, bpDia: 88, hr: 86, spo2: 98 },
      { at: daysAgoAt(5, 14, 0), bpSys: 140, bpDia: 84, hr: 80, spo2: 98 },
      { at: daysAgoAt(5, 14, 30), bpSys: 136, bpDia: 82, hr: 78, spo2: 99 },
      { at: daysAgoAt(5, 14, 50), bpSys: 134, bpDia: 80, hr: 76, spo2: 99 },
    ],
    complications: 'Minor ST changes during balloon inflation — resolved after deflation.',
    recoveryScore: 9, // Modified Aldrete 9/10
    notes: 'Radial arterial access right wrist. Smooth procedure. Post-procedure Protamine given for heparin reversal. TR band applied.',
  },
]

export const anesthesiaRecordById = (id: string) => ANESTHESIA_RECORDS.find(a => a.id === id)
export const anesthesiaForSurgery = (surgeryBookingId: string) =>
  ANESTHESIA_RECORDS.find(a => a.surgeryBookingId === surgeryBookingId)
