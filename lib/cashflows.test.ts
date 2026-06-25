import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "crypto";
import {
  buildCashflowsHash,
  formatPenceAsPounds,
  getCashflowsActionUrl,
  getCashflowsPaymentJobReference,
  getCashflowsPaymentReference,
  getCashflowsPaymentStatus,
  normalizeCashflowsStatus,
  toCashflowsLocale,
} from "./cashflows";

test("Cashflows POST hash uses exact request body string", () => {
  const apiKey = "secret";
  const body = JSON.stringify({ amountToCollect: "12.00", currency: "GBP" });
  assert.equal(buildCashflowsHash(apiKey, body), createHash("sha512").update(`${apiKey}${body}`).digest("hex"));
});

test("Cashflows GET hash uses API key only", () => {
  const apiKey = "secret";
  assert.equal(buildCashflowsHash(apiKey), createHash("sha512").update(apiKey).digest("hex"));
});

test("amount formatting uses pounds with two decimals", () => {
  assert.equal(formatPenceAsPounds(1200), "12.00");
  assert.equal(formatPenceAsPounds(199), "1.99");
});

test("unsupported locales fall back to en_GB", () => {
  assert.equal(toCashflowsLocale("en"), "en_GB");
  assert.equal(toCashflowsLocale("pl"), "en_GB");
  assert.equal(toCashflowsLocale("ro"), "en_GB");
  assert.equal(toCashflowsLocale("bg"), "en_GB");
  assert.equal(toCashflowsLocale("fr"), "en_GB");
});

test("Cashflows status mapping", () => {
  assert.equal(normalizeCashflowsStatus("Paid"), "PAID");
  assert.equal(normalizeCashflowsStatus("Pending"), "PENDING");
  assert.equal(normalizeCashflowsStatus("Reserved"), "PENDING");
  assert.equal(normalizeCashflowsStatus("Commissioned"), "PENDING");
  assert.equal(normalizeCashflowsStatus("Failed"), "FAILED");
  assert.equal(normalizeCashflowsStatus("Declined"), "FAILED");
  assert.equal(normalizeCashflowsStatus("Cancelled"), "CANCELLED");
  assert.equal(normalizeCashflowsStatus("Expired"), "EXPIRED");
});

test("Cashflows create response helpers extract canonical fields", () => {
  const body = {
    data: {
      reference: "job_123",
      payments: [{ reference: "pay_123", status: "Pending" }],
    },
    links: {
      action: { url: "https://gateway-int.cashflows.com/checkout/job_123" },
    },
  };

  assert.equal(getCashflowsPaymentJobReference(body), "job_123");
  assert.equal(getCashflowsPaymentReference(body), "pay_123");
  assert.equal(getCashflowsActionUrl(body), "https://gateway-int.cashflows.com/checkout/job_123");
  assert.equal(getCashflowsPaymentStatus(body), "Pending");
});
