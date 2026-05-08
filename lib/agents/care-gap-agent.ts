import { scoreCareGaps } from "@/lib/scoring/care-gap-score";
import type { AgentResult, FhirBundle } from "@/lib/types";

export function careGapAgent(bundle: FhirBundle): AgentResult {
  const gaps = scoreCareGaps(bundle);
  const overdue = gaps.missingCare[0];
  const missed = gaps.missedFollowUps[0];

  return {
    agent: "Care Gap Agent",
    status: gaps.score > 0 ? "Gap" : "Clear",
    severity: gaps.score > 0 ? "warning" : "good",
    summary: buildCareGapSummary({
      missed: missed?.specialty,
      overdue: overdue?.activity,
      overdueTests: gaps.overdueTests,
    }),
    structured: {
      missedFollowUps: gaps.missedFollowUps,
      overdueTests: gaps.overdueTests,
      missingCare: gaps.missingCare,
    },
  };
}

function buildCareGapSummary(input: { missed?: string; overdue?: string; overdueTests: string[] }) {
  const findings = [
    input.overdue ? `${input.overdue} overdue` : null,
    input.missed ? `${input.missed} follow-up was missed` : null,
    ...input.overdueTests,
  ].filter(Boolean);

  return findings.length > 0 ? findings.join("; ") + "." : "No priority care gap detected.";
}
