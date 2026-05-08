import { normalizeTimeline } from "@/lib/fhir/normalize";
import type { DataFusionResult, FhirBundle } from "@/lib/types";

export function dataFusionAgent(bundle: FhirBundle): DataFusionResult {
  const timeline = normalizeTimeline(bundle);

  return {
    agent: "Data Fusion Agent",
    status: "Complete",
    severity: "good",
    summary: "Unified timeline created from visits, medications, labs, notes, care plan, and appointments.",
    timeline,
    structured: {
      sourceTypes: Object.keys(bundle),
      timelineEvents: timeline.length,
    },
  };
}
