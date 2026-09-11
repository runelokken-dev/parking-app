"use server";

import { redirect } from "next/navigation";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";
import { reapExpiredPending, PENDING_HOLD_MINUTES } from "@/lib/availability";
import { calculatePrice } from "@/lib/pricing";
import { createPayment } from "@/lib/vipps";
import { toDateKey } from "@/lib/dates";

function ledigeUrl(start: Date, end: Date, feil?: string) {
  const qs = new URLSearchParams({
    start_dato: toDateKey(start),
    start_time: String(start.getUTCHours()),
    slutt_dato: toDateKey(end),
    slutt_time: String(end.getUTCHours()),
  });
  if (feil) qs.set("feil", feil);
  return `/book/ledige?${qs.toString()}`;
}

export async function reserveSpot(formData: FormData) {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const spotId = String(formData.get("spotId") || "");
  const startIso = String(formData.get("start") || "");
  const endIso = String(formData.get("end") || "");
  if (!spotId || !startIso || !endIso) redirect("/book");

  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    redirect("/book");
  }

  await reapExpiredPending();

  const [spot, settings] = await Promise.all([
    prisma.parkingSpot.findUnique({ where: { id: spotId } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);
  if (!spot || !spot.active) redirect("/book");

  const price = calculatePrice(start, end, {
    pricePerHour: settings?.pricePerHour ?? 20,
    pricePerDay: settings?.pricePerDay ?? 100,
    dailyThresholdHours: settings?.dailyThresholdHours ?? 5,
  });

  const paymentRef = `p-${crypto.randomBytes(10).toString("hex")}`;
  const pendingCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);

  let bookingId: string;
  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        const overlapping = await tx.booking.findFirst({
          where: {
            spotId,
            startTime: { lt: end },
            endTime: { gt: start },
            OR: [
              { status: "CONFIRMED" },
              { status: "PENDING", createdAt: { gte: pendingCutoff } },
            ],
          },
          select: { id: true },
        });
        if (overlapping) throw new Error("OPPTATT");

        return tx.booking.create({
          data: {
            spotId,
            apartmentId,
            startTime: start,
            endTime: end,
            status: "PENDING",
            priceKr: price.totalKr,
            paymentRef,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    bookingId = booking.id;
  } catch {
    redirect(ledigeUrl(start, end, "opptatt"));
  }

  let redirectUrl: string;
  try {
    const payment = await createPayment({
      reference: paymentRef,
      amountKr: price.totalKr,
      description: `${spot.name}, ${start.toLocaleString("nb-NO")}`,
    });
    redirectUrl = payment.redirectUrl;
  } catch {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
    redirect(ledigeUrl(start, end, "betalingsfeil"));
  }

  redirect(redirectUrl);
}
