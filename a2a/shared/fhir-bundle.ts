import { selectFhirBundle } from "@/lib/data/mock-fhir";
import type { FhirBundle } from "@/lib/types";

export interface FhirContext {
  patientId?: string | null;
  patientName?: string | null;
  birthDate?: string | null;
  fhirUrl?: string | null;
  fhirToken?: string | null;
}

export async function resolveFhirBundle(ctx: FhirContext): Promise<FhirBundle> {
  if (ctx.fhirUrl && ctx.patientId) {
    try {
      const bundle = await fetchFromFhirServer(ctx.fhirUrl, ctx.patientId, ctx.fhirToken ?? undefined);
      console.log("[fhir] fetched real patient:", bundle.Patient.name);
      return bundle;
    } catch (err) {
      console.warn("[fhir] fetch failed, falling back to mock:", (err as Error).message);
    }
  }
  const fallback = selectFhirBundle({ patientId: ctx.patientId ?? undefined });
  if (!ctx.patientId || fallback.Patient.id === ctx.patientId) {
    return fallback;
  }

  return {
    Patient: {
      id: ctx.patientId,
      name: ctx.patientName ?? "Prompt Opinion patient",
      birthDate: ctx.birthDate ?? "",
      phone: "",
      address: "",
      insurance: "",
    },
    Condition: [],
    MedicationRequest: [],
    Observation: [],
    AllergyIntolerance: [],
    Encounter: [],
    CarePlan: [],
    Appointment: [],
  };
}

async function fetchFromFhirServer(fhirUrl: string, patientId: string, fhirToken?: string): Promise<FhirBundle> {
  const base = fhirUrl.replace(/\/$/, "");
  const headers: Record<string, string> = { Accept: "application/fhir+json" };
  if (fhirToken) headers["Authorization"] = `Bearer ${fhirToken}`;

  const get = async (path: string) => {
    const res = await fetch(`${base}${path}`, { headers });
    if (!res.ok) throw new Error(`FHIR ${path} → ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  };

  const [patient, conditions, medications, observations, allergies, encounters] = await Promise.all([
    get(`/Patient/${patientId}`),
    get(`/Condition?patient=${patientId}&_count=50`),
    get(`/MedicationRequest?patient=${patientId}&_count=50`),
    get(`/Observation?patient=${patientId}&_count=50`),
    get(`/AllergyIntolerance?patient=${patientId}&_count=50`),
    get(`/Encounter?patient=${patientId}&_count=50`),
  ]);

  return mapToBundle(patient, conditions, medications, observations, allergies, encounters, patientId);
}

type FhirEntry = { resource?: Record<string, unknown> };
type FhirSearchBundle = { entry?: FhirEntry[] };

function entries(bundle: Record<string, unknown>): Record<string, unknown>[] {
  return ((bundle as FhirSearchBundle).entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is Record<string, unknown> => !!r);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function patientName(p: Record<string, unknown>): string {
  const names = p["name"] as Array<Record<string, unknown>> | undefined;
  if (!names?.length) return "Unknown Patient";
  const n = names[0];
  if (n["text"]) return str(n["text"]);
  const given = (n["given"] as string[] | undefined)?.join(" ") ?? "";
  return `${given} ${str(n["family"])}`.trim();
}

function mapToBundle(
  patient: Record<string, unknown>,
  conditions: Record<string, unknown>,
  medications: Record<string, unknown>,
  observations: Record<string, unknown>,
  allergies: Record<string, unknown>,
  encounters: Record<string, unknown>,
  patientId: string
): FhirBundle {
  return {
    Patient: {
      id: patientId,
      name: patientName(patient),
      birthDate: str(patient["birthDate"]),
      phone: "",
      address: "",
      insurance: "",
    },

    Condition: entries(conditions).map((r) => {
      const code = r["code"] as Record<string, unknown> | undefined;
      const codings = (code?.["coding"] as Array<Record<string, unknown>> | undefined) ?? [];
      return {
        code: str(codings[0]?.["code"] ?? code?.["text"] ?? ""),
        display: str(code?.["text"] ?? codings[0]?.["display"] ?? "Unknown condition"),
        recordedDate: str(r["recordedDate"] ?? r["onsetDateTime"] ?? ""),
      };
    }),

    MedicationRequest: entries(medications).map((r) => {
      const med = (r["medicationCodeableConcept"] as Record<string, unknown> | undefined)
        ?? (r["medicationReference"] as Record<string, unknown> | undefined)
        ?? {};
      return {
        medication: str(med["text"] ?? med["display"] ?? "Unknown medication"),
        status: str(r["status"] ?? "unknown"),
        authoredOn: str(r["authoredOn"] ?? ""),
      };
    }),

    Observation: entries(observations)
      .filter((r) => r["valueQuantity"])
      .map((r) => {
        const code = r["code"] as Record<string, unknown> | undefined;
        const codings = (code?.["coding"] as Array<Record<string, unknown>> | undefined) ?? [];
        const vq = r["valueQuantity"] as Record<string, unknown> | undefined;
        return {
          code: str(codings[0]?.["code"] ?? ""),
          display: str(code?.["text"] ?? codings[0]?.["display"] ?? ""),
          value: Number(vq?.["value"] ?? 0),
          unit: str(vq?.["unit"] ?? ""),
          effectiveDate: str(r["effectiveDateTime"] ?? r["effectivePeriod"] ?? ""),
        };
      }),

    AllergyIntolerance: entries(allergies).map((r) => {
      const code = r["code"] as Record<string, unknown> | undefined;
      const codings = (code?.["coding"] as Array<Record<string, unknown>> | undefined) ?? [];
      const reactions = (r["reaction"] as Array<Record<string, unknown>> | undefined) ?? [];
      const manifestations = (reactions[0]?.["manifestation"] as Array<Record<string, unknown>> | undefined) ?? [];
      const mCodings = (manifestations[0]?.["coding"] as Array<Record<string, unknown>> | undefined) ?? [];
      return {
        substance: str(code?.["text"] ?? codings[0]?.["display"] ?? "Unknown"),
        reaction: str(manifestations[0]?.["text"] ?? mCodings[0]?.["display"] ?? "Reaction"),
      };
    }),

    Encounter: entries(encounters).map((r) => {
      const types = (r["type"] as Array<Record<string, unknown>> | undefined) ?? [];
      const typeCodings = (types[0]?.["coding"] as Array<Record<string, unknown>> | undefined) ?? [];
      const period = r["period"] as Record<string, unknown> | undefined;
      const notes = (r["reasonCode"] as Array<Record<string, unknown>> | undefined) ?? [];
      const noteCodings = (notes[0]?.["coding"] as Array<Record<string, unknown>> | undefined) ?? [];
      return {
        type: str(types[0]?.["text"] ?? typeCodings[0]?.["display"] ?? "Encounter"),
        date: str(period?.["start"] ?? ""),
        note: str(notes[0]?.["text"] ?? noteCodings[0]?.["display"] ?? ""),
      };
    }),

    CarePlan: [],
    Appointment: [],
  };
}
