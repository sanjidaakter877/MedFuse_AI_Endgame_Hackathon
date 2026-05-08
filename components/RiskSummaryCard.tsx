import type { RiskFusionResult } from "@/lib/types";

type RiskSummaryCardProps = {
  risk?: RiskFusionResult;
};

export function RiskSummaryCard({ risk }: RiskSummaryCardProps) {
  const issues = risk?.structured.signals ?? ["Medication risk", "Lab trend", "Care gap"];

  return (
    <section className="final-alert" aria-label="Final alert">
      <div>
        <p className="eyebrow">Risk Assessment</p>
        <h2>{risk?.riskLevel ?? "Ready for Review"}</h2>
        <p>{risk?.summary ?? "Search or select a patient to run the MedFuse agent workflow."}</p>
      </div>

      <div className="alert-issues">
        {issues.slice(0, 3).map((issue) => (
          <span key={issue}>{issue}</span>
        ))}
      </div>

      <div className="recommended-action">
        <p className="label">Recommended action</p>
        <strong>{risk?.recommendedAction ?? "Pending"}</strong>
      </div>
    </section>
  );
}
