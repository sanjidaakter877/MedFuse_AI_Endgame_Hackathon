export type Severity = "neutral" | "good" | "warning" | "high";

export type RiskLevel = "low" | "moderate" | "high" | "urgent";

export type Patient = {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  address: string;
  insurance: string;
};

export type Condition = {
  code: string;
  display: string;
  recordedDate: string;
};

export type MedicationRequest = {
  medication: string;
  status: string;
  authoredOn: string;
};

export type Observation = {
  code: string;
  display: string;
  value: number;
  unit: string;
  effectiveDate: string;
};

export type AllergyIntolerance = {
  substance: string;
  reaction: string;
};

export type Encounter = {
  type: string;
  date: string;
  note: string;
};

export type CarePlan = {
  activity: string;
  status: string;
  dueDate: string;
};

export type Appointment = {
  specialty: string;
  status: string;
  date: string;
};

export type FhirBundle = {
  Patient: Patient;
  Condition: Condition[];
  MedicationRequest: MedicationRequest[];
  Observation: Observation[];
  AllergyIntolerance: AllergyIntolerance[];
  Encounter: Encounter[];
  CarePlan: CarePlan[];
  Appointment: Appointment[];
};

export type TimelineEvent = {
  date: string;
  type: string;
  detail: string;
};

export type AgentResult<TStructured = Record<string, unknown>> = {
  agent: string;
  status: string;
  severity: Severity;
  summary: string;
  structured: TStructured;
};

export type MatchResult = AgentResult<{
  matchedPatientId: string;
  confidence: number;
  identifiersUsed: string[];
}> & {
  confidence: string;
};

export type DataFusionResult = AgentResult<{
  sourceTypes: string[];
  timelineEvents: number;
}> & {
  timeline: TimelineEvent[];
};

export type RiskFusionResult = AgentResult<{
  riskLevel: RiskLevel;
  explanation: string;
  recommendedAction: string;
  contributingAgents: string[];
  generatedBy: "openai" | "rules";
  signals: string[];
}> & {
  riskLevel: "High Risk Detected" | "Moderate Risk" | "Low Risk" | "Urgent Risk";
  recommendedAction: string;
};

export type MedFuseRunResult = {
  match: MatchResult;
  fusion: DataFusionResult;
  medication: AgentResult;
  lab: AgentResult;
  caregap: AgentResult;
  context: AgentResult;
  risk: RiskFusionResult;
};
