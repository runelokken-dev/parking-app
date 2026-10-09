import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/dates";
import { capturePayment, getPaymentState, isVippsConfigured } from "@/lib/vipps";

export const dynamic = "force-dynamic";

export default async function BetalingReturPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const ref = String(searchParams.ref || "");

  let booking = ref
    ? await prisma.booking.findUnique({
        where: { paymentRef: ref },
        include: { spot: true, apartment: true },
      })
    : null;

  if (!booking) {
    return (
      <main>
        <h2 className="text-xl font-semibold tracking-tight">
          Fant ikke bookingen
        </h2>
        <p className="mt-2 text-sm text-muted">
          <Link href="/book" className="text-pine underline">
            Tilbake til booking
          </Link>
        </p>
      </main>
    );
  }

  // Ekte Vipps: sjekk status hos Vipps og oppdater bookingen tilsvarende.
  if (booking.status === "PENDING" && isVippsConfigured()) {
    const state = await getPaymentState(ref);
    if (state === "AUTHORIZED") {
      await capturePayment(ref, booking.priceKr);
      booking = await prisma.booking.update({
        where: { paymentRef: ref },
        data: { status: "CONFIRMED", paidAt: new Date(), vippsState: state },
        include: { spot: true, apartment: true },
      });
    } else if (
      ["ABORTED", "CANCELLED", "EXPIRED", "TERMINATED"].includes(state)
    ) {
      booking = await prisma.booking.update({
        where: { paymentRef: ref },
        data: { status: "CANCELLED", vippsState: state },
        include: { spot: true, apartment: true },
      });
    }
  }

  if (booking.status === "CONFIRMED") {
    return (
      <main>
        <h2 className="text-xl font-semibold tracking-tight">
          Booking bekreftet ✓
        </h2>
        <div className="card mt-4 text-sm">
          <p>
            <span className="text-muted">Plass:</span> {booking.spot.name}
          </p>
          <p className="mt-1">
            <span className="text-muted">Tidsrom:</span>{" "}
            {formatDateTime(booking.startTime)} –{" "}
            {formatDateTime(booking.endTime)}
          </p>
          <p className="mt-1">
            <span className="text-muted">Betalt:</span> {booking.priceKr},- kr
          </p>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/book" className="text-pine underline">
            Til dine bookinger
          </Link>
        </p>
      </main>
    );
  }

  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    return (
      <main>
        <h2 className="text-xl font-semibold tracking-tight">
          Betaling ikke fullført
        </h2>
        <p className="mt-2 text-sm text-muted">
          Reservasjonen ble avbrutt, og plassen er ledig for andre igjen.
          {!booking.paidAt && " Ingen penger er trukket."}
        </p>
        <p className="mt-4 text-sm">
          <Link href="/book" className="text-pine underline">
            Prøv på nytt
          </Link>
        </p>
      </main>
    );
  }

  // Fortsatt PENDING (betalingen pågår hos Vipps) — vanlig rett etter at
  // brukeren kommer tilbake fra WEB_REDIRECT, før status har rukket å bli satt.
  return (
    <main>
      <h2 className="text-xl font-semibold tracking-tight">
        Bekrefter betaling …
      </h2>
      <p className="mt-2 text-sm text-muted">
        Dette tar vanligvis bare noen sekunder.
      </p>
      <p className="mt-4 text-sm">
        <a href={`/betaling/retur?ref=${ref}`} className="text-pine underline">
          Oppdater
        </a>
      </p>
      <p className="mt-3 text-xs text-muted">
        Avbrøt du betalingen, eller ble du stående her?{" "}
        <Link href="/book" className="text-pine underline">
          Gå til dine bookinger
        </Link>{" "}
        for å avbryte reservasjonen.
      </p>
    </main>
  );
}
