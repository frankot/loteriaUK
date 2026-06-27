import { createHash } from "crypto";

export type CashflowsLocalStatus =
  | "INITIATED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "PROCESSING_FAILED";

export interface CashflowsCreatePaymentJobPayload {
  type: "Payment";
  amountToCollect: string;
  currency: string;
  locale: string;
  paymentMethodsToUse: string[];
  order: {
    orderNumber: string;
    billingIdentity: {
      emailAddress: string;
    };
  };
  parameters: Record<string, string>;
}

export interface CashflowsApiResult<T = unknown> {
  status: number;
  body: T;
}

const CASHFLOWS_ENDPOINTS = {
  // Cashflows' current Hosted Checkout / Gateway API examples use gateway-inta for
  // integration payment-job calls. Using gateway-int with some integration
  // Configuration IDs returns 404 "Configuration not found".
  integration: "https://gateway-inta.cashflows.com",
  production: "https://gateway.cashflows.com",
} as const;

function getCashflowsConfig() {
  const env = process.env.CASHFLOWS_ENV === "production" ? "production" : "integration";
  const configurationId = process.env.CASHFLOWS_CONFIGURATION_ID;
  const apiKey = process.env.CASHFLOWS_API_KEY;

  if (!configurationId || !apiKey) {
    throw new Error("Cashflows is not configured");
  }

  const configuredBaseUrl = process.env.CASHFLOWS_BASE_URL?.replace(/\/+$/, "");

  return {
    baseUrl: configuredBaseUrl || CASHFLOWS_ENDPOINTS[env],
    configurationId,
    apiKey,
  };
}

export function buildCashflowsHash(apiKey: string, exactRequestBodyString?: string) {
  return createHash("sha512")
    .update(`${apiKey}${exactRequestBodyString ?? ""}`)
    .digest("hex");
}

async function parseCashflowsResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function cashflowsRequest<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }) {
  const { baseUrl, configurationId, apiKey } = getCashflowsConfig();
  const method = init?.method ?? "GET";
  const bodyString = init?.body == null ? undefined : JSON.stringify(init.body);
  const hash = buildCashflowsHash(apiKey, bodyString);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ConfigurationId: configurationId,
      Hash: hash,
      "Content-Type": "application/json",
    },
    body: bodyString,
    cache: "no-store",
  });

  const body = await parseCashflowsResponse(response) as T;

  if (!response.ok) {
    console.error("Cashflows API request failed", {
      url: `${baseUrl}${path}`,
      path,
      method,
      status: response.status,
      body: JSON.stringify(body),
    });
    throw new Error(`Cashflows API request failed with status ${response.status}`);
  }

  return { status: response.status, body } satisfies CashflowsApiResult<T>;
}

export async function createCashflowsPaymentJob(payload: CashflowsCreatePaymentJobPayload) {
  const result = await cashflowsRequest("/api/gateway/payment-jobs", {
    method: "POST",
    body: payload,
  });

  if (result.status !== 201) {
    console.warn("Cashflows payment job creation returned unexpected 2xx status", {
      status: result.status,
      body: result.body,
    });
  }

  return result;
}

export async function retrieveCashflowsPayment(paymentJobReference: string, paymentReference: string) {
  return cashflowsRequest(
    `/api/gateway/payment-jobs/${encodeURIComponent(paymentJobReference)}/payments/${encodeURIComponent(paymentReference)}`,
    { method: "GET" }
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNestedRecord(root: unknown, key: string) {
  const record = asRecord(root);
  return record ? asRecord(record[key]) : null;
}

function getNestedArray(root: unknown, key: string) {
  const record = asRecord(root);
  return record && Array.isArray(record[key]) ? record[key] as unknown[] : undefined;
}

export function getCashflowsPaymentJobReference(body: unknown) {
  const root = asRecord(body);
  const data = getNestedRecord(body, "data");

  return asString(data?.reference)
    ?? asString(data?.paymentJobReference)
    ?? asString(root?.reference)
    ?? asString(root?.paymentJobReference);
}

export function getCashflowsPayments(body: unknown) {
  const data = getNestedRecord(body, "data");
  return getNestedArray(data, "payments") ?? getNestedArray(body, "payments") ?? [];
}

export function getCashflowsPaymentReference(body: unknown) {
  const root = asRecord(body);
  const data = getNestedRecord(body, "data");
  const firstPayment = asRecord(getCashflowsPayments(body)[0]);

  return asString(firstPayment?.reference)
    ?? asString(firstPayment?.paymentReference)
    ?? asString(data?.paymentReference)
    ?? asString(root?.paymentReference);
}

export function getCashflowsActionUrl(body: unknown) {
  const root = asRecord(body);
  const data = getNestedRecord(body, "data");
  const rootLinks = asRecord(root?.links);
  const dataLinks = asRecord(data?.links);
  const rootAction = asRecord(rootLinks?.action);
  const dataAction = asRecord(dataLinks?.action);

  return asString(rootAction?.url)
    ?? asString(dataAction?.url)
    ?? asString(root?.actionUrl)
    ?? asString(data?.actionUrl);
}

export function getCashflowsPaymentStatus(body: unknown) {
  const root = asRecord(body);
  const data = getNestedRecord(body, "data");
  const firstPayment = asRecord(getCashflowsPayments(body)[0]);

  return asString(data?.paymentStatus)
    ?? asString(root?.paymentStatus)
    ?? asString(firstPayment?.status)
    ?? asString(firstPayment?.paymentStatus)
    ?? asString(data?.status)
    ?? asString(root?.status);
}

export function getCashflowsAmountPence(body: unknown) {
  const root = asRecord(body);
  const data = getNestedRecord(body, "data");
  const firstPayment = asRecord(getCashflowsPayments(body)[0]);
  const value = data?.amountToCollect ?? root?.amountToCollect ?? firstPayment?.amountToCollect ?? firstPayment?.amount;

  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.round(value * 100);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed * 100);
  }

  return undefined;
}

export function getCashflowsCurrency(body: unknown) {
  const root = asRecord(body);
  const data = getNestedRecord(body, "data");
  const firstPayment = asRecord(getCashflowsPayments(body)[0]);

  return asString(data?.currency) ?? asString(root?.currency) ?? asString(firstPayment?.currency);
}

export function normalizeCashflowsStatus(status: string | undefined): CashflowsLocalStatus {
  const normalized = (status ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (["paid", "paymentpaid", "captured", "settled", "completed", "complete", "successful", "success"].includes(normalized)) {
    return "PAID";
  }

  if (["cancelled", "canceled", "void", "voided", "abandoned"].includes(normalized)) {
    return "CANCELLED";
  }

  if (["expired", "timedout", "timeout"].includes(normalized)) {
    return "EXPIRED";
  }

  if (["failed", "declined", "rejected", "refused", "error", "paymentfailed", "notauthorised", "notauthorized"].includes(normalized)) {
    return "FAILED";
  }

  return "PENDING";
}

export function toCashflowsLocale(locale: string) {
  switch (locale) {
    case "en":
      return "en_GB";
    case "pl":
    case "ro":
    case "bg":
    default:
      return "en_GB";
  }
}

export function formatPenceAsPounds(amountPence: number) {
  return (amountPence / 100).toFixed(2);
}
