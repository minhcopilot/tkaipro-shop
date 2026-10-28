import { randomUUID } from "node:crypto";

export function createSharedEmailClient(category: "bulk" | "restock" | "transactional" = "transactional") {
  return {
    async sendTransacEmail(payload: Record<string, unknown>) {
      const url = process.env.EMAIL_GATEWAY_URL; const token = process.env.EMAIL_GATEWAY_TOKEN; const source = process.env.EMAIL_GATEWAY_SOURCE;
      if (!url || !token || !source) throw new Error("EMAIL_GATEWAY_NOT_CONFIGURED");
      const response = await fetch(url, { body: JSON.stringify({ category, payload, requestId: randomUUID() }), cache: "no-store", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-email-source": source },
        method: "POST",
        signal: AbortSignal.timeout(45_000) });
      const result = await response.json() as { error?: string; messageId?: string; status?: string; };
      // Never fall back to another provider after an ambiguous gateway result.
      if (!response.ok || result.status !== "accepted") throw new Error(result.error ?? `EMAIL_${result.status ?? response.status}`);
      return { body: { messageId: result.messageId } };
    },
  };
}
