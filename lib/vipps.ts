import { getBaseUrl } from "@/lib/url";

/**
 * Tynn klient mot Vipps MobilePay sitt ePayment API.
 *
 * Så lenge VIPPS_CLIENT_ID / VIPPS_CLIENT_SECRET / VIPPS_SUBSCRIPTION_KEY /
 * VIPPS_MERCHANT_SERIAL_NUMBER ikke er satt, brukes en innebygd "test-Vipps"
 * (se app/betaling/mock) slik at hele booking- og betalingsflyten kan testes
 * uten en ekte Vipps-avtale. Så snart nøklene legges inn i miljøvariablene,
 * brukes automatisk det ekte API-et (test- eller produksjonsmiljø styrt av
 * VIPPS_ENVIRONMENT).
 *
 * Referanse: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 */

export type PaymentState =
  | "CREATED"
  | "AUTHORIZED"
  | "CANCELLED"
  | "EXPIRED"
  | "TERMINATED"
  | "UNKNOWN";

export function isVippsConfigured(): boolean {
  return Boolean(
    process.env.VIPPS_CLIENT_ID &&
      process.env.VIPPS_CLIENT_SECRET &&
      process.env.VIPPS_SUBSCRIPTION_KEY &&
      process.env.VIPPS_MERCHANT_SERIAL_NUMBER
  );
}

function vippsBaseUrl(): string {
  return process.env.VIPPS_ENVIRONMENT === "production"
    ? "https://api.vipps.no"
    : "https://apitest.vipps.no";
}

function commonHeaders(extra: Record<string, string> = {}) {
  return {
    "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
    "Merchant-Serial-Number": process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
    "Vipps-System-Name": "borettslag-parkering",
    "Vipps-System-Version": "1.0.0",
    ...extra,
  };
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${vippsBaseUrl()}/accesstoken/get`, {
    method: "POST",
    headers: commonHeaders({
      client_id: process.env.VIPPS_CLIENT_ID!,
      client_secret: process.env.VIPPS_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) {
    throw new Error(`Klarte ikke hente Vipps-token (${res.status})`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export async function createPayment(input: {
  reference: string;
  amountKr: number;
  description: string;
}): Promise<{ redirectUrl: string }> {
  if (!isVippsConfigured()) {
    // Test-modus: send brukeren til vår egen simulerte Vipps-side.
    return { redirectUrl: `/betaling/mock/${input.reference}` };
  }

  const token = await getAccessToken();
  const returnUrl = `${getBaseUrl()}/betaling/retur?ref=${input.reference}`;

  const res = await fetch(`${vippsBaseUrl()}/epayment/v1/payments`, {
    method: "POST",
    headers: commonHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.reference,
    }),
    body: JSON.stringify({
      amount: { currency: "NOK", value: Math.round(input.amountKr * 100) },
      paymentMethod: { type: "WALLET" },
      reference: input.reference,
      paymentDescription: input.description,
      returnUrl,
      userFlow: "WEB_REDIRECT",
    }),
  });

  if (!res.ok) {
    throw new Error(`Klarte ikke opprette Vipps-betaling (${res.status})`);
  }
  const data = await res.json();
  return { redirectUrl: data.redirectUrl as string };
}

export async function getPaymentState(reference: string): Promise<PaymentState> {
  if (!isVippsConfigured()) {
    // I test-modus settes status direkte på bookingen av mock-siden,
    // denne funksjonen brukes derfor ikke i test-modus.
    return "UNKNOWN";
  }

  const token = await getAccessToken();
  const res = await fetch(
    `${vippsBaseUrl()}/epayment/v1/payments/${reference}`,
    {
      headers: commonHeaders({ Authorization: `Bearer ${token}` }),
    }
  );
  if (!res.ok) return "UNKNOWN";
  const data = await res.json();
  return (data.state as PaymentState) ?? "UNKNOWN";
}

export async function capturePayment(
  reference: string,
  amountKr: number
): Promise<void> {
  if (!isVippsConfigured()) return; // ingen fangst nødvendig i test-modus

  const token = await getAccessToken();
  const res = await fetch(
    `${vippsBaseUrl()}/epayment/v1/payments/${reference}/capture`,
    {
      method: "POST",
      headers: commonHeaders({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${reference}-capture`,
      }),
      body: JSON.stringify({
        modificationAmount: {
          currency: "NOK",
          value: Math.round(amountKr * 100),
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Klarte ikke fange opp Vipps-betaling (${res.status})`);
  }
}
