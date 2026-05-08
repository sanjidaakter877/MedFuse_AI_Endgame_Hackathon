import { FunctionTool } from "@google/adk";
import type { ToolContext } from "@google/adk";
import { Type, type Schema } from "@google/genai";
import { labTestAgent } from "@/lib/agents/lab-test-agent";
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

export const checkLabResultsTool = new FunctionTool({
  name: "checkLabResults",
  description:
    "Analyzes a patient's laboratory observations for abnormal values, worsening trends, " +
    "and medication-affected lab risks. Returns structured lab findings.",
  parameters: schema,
  execute: (input: unknown, toolContext?: ToolContext) => {
    const { patientId } = (input ?? {}) as { patientId?: string };
    const resolvedId =
      patientId ??
      (toolContext?.state.get("patientId") as string | undefined) ??
      (toolContext?.state.get("patient_id") as string | undefined);

    return labTestAgent(resolveFhirBundle({ patientId: resolvedId }));
  },
});
