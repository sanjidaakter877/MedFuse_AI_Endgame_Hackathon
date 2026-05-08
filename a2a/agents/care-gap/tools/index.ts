import { FunctionTool } from "@google/adk";
import type { ToolContext } from "@google/adk";
import { Type, type Schema } from "@google/genai";
import { careGapAgent } from "@/lib/agents/care-gap-agent";
import { resolveFhirBundle } from "../../../shared/fhir-bundle";

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    patientId: {
      type: Type.STRING,
      description: "Patient ID to analyze. Uses session FHIR context if omitted.",
    },
  },
};

export const detectCareGapsTool = new FunctionTool({
  name: "detectCareGaps",
  description:
    "Detects missed follow-ups, overdue tests, screenings, and guideline-based care gaps " +
    "for a patient using their FHIR care plan and appointment data.",
  parameters: schema,
  execute: (input: unknown, toolContext?: ToolContext) => {
    const { patientId } = (input ?? {}) as { patientId?: string };
    const resolvedId =
      patientId ??
      (toolContext?.state.get("patientId") as string | undefined) ??
      (toolContext?.state.get("patient_id") as string | undefined);

    return careGapAgent(resolveFhirBundle({ patientId: resolvedId }));
  },
});
