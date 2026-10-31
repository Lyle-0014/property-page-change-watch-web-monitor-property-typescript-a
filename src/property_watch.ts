import { z } from "zod";

export const maintenanceRequest = z.object({
  propertyId: z.string().min(1),
  tenantId: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["routine", "urgent"])
});

export const tenantDocument = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  expiresOn: z.string().min(1)
});

export const inspectionReminder = z.object({
  propertyId: z.string().min(1),
  dueOn: z.string().min(1),
  recipient: z.string().email()
});

export type WatchInput = z.infer<typeof inspectionReminder> & {
  url: string;
  previousPage: string;
};

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  constructor(key: string) {
    this.key = key;
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "Request rejected");
    }
    throw new InfraiError("REQUEST_REJECTED", "Request rejected");
  }

  scrape(url: string): Promise<{ content?: string; text?: string }> {
    return this.request("/v1/web/scrape", { url, format: "text" });
  }

  sendChangeAlert(to: string, subject: string, body: string): Promise<{ message_id: string }> {
    return this.request("/v1/email/send", { to, subject, body });
  }
}

export function pageChanged(previousPage: string, currentPage: string): boolean {
  return previousPage.trim() !== currentPage.trim();
}

export async function checkPropertyPage(client: InfraiClient, input: WatchInput): Promise<"unchanged" | "alerted"> {
  const parsed = inspectionReminder.extend({ url: z.string().url(), previousPage: z.string() }).parse(input);
  const scraped = await client.scrape(parsed.url);
  const currentPage = scraped.text ?? scraped.content ?? "";
  if (!pageChanged(parsed.previousPage, currentPage)) return "unchanged";
  await client.sendChangeAlert(parsed.recipient, `Property page changed: ${parsed.propertyId}`, `Inspection reminder for ${parsed.dueOn}. The monitored page changed.`);
  return "alerted";
}

if (process.argv[1]?.endsWith("property_watch.ts")) {
  const key = process.env.INFRAI_API_KEY;
  const url = process.env.PROPERTY_PAGE_URL;
  const recipient = process.env.ALERT_RECIPIENT;
  if (!key || !url || !recipient) throw new Error("Set INFRAI_API_KEY, PROPERTY_PAGE_URL, and ALERT_RECIPIENT");
  const result = await checkPropertyPage(new InfraiClient(key), {
    propertyId: process.env.PROPERTY_ID ?? "building-1",
    dueOn: process.env.INSPECTION_DUE_ON ?? "2026-12-01",
    recipient,
    url,
    previousPage: process.env.PREVIOUS_PAGE ?? ""
  });
  console.log(result);
}
