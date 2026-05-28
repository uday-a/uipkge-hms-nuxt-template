import type { MockDischargeSummary } from './types'
import { isoDate, daysAgoAt, daysAgo } from './today'

// 3 discharge summaries — 1 draft (in-progress IPD) + 2 signed (completed)
export const DISCHARGE_SUMMARIES: MockDischargeSummary[] = [
  // Draft — enc-004 pt-007 (hypothyroid, still admitted — doctor started draft)
  {
    id: 'ds-001',
    encounterId: 'enc-004',
    patientId: 'pt-007',
    attendingUserId: 101, // Dr Sarah Bennett
    admissionDate: isoDate(daysAgo(3)),
    primaryDiagnosis: 'Myxoedema coma (hypothyroid crisis) — E03.5',
    secondaryDiagnoses: [
      { display: 'Bradycardia — R00.1' },
      { display: 'Hypothermia — T68' },
    ],
    hospitalCourse: 'Ms Sophia Anderson 48F admitted via ED in a drowsy state with bradycardia and hypothermia. TSH on admission >100 mIU/L. IV Levothyroxine commenced per endocrine protocol with slow dose titration. Cardiac monitoring throughout. By Day 3, patient alert and tolerating oral medications. TSH improving to 68 mIU/L. Plan for discharge Day 5 pending further TSH and clinical improvement.',
    conditionAtDischarge: 'improved',
    followUpInstructions: 'Follow-up with endocrinology in 2 weeks. Repeat TFTs in 6 weeks. Continue Levothyroxine 100 mcg OD. No driving until formally reviewed.',
    status: 'draft',
  },
  // Signed — enc-009 pt-010 (NSTEMI, discharged 4 days ago)
  {
    id: 'ds-002',
    encounterId: 'enc-009',
    patientId: 'pt-010',
    attendingUserId: 102, // Dr Michael O'Connor
    admissionDate: isoDate(daysAgo(8)),
    dischargeDate: isoDate(daysAgo(4)),
    primaryDiagnosis: 'Non-ST-elevation myocardial infarction (NSTEMI) — I21.4',
    secondaryDiagnoses: [
      { code: 'I10', display: 'Essential hypertension' },
      { code: 'E78.5', display: 'Hyperlipidaemia' },
    ],
    hospitalCourse: 'Mr Noah Miller 56M admitted via ED with acute chest pain and rising troponin (peak 2840 ng/L). Managed with dual antiplatelet therapy (Aspirin + Clopidogrel), LMWH bridging, statin, beta-blocker, and ACE inhibitor. Coronary angiogram Day 3: significant LAD stenosis (70%). Successful PCI with drug-eluting stent Day 4. Post-PCI course uncomplicated. LV function preserved (EF 50%) on echocardiogram. Physiotherapy commenced. Discharged day 8 with full secondary prevention therapy.',
    conditionAtDischarge: 'improved',
    followUpInstructions: 'Follow-up with Dr O\'Connor in 6 weeks. Stress echo in 3 months. Continue DAPT (Aspirin + Clopidogrel) for minimum 12 months — do not stop without cardiology advice. Cardiac rehabilitation referral made. Fasting lipids in 6 weeks.',
    status: 'signed',
    signedAt: daysAgoAt(4, 9, 30),
  },
  // Signed — enc-007 pt-004 (OPD yesterday — warfarin review, brief encounter)
  // This is a signed OPD encounter note, re-using discharge summary structure
  {
    id: 'ds-003',
    encounterId: 'enc-007',
    patientId: 'pt-004',
    attendingUserId: 101,
    admissionDate: isoDate(daysAgo(1)),
    dischargeDate: isoDate(daysAgo(1)),
    primaryDiagnosis: 'Atrial fibrillation on anticoagulation — warfarin monitoring',
    secondaryDiagnoses: [
      { display: 'Previous TIA 2019' },
      { display: 'Hypertension' },
    ],
    hospitalCourse: 'Mr James Wilson 78M routine warfarin monitoring. INR 2.7 — therapeutic (target 2.0–3.0). No bleeding events. Continue current Warfarin 5 mg OD. Review in 4 weeks.',
    conditionAtDischarge: 'stable',
    followUpInstructions: 'Repeat INR in 4 weeks. Continue Warfarin 5 mg OD at 18:00. Avoid NSAIDs and aspirin. Attend ED if any signs of bleeding.',
    status: 'signed',
    signedAt: daysAgoAt(1, 10, 25),
  },
]

export const dischargeSummaryById = (id: string) => DISCHARGE_SUMMARIES.find(d => d.id === id)
export const dischargeSummaryForEncounter = (encounterId: string) =>
  DISCHARGE_SUMMARIES.find(d => d.encounterId === encounterId)
