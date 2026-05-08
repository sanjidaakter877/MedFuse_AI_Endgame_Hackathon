import "dotenv/config";
import { createA2aApp } from "../../shared/app-factory";

const PORT = Number(process.env["LAB_PORT"] ?? 3102);
const URL = process.env["LAB_AGENT_URL"] ?? `http://localhost:${PORT}`;
const FHIR_EXT = process.env["FHIR_EXTENSION_URI"] ?? "http://localhost:5139/schemas/a2a/v1/fhir-context";

const app = createA2aApp({
  name: "medfuse_lab_test_agent",
  description:
    "Clinical laboratory analyst — detects abnormal lab values, worsening trends, " +
    "and medication-affected lab risks from FHIR observation data.",
  url: URL,
  version: "1.0.0",
  fhirExtensionUri: FHIR_EXT,
  requireApiKey: true,
});

app.listen(PORT, () => {
  console.log(`[lab-agent] port ${PORT}`);
  console.log(`[lab-agent] card → ${URL}/.well-known/agent-card.json`);
});
