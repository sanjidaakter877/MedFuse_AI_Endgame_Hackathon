import type { AgentResult, FhirBundle } from "@/lib/types";

export function clinicalContextAgent(bundle: FhirBundle): AgentResult {
  const conditions = bundle.Condition.map((item) => item.display).join(", ");
  const cardiology = bundle.Encounter.find((item) => item.type.includes("Cardiology"));
  const contextSummary = conditions || "No active conditions documented";

  return {
    agent: "Clinical Context Agent",
    status: "Complete",
    severity: conditions ? "good" : "neutral",
    summary: cardiology
      ? `Current context: ${contextSummary}. Cardiology recently changed medication plan.`
      : `Current context: ${contextSummary}. No conflicting specialist plan found in available notes.`,
    structured: {
      doctorNotes: bundle.Encounter.map((item) => item.note),
      currentDiagnosis: bundle.Condition[0]?.display ?? "None documented",
      recentSpecialistChange: cardiology?.note,
    },
  };
}
