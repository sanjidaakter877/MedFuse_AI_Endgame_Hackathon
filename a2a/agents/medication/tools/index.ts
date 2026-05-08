import { FunctionTool } from "@google/adk";
import type { ToolContext } from "@google/adk";
import { Type, type Schema } from "@google/genai";
import { medicationSafetyAgent } from "@/lib/agents/medication-safety-agent";
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

export const checkMedicationSafetyTool = new FunctionTool({
  name: "checkMedicationSafety",
  description:
    "Analyzes a patient's medications, conditions, and lab values for drug interactions, " +
    "medication-condition conflicts, and medication-lab risks. Returns structured safety findings.",
  parameters: schema,
  execute: (input: unknown, toolContext?: ToolContext) => {
    const { patientId } = (input ?? {}) as { patientId?: string };
    const resolvedId =
      patientId ??
      (toolContext?.state.get("patientId") as string | undefined) ??
      (toolContext?.state.get("patient_id") as string | undefined);

    return medicationSafetyAgent(resolveFhirBundle({ patientId: resolvedId }));
  },
});
