import type { AgentResult, FhirBundle } from "@/lib/types";

export function clinicalContextAgent(bundle: FhirBundle): AgentResult {
  const conditions = bundle.Condition.map((item) => item.display).join(", ");
  const cardiology = bundle.Encounter.find((item) => item.type.includes("Cardiology"));

  return {
    agent: "Clinical Context Agent",
    status: "Complete",
    severity: "good",
    summary: cardiology
      ? `Current context: ${conditions}. Cardiology recently changed medication plan.`
      : `Current context: ${conditions}. No conflicting specialist plan found in mock notes.`,
    structured: {
      doctorNotes: bundle.Encounter.map((item) => item.note),
      currentDiagnosis: bundle.Condition[0].display,
      recentSpecialistChange: cardiology?.note,
    },
  };
}
