import { mockPatients } from "@/lib/data/mock-patients";
import { scorePatientMatch } from "@/lib/scoring/match-score";
import type { FhirBundle, MatchResult } from "@/lib/types";

export function patientMatchAgent(bundle: FhirBundle): MatchResult {
  const scored = mockPatients
    .map((candidate) => ({
      patient: candidate,
      ...scorePatientMatch(bundle.Patient, candidate),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  return {
    agent: "Patient Match Agent",
    status: "Complete",
    severity: "good",
    confidence: `${Math.round(best.score * 100)}%`,
    summary: `${bundle.Patient.name} matched across EHR, pharmacy, lab, and payer records.`,
    structured: {
      matchedPatientId: best.patient.id,
      confidence: best.score,
      identifiersUsed: best.identifiersUsed,
    },
  };
}
