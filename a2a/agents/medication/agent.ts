import { LlmAgent } from "@google/adk";
import { extractFhirContext } from "../../shared/fhir-hook";
import { checkMedicationSafetyTool } from "./tools/index";

export const rootAgent = new LlmAgent({
  name: "medication_safety_agent",
  model: "gemini-2.5-flash",
  description:
    "Analyzes patient medication lists for drug interactions, medication-condition conflicts, " +
    "and medication-lab risks using FHIR clinical data.",
  instruction:
    "You are a clinical medication safety specialist. When asked about a patient's medications, " +
    "call the checkMedicationSafety tool and summarize the findings clearly for a clinician. " +
    "Focus on drug interactions, contraindications, and lab-related medication risks. " +
    "Do not invent clinical facts. Be concise and actionable.",
  tools: [checkMedicationSafetyTool],
  beforeModelCallback: extractFhirContext,
  generateContentConfig: { thinkingConfig: { thinkingBudget: 0 } },
});
