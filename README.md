# MedFuse

MedFuse is a Next.js MVP for agentic patient risk review. The main MedFuse Agent coordinates specialist agents that match the patient, fuse FHIR-style data, detect medication and lab risk, find care gaps, summarize clinical context, and produce a final escalation summary.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Agent Flow

1. Clinician searches or selects a patient.
2. Patient Match Agent confirms identity across sources.
3. Data Fusion Agent builds a unified timeline.
4. Medication, Lab, Care Gap, and Context agents analyze their domains.
5. Risk Fusion & Escalation Agent combines findings into one decision.
6. Clinician sees risk level, issues found, and recommended next action.

## Current Data

The MVP uses mock FHIR-style resources:

- `Patient`
- `Condition`
- `MedicationRequest`
- `Observation`
- `AllergyIntolerance`
- `Encounter`
- `CarePlan`
- `Appointment`
