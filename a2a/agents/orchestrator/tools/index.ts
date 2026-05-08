import { FunctionTool } from "@google/adk";
import type { ToolContext } from "@google/adk";
import { Type, type Schema } from "@google/genai";
import { runMedFuseAgent } from "@/lib/agents/medfuse-agent";
import { resolveFhirBundle } from "../../../shared/fhir-bundle";
import type { Condition, MedicationRequest, Encounter, Appointment } from "@/lib/types";

const patientIdSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    patientId: {
      type: Type.STRING,
      description: "Patient ID. Uses session FHIR context if omitted.",
    },
  },
};

// ─── getPatientContext ────────────────────────────────────────────────────────

export const getPatientContextTool = new FunctionTool({
  name: "getPatientContext",
  description:
    "Retrieves basic patient identity and clinical summary (name, conditions, medications, " +
    "recent encounters) from FHIR data to establish context before a detailed assessment.",
  parameters: patientIdSchema,
  execute: (input: unknown, toolContext?: ToolContext) => {
    const { patientId } = (input ?? {}) as { patientId?: string };
    const resolvedId =
      patientId ??
      (toolContext?.state.get("patientId") as string | undefined) ??
      (toolContext?.state.get("patient_id") as string | undefined);

    const bundle = resolveFhirBundle({ patientId: resolvedId });

    return {
      patient: bundle.Patient,
      conditions: bundle.Condition.map((c: Condition) => c.display),
      medications: bundle.MedicationRequest.map((m: MedicationRequest) => m.medication),
      recentEncounters: bundle.Encounter.map((e: Encounter) => ({
        date: e.date,
        type: e.type,
        note: e.note,
      })),
      appointments: bundle.Appointment.map((a: Appointment) => ({
        specialty: a.specialty,
        status: a.status,
        date: a.date,
      })),
    };
  },
});

// ─── runFullAssessment ────────────────────────────────────────────────────────

export const runFullAssessmentTool = new FunctionTool({
  name: "runFullAssessment",
  description:
    "Runs the complete MedFuse multi-agent assessment pipeline: patient match, data fusion, " +
    "medication safety, lab analysis, care gap detection, clinical context, and risk fusion. " +
    "Returns a comprehensive structured result with risk level, signals, and recommended action. " +
    "Use this for full clinical risk reviews.",
  parameters: patientIdSchema,
  execute: async (input: unknown, toolContext?: ToolContext) => {
    try {
      const { patientId } = (input ?? {}) as { patientId?: string };
      const resolvedId =
        patientId ??
        (toolContext?.state.get("patientId") as string | undefined) ??
        (toolContext?.state.get("patient_id") as string | undefined);

      const bundle = resolveFhirBundle({ patientId: resolvedId });
      const result = await runMedFuseAgent(bundle);

      return {
        patient: bundle.Patient.name,
        patientId: bundle.Patient.id,
        riskLevel: result.risk.riskLevel,
        recommendedAction: result.risk.recommendedAction,
        signals: {
          medication: { summary: result.medication.summary, severity: result.medication.severity },
          lab: { summary: result.lab.summary, severity: result.lab.severity },
          careGap: { summary: result.caregap.summary, severity: result.caregap.severity },
          clinicalContext: { summary: result.context.summary, severity: result.context.severity },
        },
        match: {
          confidence: result.match.confidence,
          matchedPatientId: result.match.structured.matchedPatientId,
        },
        timelineEventCount: result.fusion.structured.timelineEvents,
      };
    } catch (err) {
      console.error("[runFullAssessment] tool error:", err);
      return { error: String(err), riskLevel: "unknown", recommendedAction: "Manual clinical review required." };
    }
  },
});
