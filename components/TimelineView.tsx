import { Fragment } from "react";
import { formatDate } from "@/lib/fhir/helpers";
import type { TimelineEvent } from "@/lib/types";

const workflowSteps = ["Input", "Matching", "Data Fusion", "Agent Analysis", "Risk Fusion", "Output"];

type TimelineViewProps = {
  events: TimelineEvent[];
};

export function TimelineView({ events }: TimelineViewProps) {
  return (
    <section className="timeline-panel" aria-label="Unified timeline">
      <div className="panel-heading timeline-heading">
        <div>
          <p className="eyebrow">Clinical History</p>
          <h2>Unified Timeline</h2>
        </div>
        <div className="agent-chip">MedFuse Agent</div>
      </div>

      <section className="workflow-strip" aria-label="How MedFuse works">
        {workflowSteps.map((step, i) => (
          <Fragment key={step}>
            <div>{step}</div>
            {i < workflowSteps.length - 1 && <span className="workflow-sep" aria-hidden="true">›</span>}
          </Fragment>
        ))}
      </section>

      <div className="timeline">
        {events.length === 0 ? (
          <div className="empty-timeline">Run review to build the unified patient timeline.</div>
        ) : (
          events.map((item) => (
            <article className="timeline-item" key={`${item.date}-${item.type}-${item.detail}`}>
              <time>{formatDate(item.date)}</time>
              <div>
                <strong>{item.type}</strong>
                <p>{item.detail}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
