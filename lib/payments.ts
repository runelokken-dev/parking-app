import { prisma } from "@/lib/prisma";
import { capturePayment, getPaymentState, isVippsConfigured } from "@/lib/vipps";

const TERMINAL_STATES = ["ABORTED", "CANCELLED", "EXPIRED", "TERMINATED"];

/**
 * Spør Vipps om den faktiske statusen på betalingen og oppdaterer bookingen.
 * Brukes både av retur-siden, webhooken og styrepanelet, slik at all
 * bekreftelse skjer på ett sted. Stoler aldri på innholdet i et webhook-kall,
 * men spør alltid Vipps selv.
 */
export async function syncPayment(ref: string) {
  let booking = await prisma.booking.findUnique({
    where: { paymentRef: ref },
    include: { spot: true, apartment: true },
  });
  if (!booking || booking.status !== "PENDING" || !isVippsConfigured()) {
    return booking;
  }

  const state = await getPaymentState(ref);
  console.log(`[vipps] sync ${ref}: ${state}`);

  if (state === "AUTHORIZED") {
    try {
      await capturePayment(ref, booking.priceKr);
    } catch (err) {
      console.error(`[vipps] capture feilet for ${ref}`, err);
      return prisma.booking.update({
        where: { paymentRef: ref },
        data: { vippsState: "AUTHORIZED (capture feilet)" },
        include: { spot: true, apartment: true },
      });
    }
    return prisma.booking.update({
      where: { paymentRef: ref },
      data: { status: "CONFIRMED", paidAt: new Date(), vippsState: state },
      include: { spot: true, apartment: true },
    });
  }

  if (TERMINAL_STATES.includes(state)) {
    return prisma.booking.update({
      where: { paymentRef: ref },
      data: { status: "CANCELLED", vippsState: state },
      include: { spot: true, apartment: true },
    });
  }

  if (booking.vippsState !== state) {
    booking = await prisma.booking.update({
      where: { paymentRef: ref },
      data: { vippsState: state },
      include: { spot: true, apartment: true },
    });
  }
  return booking;
}
