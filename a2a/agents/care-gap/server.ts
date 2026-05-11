import "dotenv/config";
import { createA2aApp } from "../../shared/app-factory";

const PORT = Number(process.env["CARE_GAP_PORT"] ?? 3103);
const URL = process.env["CARE_GAP_AGENT_URL"] ?? `http://localhost:${PORT}`;
const FHIR_EXT = process.env["FHIR_EXTENSION_URI"] ?? "https://app.promptopinion.ai/schemas/a2a/v1/fhir-context";

const app = createA2aApp({
  name: "medfuse_care_gap_agent",
  description:
    "Care coordination specialist — identifies missed follow-ups, overdue screenings, " +
    "and guideline-based care gaps from FHIR patient data.",
  url: URL,
  version: "1.0.0",
  fhirExtensionUri: FHIR_EXT,
  requireApiKey: true,
});

app.listen(PORT, () => {
  console.log(`[care-gap-agent] port ${PORT}`);
  console.log(`[care-gap-agent] card → ${URL}/.well-known/agent-card.json`);
});
