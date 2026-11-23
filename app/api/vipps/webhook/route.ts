import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { syncPayment } from "@/lib/payments";

/**
 * Mottar asynkrone statusoppdateringer fra Vipps. Fungerer som et
 * sikkerhetsnett i tillegg til bekreftelsen som skjer når brukeren sendes
 * tilbake fra Vipps (se app/betaling/retur) — dekker tilfeller der brukeren
 * lukker nettleseren før hen rekker å bli sendt tilbake.
 *
 * Hvert kall verifiseres mot VIPPS_WEBHOOK_SECRET (fra registreringen, se
 * scripts/register-vipps-webhook.mjs) før noe behandles, iht. Vipps sin
 * spesifikasjon:
 * https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/request-authentication/
 */

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.VIPPS_WEBHOOK_SECRET;
  if (!secret) return false; // webhooken er ikke registrert ennå

  const date = req.headers.get("x-ms-date");
  const contentHash = req.headers.get("x-ms-content-sha256");
  const authHeader = req.headers.get("authorization");
  const host = req.headers.get("host");
  if (!date || !contentHash || !authHeader || !host) return false;

  const expectedContentHash = crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("base64");
  if (expectedContentHash !== contentHash) return false;

  const { pathname, search } = new URL(req.url);
  const signedString = `POST\n${pathname}${search}\n${date};${host};${contentHash}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedString)
    .digest("base64");
  const expectedAuth = `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${expectedSignature}`;

  const a = Buffer.from(expectedAuth);
  const b = Buffer.from(authHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(req, rawBody)) {
    console.error("[vipps webhook] Ugyldig eller uverifisert signatur — avvist.");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const reference: string | undefined = payload?.reference;
  const eventName: string | undefined = payload?.name;
  if (!reference || !eventName) {
    return NextResponse.json({ ok: true });
  }

  // Hendelsesnavnet fra Vipps er f.eks. "epayments.payment.authorized.v1".
  // Vi tolker det ikke selv, men spør Vipps om faktisk status (syncPayment).
  console.log(`[vipps webhook] ${eventName} for ${reference}`);
  try {
    await syncPayment(reference);
  } catch (err) {
    console.error("[vipps webhook] sync feilet", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
