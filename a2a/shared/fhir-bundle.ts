import { selectFhirBundle } from "@/lib/data/mock-fhir";
import type { FhirBundle } from "@/lib/types";

export interface FhirContext {
  patientId?: string | null;
  fhirUrl?: string | null;
  fhirToken?: string | null;
}

/**
 * Resolves a FHIR bundle from A2A session context.
 * Falls back to mock data keyed by patientId when no real FHIR server is present.
 * In production, check fhirUrl + fhirToken and fetch from the real server instead.
 */
export function resolveFhirBundle(ctx: FhirContext): FhirBundle {
  return selectFhirBundle({ patientId: ctx.patientId ?? undefined });
}
