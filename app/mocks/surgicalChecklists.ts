import type { MockSurgicalChecklist } from './types'
import { todayAt, daysAgoAt } from './today'

// 3 WHO 3-phase surgical safety checklists
export const SURGICAL_CHECKLISTS: MockSurgicalChecklist[] = [
  // surg-001 — tonsillectomy today (sign-in + time-out done, sign-out pending)
  {
    id: 'sc-001',
    surgeryBookingId: 'surg-001',
    patientId: 'pt-008',
    completedByUserId: 104, // Karen Walsh (scrub nurse)
    signInCompletedAt: todayAt(9, 10),
    signInItems: {
      patientIdentityConfirmed: true,
      siteMarked: true,
      consentVerified: true,
      anaesthesiaChecked: true,
      pulseOximeter: true,
      knownAllergies: true,
      difficultAirway: false,
      bloodLossRisk: false,
    },
    timeOutCompletedAt: todayAt(9, 13),
    timeOutItems: {
      introductionsDone: true,
      patientNameSiteConfirmed: true,
      antibioticProphylaxis: true,
      criticalStepsDiscussed: true,
      essentialImagingDisplayed: false,
      sterility: true,
    },
    signOutCompletedAt: undefined,
    signOutItems: undefined,
    status: 'timeout_done',
  },
  // surg-003 — PCI completed 5 days ago (all 3 phases complete)
  {
    id: 'sc-002',
    surgeryBookingId: 'surg-003',
    patientId: 'pt-010',
    completedByUserId: 106, // Amelia Pierce
    signInCompletedAt: daysAgoAt(5, 13, 10),
    signInItems: {
      patientIdentityConfirmed: true,
      siteMarked: false, // interventional — no site marking needed
      consentVerified: true,
      anaesthesiaChecked: true,
      pulseOximeter: true,
      knownAllergies: true,
      difficultAirway: false,
      bloodLossRisk: true,
    },
    timeOutCompletedAt: daysAgoAt(5, 13, 17),
    timeOutItems: {
      introductionsDone: true,
      patientNameSiteConfirmed: true,
      antibioticProphylaxis: true,
      criticalStepsDiscussed: true,
      essentialImagingDisplayed: true,
      sterility: true,
    },
    signOutCompletedAt: daysAgoAt(5, 15, 5),
    signOutItems: {
      procedureNameRecorded: true,
      specimenLabelled: false, // no specimen
      equipmentAccountedFor: true,
      anyEquipmentConcerns: false,
      recoveryHandover: true,
    },
    status: 'completed',
  },
  // surg-006 — laparoscopic appendicectomy yesterday (all phases complete)
  {
    id: 'sc-003',
    surgeryBookingId: 'surg-006',
    patientId: 'pt-011',
    completedByUserId: 104,
    signInCompletedAt: daysAgoAt(1, 11, 5),
    signInItems: {
      patientIdentityConfirmed: true,
      siteMarked: true,
      consentVerified: true,
      anaesthesiaChecked: true,
      pulseOximeter: true,
      knownAllergies: true,
      difficultAirway: false,
      bloodLossRisk: false,
    },
    timeOutCompletedAt: daysAgoAt(1, 11, 8),
    timeOutItems: {
      introductionsDone: true,
      patientNameSiteConfirmed: true,
      antibioticProphylaxis: true,
      criticalStepsDiscussed: true,
      essentialImagingDisplayed: true,
      sterility: true,
    },
    signOutCompletedAt: daysAgoAt(1, 12, 28),
    signOutItems: {
      procedureNameRecorded: true,
      specimenLabelled: true, // appendix sent to pathology
      equipmentAccountedFor: true,
      anyEquipmentConcerns: false,
      recoveryHandover: true,
    },
    status: 'completed',
  },
]

export const checklistById = (id: string) => SURGICAL_CHECKLISTS.find(c => c.id === id)
export const checklistForSurgery = (surgeryBookingId: string) =>
  SURGICAL_CHECKLISTS.find(c => c.surgeryBookingId === surgeryBookingId)
