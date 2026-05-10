import "dotenv/config";
import { createA2aApp } from "../../shared/app-factory";

const PORT = Number(process.env["PORT"] ?? process.env["ORCHESTRATOR_PORT"] ?? 3100);
const URL = process.env["ORCHESTRATOR_URL"] ?? `http://localhost:${PORT}`;
const FHIR_EXT = process.env["FHIR_EXTENSION_URI"] ?? "http://localhost:5139/schemas/a2a/v1/fhir-context";

const app = createA2aApp({
  name: "medfuse_orchestrator",
  description:
    "MedFuse clinical orchestrator — routes requests to specialist agents (medication safety, " +
    "lab analysis, care gap detection) and synthesizes comprehensive patient risk assessments.",
  url: URL,
  version: "1.0.0",
  fhirExtensionUri: FHIR_EXT,
  requireApiKey: false,
});

app.listen(PORT, () => {
  console.log(`[orchestrator] port ${PORT}`);
  console.log(`[orchestrator] card → ${URL}/.well-known/agent-card.json`);
  console.log(`[orchestrator] A2A endpoint → POST ${URL}/  (X-API-Key required)`);
});
