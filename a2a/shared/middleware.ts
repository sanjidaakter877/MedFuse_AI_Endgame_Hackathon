import "dotenv/config";
import type { Request, Response, NextFunction } from "express";

const VALID_KEYS = new Set<string>(
  [
    process.env["API_KEY_PRIMARY"] ?? "medfuse-dev-key-primary",
    process.env["API_KEY_SECONDARY"] ?? "",
  ].filter(Boolean)
);

/**
 * Validates X-API-Key on all routes except the agent card discovery endpoint,
 * which must always be public so Prompt Opinion can read capabilities.
 */
export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.path.includes("agent-card.json")) {
    next();
    return;
  }

  const key = req.headers["x-api-key"];
  if (!key || typeof key !== "string") {
    console.warn(`[auth] 401 missing X-API-Key — ${req.method} ${req.path}`);
    res.status(401).json({ error: "Missing X-API-Key header" });
    return;
  }

  if (!VALID_KEYS.has(key)) {
    console.warn(`[auth] 403 invalid key ${key.slice(0, 6)}... — ${req.method} ${req.path}`);
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  next();
}
