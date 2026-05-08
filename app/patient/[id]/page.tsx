import { AgentActivityPanel } from "@/components/AgentActivityPanel";
import { PatientProfileCard } from "@/components/PatientProfileCard";
import { RiskSummaryCard } from "@/components/RiskSummaryCard";
import { TimelineView } from "@/components/TimelineView";
import { runMedFuseAgent } from "@/lib/agents/medfuse-agent";
import { getFhirBundleByPatient } from "@/lib/data/mock-fhir";

type PatientRiskPageProps = {
  params: {
    id: string;
  };
};

export default async function PatientRiskPage({ params }: PatientRiskPageProps) {
  const bundle = getFhirBundleByPatient(params.id);
  const result = await runMedFuseAgent(bundle);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <h1>MedFuse</h1>
            <p>Patient risk view</p>
          </div>
        </div>
        <div className="agent-chip">Patient {params.id}</div>
      </header>

      <section className="dashboard" aria-label="MedFuse patient risk dashboard">
        <PatientProfileCard bundle={bundle} match={result.match} />
        <TimelineView events={result.fusion.timeline} />
        <AgentActivityPanel results={result} />
      </section>

      <RiskSummaryCard risk={result.risk} />
    </main>
  );
}
