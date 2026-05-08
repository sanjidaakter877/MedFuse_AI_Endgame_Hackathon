import type { MedFuseRunResult, RiskLevel } from "@/lib/types";

export function calculateRiskLevel(results: Omit<MedFuseRunResult, "risk">): RiskLevel {
  const highSignals = [results.medication, results.lab].filter((result) => result.severity === "high").length;
  const warningSignals = [results.medication, results.lab, results.caregap, results.context].filter(
    (result) => result.severity === "warning"
  ).length;

  if (highSignals >= 2) return "urgent";
  if (highSignals >= 1 || warningSignals >= 2) return "high";
  if (warningSignals >= 1) return "moderate";
  return "low";
}
