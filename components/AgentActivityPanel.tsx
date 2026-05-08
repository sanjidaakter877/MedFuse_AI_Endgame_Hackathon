import type { AgentResult, MedFuseRunResult } from "@/lib/types";

const agentDefinitions = [
  {
    id: "match",
    name: "Patient Match Agent",
    shortName: "Patient Match",
    detects: "Matches patient records across sources.",
  },
  {
    id: "fusion",
    name: "Data Fusion Agent",
    shortName: "Data Fusion",
    detects: "Builds unified visits, meds, labs, notes, and follow-ups timeline.",
  },
  {
    id: "medication",
    name: "Medication Safety Agent",
    shortName: "Medication Agent",
    detects: "Drug interactions, medication-condition conflicts, and medication-lab risks.",
  },
  {
    id: "lab",
    name: "Lab & Test Agent",
    shortName: "Lab Agent",
    detects: "Abnormal labs and worsening trends.",
  },
  {
    id: "caregap",
    name: "Care Gap Agent",
    shortName: "Care Gap Agent",
    detects: "Missed follow-ups, overdue tests, and guideline-based missing care.",
  },
  {
    id: "context",
    name: "Clinical Context Agent",
    shortName: "Context Agent",
    detects: "Doctor notes, past conditions, and current diagnosis.",
  },
  {
    id: "risk",
    name: "Risk Fusion & Escalation Agent",
    shortName: "Risk Agent",
    detects: "Risk level, explanation, and recommended action.",
  },
] as const;

type AgentActivityPanelProps = {
  results?: MedFuseRunResult;
};

export function AgentActivityPanel({ results }: AgentActivityPanelProps) {
  return (
    <aside className="insights-panel" aria-label="Agent insights">
      <div className="panel-heading">
        <p className="eyebrow">AI Analysis</p>
        <h2>Agent Insights</h2>
      </div>

      <div className="agent-stack">
        {agentDefinitions.map((agent) => {
          const result = results?.[agent.id] as AgentResult | undefined;

          return (
            <article className={`agent-card ${result?.severity ?? ""}`} key={agent.id}>
              <div>
                <p className="label">{agent.shortName}</p>
                <h3>{agent.name}</h3>
              </div>
              <p>{result?.summary ?? agent.detects}</p>
              <span>{result?.status ?? "Waiting"}</span>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
