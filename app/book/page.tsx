import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";
import { switchApartment } from "@/app/actions";
import { bookSpot, cancelBooking } from "@/app/book/actions";
import {
  addDays,
  formatDayMonth,
  formatMonthLabel,
  formatWeekday,
  isWeekend,
  todayUtcMidnight,
  toDateKey,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });
  if (!apartment) redirect("/");

  const days = Math.min(
    Number(searchParams.dager) || 45,
    120
  );
  const feil = searchParams.feil;

  const [spots, settings] = await Promise.all([
    prisma.parkingSpot.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const start = todayUtcMidnight();
  const end = addDays(start, days);

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: start, lt: end } },
    include: { apartment: true },
  });

  const bookingByKey = new Map<string, (typeof bookings)[number]>();
  for (const b of bookings) {
    bookingByKey.set(`${b.spotId}_${toDateKey(b.date)}`, b);
  }

  const dateList = Array.from({ length: days }, (_, i) => addDays(start, i));

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

      {feil === "opptatt" && (
        <div className="mt-4 rounded border border-clay bg-clay-light px-4 py-2 text-sm text-clay">
          Beklager, den plassen ble akkurat booket av noen andre. Velg en
          annen dato eller plass.
        </div>
      )}

      {settings && (
        <div className="mt-4 rounded border border-border bg-surface px-4 py-3 text-sm">
          <p>
            <span className="font-medium">{settings.pricePerDay},-</span> kr
            per døgn. Vipps til{" "}
            <span className="font-medium">{settings.vippsNumber}</span> —
            merk betalingen med leilighetsnummer.
          </p>
        </div>
      )}

      {spots.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Ingen parkeringsplasser er lagt inn ennå. Be styret legge dem inn.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink text-white">
                <th className="sticky left-0 z-10 bg-ink px-3 py-2 text-left font-medium">
                  Dato
                </th>
                {spots.map((s) => (
                  <th
                    key={s.id}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium"
                  >
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dateList.map((date, i) => {
                const key = toDateKey(date);
                const showMonthHeader =
                  i === 0 ||
                  formatMonthLabel(date) !== formatMonthLabel(dateList[i - 1]);
                const weekend = isWeekend(date);

                return (
                  <RowGroup
                    key={key}
                    showMonthHeader={showMonthHeader}
                    monthLabel={formatMonthLabel(date)}
                    colSpan={spots.length + 1}
                  >
                    <tr className={weekend ? "bg-paper" : "bg-surface"}>
                      <td
                        className={`sticky left-0 z-10 whitespace-nowrap px-3 py-2 ${
                          weekend ? "bg-paper" : "bg-surface"
                        }`}
                      >
                        <span className="text-muted">
                          {formatWeekday(date)}
                        </span>{" "}
                        {formatDayMonth(date)}
                      </td>
                      {spots.map((spot) => {
                        const booking = bookingByKey.get(`${spot.id}_${key}`);
                        return (
                          <td key={spot.id} className="px-3 py-2">
                            {!booking ? (
                              <form action={bookSpot}>
                                <input
                                  type="hidden"
                                  name="spotId"
                                  value={spot.id}
                                />
                                <input type="hidden" name="date" value={key} />
                                <button type="submit" className="btn-primary">
                                  Book
                                </button>
                              </form>
                            ) : booking.apartmentId === apartment.id ? (
                              <form
                                action={cancelBooking}
                                className="flex items-center gap-2"
                              >
                                <span className="rounded bg-pine-light px-2 py-1 text-xs font-medium text-pine-dark">
                                  Din booking
                                </span>
                                <input
                                  type="hidden"
                                  name="bookingId"
                                  value={booking.id}
                                />
                                <button
                                  type="submit"
                                  className="text-xs text-clay underline"
                                >
                                  Avbestill
                                </button>
                              </form>
                            ) : (
                              <span className="rounded bg-booked px-2 py-1 text-xs text-muted">
                                Leil. {booking.apartment.number}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </RowGroup>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {days < 120 && (
        <p className="mt-4 text-sm">
          <a
            href={`/book?dager=${Math.min(days + 45, 120)}`}
            className="text-pine underline"
          >
            Vis flere dager
          </a>
        </p>
      )}
    </main>
  );
}

function RowGroup({
  children,
  showMonthHeader,
  monthLabel,
  colSpan,
}: {
  children: React.ReactNode;
  showMonthHeader: boolean;
  monthLabel: string;
  colSpan: number;
}) {
  return (
    <>
      {showMonthHeader && (
        <tr>
          <td
            colSpan={colSpan}
            className="border-t border-border bg-paper px-3 py-1.5 text-sm font-semibold text-ink"
          >
            {monthLabel}
          </td>
        </tr>
      )}
      {children}
    </>
  );
}
