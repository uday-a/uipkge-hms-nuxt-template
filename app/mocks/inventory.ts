import type {
  MockStore,
  MockInventoryItem,
  MockStockLevel,
  MockGRN,
  MockStockTransfer,
} from './types'

export const INVENTORY_STORES: MockStore[] = [
  { id: 'store-main', code: 'MAIN', name: 'Main Store', facilityId: 'fac-1' },
  { id: 'store-pharm', code: 'PHARM', name: 'Pharmacy Store', facilityId: 'fac-1' },
  { id: 'store-ot', code: 'OTST', name: 'OT Store', facilityId: 'fac-1' },
  { id: 'store-ward', code: 'WARD', name: 'Ward Store', facilityId: 'fac-1' },
]

export const INVENTORY_ITEMS: MockInventoryItem[] = [
  { id: 'item-001', code: 'SKU-SYR-05', display: 'Disposable Syringe 5ml', category: 'consumable', unit: 'box', reorderLevel: 50 },
  { id: 'item-002', code: 'SKU-SYR-10', display: 'Disposable Syringe 10ml', category: 'consumable', unit: 'box', reorderLevel: 40 },
  { id: 'item-003', code: 'SKU-CAN-18', display: 'IV Cannula 18G', category: 'consumable', unit: 'box', reorderLevel: 30 },
  { id: 'item-004', code: 'SKU-CAN-20', display: 'IV Cannula 20G', category: 'consumable', unit: 'box', reorderLevel: 30 },
  { id: 'item-005', code: 'SKU-GLV-S', display: 'Surgical Gloves (Sterile)', category: 'consumable', unit: 'box', reorderLevel: 60 },
  { id: 'item-006', code: 'SKU-MSK-N9', display: 'Face Mask N95', category: 'consumable', unit: 'box', reorderLevel: 40 },
  { id: 'item-007', code: 'SKU-BAN-04', display: 'Bandage Roll 4 inch', category: 'consumable', unit: 'pack', reorderLevel: 25 },
  { id: 'item-008', code: 'SKU-COT-50', display: 'Cotton Roll 500g', category: 'consumable', unit: 'pack', reorderLevel: 20 },
  { id: 'item-009', code: 'SKU-BPM-DG', display: 'Blood Pressure Monitor', category: 'equipment', unit: 'each', reorderLevel: 2 },
  { id: 'item-010', code: 'SKU-OXI-FG', display: 'Pulse Oximeter', category: 'equipment', unit: 'each', reorderLevel: 3 },
  { id: 'item-011', code: 'SKU-ECG-EL', display: 'ECG Electrodes', category: 'consumable', unit: 'pack', reorderLevel: 15 },
  { id: 'item-012', code: 'SKU-URN-2L', display: 'Urine Bag 2L', category: 'consumable', unit: 'box', reorderLevel: 20 },
  { id: 'item-013', code: 'SKU-CAT-14', display: 'Foley\'s Catheter 14FR', category: 'consumable', unit: 'box', reorderLevel: 15 },
  { id: 'item-014', code: 'SKU-SUT-AS', display: 'Suture Kit (Assorted)', category: 'consumable', unit: 'box', reorderLevel: 10 },
  { id: 'item-015', code: 'SKU-DEF-PD', display: 'Defibrillator Pads', category: 'consumable', unit: 'pack', reorderLevel: 5 },
  { id: 'item-016', code: 'SKU-ST-A4R', display: 'Stationery A4 Ream', category: 'stationery', unit: 'pack', reorderLevel: 10 },
  { id: 'item-017', code: 'SKU-ST-FLD', display: 'Patient File Folder', category: 'stationery', unit: 'pack', reorderLevel: 15 },
  { id: 'item-018', code: 'SKU-LN-BSS', display: 'Bed Sheet Set', category: 'linens', unit: 'pack', reorderLevel: 12 },
  { id: 'item-019', code: 'SKU-LN-PVC', display: 'Pillow Cover', category: 'linens', unit: 'pack', reorderLevel: 15 },
  { id: 'item-020', code: 'SKU-CLN-5L', display: 'Cleaning Solution 5L', category: 'other', unit: 'pack', reorderLevel: 8 },
]

function makeStockLevels(): MockStockLevel[] {
  const levels: MockStockLevel[] = []
  let idx = 1
  const seed: Record<string, number[]> = {
    'store-main': [120, 90, 45, 60, 150, 80, 40, 35, 8, 12, 30, 55, 25, 18, 10, 25, 40, 30, 35, 15],
    'store-pharm': [85, 70, 55, 65, 110, 95, 30, 25, 4, 6, 20, 40, 30, 12, 6, 10, 15, 8, 12, 10],
    'store-ot': [45, 35, 60, 55, 90, 40, 20, 15, 3, 5, 15, 25, 20, 25, 12, 5, 8, 10, 8, 6],
    'store-ward': [60, 50, 40, 45, 80, 70, 25, 20, 5, 8, 18, 35, 22, 10, 5, 12, 20, 25, 20, 12],
  }
  for (const store of INVENTORY_STORES) {
    const storeSeed = seed[store.id]!
    for (let i = 0; i < INVENTORY_ITEMS.length; i++) {
      const item = INVENTORY_ITEMS[i]!
      levels.push({
        id: `sl-${String(idx).padStart(3, '0')}`,
        itemId: item.id,
        storeId: store.id,
        qtyOnHand: storeSeed[i]!,
      })
      idx++
    }
  }
  return levels
}

export const INVENTORY_STOCK_LEVELS: MockStockLevel[] = makeStockLevels()

export const INVENTORY_GRNS: MockGRN[] = [
  {
    id: 'grn-001',
    grnNo: 'GRN-2026-000001',
    receivedAt: '2026-05-20T09:30:00.000Z',
    receivedByUserId: 101,
    storeId: 'store-main',
    supplierName: 'MediSupply Corp',
    lines: [
      { itemId: 'item-001', qty: 100, unitCostCents: 2500, batchNo: 'BATCH-A1' },
      { itemId: 'item-003', qty: 80, unitCostCents: 1800, batchNo: 'BATCH-A2' },
      { itemId: 'item-005', qty: 120, unitCostCents: 3200, batchNo: 'BATCH-A3' },
    ],
    totalCents: 100000 + 57600 + 153600,
  },
  {
    id: 'grn-002',
    grnNo: 'GRN-2026-000002',
    receivedAt: '2026-05-21T11:15:00.000Z',
    receivedByUserId: 102,
    storeId: 'store-pharm',
    supplierName: 'PharmaCare Ltd',
    lines: [
      { itemId: 'item-002', qty: 90, unitCostCents: 2800, batchNo: 'BATCH-B1' },
      { itemId: 'item-006', qty: 100, unitCostCents: 1500, batchNo: 'BATCH-B2' },
    ],
    totalCents: 252000 + 150000,
  },
  {
    id: 'grn-003',
    grnNo: 'GRN-2026-000003',
    receivedAt: '2026-05-22T14:00:00.000Z',
    receivedByUserId: 103,
    storeId: 'store-ot',
    supplierName: 'SurgiTech Solutions',
    lines: [
      { itemId: 'item-014', qty: 30, unitCostCents: 4500, batchNo: 'BATCH-C1' },
      { itemId: 'item-015', qty: 20, unitCostCents: 12000, batchNo: 'BATCH-C2' },
    ],
    totalCents: 135000 + 240000,
  },
  {
    id: 'grn-004',
    grnNo: 'GRN-2026-000004',
    receivedAt: '2026-05-23T08:45:00.000Z',
    receivedByUserId: 101,
    storeId: 'store-ward',
    supplierName: 'MediSupply Corp',
    lines: [
      { itemId: 'item-012', qty: 60, unitCostCents: 800, batchNo: 'BATCH-D1' },
      { itemId: 'item-013', qty: 40, unitCostCents: 2200, batchNo: 'BATCH-D2' },
      { itemId: 'item-018', qty: 25, unitCostCents: 3500, batchNo: 'BATCH-D3' },
    ],
    totalCents: 48000 + 88000 + 87500,
  },
  {
    id: 'grn-005',
    grnNo: 'GRN-2026-000005',
    receivedAt: '2026-05-24T10:20:00.000Z',
    receivedByUserId: 104,
    storeId: 'store-main',
    supplierName: 'General Hospital Suppliers',
    lines: [
      { itemId: 'item-009', qty: 5, unitCostCents: 185000, batchNo: 'BATCH-E1' },
      { itemId: 'item-010', qty: 8, unitCostCents: 95000, batchNo: 'BATCH-E2' },
    ],
    totalCents: 925000 + 760000,
  },
  {
    id: 'grn-006',
    grnNo: 'GRN-2026-000006',
    receivedAt: '2026-05-25T16:00:00.000Z',
    receivedByUserId: 102,
    storeId: 'store-pharm',
    supplierName: 'PharmaCare Ltd',
    lines: [
      { itemId: 'item-004', qty: 70, unitCostCents: 1900, batchNo: 'BATCH-F1' },
      { itemId: 'item-007', qty: 50, unitCostCents: 1200, batchNo: 'BATCH-F2' },
      { itemId: 'item-008', qty: 40, unitCostCents: 900, batchNo: 'BATCH-F3' },
    ],
    totalCents: 133000 + 60000 + 36000,
  },
]

export const INVENTORY_TRANSFERS: MockStockTransfer[] = [
  {
    id: 'trf-001',
    transferNo: 'TRF-2026-0001',
    fromStoreId: 'store-main',
    toStoreId: 'store-ot',
    status: 'pending',
    initiatedAt: '2026-05-26T08:00:00.000Z',
    lines: [
      { itemId: 'item-001', qty: 20 },
      { itemId: 'item-005', qty: 15 },
    ],
  },
  {
    id: 'trf-002',
    transferNo: 'TRF-2026-0002',
    fromStoreId: 'store-main',
    toStoreId: 'store-ward',
    status: 'in_transit',
    initiatedAt: '2026-05-25T14:30:00.000Z',
    lines: [
      { itemId: 'item-012', qty: 25 },
      { itemId: 'item-013', qty: 10 },
    ],
  },
  {
    id: 'trf-003',
    transferNo: 'TRF-2026-0003',
    fromStoreId: 'store-pharm',
    toStoreId: 'store-ward',
    status: 'received',
    initiatedAt: '2026-05-20T09:00:00.000Z',
    lines: [
      { itemId: 'item-002', qty: 30 },
    ],
  },
  {
    id: 'trf-004',
    transferNo: 'TRF-2026-0004',
    fromStoreId: 'store-ot',
    toStoreId: 'store-main',
    status: 'cancelled',
    initiatedAt: '2026-05-18T11:00:00.000Z',
    lines: [
      { itemId: 'item-014', qty: 5 },
    ],
  },
]
