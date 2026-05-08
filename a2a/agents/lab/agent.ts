import { LlmAgent } from "@google/adk";
import { extractFhirContext } from "../../shared/fhir-hook";
import { checkLabResultsTool } from "./tools/index";

export const rootAgent = new LlmAgent({
  name: "lab_test_agent",
  model: "gemini-2.5-flash",
  description:
    "Analyzes patient laboratory results for abnormal values, worsening trends, " +
    "and medication-related lab risks using FHIR observation data.",
  instruction:
    "You are a clinical laboratory specialist. When asked about a patient's lab results, " +
    "call the checkLabResults tool and present the findings clearly. " +
    "Highlight abnormal values, worsening trends, and any values that increase medication risk. " +
    "Do not fabricate clinical values. Be concise and actionable.",
  tools: [checkLabResultsTool],
  beforeModelCallback: extractFhirContext,
  generateContentConfig: { thinkingConfig: { thinkingBudget: 0 } },
});
