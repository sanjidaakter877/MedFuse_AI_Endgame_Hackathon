import { careGapAgent } from "@/lib/agents/care-gap-agent";
import { clinicalContextAgent } from "@/lib/agents/clinical-context-agent";
import { dataFusionAgent } from "@/lib/agents/data-fusion-agent";
import { labTestAgent } from "@/lib/agents/lab-test-agent";
import { medicationSafetyAgent } from "@/lib/agents/medication-safety-agent";
import { patientMatchAgent } from "@/lib/agents/patient-match-agent";
import { riskFusionAgent } from "@/lib/agents/risk-fusion-agent";
import type { FhirBundle, MedFuseRunResult } from "@/lib/types";

export async function runMedFuseAgent(bundle: FhirBundle): Promise<MedFuseRunResult> {
  const match = patientMatchAgent(bundle);
  const fusion = dataFusionAgent(bundle);
  const medication = medicationSafetyAgent(bundle);
  const lab = labTestAgent(bundle);
  const caregap = careGapAgent(bundle);
  const context = clinicalContextAgent(bundle);
  const risk = await riskFusionAgent({ match, fusion, medication, lab, caregap, context });

  return { match, fusion, medication, lab, caregap, context, risk };
}
