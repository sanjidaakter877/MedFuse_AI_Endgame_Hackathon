import type { FhirBundle } from "@/lib/types";

export const mockFhirBundles: FhirBundle[] = [
  {
    Patient: {
      id: "patient-001",
      name: "Maya Hernandez",
      birthDate: "1962-08-14",
      phone: "(312) 555-0148",
      address: "2148 W Erie St, Chicago, IL",
      insurance: "HF-884201",
    },
    Condition: [
      { code: "CKD", display: "Chronic kidney disease stage 3", recordedDate: "2025-09-18" },
      { code: "T2D", display: "Type 2 diabetes mellitus", recordedDate: "2021-03-02" },
      { code: "HTN", display: "Hypertension", recordedDate: "2020-11-14" },
    ],
    MedicationRequest: [
      { medication: "Lisinopril 20 mg", status: "active", authoredOn: "2026-03-18" },
      { medication: "Spironolactone 25 mg", status: "active", authoredOn: "2026-04-12" },
      { medication: "Metformin ER 500 mg", status: "active", authoredOn: "2025-12-02" },
    ],
    Observation: [
      { code: "K", display: "Potassium", value: 5.8, unit: "mmol/L", effectiveDate: "2026-04-28" },
      { code: "K", display: "Potassium", value: 5.3, unit: "mmol/L", effectiveDate: "2026-03-18" },
      { code: "eGFR", display: "eGFR", value: 38, unit: "mL/min", effectiveDate: "2026-04-28" },
      { code: "A1c", display: "Hemoglobin A1c", value: 8.2, unit: "%", effectiveDate: "2025-11-10" },
    ],
    AllergyIntolerance: [{ substance: "Sulfonamide antibiotics", reaction: "Rash" }],
    Encounter: [
      { type: "Primary care visit", date: "2026-03-18", note: "CKD monitoring discussed." },
      { type: "Cardiology visit", date: "2026-04-12", note: "Spironolactone started for resistant hypertension." },
    ],
    CarePlan: [{ activity: "Nephrology follow-up", status: "overdue", dueDate: "2026-04-20" }],
    Appointment: [{ specialty: "Nephrology", status: "missed", date: "2026-04-22" }],
  },
  {
    Patient: {
      id: "patient-002",
      name: "Jordan Lee",
      birthDate: "1974-02-07",
      phone: "(415) 555-0182",
      address: "82 Valencia St, San Francisco, CA",
      insurance: "CA-220144",
    },
    Condition: [
      { code: "T2D", display: "Type 2 diabetes mellitus", recordedDate: "2023-05-16" },
      { code: "HLD", display: "Hyperlipidemia", recordedDate: "2024-01-22" },
    ],
    MedicationRequest: [
      { medication: "Metformin ER 1000 mg", status: "active", authoredOn: "2026-01-15" },
      { medication: "Atorvastatin 20 mg", status: "active", authoredOn: "2026-02-11" },
    ],
    Observation: [
      { code: "A1c", display: "Hemoglobin A1c", value: 8.7, unit: "%", effectiveDate: "2026-04-10" },
      { code: "A1c", display: "Hemoglobin A1c", value: 7.8, unit: "%", effectiveDate: "2025-10-18" },
      { code: "LDL", display: "LDL cholesterol", value: 132, unit: "mg/dL", effectiveDate: "2026-04-10" },
      { code: "K", display: "Potassium", value: 4.5, unit: "mmol/L", effectiveDate: "2026-04-10" },
    ],
    AllergyIntolerance: [],
    Encounter: [
      { type: "Primary care visit", date: "2026-02-11", note: "Diabetes control above goal; medication adherence reviewed." },
    ],
    CarePlan: [{ activity: "Diabetes nutrition follow-up", status: "overdue", dueDate: "2026-04-15" }],
    Appointment: [{ specialty: "Endocrinology", status: "scheduled", date: "2026-05-14" }],
  },
  {
    Patient: {
      id: "patient-003",
      name: "Avery Chen",
      birthDate: "1988-11-29",
      phone: "(206) 555-0120",
      address: "540 Pine St, Seattle, WA",
      insurance: "NW-771905",
    },
    Condition: [{ code: "ASTHMA", display: "Mild intermittent asthma", recordedDate: "2022-08-03" }],
    MedicationRequest: [
      { medication: "Albuterol inhaler", status: "active", authoredOn: "2026-03-05" },
      { medication: "Cetirizine 10 mg", status: "active", authoredOn: "2026-03-05" },
    ],
    Observation: [
      { code: "K", display: "Potassium", value: 4.2, unit: "mmol/L", effectiveDate: "2026-04-18" },
      { code: "eGFR", display: "eGFR", value: 102, unit: "mL/min", effectiveDate: "2026-04-18" },
      { code: "FEV1", display: "FEV1 predicted", value: 91, unit: "%", effectiveDate: "2026-04-18" },
    ],
    AllergyIntolerance: [{ substance: "Peanuts", reaction: "Hives" }],
    Encounter: [{ type: "Wellness visit", date: "2026-04-18", note: "Asthma stable; rescue inhaler use rare." }],
    CarePlan: [{ activity: "Annual wellness visit", status: "active", dueDate: "2027-04-18" }],
    Appointment: [{ specialty: "Primary care", status: "scheduled", date: "2027-04-18" }],
  },
];

export const mockFhirBundle = mockFhirBundles[0];

export function getFhirBundleByPatient(patientId?: string) {
  return mockFhirBundles.find((bundle) => bundle.Patient.id === patientId) ?? mockFhirBundle;
}

export function searchFhirBundles(query?: string) {
  const normalized = query?.trim().toLowerCase();

  if (!normalized) {
    return mockFhirBundles;
  }

  const matches = mockFhirBundles.filter((bundle) => {
    const patient = bundle.Patient;
    return [patient.id, patient.name, patient.birthDate, patient.phone, patient.address, patient.insurance].some(
      (value) => value.toLowerCase().includes(normalized)
    );
  });

  return matches.length > 0 ? matches : mockFhirBundles;
}

export function selectFhirBundle(input: { patientId?: string; query?: string }) {
  if (input.patientId) {
    return getFhirBundleByPatient(input.patientId);
  }

  return searchFhirBundles(input.query)[0];
}
