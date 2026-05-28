import type { MockBill, MockBillLine, MockPayment } from './types'
import { todayAt, daysAgoAt } from './today'

// 6 bills: 2 paid, 2 partially_paid, 1 open, 1 draft
// 12 bill lines distributed across them
// 6 payments

export const BILLS: MockBill[] = [
  // PAID — enc-001 (pt-001, OPD today finished)
  {
    id: 'bill-001',
    encounterId: 'enc-001',
    billNo: 'BILL-2026-0501',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    subtotalCents: 16000, // $160 (consult + ECG)
    taxTotalCents: 600,
    discountCents: 0,
    totalCents: 16600,
    paidCents: 16600,
    balanceCents: 0,
    status: 'paid',
    finalizedAt: todayAt(9, 0),
  },
  // PAID — enc-009 (pt-010, IPD NSTEMI discharged)
  {
    id: 'bill-002',
    encounterId: 'enc-009',
    billNo: 'BILL-2026-0502',
    patientId: 'pt-010',
    facilityId: 'fac-001',
    subtotalCents: 430000, // $4300 (specialist + ward 4d + ECG + procedure)
    taxTotalCents: 22500,
    discountCents: 10000,
    totalCents: 442500,
    paidCents: 442500,
    balanceCents: 0,
    status: 'paid',
    finalizedAt: daysAgoAt(4, 9, 45),
  },
  // PARTIALLY PAID — enc-004 (pt-007, IPD hypothyroid, still admitted)
  {
    id: 'bill-003',
    encounterId: 'enc-004',
    billNo: 'BILL-2026-0503',
    patientId: 'pt-007',
    facilityId: 'fac-001',
    subtotalCents: 120000, // $1200 (specialist + ward 3d + investigation)
    taxTotalCents: 6500,
    discountCents: 0,
    totalCents: 126500,
    paidCents: 50000,
    balanceCents: 76500,
    status: 'partially_paid',
    finalizedAt: daysAgoAt(3, 15, 30),
  },
  // PARTIALLY PAID — enc-005 (pt-001, IPD hypertensive urgency, still admitted)
  {
    id: 'bill-004',
    encounterId: 'enc-005',
    billNo: 'BILL-2026-0504',
    patientId: 'pt-001',
    facilityId: 'fac-001',
    subtotalCents: 90000, // $900 (specialist + ward 2d)
    taxTotalCents: 0,
    discountCents: 0,
    totalCents: 90000,
    paidCents: 30000,
    balanceCents: 60000,
    status: 'partially_paid',
    finalizedAt: daysAgoAt(2, 12, 30),
  },
  // OPEN — enc-006 (pt-004, ER stroke, active)
  {
    id: 'bill-005',
    encounterId: 'enc-006',
    billNo: 'BILL-2026-0505',
    patientId: 'pt-004',
    facilityId: 'fac-001',
    subtotalCents: 45000, // $450 (ER consult + procedures)
    taxTotalCents: 3500,
    discountCents: 0,
    totalCents: 48500,
    paidCents: 0,
    balanceCents: 48500,
    status: 'open',
    finalizedAt: todayAt(7, 30),
  },
  // DRAFT — enc-010 (pt-008, daycare tonsil, in progress)
  {
    id: 'bill-006',
    encounterId: 'enc-010',
    billNo: 'BILL-2026-0506',
    patientId: 'pt-008',
    facilityId: 'fac-001',
    subtotalCents: 280000, // $2800 (procedure + ward + nursing)
    taxTotalCents: 14500,
    discountCents: 5000,
    totalCents: 289500,
    paidCents: 0,
    balanceCents: 289500,
    status: 'draft',
  },
]

export const BILL_LINES: MockBillLine[] = [
  // bill-001 lines (enc-001 pt-001 OPD)
  {
    id: 'bl-001',
    billId: 'bill-001',
    serviceId: 'svc-001',
    description: 'General Practice Consultation',
    qty: 1,
    unitPriceCents: 8000,
    taxRateBp: 0,
    amountCents: 8000,
  },
  {
    id: 'bl-002',
    billId: 'bill-001',
    serviceId: 'svc-005',
    description: '12-Lead ECG',
    qty: 1,
    unitPriceCents: 6000,
    taxRateBp: 1000,
    amountCents: 6600,
  },
  {
    id: 'bl-003',
    billId: 'bill-001',
    description: 'Lisinopril 10 mg x30 tabs',
    qty: 30,
    unitPriceCents: 50,
    taxRateBp: 0,
    amountCents: 1500,
  },
  // bill-002 lines (enc-009 pt-010 NSTEMI)
  {
    id: 'bl-004',
    billId: 'bill-002',
    serviceId: 'svc-002',
    description: 'Specialist Consultation',
    qty: 1,
    unitPriceCents: 15000,
    taxRateBp: 0,
    amountCents: 15000,
  },
  {
    id: 'bl-005',
    billId: 'bill-002',
    serviceId: 'svc-009',
    description: 'General Ward — 4 Days',
    qty: 4,
    unitPriceCents: 35000,
    taxRateBp: 0,
    amountCents: 140000,
  },
  {
    id: 'bl-006',
    billId: 'bill-002',
    serviceId: 'svc-008',
    description: 'Percutaneous Coronary Intervention (PCI)',
    qty: 1,
    unitPriceCents: 250000,
    taxRateBp: 500,
    amountCents: 262500,
  },
  // bill-003 lines (enc-004 pt-007 hypothyroid)
  {
    id: 'bl-007',
    billId: 'bill-003',
    serviceId: 'svc-002',
    description: 'Specialist Consultation',
    qty: 1,
    unitPriceCents: 15000,
    taxRateBp: 0,
    amountCents: 15000,
  },
  {
    id: 'bl-008',
    billId: 'bill-003',
    serviceId: 'svc-009',
    description: 'General Ward — 3 Days',
    qty: 3,
    unitPriceCents: 35000,
    taxRateBp: 0,
    amountCents: 105000,
  },
  // bill-004 lines (enc-005 pt-001 hypertensive urgency)
  {
    id: 'bl-009',
    billId: 'bill-004',
    serviceId: 'svc-002',
    description: 'Specialist Consultation',
    qty: 1,
    unitPriceCents: 15000,
    taxRateBp: 0,
    amountCents: 15000,
  },
  {
    id: 'bl-010',
    billId: 'bill-004',
    serviceId: 'svc-009',
    description: 'General Ward — 2 Days',
    qty: 2,
    unitPriceCents: 35000,
    taxRateBp: 0,
    amountCents: 70000,
  },
  // bill-005 lines (enc-006 pt-004 ER stroke)
  {
    id: 'bl-011',
    billId: 'bill-005',
    serviceId: 'svc-003',
    description: 'Emergency Consultation',
    qty: 1,
    unitPriceCents: 25000,
    taxRateBp: 0,
    amountCents: 25000,
  },
  {
    id: 'bl-012',
    billId: 'bill-006',
    serviceId: 'svc-008',
    description: 'Tonsillectomy (Day Surgery)',
    qty: 1,
    unitPriceCents: 250000,
    taxRateBp: 500,
    amountCents: 262500,
  },
]

export const PAYMENTS: MockPayment[] = [
  // bill-001 — paid in full by card
  {
    id: 'pay-001',
    billId: 'bill-001',
    method: 'card',
    amountCents: 16600,
    receivedAt: todayAt(9, 5),
    receivedByUserId: 114, // Jessica Stewart
    reference: 'CARD-4421',
  },
  // bill-002 — paid in full by bank transfer
  {
    id: 'pay-002',
    billId: 'bill-002',
    method: 'bank_transfer',
    amountCents: 442500,
    receivedAt: daysAgoAt(4, 10, 0),
    receivedByUserId: 115, // Olivia Park
    reference: 'WIRE-20260523',
  },
  // bill-003 — partial payment by cash
  {
    id: 'pay-003',
    billId: 'bill-003',
    method: 'cash',
    amountCents: 50000,
    receivedAt: daysAgoAt(2, 10, 0),
    receivedByUserId: 114,
  },
  // bill-004 — partial payment by UPI
  {
    id: 'pay-004',
    billId: 'bill-004',
    method: 'upi',
    amountCents: 20000,
    receivedAt: daysAgoAt(1, 9, 30),
    receivedByUserId: 115,
    reference: 'UPI-789012',
  },
  // bill-004 — second partial by card
  {
    id: 'pay-005',
    billId: 'bill-004',
    method: 'card',
    amountCents: 10000,
    receivedAt: daysAgoAt(1, 11, 0),
    receivedByUserId: 115,
    reference: 'CARD-7789',
  },
  // bill-005 — insurance pending (no cash yet)
  {
    id: 'pay-006',
    billId: 'bill-005',
    method: 'insurance_pending',
    amountCents: 0,
    receivedAt: todayAt(8, 0),
    receivedByUserId: 114,
    reference: 'INS-CLAIM-00445',
  },
]

export const billById = (id: string) => BILLS.find(b => b.id === id)
export const linesForBill = (billId: string) => BILL_LINES.filter(l => l.billId === billId)
export const paymentsForBill = (billId: string) => PAYMENTS.filter(p => p.billId === billId)
export const billForEncounter = (encounterId: string) =>
  BILLS.find(b => b.encounterId === encounterId)
