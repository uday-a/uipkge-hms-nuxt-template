// useMockState — reactive in-memory store seeded from the static mock arrays.
//
// Pages can mutate state via useMockState().patients.push(...) and changes
// persist to localStorage so they survive navigation and page reload.
// Call resetMockState() to wipe localStorage and restore defaults.
//
// The store is a module-level singleton (initialized lazily on first call).
// Only one reactive instance exists per page lifecycle; all components share
// the same reference.

import {
  STAFF,
  PATIENTS,
  FACILITY,
  DEPARTMENTS,
  UNITS,
  BEDS,
  APPOINTMENTS,
  ENCOUNTERS,
  CLINICAL_NOTES,
  DRUGS,
  DRUG_BATCHES,
  PRESCRIPTIONS,
  DISPENSES,
  SERVICES,
  BILLS,
  BILL_LINES,
  PAYMENTS,
  LAB_CATALOG,
  LAB_ORDERS,
  LAB_SAMPLES,
  OBSERVATIONS,
  DIAGNOSTIC_REPORTS,
  IMAGING_STUDIES,
  RADIOLOGY_ORDERS,
  BED_ASSIGNMENTS,
  NURSING_ENTRIES,
  MEDICATION_ADMINISTRATIONS,
  DISCHARGE_SUMMARIES,
  SURGERY_BOOKINGS,
  PAC_ASSESSMENTS,
  SURGICAL_CHECKLISTS,
  ANESTHESIA_RECORDS,
  ICU_ADMISSIONS,
  CRITICAL_ALERTS,
  AUDIT_EVENTS,
  INVENTORY_STORES,
  INVENTORY_ITEMS,
  INVENTORY_STOCK_LEVELS,
  INVENTORY_GRNS,
  INVENTORY_TRANSFERS,
  ER_VISITS,
  ANC_RECORDS,
  LABOURS,
  DELIVERIES,
  DONORS,
  BLOOD_UNITS,
  TRANSFUSION_REQUESTS,
} from '~/mocks'

import type {
  MockUser,
  MockPatient,
  MockFacility,
  MockDepartment,
  MockUnit,
  MockBed,
  MockAppointment,
  MockEncounter,
  MockClinicalNote,
  MockDrug,
  MockDrugBatch,
  MockMedicationRequest,
  MockMedicationDispense,
  MockServiceCatalogItem,
  MockBill,
  MockBillLine,
  MockPayment,
  MockLabCatalogItem,
  MockServiceRequest,
  MockLabSample,
  MockObservation,
  MockDiagnosticReport,
  MockImagingStudy,
  MockBedAssignment,
  MockNursingEntry,
  MockMedicationAdministration,
  MockDischargeSummary,
  MockSurgeryBooking,
  MockPACAssessment,
  MockSurgicalChecklist,
  MockAnesthesiaRecord,
  MockICUAdmission,
  MockCriticalAlert,
  MockAuditEvent,
  MockStore,
  MockInventoryItem,
  MockStockLevel,
  MockGRN,
  MockStockTransfer,
  MockANCRecord,
  MockLabour,
  MockDelivery,
  MockDonor,
  MockBloodUnit,
  MockTransfusionRequest,
} from '~/mocks/types'
import type { MockERVisit } from '~/mocks/er-visits'

const STORAGE_KEY = 'hms-mock-state-v1'

interface MockState {
  staff: MockUser[]
  patients: MockPatient[]
  facility: MockFacility
  departments: MockDepartment[]
  units: MockUnit[]
  beds: MockBed[]
  appointments: MockAppointment[]
  encounters: MockEncounter[]
  clinicalNotes: MockClinicalNote[]
  drugs: MockDrug[]
  drugBatches: MockDrugBatch[]
  prescriptions: MockMedicationRequest[]
  dispenses: MockMedicationDispense[]
  services: MockServiceCatalogItem[]
  bills: MockBill[]
  billLines: MockBillLine[]
  payments: MockPayment[]
  labCatalog: MockLabCatalogItem[]
  labOrders: MockServiceRequest[]
  labSamples: MockLabSample[]
  observations: MockObservation[]
  diagnosticReports: MockDiagnosticReport[]
  imagingStudies: MockImagingStudy[]
  radiologyOrders: MockServiceRequest[]
  bedAssignments: MockBedAssignment[]
  nursingEntries: MockNursingEntry[]
  medicationAdministrations: MockMedicationAdministration[]
  dischargeSummaries: MockDischargeSummary[]
  surgeryBookings: MockSurgeryBooking[]
  pacAssessments: MockPACAssessment[]
  surgicalChecklists: MockSurgicalChecklist[]
  anesthesiaRecords: MockAnesthesiaRecord[]
  icuAdmissions: MockICUAdmission[]
  criticalAlerts: MockCriticalAlert[]
  auditEvents: MockAuditEvent[]
  inventoryStores: MockStore[]
  inventoryItems: MockInventoryItem[]
  inventoryStockLevels: MockStockLevel[]
  inventoryGRNs: MockGRN[]
  inventoryTransfers: MockStockTransfer[]
  erVisits: MockERVisit[]
  ancRecords: MockANCRecord[]
  labours: MockLabour[]
  deliveries: MockDelivery[]
  donors: MockDonor[]
  bloodUnits: MockBloodUnit[]
  transfusionRequests: MockTransfusionRequest[]
}

// Deep clone by round-tripping through JSON. Adequate for plain data objects.
function cloneInitial(): MockState {
  return JSON.parse(JSON.stringify({
    staff: STAFF,
    patients: PATIENTS,
    facility: FACILITY,
    departments: DEPARTMENTS,
    units: UNITS,
    beds: BEDS,
    appointments: APPOINTMENTS,
    encounters: ENCOUNTERS,
    clinicalNotes: CLINICAL_NOTES,
    drugs: DRUGS,
    drugBatches: DRUG_BATCHES,
    prescriptions: PRESCRIPTIONS,
    dispenses: DISPENSES,
    services: SERVICES,
    bills: BILLS,
    billLines: BILL_LINES,
    payments: PAYMENTS,
    labCatalog: LAB_CATALOG,
    labOrders: LAB_ORDERS,
    labSamples: LAB_SAMPLES,
    observations: OBSERVATIONS,
    diagnosticReports: DIAGNOSTIC_REPORTS,
    imagingStudies: IMAGING_STUDIES,
    radiologyOrders: RADIOLOGY_ORDERS,
    bedAssignments: BED_ASSIGNMENTS,
    nursingEntries: NURSING_ENTRIES,
    medicationAdministrations: MEDICATION_ADMINISTRATIONS,
    dischargeSummaries: DISCHARGE_SUMMARIES,
    surgeryBookings: SURGERY_BOOKINGS,
    pacAssessments: PAC_ASSESSMENTS,
    surgicalChecklists: SURGICAL_CHECKLISTS,
    anesthesiaRecords: ANESTHESIA_RECORDS,
    icuAdmissions: ICU_ADMISSIONS,
    criticalAlerts: CRITICAL_ALERTS,
    auditEvents: AUDIT_EVENTS,
    inventoryStores: INVENTORY_STORES,
    inventoryItems: INVENTORY_ITEMS,
    inventoryStockLevels: INVENTORY_STOCK_LEVELS,
    inventoryGRNs: INVENTORY_GRNS,
    inventoryTransfers: INVENTORY_TRANSFERS,
    erVisits: ER_VISITS,
    ancRecords: ANC_RECORDS,
    labours: LABOURS,
    deliveries: DELIVERIES,
    donors: DONORS,
    bloodUnits: BLOOD_UNITS,
    transfusionRequests: TRANSFUSION_REQUESTS,
  }))
}

// Module-level singleton — null until first call
let _state: ReturnType<typeof reactive<MockState>> | null = null
let _watchStop: (() => void) | null = null

export function useMockState(): ReturnType<typeof reactive<MockState>> {
  if (!_state) {
    const initial = cloneInitial()
    _state = reactive<MockState>(initial)

    // On the client, attempt to restore persisted state AFTER hydration.
    // Merging localStorage during setup would make the client render differ
    // from the server HTML and trigger a hydration mismatch.
    if (import.meta.client) {
      onMounted(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<MockState>
            Object.assign(_state!, parsed)
          }
        }
        catch {
          // Silently ignore corrupt localStorage data — start fresh
        }
      })

      // Persist state changes on client. Deep watch is intentional: we want
      // to capture mutations to nested arrays (e.g. .push(), item field updates).
      _watchStop = watch(
        _state,
        (v) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
          }
          catch {
            // localStorage may be full or unavailable in private mode — ignore
          }
        },
        { deep: true },
      )
    }
  }

  return _state
}

/**
 * Wipe localStorage and tear down the reactive singleton so the next call
 * to useMockState() re-seeds from the static defaults.
 *
 * Call from a dev-tools reset button or a test setup hook.
 */
export function resetMockState() {
  if (import.meta.client) {
    try {
      localStorage.removeItem(STORAGE_KEY)
    }
    catch {
      // localStorage unavailable — nothing to do
    }
  }

  // Stop the deep watcher before nulling the state to avoid Vue warnings
  if (_watchStop) {
    _watchStop()
    _watchStop = null
  }

  _state = null
}
