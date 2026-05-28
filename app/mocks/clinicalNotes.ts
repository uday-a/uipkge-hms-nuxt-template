import type { MockClinicalNote } from './types'
import { todayAt, daysAgoAt } from './today'

// 8 SOAP/clinical notes attached to encounters. Mix of draft + signed.
export const CLINICAL_NOTES: MockClinicalNote[] = [
  {
    id: 'note-001',
    encounterId: 'enc-001',
    authorUserId: 101,
    kind: 'soap',
    status: 'signed',
    signedAt: todayAt(8, 55),
    signedByUserId: 101,
    content: {
      subjective: 'Patient reports BP well-controlled on current regimen. No headaches, no visual disturbance. Compliant with Lisinopril 10 mg OD.',
      objective: 'BP 138/84 mmHg. HR 72 bpm regular. Weight 86 kg (stable). No peripheral oedema. Lung fields clear.',
      assessment: 'Hypertension — well controlled on Lisinopril. No target organ damage signs.',
      plan: 'Continue Lisinopril 10 mg OD. Repeat BP check in 3 months. Renal function profile in 6 months. Lifestyle counselling re salt restriction.',
    },
  },
  {
    id: 'note-002',
    encounterId: 'enc-002',
    authorUserId: 101,
    kind: 'soap',
    status: 'signed',
    signedAt: todayAt(9, 25),
    signedByUserId: 101,
    content: {
      subjective: 'Patient reports good dietary compliance. Occasional fasting BGL ~7.2 mmol/L at home. No hypoglycaemic episodes. Foot care maintained.',
      objective: 'BP 126/78 mmHg. Weight 72 kg. HbA1c 7.3% (previous 7.8%). Foot exam: intact sensation, normal pulses. No skin breakdown.',
      assessment: 'Type 2 diabetes mellitus — improving control. HbA1c trending down.',
      plan: 'Continue Metformin 1 g BD. Repeat HbA1c in 3 months. Annual retinal screen due — refer ophthalmology. Reinforce SMBG twice daily.',
    },
  },
  {
    id: 'note-003',
    encounterId: 'enc-003',
    authorUserId: 102,
    kind: 'soap',
    status: 'draft',
    content: {
      subjective: 'Ms Johnson 33F, c/o central chest pain 6/10, sharp, radiates to left jaw, onset 1 hour ago. Associated diaphoresis. Denies SOB. No prior cardiac history.',
      objective: 'BP 148/92 mmHg. HR 96 bpm. SpO2 98% on air. ECG: ST-segment flattening V3-V5. Troponin-I pending.',
      assessment: 'Chest pain — rule out NSTEMI. High-risk features present.',
      plan: 'ECG serial monitoring. Troponin at 0 and 3 h. Aspirin 300 mg loading dose given. IV access established. Cardiology consult arranged. Admit if troponin positive.',
    },
  },
  {
    id: 'note-004',
    encounterId: 'enc-004',
    authorUserId: 101,
    kind: 'progress',
    status: 'signed',
    signedAt: daysAgoAt(3, 16, 0),
    signedByUserId: 101,
    content: {
      narrative: 'Day 1 admission. Sophia Anderson 48F admitted with hypothyroid crisis. TSH > 100 mIU/L on admission bloods. Commenced IV Levothyroxine per endocrine protocol. Patient drowsy but arousable. Vitals stable. Cardiac monitoring in situ. Continue current management and reassess in 24 hours.',
    },
  },
  {
    id: 'note-005',
    encounterId: 'enc-004',
    authorUserId: 101,
    kind: 'progress',
    status: 'draft',
    content: {
      narrative: 'Day 3. Patient more alert — GCS 15. Tolerating oral medications. Switched to oral Levothyroxine 100 mcg OD. TSH still elevated at 68 mIU/L, expect slow improvement over weeks. Plan discharge in 1-2 days if vitals remain stable.',
    },
  },
  {
    id: 'note-006',
    encounterId: 'enc-005',
    authorUserId: 102,
    kind: 'progress',
    status: 'signed',
    signedAt: daysAgoAt(2, 13, 0),
    signedByUserId: 102,
    content: {
      narrative: 'Mr Smith 68M admitted Day 1 with hypertensive urgency. BP on arrival 198/114. IV Labetalol infusion commenced. BP now 155/92 at 2-hour mark. Troponin negative. ECG: LVH but no acute changes. Renal function normal. Echocardiogram requested. Will titrate antihypertensives.',
    },
  },
  {
    id: 'note-007',
    encounterId: 'enc-006',
    authorUserId: 102,
    kind: 'soap',
    status: 'signed',
    signedAt: todayAt(7, 0),
    signedByUserId: 102,
    content: {
      subjective: 'James Wilson 78M, BIBEMS with left-sided weakness and facial droop onset ~05:30. Last seen well 04:45. Warfarin user (INR unknown). HTN, AF, previous TIA 2019.',
      objective: 'BP 180/104. HR irregular 94 bpm. NIHSS 12. Left hemiplegia, left hemianopia. GCS E4V4M5. CT Brain: no haemorrhage. CT Angio: right MCA M1 occlusion.',
      assessment: 'Acute ischaemic stroke — right MCA territory. INR contraindication to IV thrombolysis. Candidate for mechanical thrombectomy.',
      plan: 'Activate stroke pathway. Neurology and interventional radiology notified. INR stat. Neurosurgery on standby. IV fluids, NBM, HDU bed.',
    },
  },
  {
    id: 'note-008',
    encounterId: 'enc-009',
    authorUserId: 102,
    kind: 'discharge',
    status: 'signed',
    signedAt: daysAgoAt(4, 9, 30),
    signedByUserId: 102,
    content: {
      narrative: 'Mr Noah Miller 56M admitted 8 days ago with NSTEMI. Managed with dual antiplatelet therapy, heparin infusion. Coronary angiogram Day 3: 70% LAD stenosis. PCI to LAD performed Day 4, drug-eluting stent placed. Post-procedure course uneventful. Echocardiogram: EF 50%. Discharged on Aspirin 100 mg OD, Clopidogrel 75 mg OD, Atorvastatin 80 mg ON, Metoprolol 25 mg BD, Ramipril 2.5 mg OD. Cardiac rehab referral made. Reviewed by physiotherapy. Follow-up with Dr O\'Connor in 6 weeks.',
    },
  },
]

export const noteById = (id: string) => CLINICAL_NOTES.find(n => n.id === id)
export const notesForEncounter = (encounterId: string) =>
  CLINICAL_NOTES.filter(n => n.encounterId === encounterId)
