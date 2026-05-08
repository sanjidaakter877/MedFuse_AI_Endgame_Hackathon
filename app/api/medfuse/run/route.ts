import { runMedFuseAgent } from "@/lib/agents/medfuse-agent";
import { selectFhirBundle } from "@/lib/data/mock-fhir";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    patientId?: string;
  };

  const bundle = selectFhirBundle({
    patientId: body.patientId,
    query: body.query,
  });
  const result = await runMedFuseAgent(bundle);

  return Response.json({
    ...result,
    bundle,
    request: {
      query: body.query ?? "",
      patientId: body.patientId ?? bundle.Patient.id,
      handledBy: "Next.js API route backend",
    },
  });
}
