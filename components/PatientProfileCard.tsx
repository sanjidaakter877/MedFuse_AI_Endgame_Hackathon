import { calculateAge } from "@/lib/fhir/helpers";
import type { FhirBundle, MatchResult } from "@/lib/types";

type PatientProfileCardProps = {
  bundle?: FhirBundle;
  match?: MatchResult;
};

export function PatientProfileCard({ bundle, match }: PatientProfileCardProps) {
  const patient = bundle?.Patient;

  return (
    <aside className="patient-panel" aria-label="Patient profile">
      <div className="panel-heading">
        <p className="eyebrow">Patient Data</p>
        <h2>Patient Profile</h2>
      </div>

      <section className="profile-card">
        <div>
          <p className="label">Name</p>
          <strong>{patient?.name ?? "-"}</strong>
        </div>
        <div>
          <p className="label">Age</p>
          <strong>{patient ? calculateAge(patient.birthDate) : "-"}</strong>
        </div>
        <div>
          <p className="label">Match confidence</p>
          <strong>{match?.confidence ?? "Pending"}</strong>
        </div>
      </section>

      <ClinicalList title="Conditions" items={bundle?.Condition.map((item) => item.display) ?? []} />
      <ClinicalList title="Medications" items={bundle?.MedicationRequest.map((item) => item.medication) ?? []} />
      <ClinicalList
        title="Allergies"
        items={bundle?.AllergyIntolerance.map((item) => `${item.substance}: ${item.reaction}`) ?? []}
      />
    </aside>
  );
}

function ClinicalList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="clinical-list">
      <h3>{title}</h3>
      <ul>
        {items.length > 0 ? items.map((item) => <li key={item}>{item}</li>) : <li>Pending review</li>}
      </ul>
    </section>
  );
}
