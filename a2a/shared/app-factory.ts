import "dotenv/config";
import express, { type Application } from "express";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenAI } from "@google/genai";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  agentCardHandler,
  jsonRpcHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";
import type { AgentCard, Message } from "@a2a-js/sdk";
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from "@a2a-js/sdk/server";
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

class DirectGeminiExecutor implements AgentExecutor {
  private readonly fhirExtensionUri?: string;

  constructor(_model: string, fhirExtensionUri?: string) {
    this.fhirExtensionUri = fhirExtensionUri;
  }

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const { userMessage, contextId } = requestContext;
    const userText = extractText(userMessage);
    console.log("[executor] userText:", userText.slice(0, 200));

    let finalText = "";

    try {
      const fhirCtx = buildFhirContext(
        (userMessage.metadata ?? {}) as Record<string, unknown>,
        this.fhirExtensionUri
      );

      const hasFhirCredentials = !!(fhirCtx.fhirUrl && fhirCtx.patientId);

      if (hasFhirCredentials) {
        // Real patient — fetch FHIR data and run full pipeline
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
        const prompt = `Patient request: ${userText || "Run a full risk assessment"}\n\nMedFuse assessment results:\n${JSON.stringify(assessment, null, 2)}`;
        finalText = await generateWithFallback(prompt);
      } else {
        // No FHIR credentials — use message text directly as clinical context
        const prompt = `${userText || "Run a full risk assessment"}`;
        finalText = await generateWithFallback(prompt);
      }
    } catch (err) {
      console.error("[executor] error:", err);
      finalText = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    console.log("[executor] finalText:", finalText.slice(0, 200));

    const reply: Message = {
      kind: "message",
      messageId: uuidv4(),
      role: "agent",
      parts: [{ kind: "text", text: finalText || "(no response)" }],
      taskId: requestContext.taskId,
      contextId,
    };

    eventBus.publish(reply);
    eventBus.finished();
  }

  async cancelTask(_taskId: string, _eventBus: ExecutionEventBus): Promise<void> {
    // no-op
  }
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
  // Try Gemini first
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

  // Fall back to Groq
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

function extractText(message: Message): string {
  return message.parts
    .filter((p) => typeof (p as unknown as Record<string, unknown>)["text"] === "string")
    .map((p) => (p as unknown as { text: string }).text)
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
    // Required by Prompt Opinion platform (A2A v1 endpoint declaration)
    ...({
      supportedInterfaces: [
        {
          url: options.url,
          protocolBinding: "JSONRPC",
          protocolVersion: "0.3.0",
        },
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
          securitySchemes: {
            apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
          },
          security: [{ apiKey: [] as string[] }],
        }
      : {}),
  };
}

/**
 * Creates a fully wired Express app implementing the A2A protocol:
 * - GET  /.well-known/agent-card.json  (always public — no auth)
 * - POST /                             (A2A JSON-RPC, optionally API-key gated)
 */
export function createA2aApp(options: CreateA2aAppOptions): Application {
  const resolved = {
    version: "1.0.0",
    fhirExtensionUri: "",
    requireApiKey: true,
    model: "gemini-2.0-flash",
    ...options,
  };

  const agentCard = buildAgentCard(resolved);
  const taskStore = new InMemoryTaskStore();
  const executor = new DirectGeminiExecutor(resolved.model, resolved.fhirExtensionUri);
  const requestHandler = new DefaultRequestHandler(agentCard, taskStore, executor);

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

  // Agent card is always public — register before any auth middleware.
  // agentCardHandler returns a Router (not a plain handler), so use app.use().
  app.use(
    "/.well-known/agent-card.json",
    agentCardHandler({ agentCardProvider: requestHandler })
  );

  if (resolved.requireApiKey) {
    app.use(apiKeyMiddleware);
  }

  app.post(
    "/",
    (req, _res, next) => {
      if (req.body?.method === "SendMessage") {
        req.body.method = "message/send";
      }
      next();
    },
    jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication })
  );

  return app;
}
