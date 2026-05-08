import "dotenv/config";
import { createA2aApp } from "../../shared/app-factory";

const PORT = Number(process.env["MEDICATION_PORT"] ?? 3101);
const URL = process.env["MEDICATION_AGENT_URL"] ?? `http://localhost:${PORT}`;
const FHIR_EXT = process.env["FHIR_EXTENSION_URI"] ?? "http://localhost:5139/schemas/a2a/v1/fhir-context";

const app = createA2aApp({
  name: "medfuse_medication_safety_agent",
  description:
    "Clinical medication safety specialist — analyzes drug interactions, " +
    "medication-condition conflicts, and medication-lab risks from FHIR patient data.",
  url: URL,
  version: "1.0.0",
  fhirExtensionUri: FHIR_EXT,
  requireApiKey: true,
});

app.listen(PORT, () => {
  console.log(`[medication-agent] port ${PORT}`);
  console.log(`[medication-agent] card → ${URL}/.well-known/agent-card.json`);
});
