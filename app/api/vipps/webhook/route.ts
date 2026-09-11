import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePayment } from "@/lib/vipps";

/**
 * Mottar asynkrone statusoppdateringer fra Vipps (anbefalt av Vipps i tillegg
 * til polling på returUrl, siden brukeren kan lukke nettleseren før
 * returUrl blir besøkt).
 *
 * NB, før dette kobles til produksjon med ekte penger: legg til verifisering
 * av at kallet faktisk kommer fra Vipps (HMAC-signatur i headeren, se
 * https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/). Denne
 * enkle versjonen stoler på reference-feltet og er ment som et startpunkt.
 */
export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const reference: string | undefined = payload?.reference;
  const eventName: string | undefined = payload?.name;
  if (!reference || !eventName) {
    return NextResponse.json({ ok: true }); // ukjent format, bare bekreft mottak
  }

  const booking = await prisma.booking.findUnique({
    where: { paymentRef: reference },
  });
  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json({ ok: true });
  }

  if (eventName.includes("authorized")) {
    try {
      await capturePayment(reference, booking.priceKr);
      await prisma.booking.update({
        where: { paymentRef: reference },
        data: { status: "CONFIRMED", paidAt: new Date(), vippsState: eventName },
      });
    } catch (err) {
      console.error("Klarte ikke fange opp Vipps-betaling via webhook", err);
    }
  } else if (
    eventName.includes("cancelled") ||
    eventName.includes("expired") ||
    eventName.includes("terminated")
  ) {
    await prisma.booking.update({
      where: { paymentRef: reference },
      data: { status: "CANCELLED", vippsState: eventName },
    });
  }

  return NextResponse.json({ ok: true });
}
