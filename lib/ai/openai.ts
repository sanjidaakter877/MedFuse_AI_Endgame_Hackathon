type RiskSummaryInput = {
  patientName: string;
  riskLevel: string;
  signals: string[];
  recommendedAction: string;
};

export async function generateRiskExplanation(input: RiskSummaryInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      text: fallbackRiskExplanation(input),
      generatedBy: "rules" as const,
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You summarize clinical risk review outputs for clinicians. Be concise, do not invent facts, and avoid diagnosis beyond provided findings.",
        },
        {
          role: "user",
          content: `Patient: ${input.patientName}
Risk level: ${input.riskLevel}
Signals: ${input.signals.join("; ")}
Recommended action: ${input.recommendedAction}

Write one clinician-facing risk explanation in 1-2 sentences.`,
        },
      ],
      max_output_tokens: 140,
    }),
  });

  if (!response.ok) {
    return {
      text: fallbackRiskExplanation(input),
      generatedBy: "rules" as const,
    };
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  return {
    text: payload.output_text?.trim() || fallbackRiskExplanation(input),
    generatedBy: "openai" as const,
  };
}

function fallbackRiskExplanation(input: RiskSummaryInput) {
  const riskText = input.riskLevel.toLowerCase().replace(" detected", "");
  return `${input.patientName} is ${riskText} because MedFuse found ${input.signals.join(
    "; "
  )}. ${input.recommendedAction}`.replace(/\.\./g, ".");
}
