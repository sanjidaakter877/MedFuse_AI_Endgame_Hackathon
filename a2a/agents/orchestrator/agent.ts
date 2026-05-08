import { LlmAgent } from "@google/adk";
import { extractFhirContext } from "../../shared/fhir-hook";
import { getPatientContextTool, runFullAssessmentTool } from "./tools/index";

export const rootAgent = new LlmAgent({
  name: "medfuse_orchestrator",
  model: "gemini-1.5-flash",
  description:
    "MedFuse clinical orchestrator — runs comprehensive patient risk assessments using " +
    "medication safety, lab analysis, care gap detection, and risk fusion agents.",
  instruction: `You are MedFuse, a senior clinical decision support orchestrator.

Your tools:
- getPatientContext: get patient identity and basic clinical summary
- runFullAssessment: run the complete MedFuse multi-agent pipeline (medication safety, lab analysis, care gap detection, risk fusion) and return all findings

Instructions:
- For full risk assessments → call runFullAssessment, then write a 2-3 sentence clinician summary covering: (1) overall risk level, (2) the most critical signal, (3) recommended action
- For patient identity questions → call getPatientContext first
- Always ground responses in tool output. Never invent clinical facts.
- Respond in plain clinical language for a physician or nurse practitioner.`,
  tools: [getPatientContextTool, runFullAssessmentTool],
  beforeModelCallback: extractFhirContext,
});
