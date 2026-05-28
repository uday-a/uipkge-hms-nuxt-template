import type { MockDrugBatch } from './types'
import { isoDate, daysFromNow, daysAgo } from './today'

// 20 drug batches across the 15 drugs — some near-expiry, some low stock
export const DRUG_BATCHES: MockDrugBatch[] = [
  // Paracetamol — two batches, one near-expiry
  {
    id: 'batch-001',
    drugId: 'drug-001',
    batchNo: 'PARA-2024-0881',
    expiresOn: isoDate(daysFromNow(14)), // near-expiry
    qtyOnHand: 42,
    facilityId: 'fac-001',
  },
  {
    id: 'batch-002',
    drugId: 'drug-001',
    batchNo: 'PARA-2025-1204',
    expiresOn: isoDate(daysFromNow(365)),
    qtyOnHand: 840,
    facilityId: 'fac-001',
  },
  // Ibuprofen
  {
    id: 'batch-003',
    drugId: 'drug-002',
    batchNo: 'IBU-2025-0443',
    expiresOn: isoDate(daysFromNow(180)),
    qtyOnHand: 620,
    facilityId: 'fac-001',
  },
  // Amoxicillin — low stock
  {
    id: 'batch-004',
    drugId: 'drug-003',
    batchNo: 'AMOX-2025-0112',
    expiresOn: isoDate(daysFromNow(90)),
    qtyOnHand: 8, // low stock
    facilityId: 'fac-001',
  },
  // Lisinopril
  {
    id: 'batch-005',
    drugId: 'drug-004',
    batchNo: 'LISIN-2025-0340',
    expiresOn: isoDate(daysFromNow(270)),
    qtyOnHand: 450,
    facilityId: 'fac-001',
  },
  // Metformin — two batches
  {
    id: 'batch-006',
    drugId: 'drug-005',
    batchNo: 'MET-2024-0997',
    expiresOn: isoDate(daysFromNow(60)),
    qtyOnHand: 200,
    facilityId: 'fac-001',
  },
  {
    id: 'batch-007',
    drugId: 'drug-005',
    batchNo: 'MET-2025-1050',
    expiresOn: isoDate(daysFromNow(400)),
    qtyOnHand: 1200,
    facilityId: 'fac-001',
  },
  // Atorvastatin
  {
    id: 'batch-008',
    drugId: 'drug-006',
    batchNo: 'ATOR-2025-0222',
    expiresOn: isoDate(daysFromNow(300)),
    qtyOnHand: 780,
    facilityId: 'fac-001',
  },
  // Cetirizine
  {
    id: 'batch-009',
    drugId: 'drug-007',
    batchNo: 'CET-2025-0089',
    expiresOn: isoDate(daysFromNow(200)),
    qtyOnHand: 360,
    facilityId: 'fac-001',
  },
  // Omeprazole — near-expiry batch
  {
    id: 'batch-010',
    drugId: 'drug-008',
    batchNo: 'OMP-2024-0601',
    expiresOn: isoDate(daysFromNow(21)), // near-expiry
    qtyOnHand: 30,
    facilityId: 'fac-001',
  },
  // Salbutamol inhaler
  {
    id: 'batch-011',
    drugId: 'drug-009',
    batchNo: 'SALB-2025-0054',
    expiresOn: isoDate(daysFromNow(500)),
    qtyOnHand: 48,
    facilityId: 'fac-001',
  },
  // Insulin Regular — cold chain, low stock
  {
    id: 'batch-012',
    drugId: 'drug-010',
    batchNo: 'INS-2025-0011',
    expiresOn: isoDate(daysFromNow(45)),
    qtyOnHand: 5, // low stock
    facilityId: 'fac-001',
  },
  // Warfarin
  {
    id: 'batch-013',
    drugId: 'drug-011',
    batchNo: 'WARF-2025-0303',
    expiresOn: isoDate(daysFromNow(240)),
    qtyOnHand: 250,
    facilityId: 'fac-001',
  },
  // Aspirin
  {
    id: 'batch-014',
    drugId: 'drug-012',
    batchNo: 'ASP-2025-0188',
    expiresOn: isoDate(daysFromNow(330)),
    qtyOnHand: 900,
    facilityId: 'fac-001',
  },
  // Diazepam (schedule 4) — controlled narcotics register
  {
    id: 'batch-015',
    drugId: 'drug-013',
    batchNo: 'DIAZ-2025-0007',
    expiresOn: isoDate(daysFromNow(365)),
    qtyOnHand: 60,
    facilityId: 'fac-001',
  },
  // Morphine (schedule 2) — very low stock, controlled
  {
    id: 'batch-016',
    drugId: 'drug-014',
    batchNo: 'MORPH-2025-0002',
    expiresOn: isoDate(daysFromNow(90)),
    qtyOnHand: 10, // low stock, controlled
    facilityId: 'fac-001',
  },
  // Codeine (schedule 3) — controlled
  {
    id: 'batch-017',
    drugId: 'drug-015',
    batchNo: 'CODE-2025-0015',
    expiresOn: isoDate(daysFromNow(180)),
    qtyOnHand: 40,
    facilityId: 'fac-001',
  },
  // Expired batch (for testing expired alerts)
  {
    id: 'batch-018',
    drugId: 'drug-002',
    batchNo: 'IBU-2023-0190',
    expiresOn: isoDate(daysAgo(30)), // already expired
    qtyOnHand: 12,
    facilityId: 'fac-001',
  },
  // Extra Paracetamol for surgical ward
  {
    id: 'batch-019',
    drugId: 'drug-001',
    batchNo: 'PARA-2025-1305',
    expiresOn: isoDate(daysFromNow(450)),
    qtyOnHand: 500,
    facilityId: 'fac-001',
  },
  // Extra Lisinopril, near-expiry
  {
    id: 'batch-020',
    drugId: 'drug-004',
    batchNo: 'LISIN-2024-0207',
    expiresOn: isoDate(daysFromNow(10)), // near-expiry
    qtyOnHand: 18,
    facilityId: 'fac-001',
  },
]

export const batchById = (id: string) => DRUG_BATCHES.find(b => b.id === id)
export const batchesForDrug = (drugId: string) => DRUG_BATCHES.filter(b => b.drugId === drugId)
export const nearExpiryBatches = () =>
  DRUG_BATCHES.filter((b) => {
    const days = (new Date(b.expiresOn).getTime() - Date.now()) / 86_400_000
    return days >= 0 && days <= 30
  })
export const lowStockBatches = () =>
  DRUG_BATCHES.filter(b => b.qtyOnHand <= 10)
