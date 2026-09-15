import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";
import { switchApartment } from "@/app/actions";
import { cancelPendingBooking } from "@/app/book/actions";
import { reapExpiredPending } from "@/lib/availability";
import { FIRMA } from "@/lib/firma";
import {
  addDays,
  formatDateTime,
  maxBookableDate,
  todayUtcMidnight,
  toDateKey,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default async function BookPage() {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });
  if (!apartment) redirect("/");

  await reapExpiredPending();

  const minDate = toDateKey(todayUtcMidnight());
  const maxDate = toDateKey(maxBookableDate());
  const tomorrowDate = toDateKey(addDays(todayUtcMidnight(), 1));

  const myBookings = await prisma.booking.findMany({
    where: {
      apartmentId,
      status: { in: ["PENDING", "CONFIRMED"] },
      endTime: { gte: new Date() },
    },
    include: { spot: true },
    orderBy: { startTime: "asc" },
    take: 25,
  });

  return (
    <main>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Parkering
          </h1>
          <p className="mt-1 text-sm text-muted">
            Leil. {apartment.number}
            {apartment.andelsnummer ? ` · Andel ${apartment.andelsnummer}` : ""}
          </p>
        </div>
        <form action={switchApartment}>
          <button type="submit" className="btn-secondary">
            Bytt leilighet
          </button>
        </form>
      </div>

      <div className="card mt-6">
        <h2 className="font-medium">1. Velg tidsrom</h2>
        <p className="mt-1 text-sm text-muted">
          Du kan booke inntil {toDateKey(maxBookableDate())
            .split("-")
            .reverse()
            .join(".")} fram i tid. Start og slutt må være på hele timer.
        </p>
        <form action="/book/ledige" method="get" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="start_dato" className="label">
                Fra dato
              </label>
              <input
                type="date"
                id="start_dato"
                name="start_dato"
                min={minDate}
                max={maxDate}
                defaultValue={minDate}
                required
                className="field"
              />
            </div>
            <div>
              <label htmlFor="start_time" className="label">
                Fra kl.
              </label>
              <select
                id="start_time"
                name="start_time"
                defaultValue="12"
                required
                className="field"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="slutt_dato" className="label">
                Til dato
              </label>
              <input
                type="date"
                id="slutt_dato"
                name="slutt_dato"
                min={minDate}
                max={maxDate}
                defaultValue={tomorrowDate}
                required
                className="field"
              />
            </div>
            <div>
              <label htmlFor="slutt_time" className="label">
                Til kl.
              </label>
              <select
                id="slutt_time"
                name="slutt_time"
                defaultValue="12"
                required
                className="field"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Se ledige plasser
          </button>
        </form>
      </div>

      <section className="card mt-6">
        <h2 className="font-medium">Dine bookinger</h2>
        <ul className="mt-3 divide-y divide-border">
          {myBookings.map((b) => (
            <li key={b.id} className="py-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{b.spot.name}</span>{" "}
                  <span className="text-muted">
                    {formatDateTime(b.startTime)} – {formatDateTime(b.endTime)}
                  </span>
                  <div className="mt-0.5 text-xs text-muted">
                    {b.priceKr},- kr ·{" "}
                    {b.status === "CONFIRMED" ? "Betalt og bekreftet" : "Venter på betaling"}
                  </div>
                </div>
                {b.status === "PENDING" && (
                  <form action={cancelPendingBooking}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="text-xs text-clay underline whitespace-nowrap">
                      Avbryt
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {myBookings.length === 0 && (
            <li className="py-2 text-sm text-muted">
              Ingen kommende bookinger.
            </li>
          )}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Vil du avbestille en betalt booking? Ta kontakt med styret.
        </p>
      </section>

      <footer className="mt-10 border-t border-border pt-4 text-xs text-muted">
        <p>
          {FIRMA.navn} ·{" "}
          <Link href="/vilkar" className="text-pine underline">
            Vilkår
          </Link>
        </p>
      </footer>
    </main>
  );
}
