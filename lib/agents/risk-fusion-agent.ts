import { generateRiskExplanation } from "@/lib/ai/openai";
import { calculateRiskLevel } from "@/lib/scoring/risk-score";
import type { MedFuseRunResult, RiskFusionResult } from "@/lib/types";

export async function riskFusionAgent(results: Omit<MedFuseRunResult, "risk">): Promise<RiskFusionResult> {
  const riskLevel = calculateRiskLevel(results);
  const signals = buildSignals(results);
  const label = riskLabel(riskLevel);
  const recommendedAction = actionForRisk(riskLevel);
  const explanation = await generateRiskExplanation({
    patientName: patientNameFromMatch(results.match.summary),
    riskLevel: label,
    signals,
    recommendedAction,
  });

  return {
    agent: "Risk Fusion & Escalation Agent",
    status: riskLevel === "low" ? "Low Risk" : "Review",
    severity: riskLevel === "high" || riskLevel === "urgent" ? "high" : riskLevel === "moderate" ? "warning" : "good",
    riskLevel: label,
    summary: explanation.text,
    recommendedAction,
    structured: {
      riskLevel,
      explanation: explanation.text,
      recommendedAction,
      contributingAgents: Object.values(results).map((result) => result.agent),
      generatedBy: explanation.generatedBy,
      signals,
    },
  };
}

function buildSignals(results: Omit<MedFuseRunResult, "risk">) {
  const signals = [results.medication, results.lab, results.caregap, results.context]
    .filter((result) => result.severity !== "good")
    .map((result) => `${result.agent}: ${result.summary}`);

  return signals.length > 0 ? signals : ["No high-priority medication, lab, care-gap, or context risk found"];
}

function riskLabel(riskLevel: "low" | "moderate" | "high" | "urgent") {
  if (riskLevel === "urgent") return "Urgent Risk";
  if (riskLevel === "high") return "High Risk Detected";
  if (riskLevel === "moderate") return "Moderate Risk";
  return "Low Risk";
}

function actionForRisk(riskLevel: "low" | "moderate" | "high" | "urgent") {
  if (riskLevel === "urgent") return "Immediate provider escalation recommended.";
  if (riskLevel === "high") return "Provider review recommended today.";
  if (riskLevel === "moderate") return "Schedule follow-up and review care plan.";
  return "Continue routine monitoring.";
}

function patientNameFromMatch(summary: string) {
  return summary.split(" matched ")[0] || "Patient";
}
