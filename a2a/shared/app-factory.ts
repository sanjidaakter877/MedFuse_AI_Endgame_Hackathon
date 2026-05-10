import "dotenv/config";
import express, { type Application, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenAI } from "@google/genai";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import { agentCardHandler } from "@a2a-js/sdk/server/express";
import type { AgentCard, Message } from "@a2a-js/sdk";
import { apiKeyMiddleware } from "./middleware";
import { resolveFhirBundle } from "./fhir-bundle";
import { runMedFuseAgent } from "@/lib/agents/medfuse-agent";

export interface CreateA2aAppOptions {
  name: string;
  description: string;
  url: string;
  version?: string;
  fhirExtensionUri?: string;
  requireApiKey?: boolean;
  model?: string;
}

const SYSTEM_INSTRUCTION = `You are MedFuse, a senior clinical decision support AI.
You have just run a comprehensive multi-agent risk assessment on a patient.
Write a 2-3 sentence clinical summary for a physician covering:
1. Overall risk level
2. The most critical signal found
3. Recommended action
Be concise and clinical. Ground your response only in the assessment data provided.`;

async function runAssessment(userText: string, metadata: Record<string, unknown>, fhirExtensionUri?: string): Promise<string> {
  const fhirCtx = buildFhirContext(metadata, fhirExtensionUri);
  const hasFhirCredentials = !!(fhirCtx.fhirUrl && fhirCtx.patientId);

  if (hasFhirCredentials) {
    const bundle = await resolveFhirBundle(fhirCtx);
    const result = await runMedFuseAgent(bundle);
    const assessment = {
      patient: bundle.Patient.name,
      riskLevel: result.risk.riskLevel,
      recommendedAction: result.risk.recommendedAction,
      medicationSignal: result.medication.summary,
      labSignal: result.lab.summary,
      careGapSignal: result.caregap.summary,
      clinicalContext: result.context.summary,
    };
    return generateWithFallback(`Patient request: ${userText || "Run a full risk assessment"}\n\nMedFuse assessment results:\n${JSON.stringify(assessment, null, 2)}`);
  }

  return generateWithFallback(userText || "Run a full risk assessment for an unknown patient with no clinical data.");
}

function buildFhirContext(
  metadata: Record<string, unknown>,
  fhirExtensionUri?: string
): { patientId?: string; fhirUrl?: string; fhirToken?: string } {
  const fhirBlock = fhirExtensionUri
    ? (metadata[fhirExtensionUri] as Record<string, unknown> | undefined)
    : undefined;

  const source =
    fhirBlock ??
    (Object.entries(metadata).find(([k]) => k.toLowerCase().includes("fhir"))
      ?.[1] as Record<string, unknown> | undefined);

  if (!source || typeof source !== "object") return {};

  return {
    patientId: (source["patientId"] ?? source["patient_id"]) as string | undefined,
    fhirUrl: (source["fhirUrl"] ?? source["fhir_url"]) as string | undefined,
    fhirToken: (source["fhirToken"] ?? source["fhir_token"]) as string | undefined,
  };
}

async function generateWithFallback(prompt: string): Promise<string> {
  const geminiKey = process.env["GOOGLE_API_KEY"] ?? process.env["GOOGLE_GENAI_API_KEY"] ?? "";
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });
      const text = (res.text ?? "").trim();
      if (text) { console.log("[llm] gemini ok"); return text; }
    } catch (err) {
      console.warn("[llm] gemini failed, trying groq:", (err as Error).message?.slice(0, 120));
    }
  }

  const groqKey = process.env["GROQ_API_KEY"] ?? "";
  if (!groqKey) throw new Error("No LLM available — set GOOGLE_API_KEY or GROQ_API_KEY");
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    }),
  });
  const json = await groqRes.json() as { choices?: { message?: { content?: string } }[] };
  console.log("[llm] groq ok");
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

function extractText(parts: unknown[]): string {
  return parts
    .filter((p) => typeof (p as Record<string, unknown>)["text"] === "string")
    .map((p) => (p as { text: string }).text)
    .join("\n")
    .trim();
}

function buildAgentCard(options: Required<CreateA2aAppOptions>): AgentCard {
  return {
    name: options.name,
    description: options.description,
    url: options.url,
    version: options.version,
    protocolVersion: "0.3.0",
    preferredTransport: "JSONRPC",
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    ...({
      supportedInterfaces: [
        { url: options.url, protocolBinding: "JSONRPC", protocolVersion: "0.3.0" },
      ],
    } as object),
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
      ...(options.fhirExtensionUri
        ? {
            extensions: [
              {
                uri: options.fhirExtensionUri,
                required: false,
                description: "FHIR patient context credentials (patientId, fhirUrl, fhirToken)",
              },
            ],
          }
        : {}),
    },
    skills: [
      {
        id: options.name,
        name: options.name,
        description: options.description,
        inputModes: ["text/plain"],
        outputModes: ["text/plain"],
        examples: [],
        tags: ["healthcare", "medfuse"],
      },
    ],
    ...(options.requireApiKey
      ? {
          securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-Key" } },
          security: [{ apiKey: [] as string[] }],
        }
      : {}),
  };
}

export function createA2aApp(options: CreateA2aAppOptions): Application {
  const resolved = {
    version: "1.0.0",
    fhirExtensionUri: "",
    requireApiKey: false,
    model: "gemini-2.0-flash",
    ...options,
  };

  const agentCard = buildAgentCard(resolved);
  const taskStore = new InMemoryTaskStore();
  const requestHandler = new DefaultRequestHandler(agentCard, taskStore, {
    execute: async () => {},
    cancelTask: async () => {},
  });

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      env: {
        GOOGLE_API_KEY: !!process.env["GOOGLE_API_KEY"],
        GOOGLE_GENAI_API_KEY: !!process.env["GOOGLE_GENAI_API_KEY"],
        GROQ_API_KEY: !!process.env["GROQ_API_KEY"],
        API_KEY_PRIMARY: !!process.env["API_KEY_PRIMARY"],
      },
    });
  });

  app.use("/.well-known/agent-card.json", agentCardHandler({ agentCardProvider: requestHandler }));

  if (resolved.requireApiKey) {
    app.use(apiKeyMiddleware);
  }

  // Custom JSON-RPC handler that returns a Task (kind:"task") — required by Prompt Opinion
  app.post("/", (req: Request, res: Response) => {
    const { id, method, params } = req.body ?? {};
    const normalizedMethod = method === "SendMessage" ? "message/send" : method;

    if (normalizedMethod !== "message/send") {
      res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
      return;
    }

    const message = params?.message ?? params?.params?.message;
    const parts: unknown[] = Array.isArray(message?.parts) ? message.parts : [];
    const userText = extractText(parts);
    const metadata = (message?.metadata ?? {}) as Record<string, unknown>;

    const taskId = uuidv4();
    const contextId = message?.contextId ?? uuidv4();
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    console.log("[handler] userText:", userText.slice(0, 200));

    runAssessment(userText, metadata, resolved.fhirExtensionUri || undefined)
      .then((text) => {
        console.log("[handler] result:", text.slice(0, 200));
        const agentMessage: Message = {
          kind: "message",
          messageId,
          role: "agent",
          parts: [{ kind: "text", text: text || "(no response)" }],
          taskId,
          contextId,
        };
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            kind: "task",
            id: taskId,
            contextId,
            status: {
              state: "completed",
              message: agentMessage,
              timestamp,
            },
          },
        });
      })
      .catch((err: unknown) => {
        console.error("[handler] error:", err);
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            kind: "task",
            id: taskId,
            contextId,
            status: {
              state: "failed",
              message: {
                kind: "message",
                messageId,
                role: "agent",
                parts: [{ kind: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
                taskId,
                contextId,
              },
              timestamp,
            },
          },
        });
      });
  });

  return app;
}
