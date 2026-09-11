import { prisma } from "@/lib/prisma";
import { isVippsConfigured } from "@/lib/vipps";
import { formatDateTime } from "@/lib/dates";
import { confirmMock, cancelMock } from "@/app/betaling/mock/actions";

export const dynamic = "force-dynamic";

export default async function MockVippsPage({
  params,
}: {
  params: { ref: string };
}) {
  if (isVippsConfigured()) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">
          Test-Vipps er ikke i bruk
        </h1>
        <p className="mt-2 text-sm text-muted">
          Denne appen er koblet til ekte Vipps-betaling, så denne test-siden
          brukes ikke lenger.
        </p>
      </main>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { paymentRef: params.ref },
    include: { spot: true, apartment: true },
  });

  if (!booking || booking.status !== "PENDING") {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">
          Fant ikke betalingen
        </h1>
        <p className="mt-2 text-sm text-muted">
          Denne reservasjonen finnes ikke lenger, eller er allerede
          behandlet.
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="card mx-auto max-w-sm text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-pine-light text-sm font-bold text-pine-dark">
          V
        </div>
        <h1 className="text-lg font-semibold">Simulert Vipps-betaling</h1>
        <p className="mt-1 text-xs text-muted">
          Test-modus — ingen ekte penger trekkes
        </p>

        <div className="mt-5 rounded border border-border bg-paper px-4 py-3 text-left text-sm">
          <p>
            <span className="text-muted">Plass:</span> {booking.spot.name}
          </p>
          <p className="mt-1">
            <span className="text-muted">Tidsrom:</span>{" "}
            {formatDateTime(booking.startTime)} –{" "}
            {formatDateTime(booking.endTime)}
          </p>
          <p className="mt-1">
            <span className="text-muted">Leilighet:</span>{" "}
            {booking.apartment.number}
          </p>
        </div>

        <p className="mt-4 text-2xl font-semibold">{booking.priceKr},- kr</p>

        <form action={confirmMock} className="mt-5">
          <input type="hidden" name="ref" value={params.ref} />
          <button type="submit" className="btn-primary w-full">
            Betal med Vipps (test)
          </button>
        </form>
        <form action={cancelMock} className="mt-2">
          <input type="hidden" name="ref" value={params.ref} />
          <button type="submit" className="btn-secondary w-full">
            Avbryt
          </button>
        </form>
      </div>
    </main>
  );
}
