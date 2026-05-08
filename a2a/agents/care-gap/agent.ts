import { LlmAgent } from "@google/adk";
import { extractFhirContext } from "../../shared/fhir-hook";
import { detectCareGapsTool } from "./tools/index";

export const rootAgent = new LlmAgent({
  name: "care_gap_agent",
  model: "gemini-2.5-flash",
  description:
    "Detects care gaps including missed follow-ups, overdue screenings, and guideline-based " +
    "missing care using FHIR care plan and appointment data.",
  instruction:
    "You are a care coordination specialist. When asked about a patient's care gaps, " +
    "call the detectCareGaps tool and present the findings. " +
    "Highlight missed follow-ups, overdue tests, and any guideline-based care the patient is missing. " +
    "Do not fabricate appointment details. Be concise and actionable.",
  tools: [detectCareGapsTool],
  beforeModelCallback: extractFhirContext,
  generateContentConfig: { thinkingConfig: { thinkingBudget: 0 } },
});
