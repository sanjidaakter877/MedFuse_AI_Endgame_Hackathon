import type { CallbackContext, LlmRequest, LlmResponse } from "@google/adk";

/**
 * ADK beforeModelCallback that ensures FHIR credentials from the A2A message
 * metadata are available in session state before every LLM invocation.
 *
 * Credential flow:
 *   A2A message.metadata
 *     → app-factory stateDelta (camelCase + snake_case flat keys)
 *     → session state
 *     → this hook (fast path: already there; fallback: scan raw a2aMetadata)
 *     → tools read via toolContext.state.get('patientId') etc.
 */
export function extractFhirContext(params: {
  context: CallbackContext;
  request: LlmRequest;
}): LlmResponse | undefined {
  const state = params.context.state;

  // Fast path: app-factory already flattened the keys into stateDelta
  const existingPatientId = state.get<string>("patientId");
  const existingFhirUrl = state.get<string>("fhirUrl");

  if (existingPatientId || existingFhirUrl) {
    // Mirror as snake_case for any Python-authored sub-tools
    if (existingPatientId && !state.get("patient_id")) {
      state.set("patient_id", existingPatientId);
    }
    if (existingFhirUrl && !state.get("fhir_url")) {
      state.set("fhir_url", existingFhirUrl);
      const token = state.get<string>("fhirToken");
      if (token) state.set("fhir_token", token);
    }
    console.debug("[fhir-hook] fast path — FHIR context in state");
    return undefined;
  }

  // Fallback: scan the raw a2aMetadata object stored by app-factory
  const rawMetadata = state.get<Record<string, unknown>>("a2aMetadata");
  if (!rawMetadata) {
    console.debug("[fhir-hook] no FHIR context");
    return undefined;
  }

  const creds = scanForFhirCredentials(rawMetadata);
  if (creds) {
    if (creds.patientId) {
      state.set("patientId", creds.patientId);
      state.set("patient_id", creds.patientId);
    }
    if (creds.fhirUrl) {
      state.set("fhirUrl", creds.fhirUrl);
      state.set("fhir_url", creds.fhirUrl);
    }
    if (creds.fhirToken) {
      state.set("fhirToken", creds.fhirToken);
      state.set("fhir_token", creds.fhirToken);
    }
    console.debug(`[fhir-hook] fallback found patientId=${creds.patientId ?? "none"}`);
  } else {
    console.debug("[fhir-hook] metadata present but no FHIR credentials found");
  }

  return undefined;
}

interface FhirCredentials {
  patientId?: string;
  fhirUrl?: string;
  fhirToken?: string;
}

function scanForFhirCredentials(
  metadata: Record<string, unknown>
): FhirCredentials | null {
  for (const [key, value] of Object.entries(metadata)) {
    if (key.toLowerCase().includes("fhir")) {
      const obj = toObject(value);
      if (obj) {
        return {
          patientId: (obj["patientId"] ?? obj["patient_id"]) as string | undefined,
          fhirUrl: (obj["fhirUrl"] ?? obj["fhir_url"]) as string | undefined,
          fhirToken: (obj["fhirToken"] ?? obj["fhir_token"]) as string | undefined,
        };
      }
    }
  }
  return null;
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // not JSON
    }
  }
  return null;
}
