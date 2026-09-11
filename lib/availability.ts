import { prisma } from "@/lib/prisma";

// Hvor lenge en ubetalt (PENDING) booking holder plassen reservert
// før den regnes som "sluppet" igjen (i minutter).
export const PENDING_HOLD_MINUTES = 15;

function pendingCutoff(): Date {
  return new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);
}

/**
 * Rydder opp gamle, ubetalte reservasjoner som har gått ut på tid, slik at
 * de slutter å blokkere plassen for andre. Kalles "gratis" (best-effort) fra
 * steder som uansett spør databasen om ledighet – ingen egen cron nødvendig
 * for et borettslag i denne størrelsen.
 */
export async function reapExpiredPending(): Promise<void> {
  await prisma.booking.updateMany({
    where: { status: "PENDING", createdAt: { lt: pendingCutoff() } },
    data: { status: "EXPIRED" },
  });
}

/**
 * Er den gitte plassen ledig i hele det ønskede tidsrommet?
 * Blokkeres av bekreftede bookinger, og av ubetalte bookinger som fortsatt
 * er innenfor betalingsvinduet.
 */
export async function isSpotFree(
  spotId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const overlapping = await prisma.booking.findFirst({
    where: {
      spotId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      startTime: { lt: end },
      endTime: { gt: start },
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", createdAt: { gte: pendingCutoff() } },
      ],
    },
    select: { id: true },
  });
  return !overlapping;
}
