import type { FhirBundle, TimelineEvent } from "@/lib/types";

export function normalizeTimeline(bundle: FhirBundle): TimelineEvent[] {
  return [
    ...bundle.Encounter.map((item) => ({
      date: item.date,
      type: item.type,
      detail: item.note,
    })),
    ...bundle.MedicationRequest.map((item) => ({
      date: item.authoredOn,
      type: "Medication",
      detail: `${item.medication} marked ${item.status}.`,
    })),
    ...bundle.Observation.map((item) => ({
      date: item.effectiveDate,
      type: "Lab",
      detail: `${item.display}: ${item.value} ${item.unit}`,
    })),
    ...bundle.CarePlan.map((item) => ({
      date: item.dueDate,
      type: "Care plan",
      detail: `${item.activity} is ${item.status}.`,
    })),
    ...bundle.Appointment.map((item) => ({
      date: item.date,
      type: "Follow-up",
      detail: `${item.specialty} appointment ${item.status}.`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
