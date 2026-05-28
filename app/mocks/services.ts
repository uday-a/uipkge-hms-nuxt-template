import type { MockServiceCatalogItem } from './types'

// 10 service catalog items — consultation, procedure, investigation, ward, misc
// Prices in USD cents. Tax rate in basis points (1 bp = 0.01%).
export const SERVICES: MockServiceCatalogItem[] = [
  // Consultations
  {
    id: 'svc-001',
    facilityId: 'fac-001',
    code: 'CONSULT-GP',
    display: 'General Practice Consultation',
    category: 'consultation',
    defaultPriceCents: 8000, // $80.00
    taxRateBp: 0,
  },
  {
    id: 'svc-002',
    facilityId: 'fac-001',
    code: 'CONSULT-SPEC',
    display: 'Specialist Consultation',
    category: 'consultation',
    defaultPriceCents: 15000, // $150.00
    taxRateBp: 0,
  },
  {
    id: 'svc-003',
    facilityId: 'fac-001',
    code: 'CONSULT-ER',
    display: 'Emergency Consultation',
    category: 'consultation',
    defaultPriceCents: 25000, // $250.00
    taxRateBp: 0,
  },
  // Investigations
  {
    id: 'svc-004',
    facilityId: 'fac-001',
    code: 'INV-CBCD',
    display: 'Complete Blood Count with Differential',
    category: 'investigation',
    defaultPriceCents: 4500, // $45.00
    taxRateBp: 1000, // 10% tax
  },
  {
    id: 'svc-005',
    facilityId: 'fac-001',
    code: 'INV-ECG',
    display: '12-Lead ECG',
    category: 'investigation',
    defaultPriceCents: 6000, // $60.00
    taxRateBp: 1000,
  },
  {
    id: 'svc-006',
    facilityId: 'fac-001',
    code: 'INV-XRCX',
    display: 'Chest X-Ray PA',
    category: 'investigation',
    defaultPriceCents: 9000, // $90.00
    taxRateBp: 1000,
  },
  // Procedures
  {
    id: 'svc-007',
    facilityId: 'fac-001',
    code: 'PROC-IV',
    display: 'IV Cannula Insertion',
    category: 'procedure',
    defaultPriceCents: 3500, // $35.00
    taxRateBp: 1000,
  },
  {
    id: 'svc-008',
    facilityId: 'fac-001',
    code: 'PROC-TONSIL',
    display: 'Tonsillectomy (Day Surgery)',
    category: 'procedure',
    defaultPriceCents: 250000, // $2500.00
    taxRateBp: 500, // 5% tax
  },
  // Ward
  {
    id: 'svc-009',
    facilityId: 'fac-001',
    code: 'WARD-GEN',
    display: 'General Ward — Per Day',
    category: 'ward',
    defaultPriceCents: 35000, // $350.00/day
    taxRateBp: 0,
  },
  // Misc
  {
    id: 'svc-010',
    facilityId: 'fac-001',
    code: 'MISC-NURSING',
    display: 'Nursing Procedures (Dressings, etc.)',
    category: 'misc',
    defaultPriceCents: 2000, // $20.00
    taxRateBp: 1000,
  },
]

export const serviceById = (id: string) => SERVICES.find(s => s.id === id)
export const servicesByCategory = (cat: MockServiceCatalogItem['category']) =>
  SERVICES.filter(s => s.category === cat)
