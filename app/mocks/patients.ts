import type { MockPatient } from './types'
import { isoDate, daysAgo } from './today'

// 30+ patients for realistic pagination and client demo.
// Kept original 12 for backward compatibility with existing encounters/bookings.
export const PATIENTS: MockPatient[] = [
  {
    id: 'pt-001',
    mrn: 'MRN-100001',
    givenName: 'John',
    familyName: 'Smith',
    sex: 'male',
    dateOfBirth: '1958-03-12', // 68 years — elderly
    phone: '+1-555-0101',
    email: 'john.smith@email.com',
    address: '14 Oak Street, Springfield, IL 62701',
    allergiesSummary: 'Penicillin (rash), Sulfa drugs (anaphylaxis)',
  },
  {
    id: 'pt-002',
    mrn: 'MRN-100002',
    givenName: 'Maria',
    familyName: 'Garcia',
    sex: 'female',
    dateOfBirth: '1985-07-24', // 40 years — adult
    phone: '+1-555-0102',
    email: 'maria.garcia@email.com',
    address: '82 Maple Avenue, Riverside, CA 92501',
    allergiesSummary: 'NKDA',
  },
  {
    id: 'pt-003',
    mrn: 'MRN-100003',
    givenName: 'Sarah',
    familyName: 'Johnson',
    sex: 'female',
    dateOfBirth: '1992-11-05', // 33 years — adult
    phone: '+1-555-0103',
    email: 'sarah.johnson@email.com',
    address: '205 Pine Road, Austin, TX 73301',
    allergiesSummary: 'Aspirin (GI intolerance)',
  },
  {
    id: 'pt-004',
    mrn: 'MRN-100004',
    givenName: 'James',
    familyName: 'Wilson',
    sex: 'male',
    dateOfBirth: '1947-09-30', // 78 years — elderly
    phone: '+1-555-0104',
    email: 'james.wilson@email.com',
    address: '7 Elm Court, Charleston, SC 29401',
    allergiesSummary: 'Codeine (nausea/vomiting), Latex (contact dermatitis)',
  },
  {
    id: 'pt-005',
    mrn: 'MRN-100005',
    givenName: 'Olivia',
    familyName: 'Brown',
    sex: 'female',
    dateOfBirth: '2008-02-18', // 18 years — teen
    phone: '+1-555-0105',
    email: 'olivia.brown@email.com',
    address: '330 Cedar Lane, Denver, CO 80201',
    allergiesSummary: 'NKDA',
  },
  {
    id: 'pt-006',
    mrn: 'MRN-100006',
    givenName: 'Liam',
    familyName: 'Davis',
    sex: 'male',
    dateOfBirth: '2021-08-09', // 4 years — toddler
    phone: '+1-555-0106',
    address: '51 Birch Boulevard, Portland, OR 97201',
    allergiesSummary: 'NKDA',
  },
  {
    id: 'pt-007',
    mrn: 'MRN-100007',
    givenName: 'Sophia',
    familyName: 'Anderson',
    sex: 'female',
    dateOfBirth: '1978-04-14', // 48 years — middle-aged
    phone: '+1-555-0107',
    email: 'sophia.anderson@email.com',
    address: '19 Willow Way, Nashville, TN 37201',
    allergiesSummary: 'Ibuprofen (asthma exacerbation)',
  },
  {
    id: 'pt-008',
    mrn: 'MRN-100008',
    givenName: 'Lucas',
    familyName: 'Martinez',
    sex: 'male',
    dateOfBirth: '2015-12-01', // 10 years — child
    phone: '+1-555-0108',
    address: '88 Aspen Drive, Phoenix, AZ 85001',
    allergiesSummary: 'Amoxicillin (urticaria)',
  },
  {
    id: 'pt-009',
    mrn: 'MRN-100009',
    givenName: 'Emma',
    familyName: 'Williams',
    sex: 'female',
    dateOfBirth: '1999-06-22', // 26 years — young adult
    phone: '+1-555-0109',
    email: 'emma.williams@email.com',
    address: '44 Spruce Close, Seattle, WA 98101',
    allergiesSummary: 'NKDA',
  },
  {
    id: 'pt-010',
    mrn: 'MRN-100010',
    givenName: 'Noah',
    familyName: 'Miller',
    sex: 'male',
    dateOfBirth: '1970-01-17', // 56 years — adult
    phone: '+1-555-0110',
    email: 'noah.miller@email.com',
    address: '113 Poplar Street, Columbus, OH 43201',
    allergiesSummary: 'ACE inhibitors (dry cough)',
  },
  {
    id: 'pt-011',
    mrn: 'MRN-100011',
    givenName: 'Charlotte',
    familyName: 'Taylor',
    sex: 'female',
    dateOfBirth: '2002-10-30', // 23 years — young adult
    phone: '+1-555-0111',
    email: 'charlotte.taylor@email.com',
    address: '67 Chestnut Grove, Boston, MA 02101',
    allergiesSummary: 'NKDA',
  },
  {
    id: 'pt-012',
    mrn: 'MRN-100012',
    givenName: 'Henry',
    familyName: 'Moore',
    sex: 'male',
    dateOfBirth: isoDate(daysAgo(12)), // 12 days old — newborn
    address: '22 Sycamore Place, Houston, TX 77001',
    allergiesSummary: 'NKDA',
  },

  // Additional patients for pagination demo (pt-013 onwards)
  { id: 'pt-013', mrn: 'MRN-100013', givenName: 'Ava', familyName: 'Thomas', sex: 'female', dateOfBirth: '1995-03-08', phone: '+1-555-0113', email: 'ava.thomas@email.com', address: '91 Magnolia Lane, Miami, FL 33101', allergiesSummary: 'NKDA' },
  { id: 'pt-014', mrn: 'MRN-100014', givenName: 'William', familyName: 'Jackson', sex: 'male', dateOfBirth: '1962-11-19', phone: '+1-555-0114', email: 'william.jackson@email.com', address: '410 Hickory Road, Chicago, IL 60601', allergiesSummary: 'Shellfish' },
  { id: 'pt-015', mrn: 'MRN-100015', givenName: 'Mia', familyName: 'White', sex: 'female', dateOfBirth: '2010-07-02', phone: '+1-555-0115', email: 'mia.white@email.com', address: '55 Dogwood Court, San Francisco, CA 94101', allergiesSummary: 'NKDA' },
  { id: 'pt-016', mrn: 'MRN-100016', givenName: 'Benjamin', familyName: 'Harris', sex: 'male', dateOfBirth: '1988-09-14', phone: '+1-555-0116', email: 'benjamin.harris@email.com', address: '309 Beech Street, New York, NY 10001', allergiesSummary: 'Latex' },
  { id: 'pt-017', mrn: 'MRN-100017', givenName: 'Isabella', familyName: 'Martin', sex: 'female', dateOfBirth: '1975-05-27', phone: '+1-555-0117', email: 'isabella.martin@email.com', address: '17 Cypress Drive, Los Angeles, CA 90001', allergiesSummary: 'Sulfa drugs' },
  { id: 'pt-018', mrn: 'MRN-100018', givenName: 'Lucas', familyName: 'Thompson', sex: 'male', dateOfBirth: '2003-01-09', phone: '+1-555-0118', email: 'lucas.thompson@email.com', address: '402 Walnut Avenue, Dallas, TX 75201', allergiesSummary: 'NKDA' },
  { id: 'pt-019', mrn: 'MRN-100019', givenName: 'Amelia', familyName: 'Garcia', sex: 'female', dateOfBirth: '1968-08-03', phone: '+1-555-0119', email: 'amelia.garcia@email.com', address: '88 Palm Court, Phoenix, AZ 85001', allergiesSummary: 'Penicillin' },
  { id: 'pt-020', mrn: 'MRN-100020', givenName: 'Henry', familyName: 'Martinez', sex: 'male', dateOfBirth: '1952-12-15', phone: '+1-555-0120', email: 'henry.martinez@email.com', address: '1200 Cedar Blvd, Houston, TX 77001', allergiesSummary: 'Aspirin' },
  { id: 'pt-021', mrn: 'MRN-100021', givenName: 'Evelyn', familyName: 'Robinson', sex: 'female', dateOfBirth: '1998-04-22', phone: '+1-555-0121', email: 'evelyn.robinson@email.com', address: '64 Pinecrest Way, Atlanta, GA 30301', allergiesSummary: 'NKDA' },
  { id: 'pt-022', mrn: 'MRN-100022', givenName: 'Alexander', familyName: 'Clark', sex: 'male', dateOfBirth: '1981-06-30', phone: '+1-555-0122', email: 'alexander.clark@email.com', address: '251 Oakridge Lane, Boston, MA 02101', allergiesSummary: 'Ibuprofen' },
  { id: 'pt-023', mrn: 'MRN-100023', givenName: 'Harper', familyName: 'Rodriguez', sex: 'female', dateOfBirth: '2018-10-05', phone: '+1-555-0123', address: '9 Maplewood Circle, Seattle, WA 98101', allergiesSummary: 'NKDA' },
  { id: 'pt-024', mrn: 'MRN-100024', givenName: 'Daniel', familyName: 'Lewis', sex: 'male', dateOfBirth: '1944-02-28', phone: '+1-555-0124', email: 'daniel.lewis@email.com', address: '500 Riverbend Road, Chicago, IL 60601', allergiesSummary: 'Codeine' },
  { id: 'pt-025', mrn: 'MRN-100025', givenName: 'Luna', familyName: 'Lee', sex: 'female', dateOfBirth: '2006-09-11', phone: '+1-555-0125', email: 'luna.lee@email.com', address: '37 Summit Drive, Denver, CO 80201', allergiesSummary: 'NKDA' },
  { id: 'pt-026', mrn: 'MRN-100026', givenName: 'Matthew', familyName: 'Walker', sex: 'male', dateOfBirth: '1972-07-07', phone: '+1-555-0126', email: 'matthew.walker@email.com', address: '189 Highland Terrace, Philadelphia, PA 19101', allergiesSummary: 'Shellfish' },
  { id: 'pt-027', mrn: 'MRN-100027', givenName: 'Ella', familyName: 'Hall', sex: 'female', dateOfBirth: '1990-11-23', phone: '+1-555-0127', email: 'ella.hall@email.com', address: '72 Lakeside Court, San Diego, CA 92101', allergiesSummary: 'NKDA' },
  { id: 'pt-028', mrn: 'MRN-100028', givenName: 'Samuel', familyName: 'Allen', sex: 'male', dateOfBirth: '1965-01-04', phone: '+1-555-0128', email: 'samuel.allen@email.com', address: '310 Meadowbrook Ave, Orlando, FL 32801', allergiesSummary: 'Latex, Penicillin' },
  { id: 'pt-029', mrn: 'MRN-100029', givenName: 'Scarlett', familyName: 'Young', sex: 'female', dateOfBirth: '2012-05-19', phone: '+1-555-0129', address: '15 Forest Glen, Portland, OR 97201', allergiesSummary: 'NKDA' },
  { id: 'pt-030', mrn: 'MRN-100030', givenName: 'David', familyName: 'King', sex: 'male', dateOfBirth: '1959-10-08', phone: '+1-555-0130', email: 'david.king@email.com', address: '950 Harbor View Drive, Tampa, FL 33601', allergiesSummary: 'Aspirin, Sulfa' },
]

export const patientById = (id: string) => PATIENTS.find(p => p.id === id)
export const patientFullName = (p: MockPatient) => `${p.givenName} ${p.familyName}`
