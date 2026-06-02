# 🏥 MedFuse — Agentic Clinical Risk Intelligence

> **One patient query. Every clinical risk — medications, labs, care gaps — surfaced in seconds by a team of specialized AI agents reaching instant consensus.**

Built for the **Agents Assemble Hackathon** 🏆

🚀 **Live Demo**: [medfuse.onrender.com](https://medfuse.onrender.com)

---

## ✨ What is MedFuse?

MedFuse is a **multi-agent clinical decision support system** that helps physicians instantly identify patient risk across three critical domains:

- 💊 **Medication Safety** — drug interactions, medication-condition conflicts
- 🧪 **Lab Analysis** — abnormal values, worsening trends, critical flags
- 📋 **Care Gap Detection** — missed screenings, overdue follow-ups, guideline violations

A team of specialized AI agents analyzes real **FHIR R4** patient data in parallel and the orchestrator synthesizes every signal into a single clinical narrative — in seconds.

---

## 🤖 How the Agent Pipeline Works

```
Clinician Query
        ↓
Patient Match Agent       → confirms patient identity across sources
        ↓
Data Fusion Agent         → builds unified clinical timeline
        ↓
  Medication Agent · Lab Agent · Care Gap Agent · Context Agent
        ↓
Risk Fusion & Escalation Agent  → combines all signals into one decision
        ↓
Clinical Summary (LLM narrative)
```

**Risk levels**: 🟢 Low → 🟡 Moderate → 🔴 High → 🚨 Urgent

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript |
| Backend | Next.js API Routes |
| A2A Protocol | A2A JS SDK v0.3.0, Express |
| Primary LLM | Google Gemini 2.0 Flash |
| Fallback LLM | Groq (Llama 3.3 70B) |
| Patient Data | FHIR R4 |
| Deployment | Render |
| Agent Platform | Prompt Opinion |

---


## 🧠 Agents at a Glance

| Agent | What it finds |
|---|---|
| 🔍 Patient Match | Confirms identity across EHR, pharmacy, lab, and payer records |
| 🔗 Data Fusion | Builds a unified timeline from visits, meds, labs, notes, and care plans |
| 💊 Medication Safety | Drug interactions, med-condition conflicts, lab-medication risks |
| 🧪 Lab & Test | Abnormal values, worsening trends, A1c, eGFR, electrolytes |
| 📋 Care Gap | Overdue screenings, missed follow-ups, guideline violations |
| ⚠️ Risk Fusion | Synthesizes all signals into a final escalation decision |

---

## 📦 Project Structure

```
MedFuse/
├── app/                  # Next.js pages and API routes
├── components/           # UI components
├── lib/
│   ├── agents/           # Agent logic
│   ├── data/             # Mock FHIR patient data
│   ├── fhir/             # FHIR helpers and types
│   └── scoring/          # Risk scoring functions
└── a2a/                  # A2A protocol layer (Prompt Opinion integration)
    ├── agents/           # Orchestrator + sub-agents
    └── shared/           # Shared Express app factory
```

---
