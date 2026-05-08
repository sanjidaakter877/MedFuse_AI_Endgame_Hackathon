import type { AgentResult, FhirBundle } from "@/lib/types";

export function labTestAgent(bundle: FhirBundle): AgentResult {
  const potassium = bundle.Observation.filter((item) => item.code === "K").sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );
  const egfr = bundle.Observation.find((item) => item.code === "eGFR");
  const a1c = bundle.Observation.find((item) => item.code === "A1c");
  const latestPotassium = potassium[0];
  const isPotassiumWorsening = potassium.length > 1 && potassium[0].value > potassium[1].value;
  const abnormalLabs = [
    latestPotassium && latestPotassium.value >= 5.5
      ? `Potassium ${latestPotassium.value} ${latestPotassium.unit}`
      : null,
    egfr && egfr.value < 60 ? `eGFR ${egfr.value} ${egfr.unit}` : null,
    a1c && a1c.value >= 8 ? `A1c ${a1c.value}${a1c.unit}` : null,
  ].filter(Boolean) as string[];
  const worseningTrends = [
    isPotassiumWorsening ? "Potassium increasing" : null,
    a1c && a1c.value >= 8 ? "Diabetes marker above goal" : null,
  ].filter(Boolean) as string[];
  const severity = abnormalLabs.some((item) => item.startsWith("Potassium") || item.startsWith("eGFR"))
    ? "high"
    : abnormalLabs.length > 0
      ? "warning"
      : "good";

  return {
    agent: "Lab & Test Agent",
    status: abnormalLabs.length > 0 ? "Risk" : "Clear",
    severity,
    summary:
      abnormalLabs.length > 0
        ? `Lab concern: ${abnormalLabs.join("; ")}${worseningTrends.length ? ` with ${worseningTrends.join(", ")}.` : "."}`
        : "No abnormal lab trend detected in the mock data.",
    structured: {
      abnormalLabs,
      worseningTrends,
    },
  };
}
