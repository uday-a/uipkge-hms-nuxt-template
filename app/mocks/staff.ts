import type { MockUser } from './types'

// 16 staff users: 1 admin, 3 doctors, 4 nurses, 2 pharmacists,
// 2 lab techs, 2 radiologists, 2 receptionists.
// IDs start at 100 to avoid collisions with future auth user rows.
export const STAFF: MockUser[] = [
  {
    id: 100,
    email: 'adam.boyle@mainhospital.org',
    login: 'adam.boyle',
    name: 'Adam Boyle',
    role: 'admin',
  },
  // --- Doctors ---
  {
    id: 101,
    email: 'sarah.bennett@mainhospital.org',
    login: 'sarah.bennett',
    name: 'Dr Sarah Bennett',
    role: 'doctor',
    specialty: 'Internal Medicine',
  },
  {
    id: 102,
    email: 'michael.oconnor@mainhospital.org',
    login: 'michael.oconnor',
    name: 'Dr Michael O\'Connor',
    role: 'doctor',
    specialty: 'Cardiology',
  },
  {
    id: 103,
    email: 'rebecca.holmes@mainhospital.org',
    login: 'rebecca.holmes',
    name: 'Dr Rebecca Holmes',
    role: 'doctor',
    specialty: 'Pediatrics',
  },
  // --- Nurses ---
  {
    id: 104,
    email: 'karen.walsh@mainhospital.org',
    login: 'karen.walsh',
    name: 'Karen Walsh',
    role: 'nurse',
  },
  {
    id: 105,
    email: 'daniel.ross@mainhospital.org',
    login: 'daniel.ross',
    name: 'Daniel Ross',
    role: 'nurse',
  },
  {
    id: 106,
    email: 'amelia.pierce@mainhospital.org',
    login: 'amelia.pierce',
    name: 'Amelia Pierce',
    role: 'nurse',
  },
  {
    id: 107,
    email: 'jacob.hill@mainhospital.org',
    login: 'jacob.hill',
    name: 'Jacob Hill',
    role: 'nurse',
  },
  // --- Pharmacists ---
  {
    id: 108,
    email: 'linda.foster@mainhospital.org',
    login: 'linda.foster',
    name: 'Linda Foster',
    role: 'pharmacist',
  },
  {
    id: 109,
    email: 'robert.quinn@mainhospital.org',
    login: 'robert.quinn',
    name: 'Robert Quinn',
    role: 'pharmacist',
  },
  // --- Lab Techs ---
  {
    id: 110,
    email: 'steven.hayes@mainhospital.org',
    login: 'steven.hayes',
    name: 'Steven Hayes',
    role: 'lab_tech',
  },
  {
    id: 111,
    email: 'megan.cole@mainhospital.org',
    login: 'megan.cole',
    name: 'Megan Cole',
    role: 'lab_tech',
  },
  // --- Radiologists ---
  {
    id: 112,
    email: 'patrick.lane@mainhospital.org',
    login: 'patrick.lane',
    name: 'Dr Patrick Lane',
    role: 'radiologist',
    specialty: 'Diagnostic Radiology',
  },
  {
    id: 113,
    email: 'jennifer.reid@mainhospital.org',
    login: 'jennifer.reid',
    name: 'Dr Jennifer Reid',
    role: 'radiologist',
    specialty: 'Interventional Radiology',
  },
  // --- Receptionists ---
  {
    id: 114,
    email: 'jessica.stewart@mainhospital.org',
    login: 'jessica.stewart',
    name: 'Jessica Stewart',
    role: 'receptionist',
  },
  {
    id: 115,
    email: 'olivia.park@mainhospital.org',
    login: 'olivia.park',
    name: 'Olivia Park',
    role: 'receptionist',
  },
]

// Convenience lookups
export const staffById = (id: number) => STAFF.find(s => s.id === id)
export const staffByRole = (role: MockUser['role']) => STAFF.filter(s => s.role === role)
export const DOCTORS = STAFF.filter(s => s.role === 'doctor')
export const NURSES = STAFF.filter(s => s.role === 'nurse')
