export const agentPrompts = {
  patientMatch: "Match patient identity using name, DOB, phone, address, and insurance/member details.",
  dataFusion: "Create a single timeline from visits, medications, labs, notes, follow-ups, and care plans.",
  medicationSafety: "Detect drug interactions, medication-condition conflicts, and medication-lab risks.",
  labTest: "Detect abnormal labs, worsening trends, and medication-affected lab risks.",
  careGap: "Detect missed follow-ups, overdue tests, screenings, and guideline-based missing care.",
  clinicalContext: "Summarize doctor notes, past conditions, current diagnosis, and contradictory care plans.",
  riskFusion: "Combine all findings into a risk level, explanation, and recommended clinical action.",
};
