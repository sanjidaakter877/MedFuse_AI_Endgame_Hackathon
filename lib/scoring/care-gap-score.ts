import type { FhirBundle } from "@/lib/types";

export function scoreCareGaps(bundle: FhirBundle) {
  const missedFollowUps = bundle.Appointment.filter((item) => item.status === "missed");
  const missingCare = bundle.CarePlan.filter((item) => item.status === "overdue");
  const latestA1c = bundle.Observation.find((item) => item.code === "A1c");
  const overdueTests =
    bundle.Condition.some((item) => item.code === "T2D") && (!latestA1c || latestA1c.effectiveDate < "2026-01-01")
      ? ["A1c monitoring overdue"]
      : [];

  return {
    missedFollowUps,
    overdueTests,
    missingCare,
    score: missedFollowUps.length + missingCare.length + overdueTests.length,
  };
}
