import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";
import { reapExpiredPending, isSpotFree } from "@/lib/availability";
import { calculatePrice } from "@/lib/pricing";
import {
  combineDateAndHour,
  formatDateTime,
  maxBookableDate,
} from "@/lib/dates";
import { reserveSpot } from "@/app/book/ledige/actions";

export const dynamic = "force-dynamic";

export default async function LedigePlasserPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const startDato = String(searchParams.start_dato || "");
  const startTime = Number(searchParams.start_time);
  const sluttDato = String(searchParams.slutt_dato || "");
  const sluttTime = Number(searchParams.slutt_time);
  const feil = searchParams.feil;

  if (!startDato || !sluttDato || Number.isNaN(startTime) || Number.isNaN(sluttTime)) {
    redirect("/book");
  }

  const start = combineDateAndHour(startDato, startTime);
  const end = combineDateAndHour(sluttDato, sluttTime);

  const now = new Date();
  const invalidRange = end <= start;
  const inPast = start < now;
  const tooFarAhead = start > maxBookableDate();

  await reapExpiredPending();

  const [spots, settings] = await Promise.all([
    prisma.parkingSpot.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const price =
    !invalidRange && !inPast
      ? calculatePrice(start, end, {
          pricePerHour: settings?.pricePerHour ?? 20,
          pricePerDay: settings?.pricePerDay ?? 100,
          dailyThresholdHours: settings?.dailyThresholdHours ?? 5,
        })
      : null;

  const availability = invalidRange || inPast || tooFarAhead
    ? []
    : await Promise.all(
        spots.map(async (spot) => ({
          spot,
          free: await isSpotFree(spot.id, start, end),
        }))
      );

  const qs = `start_dato=${startDato}&start_time=${startTime}&slutt_dato=${sluttDato}&slutt_time=${sluttTime}`;

  return (
    <main>
      <p className="text-sm">
        <Link href="/book" className="text-pine underline">
          ← Endre tidsrom
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        2. Velg parkeringsplass
      </h1>
      <p className="mt-1 text-sm text-muted">
        {formatDateTime(start)} – {formatDateTime(end)}
      </p>

      {feil === "opptatt" && (
        <div className="mt-4 rounded border border-clay bg-clay-light px-4 py-2 text-sm text-clay">
          Beklager, den plassen ble akkurat reservert av noen andre. Velg en
          annen plass under.
        </div>
      )}
      {feil === "betalingsfeil" && (
        <div className="mt-4 rounded border border-clay bg-clay-light px-4 py-2 text-sm text-clay">
          Noe gikk galt med betalingen. Reservasjonen ble avbrutt — prøv
          igjen.
        </div>
      )}

      {invalidRange && (
        <p className="mt-4 rounded border border-clay bg-clay-light px-4 py-2 text-sm text-clay">
          Sluttidspunktet må være etter starttidspunktet.
        </p>
      )}
      {inPast && !invalidRange && (
        <p className="mt-4 rounded border border-clay bg-clay-light px-4 py-2 text-sm text-clay">
          Du kan ikke booke et tidsrom som allerede er passert.
        </p>
      )}
      {tooFarAhead && !invalidRange && (
        <p className="mt-4 rounded border border-clay bg-clay-light px-4 py-2 text-sm text-clay">
          Du kan ikke booke så langt fram i tid ennå.
        </p>
      )}

      {price && (
        <div className="mt-4 rounded border border-border bg-surface px-4 py-3 text-sm">
          <p>
            Pris: <span className="font-medium">{price.totalKr},-</span> kr
            {price.basis === "hourly" ? (
              <> ({price.hours.toFixed(0)} timer à {settings?.pricePerHour ?? 20},- kr/t)</>
            ) : (
              <> ({price.days} påbegynt{price.days === 1 ? "" : "e"} døgn à {settings?.pricePerDay ?? 100},- kr)</>
            )}
          </p>
        </div>
      )}

      {!invalidRange && !inPast && !tooFarAhead && (
        <ul className="mt-6 divide-y divide-border rounded border border-border">
          {availability.map(({ spot, free }) => (
            <li key={spot.id} className="flex items-center justify-between px-4 py-3">
              <span className={free ? "" : "text-muted"}>{spot.name}</span>
              {free ? (
                <form action={reserveSpot}>
                  <input type="hidden" name="spotId" value={spot.id} />
                  <input type="hidden" name="start" value={start.toISOString()} />
                  <input type="hidden" name="end" value={end.toISOString()} />
                  <button type="submit" className="btn-primary">
                    Velg og betal
                  </button>
                </form>
              ) : (
                <span className="rounded bg-booked px-2 py-1 text-xs text-muted">
                  Opptatt
                </span>
              )}
            </li>
          ))}
          {availability.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">
              Ingen parkeringsplasser er lagt inn ennå.
            </li>
          )}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted">
        <Link href={`/book/ledige?${qs}`} className="underline">
          Oppdater ledighet
        </Link>
      </p>
    </main>
  );
}
