import type { Patient } from "@/lib/types";

export function scorePatientMatch(source: Patient, candidate: Patient) {
  let score = 0;
  const identifiersUsed: string[] = [];

  if (source.name.toLowerCase() === candidate.name.toLowerCase()) {
    score += 0.24;
    identifiersUsed.push("name");
  }

  if (source.birthDate === candidate.birthDate) {
    score += 0.24;
    identifiersUsed.push("DOB");
  }

  if (source.phone === candidate.phone) {
    score += 0.18;
    identifiersUsed.push("phone");
  }

  if (normalizeAddress(source.address) === normalizeAddress(candidate.address)) {
    score += 0.16;
    identifiersUsed.push("address");
  }

  if (source.insurance === candidate.insurance) {
    score += 0.18;
    identifiersUsed.push("insurance");
  }

  return {
    score: Math.min(score, 0.96),
    identifiersUsed,
  };
}

function normalizeAddress(value: string) {
  return value.toLowerCase().replace(/\bstreet\b/g, "st").replace(/\bwest\b/g, "w").replace(/[^a-z0-9]/g, "");
}
