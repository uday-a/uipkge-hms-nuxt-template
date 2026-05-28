import type { MockFacility, MockDepartment, MockUnit, MockBed } from './types'

export const FACILITY: MockFacility = {
  id: 'fac-001',
  code: 'MH',
  name: 'Main Hospital',
  type: 'hospital',
}

export const DEPARTMENTS: MockDepartment[] = [
  { id: 'dept-opd', facilityId: 'fac-001', code: 'OPD', name: 'Outpatient Department', kind: 'opd' },
  { id: 'dept-ipd-med', facilityId: 'fac-001', code: 'MED', name: 'Medical Ward', kind: 'ipd' },
  { id: 'dept-ipd-surg', facilityId: 'fac-001', code: 'SURG', name: 'Surgical Ward', kind: 'ipd' },
  { id: 'dept-ipd-peds', facilityId: 'fac-001', code: 'PEDS', name: 'Pediatric Ward', kind: 'ipd' },
  { id: 'dept-er', facilityId: 'fac-001', code: 'ER', name: 'Emergency Department', kind: 'er' },
  { id: 'dept-ot', facilityId: 'fac-001', code: 'OT', name: 'Operating Theatre', kind: 'ot' },
  { id: 'dept-icu', facilityId: 'fac-001', code: 'ICU', name: 'Intensive Care Unit', kind: 'icu' },
  { id: 'dept-lab', facilityId: 'fac-001', code: 'LAB', name: 'Clinical Laboratory', kind: 'lab' },
  { id: 'dept-rad', facilityId: 'fac-001', code: 'RAD', name: 'Radiology', kind: 'radiology' },
  { id: 'dept-pharm', facilityId: 'fac-001', code: 'PHARM', name: 'Pharmacy', kind: 'pharmacy' },
]

export const UNITS: MockUnit[] = [
  // Medical Ward
  { id: 'unit-med-a', departmentId: 'dept-ipd-med', code: 'MED-A', name: 'Medical Ward A' },
  { id: 'unit-med-b', departmentId: 'dept-ipd-med', code: 'MED-B', name: 'Medical Ward B' },
  // Surgical Ward
  { id: 'unit-surg-a', departmentId: 'dept-ipd-surg', code: 'SRG-A', name: 'Surgical Ward A' },
  // Pediatric Ward
  { id: 'unit-peds-a', departmentId: 'dept-ipd-peds', code: 'PED-A', name: 'Pediatric Ward A' },
  // ICU
  { id: 'unit-icu', departmentId: 'dept-icu', code: 'ICU-1', name: 'ICU' },
  // ER
  { id: 'unit-er', departmentId: 'dept-er', code: 'ER-1', name: 'Emergency Bay' },
  // OT
  { id: 'unit-ot-1', departmentId: 'dept-ot', code: 'OT-1', name: 'Operating Room 1' },
  { id: 'unit-ot-2', departmentId: 'dept-ot', code: 'OT-2', name: 'Operating Room 2' },
]

export const BEDS: MockBed[] = [
  // Medical Ward A — 6 beds
  { id: 'bed-med-a-01', unitId: 'unit-med-a', label: 'MED-A 01', status: 'occupied' },
  { id: 'bed-med-a-02', unitId: 'unit-med-a', label: 'MED-A 02', status: 'occupied' },
  { id: 'bed-med-a-03', unitId: 'unit-med-a', label: 'MED-A 03', status: 'available' },
  { id: 'bed-med-a-04', unitId: 'unit-med-a', label: 'MED-A 04', status: 'cleaning' },
  { id: 'bed-med-a-05', unitId: 'unit-med-a', label: 'MED-A 05', status: 'available' },
  { id: 'bed-med-a-06', unitId: 'unit-med-a', label: 'MED-A 06', status: 'maintenance' },
  // Medical Ward B — 4 beds
  { id: 'bed-med-b-01', unitId: 'unit-med-b', label: 'MED-B 01', status: 'occupied' },
  { id: 'bed-med-b-02', unitId: 'unit-med-b', label: 'MED-B 02', status: 'available' },
  { id: 'bed-med-b-03', unitId: 'unit-med-b', label: 'MED-B 03', status: 'available' },
  { id: 'bed-med-b-04', unitId: 'unit-med-b', label: 'MED-B 04', status: 'blocked' },
  // Surgical Ward A — 4 beds
  { id: 'bed-surg-a-01', unitId: 'unit-surg-a', label: 'SRG-A 01', status: 'occupied' },
  { id: 'bed-surg-a-02', unitId: 'unit-surg-a', label: 'SRG-A 02', status: 'available' },
  { id: 'bed-surg-a-03', unitId: 'unit-surg-a', label: 'SRG-A 03', status: 'available' },
  { id: 'bed-surg-a-04', unitId: 'unit-surg-a', label: 'SRG-A 04', status: 'cleaning' },
  // Pediatric Ward A — 3 beds
  { id: 'bed-peds-a-01', unitId: 'unit-peds-a', label: 'PED-A 01', status: 'occupied' },
  { id: 'bed-peds-a-02', unitId: 'unit-peds-a', label: 'PED-A 02', status: 'available' },
  { id: 'bed-peds-a-03', unitId: 'unit-peds-a', label: 'PED-A 03', status: 'available' },
  // ICU — 4 beds
  { id: 'bed-icu-01', unitId: 'unit-icu', label: 'ICU 01', status: 'occupied' },
  { id: 'bed-icu-02', unitId: 'unit-icu', label: 'ICU 02', status: 'occupied' },
  { id: 'bed-icu-03', unitId: 'unit-icu', label: 'ICU 03', status: 'available' },
  { id: 'bed-icu-04', unitId: 'unit-icu', label: 'ICU 04', status: 'maintenance' },
  // ER bays — 3 bays
  { id: 'bed-er-01', unitId: 'unit-er', label: 'ER Bay 1', status: 'occupied' },
  { id: 'bed-er-02', unitId: 'unit-er', label: 'ER Bay 2', status: 'available' },
  { id: 'bed-er-03', unitId: 'unit-er', label: 'ER Bay 3', status: 'available' },
]

export const departmentById = (id: string) => DEPARTMENTS.find(d => d.id === id)
export const unitById = (id: string) => UNITS.find(u => u.id === id)
export const bedById = (id: string) => BEDS.find(b => b.id === id)

// OR rooms are units in the OT department
export const OR_ROOMS = UNITS.filter(u => u.departmentId === 'dept-ot')
