// All HMS entity TypeScript interfaces.
// These are pure data shapes — no runtime code here.

export interface MockUser {
  id: number
  email: string
  login: string
  name: string
  role: 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'lab_tech' | 'radiologist' | 'receptionist'
  specialty?: string
  avatar?: string
}

export interface MockFacility {
  id: string
  code: string
  name: string
  type: 'hospital'
}

export interface MockDepartment {
  id: string
  facilityId: string
  code: string
  name: string
  kind: 'opd' | 'ipd' | 'er' | 'ot' | 'icu' | 'lab' | 'radiology' | 'pharmacy'
}

export interface MockUnit {
  id: string
  departmentId: string
  code: string
  name: string
}

export interface MockBed {
  id: string
  unitId: string
  label: string
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked'
}

export interface MockPatient {
  id: string
  mrn: string
  givenName: string
  familyName: string
  sex: 'male' | 'female' | 'intersex' | 'unknown'
  dateOfBirth: string // YYYY-MM-DD
  phone?: string
  email?: string
  address?: string
  allergiesSummary?: string
}

export interface MockEncounter {
  id: string
  patientId: string
  facilityId: string
  type: 'outpatient' | 'inpatient' | 'emergency' | 'daycare' | 'telemedicine'
  status: 'planned' | 'arrived' | 'in_progress' | 'finished' | 'cancelled' | 'no_show'
  departmentId?: string
  attendingUserId?: number
  admissionAt?: string
  dischargeAt?: string
  bedId?: string
  reasonChiefComplaint?: string
  appointmentId?: string
}

export interface MockAppointment {
  id: string
  patientId: string
  doctorUserId: number
  facilityId: string
  scheduledAt: string // ISO
  slotMinutes: number
  status: 'booked' | 'arrived' | 'cancelled' | 'no_show' | 'completed'
  encounterId?: string
  tokenNumber?: number
  reasonNote?: string
}

export interface MockClinicalNote {
  id: string
  encounterId: string
  authorUserId: number
  kind: 'soap' | 'progress' | 'discharge' | 'free' | 'anesthesia' | 'operative'
  content: any // shape depends on kind
  status: 'draft' | 'signed' | 'amended' | 'superseded'
  signedAt?: string
  signedByUserId?: number
}

export interface MockDrug {
  id: string
  code: string
  display: string
  form: 'tablet' | 'syrup' | 'injection' | 'cream' | 'drops' | 'capsule' | 'inhaler'
  strengthText: string
  genericName: string
  schedule?: number // 1–5 for controlled substances
}

export interface MockDrugBatch {
  id: string
  drugId: string
  batchNo: string
  expiresOn: string // YYYY-MM-DD
  qtyOnHand: number
  facilityId: string
}

export interface MockMedicationRequest {
  id: string
  encounterId: string
  prescriberUserId: number
  patientId: string
  drugId: string
  doseValue: number
  doseUnit: string
  route: string
  frequencyText: string
  durationDays: number
  dispenseQty: number
  prn: boolean
  instructions?: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  signedAt?: string
}

export interface MockMedicationDispense {
  id: string
  medicationRequestId: string
  drugId: string
  batchId: string
  qtyDispensed: number
  dispensedAt: string
  dispensedByUserId: number
  patientId: string
  encounterId: string
}

export interface MockMedicationAdministration {
  id: string
  medicationRequestId: string
  encounterId: string
  patientId: string
  administeredAt: string
  administeredByUserId: number
  doseValue: number
  doseUnit: string
  route?: string
  status: 'given' | 'held' | 'refused' | 'omitted' | 'partial'
  notes?: string
}

export interface MockServiceCatalogItem {
  id: string
  facilityId: string
  code: string
  display: string
  category: 'consultation' | 'procedure' | 'investigation' | 'ward' | 'misc'
  defaultPriceCents: number
  taxRateBp: number
}

export interface MockBill {
  id: string
  encounterId: string
  billNo: string
  patientId: string
  facilityId: string
  subtotalCents: number
  taxTotalCents: number
  discountCents: number
  totalCents: number
  paidCents: number
  balanceCents: number
  status: 'draft' | 'open' | 'paid' | 'partially_paid' | 'cancelled'
  finalizedAt?: string
}

export interface MockBillLine {
  id: string
  billId: string
  serviceId?: string
  description: string
  qty: number
  unitPriceCents: number
  taxRateBp: number
  amountCents: number
}

export interface MockPayment {
  id: string
  billId: string
  method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance_pending'
  amountCents: number
  receivedAt: string
  receivedByUserId: number
  reference?: string
}

export interface MockLabCatalogItem {
  id: string
  facilityId: string
  code: string
  display: string
  specimenType: 'blood' | 'urine' | 'swab' | 'stool' | 'csf' | 'sputum' | string
  unit?: string
  referenceLow?: number
  referenceHigh?: number
  criticalLow?: number
  criticalHigh?: number
}

export interface MockServiceRequest {
  id: string
  encounterId: string
  patientId: string
  facilityId: string
  requesterUserId: number
  category: 'lab' | 'radiology'
  code: string
  display: string
  priority: 'routine' | 'urgent' | 'stat'
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  // domain-specific
  catalogId?: string // lab — refs MockLabCatalogItem
  modality?: string // radiology
  bodyRegion?: string
}

export interface MockLabSample {
  id: string
  serviceRequestId: string
  patientId: string
  specimenType: string
  barcode: string
  collectedAt?: string
  collectedByUserId?: number
  receivedAt?: string
  rejectedAt?: string
}

export interface MockObservation {
  id: string
  serviceRequestId?: string // optional for vitals
  encounterId: string
  patientId: string
  code: string
  display: string
  valueNumeric?: number
  valueString?: string
  unit?: string
  effectiveAt: string
  interpretation?: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low' | 'abnormal'
  referenceRangeText?: string
  diagnosticReportId?: string
}

export interface MockDiagnosticReport {
  id: string
  serviceRequestId: string
  encounterId: string
  patientId: string
  category: 'lab' | 'radiology'
  code: string
  display: string
  status: 'draft' | 'final' | 'amended' | 'superseded'
  conclusion?: string
  effectiveAt: string
  issuedAt?: string
  signedByUserId?: number
  observationIds: string[]
  imagingStudyId?: string
}

export interface MockImagingStudy {
  id: string
  serviceRequestId: string
  patientId: string
  facilityId: string
  accessionNumber: string
  modality: 'xr' | 'ct' | 'mri' | 'us' | 'dx' | 'mg' | 'nm' | 'pt' | 'er' | 'os' | 'xa'
  bodyRegion: string
  description?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduledAt: string
  startedAt?: string
  completedAt?: string
}

export interface MockBedAssignment {
  id: string
  encounterId: string
  patientId: string
  bedId: string
  facilityId: string
  unitId: string
  assignedAt: string
  releasedAt?: string
  reason: 'admission' | 'transfer' | 'temporary' | 'discharge'
  assignedByUserId: number
}

export interface MockNursingEntry {
  id: string
  encounterId: string
  patientId: string
  recordedAt: string
  recordedByUserId: number
  shift: 'morning' | 'afternoon' | 'night'
  vitals?: { bpSys?: number, bpDia?: number, hr?: number, t?: number, spo2?: number, rr?: number }
  painScore?: number
  intake?: { poMl?: number, ivMl?: number }
  output?: { urineMl?: number, stoolCount?: number }
  notes?: string
  signedAt?: string
  context?: 'ward' | 'pacu' | 'icu'
  icuData?: { ventilator?: any, pressors?: any, scores?: any }
}

export interface MockDischargeSummary {
  id: string
  encounterId: string
  patientId: string
  attendingUserId: number
  admissionDate: string
  dischargeDate?: string
  primaryDiagnosis?: string
  secondaryDiagnoses?: Array<{ code?: string, display: string }>
  hospitalCourse?: string
  conditionAtDischarge?: 'improved' | 'stable' | 'unchanged' | 'deteriorated' | 'expired' | 'left_against_advice'
  followUpInstructions?: string
  status: 'draft' | 'signed' | 'amended' | 'superseded'
  signedAt?: string
}

export interface MockSurgeryBooking {
  id: string
  encounterId: string
  patientId: string
  orRoomId: string
  procedureName: string
  primarySurgeonUserId: number
  anesthetistUserId?: number
  scrubNurseUserId?: number
  scheduledAt: string
  estimatedMinutes: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  startedAt?: string
  endedAt?: string
}

export interface MockPACAssessment {
  id: string
  surgeryBookingId: string
  patientId: string
  assessedByUserId: number
  assessedAt: string
  asa: 1 | 2 | 3 | 4 | 5 | 6
  airwayMallampati: 1 | 2 | 3 | 4
  dentalNotes?: string
  allergies?: string
  currentMedications?: string
  fasting: boolean
  fastingLastOralAt?: string
  consentSigned: boolean
  consentSignedAt?: string
  anesthesiaPlan?: string
  premedications?: string
  status: 'draft' | 'completed' | 'reviewed'
}

export interface MockSurgicalChecklist {
  id: string
  surgeryBookingId: string
  patientId: string
  completedByUserId: number
  // WHO 3-phase
  signInCompletedAt?: string
  signInItems?: Record<string, boolean>
  timeOutCompletedAt?: string
  timeOutItems?: Record<string, boolean>
  signOutCompletedAt?: string
  signOutItems?: Record<string, boolean>
  status: 'pending' | 'sign_in_done' | 'timeout_done' | 'completed'
}

export interface MockAnesthesiaRecord {
  id: string
  surgeryBookingId: string
  patientId: string
  anesthetistUserId: number
  type: 'general' | 'spinal' | 'epidural' | 'local' | 'combined'
  startAt: string
  endAt?: string
  agents: Array<{ drug: string, dose: string, route: string, at: string }>
  intraopVitals: Array<{
    at: string
    bpSys: number
    bpDia: number
    hr: number
    spo2: number
    etco2?: number
  }>
  complications?: string
  recoveryScore?: number // Aldrete or Modified Aldrete 0–10
  notes?: string
}

export interface MockICUAdmission {
  id: string
  encounterId: string
  patientId: string
  source?: 'OT' | 'ER' | 'ward' | 'external_transfer'
  indication: string
  admittedAt: string
  admittedByUserId: number
  intensivistUserId?: number
  initialSeverity?: 'mild' | 'moderate' | 'severe'
  initialGcs?: number
  dischargedAt?: string
  outcome?: 'discharged_to_ward' | 'transferred' | 'expired' | 'left_against_advice'
}

export interface MockCriticalAlert {
  id: string
  observationId: string
  patientId: string
  encounterId: string
  facilityId: string
  triggeredAt: string
  acknowledgedAt?: string
  acknowledgedByUserId?: number
}

export interface MockAuditEvent {
  id: number
  occurredAt: string
  actorUserId?: number
  actorRole?: string
  action: string
  resourceType: string
  resourceId?: string
  patientId?: string
}

export interface MockDonor {
  id: string
  givenName: string
  familyName: string
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  phone: string
  lastDonatedAt?: string
  totalDonations: number
}

export interface MockBloodUnit {
  id: string
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  collectedAt: string
  expiresAt: string
  component: 'whole_blood' | 'prbc' | 'platelets' | 'plasma' | 'cryoprecipitate'
  status: 'available' | 'reserved' | 'issued' | 'expired' | 'discarded'
  donorId: string
}

export interface MockTransfusionRequest {
  id: string
  patientId: string
  encounterId: string
  bloodGroup: string
  component: string
  unitsRequested: number
  priority: 'routine' | 'urgent' | 'stat'
  requestedAt: string
  requestedByUserId: number
  status: 'pending_crossmatch' | 'crossmatched' | 'issued' | 'returned' | 'cancelled'
  unitsIssued?: string[]
}

export interface MockStore {
  id: string
  code: string
  name: string
  facilityId: string
}

export interface MockInventoryItem {
  id: string
  code: string
  display: string
  category: 'consumable' | 'equipment' | 'stationery' | 'linens' | 'other'
  unit: string
  reorderLevel: number
}

export interface MockStockLevel {
  id: string
  itemId: string
  storeId: string
  qtyOnHand: number
}

export interface MockGRNLine {
  itemId: string
  qty: number
  unitCostCents: number
  batchNo?: string
}

export interface MockGRN {
  id: string
  grnNo: string
  receivedAt: string
  receivedByUserId: number
  storeId: string
  supplierName: string
  lines: MockGRNLine[]
  totalCents: number
}

export interface MockStockTransferLine {
  itemId: string
  qty: number
}

export interface MockStockTransfer {
  id: string
  transferNo: string
  fromStoreId: string
  toStoreId: string
  status: 'pending' | 'in_transit' | 'received' | 'cancelled'
  initiatedAt: string
  lines: MockStockTransferLine[]
}

export interface MockANCRecord {
  id: string
  patientId: string
  lmp: string
  edd: string
  gravidaPara: string
  visits: Array<{
    at: string
    weeks: number
    weightKg: number
    bpSys: number
    bpDia: number
    fundalHeightCm?: number
    fetalHr?: number
    notes?: string
  }>
  riskFactors: string[]
}

export interface MockLabour {
  id: string
  patientId: string
  ancRecordId?: string
  startedAt: string
  stage: 1 | 2 | 3 | 4
  cervicalDilationCm: number
  partograph: Array<{
    at: string
    cervicalDilationCm: number
    contractionsPer10Min: number
    fetalHr: number
    bpSys: number
    bpDia: number
  }>
  attendingObUserId: number
  status: 'in_progress' | 'delivered' | 'cs_pending' | 'transferred'
}

export interface MockDelivery {
  id: string
  labourId?: string
  patientId: string
  mode: 'svd' | 'instrumental' | 'cs_elective' | 'cs_emergency'
  deliveredAt: string
  babySexAtBirth: 'male' | 'female'
  babyWeightGrams: number
  apgar1Min: number
  apgar5Min: number
  complications?: string
}
