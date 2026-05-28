import type { MockDrug } from './types'

// 15 drugs — common Rx + OTC, incl. 3 controlled substances (schedule 2, 3, 4)
export const DRUGS: MockDrug[] = [
  {
    id: 'drug-001',
    code: 'PARA500T',
    display: 'Paracetamol 500 mg Tablet',
    form: 'tablet',
    strengthText: '500 mg',
    genericName: 'paracetamol',
  },
  {
    id: 'drug-002',
    code: 'IBU400T',
    display: 'Ibuprofen 400 mg Tablet',
    form: 'tablet',
    strengthText: '400 mg',
    genericName: 'ibuprofen',
  },
  {
    id: 'drug-003',
    code: 'AMOX500C',
    display: 'Amoxicillin 500 mg Capsule',
    form: 'capsule',
    strengthText: '500 mg',
    genericName: 'amoxicillin',
  },
  {
    id: 'drug-004',
    code: 'LISIN10T',
    display: 'Lisinopril 10 mg Tablet',
    form: 'tablet',
    strengthText: '10 mg',
    genericName: 'lisinopril',
  },
  {
    id: 'drug-005',
    code: 'MET500T',
    display: 'Metformin 500 mg Tablet',
    form: 'tablet',
    strengthText: '500 mg',
    genericName: 'metformin hydrochloride',
  },
  {
    id: 'drug-006',
    code: 'ATOR40T',
    display: 'Atorvastatin 40 mg Tablet',
    form: 'tablet',
    strengthText: '40 mg',
    genericName: 'atorvastatin calcium',
  },
  {
    id: 'drug-007',
    code: 'CET10T',
    display: 'Cetirizine 10 mg Tablet',
    form: 'tablet',
    strengthText: '10 mg',
    genericName: 'cetirizine hydrochloride',
  },
  {
    id: 'drug-008',
    code: 'OMP20C',
    display: 'Omeprazole 20 mg Capsule',
    form: 'capsule',
    strengthText: '20 mg',
    genericName: 'omeprazole',
  },
  {
    id: 'drug-009',
    code: 'SALB100I',
    display: 'Salbutamol 100 mcg Inhaler',
    form: 'inhaler',
    strengthText: '100 mcg/actuation',
    genericName: 'salbutamol sulfate',
  },
  {
    id: 'drug-010',
    code: 'INSREG10',
    display: 'Insulin Regular 100 IU/mL Injection',
    form: 'injection',
    strengthText: '100 IU/mL',
    genericName: 'insulin (human, regular)',
  },
  {
    id: 'drug-011',
    code: 'WARF5T',
    display: 'Warfarin 5 mg Tablet',
    form: 'tablet',
    strengthText: '5 mg',
    genericName: 'warfarin sodium',
  },
  {
    id: 'drug-012',
    code: 'ASP100T',
    display: 'Aspirin 100 mg Tablet',
    form: 'tablet',
    strengthText: '100 mg',
    genericName: 'aspirin',
  },
  {
    id: 'drug-013',
    code: 'DIAZ5T',
    display: 'Diazepam 5 mg Tablet',
    form: 'tablet',
    strengthText: '5 mg',
    genericName: 'diazepam',
    schedule: 4, // Schedule 4 controlled substance (benzodiazepine)
  },
  {
    id: 'drug-014',
    code: 'MORPH10I',
    display: 'Morphine Sulfate 10 mg/mL Injection',
    form: 'injection',
    strengthText: '10 mg/mL',
    genericName: 'morphine sulfate',
    schedule: 2, // Schedule 2 — opioid
  },
  {
    id: 'drug-015',
    code: 'CODE30T',
    display: 'Codeine Phosphate 30 mg Tablet',
    form: 'tablet',
    strengthText: '30 mg',
    genericName: 'codeine phosphate',
    schedule: 3, // Schedule 3
  },
]

export const drugById = (id: string) => DRUGS.find(d => d.id === id)
export const controlledDrugs = () => DRUGS.filter(d => d.schedule !== undefined)
