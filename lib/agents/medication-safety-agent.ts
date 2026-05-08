import type { AgentResult, FhirBundle } from "@/lib/types";

export function medicationSafetyAgent(bundle: FhirBundle): AgentResult {
  const meds = bundle.MedicationRequest.map((item) => item.medication.toLowerCase());
  const hasCkd = bundle.Condition.some((item) => item.code === "CKD");
  const latestPotassium = bundle.Observation.find((item) => item.code === "K");
  const hasPotassiumRisk =
    meds.some((med) => med.includes("lisinopril")) &&
    meds.some((med) => med.includes("spironolactone")) &&
    hasCkd &&
    Boolean(latestPotassium && latestPotassium.value >= 5.5);

  return {
    agent: "Medication Safety Agent",
    status: hasPotassiumRisk ? "Risk" : "Clear",
    severity: hasPotassiumRisk ? "high" : "good",
    summary: hasPotassiumRisk
      ? "Medication conflict: lisinopril plus spironolactone may worsen elevated potassium in CKD."
      : "No high-priority medication safety issue detected.",
    structured: {
      drugInteraction: "ACE inhibitor + potassium-sparing diuretic",
      conditionConflict: hasCkd ? "CKD increases hyperkalemia risk" : null,
      labRisk: latestPotassium && latestPotassium.value >= 5.5 ? "Potassium elevated" : null,
    },
  };
}
