"use client";

import { useMemo, useState } from "react";
import { AgentActivityPanel } from "@/components/AgentActivityPanel";
import { PatientProfileCard } from "@/components/PatientProfileCard";
import { PatientSearch } from "@/components/PatientSearch";
import { RiskSummaryCard } from "@/components/RiskSummaryCard";
import { TimelineView } from "@/components/TimelineView";
import type { FhirBundle, MedFuseRunResult } from "@/lib/types";

type MedFuseApiResult = MedFuseRunResult & {
  bundle: FhirBundle;
};

export default function HomePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MedFuseApiResult | undefined>();
  const events = useMemo(() => result?.fusion.timeline ?? [], [result]);

  async function runReview(query: string) {
    setIsRunning(true);
    try {
      const response = await fetch("/api/medfuse/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("MedFuse workflow failed");
      }

      setResult((await response.json()) as MedFuseApiResult);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <h1>MedFuse</h1>
            <p>Agentic patient risk review</p>
          </div>
        </div>

        <PatientSearch onRun={runReview} isRunning={isRunning} />
      </header>

      <section className="dashboard" aria-label="MedFuse clinical dashboard">
        <PatientProfileCard bundle={result?.bundle} match={result?.match} />
        <TimelineView events={events} />
        <AgentActivityPanel results={result} />
      </section>

      <RiskSummaryCard risk={result?.risk} />
    </main>
  );
}
