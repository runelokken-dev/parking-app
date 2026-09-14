import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { isVippsConfigured } from "@/lib/vipps";
import { formatDateTime, addDays, todayUtcMidnight, toDateKey, parseDateKey } from "@/lib/dates";
import {
  addApartment,
  addApartmentsBulk,
  addSpot,
  adminLogin,
  adminLogout,
  cancelBookingAsAdmin,
  deleteApartment,
  deleteSpot,
  toggleSpot,
  updateSettings,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Bekreftet",
  PENDING: "Venter på betaling",
  CANCELLED: "Avbestilt",
  EXPIRED: "Utløpt (ubetalt)",
};

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: "bg-pine-light text-pine-dark",
  PENDING: "bg-booked text-muted",
  CANCELLED: "bg-clay-light text-clay",
  EXPIRED: "bg-clay-light text-clay",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (!isAdmin()) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Styret</h1>
        <p className="mt-2 text-sm text-muted">
          Logg inn for å administrere plasser, leiligheter og bookinger.
        </p>
        <div className="card mt-6 max-w-sm">
          <form action={adminLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="label">
                Passord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="field"
              />
            </div>
            {searchParams.feil && (
              <p className="text-sm text-clay">Feil passord.</p>
            )}
            <button type="submit" className="btn-primary w-full">
              Logg inn
            </button>
          </form>
        </div>
        <p className="mt-8 text-xs text-muted">
          <Link href="/" className="text-pine underline">
            Tilbake til booking
          </Link>
        </p>
      </main>
    );
  }

  const defaultFra = toDateKey(addDays(todayUtcMidnight(), -30));
  const defaultTil = toDateKey(addDays(todayUtcMidnight(), 60));
  const fra = String(searchParams.fra || defaultFra);
  const til = String(searchParams.til || defaultTil);

  const [apartments, spots, settings, bookings] = await Promise.all([
    prisma.apartment.findMany({ orderBy: { number: "asc" } }),
    prisma.parkingSpot.findMany({ orderBy: { name: "asc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.booking.findMany({
      where: {
        startTime: { gte: parseDateKey(fra), lt: addDays(parseDateKey(til), 1) },
      },
      include: { apartment: true, spot: true },
      orderBy: { startTime: "desc" },
      take: 300,
    }),
  ]);

  const confirmedInPeriod = bookings.filter((b) => b.status === "CONFIRMED");
  const totalRevenue = confirmedInPeriod.reduce((sum, b) => sum + b.priceKr, 0);

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Styret</h1>
        <form action={adminLogout}>
          <button type="submit" className="btn-secondary">
            Logg ut
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm">
        <Link href="/" className="text-pine underline">
          Til booking-siden
        </Link>
      </p>

      {/* Priser */}
      <section className="card mt-6">
        <h2 className="font-medium">Pris</h2>
        <form action={updateSettings} className="mt-3 flex flex-wrap gap-4">
          <div>
            <label htmlFor="pricePerHour" className="label">
              Kr per time
            </label>
            <input
              id="pricePerHour"
              name="pricePerHour"
              type="number"
              min={0}
              defaultValue={settings?.pricePerHour ?? 20}
              className="field w-28"
            />
          </div>
          <div>
            <label htmlFor="pricePerDay" className="label">
              Kr per døgn
            </label>
            <input
              id="pricePerDay"
              name="pricePerDay"
              type="number"
              min={0}
              defaultValue={settings?.pricePerDay ?? 100}
              className="field w-28"
            />
          </div>
          <div>
            <label htmlFor="dailyThresholdHours" className="label">
              Døgnpris fra og med (timer)
            </label>
            <input
              id="dailyThresholdHours"
              name="dailyThresholdHours"
              type="number"
              min={1}
              defaultValue={settings?.dailyThresholdHours ?? 5}
              className="field w-28"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Lagre
            </button>
          </div>
        </form>
      </section>

      {/* Vipps-status */}
      <section className="card mt-6">
        <h2 className="font-medium">Vipps-betaling</h2>
        {isVippsConfigured() ? (
          <p className="mt-2 text-sm text-pine-dark">
            ✓ Koblet til med ekte Vipps API-nøkler ({process.env.VIPPS_ENVIRONMENT === "production" ? "produksjon" : "testmiljø"}).
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Kjører i test-modus — beboere sendes til en simulert
            Vipps-side i stedet for ekte betaling. Legg inn VIPPS_CLIENT_ID,
            VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY og
            VIPPS_MERCHANT_SERIAL_NUMBER som miljøvariabler på Vercel for å
            koble til ekte Vipps.
          </p>
        )}
      </section>

      {/* Parkeringsplasser */}
      <section className="card mt-6">
        <h2 className="font-medium">Parkeringsplasser</h2>
        <ul className="mt-3 divide-y divide-border">
          {spots.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span className={s.active ? "" : "text-muted line-through"}>
                {s.name}
              </span>
              <div className="flex gap-3">
                <form action={toggleSpot}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-sm text-pine underline">
                    {s.active ? "Deaktiver" : "Aktiver"}
                  </button>
                </form>
                <form action={deleteSpot}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-sm text-clay underline">
                    Slett
                  </button>
                </form>
              </div>
            </li>
          ))}
          {spots.length === 0 && (
            <li className="py-2 text-sm text-muted">
              Ingen parkeringsplasser lagt inn.
            </li>
          )}
        </ul>
        <form action={addSpot} className="mt-4 flex gap-2">
          <input name="name" placeholder="F.eks. Plass 9" required className="field" />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Legg til
          </button>
        </form>
      </section>

      {/* Leiligheter */}
      <section className="card mt-6">
        <h2 className="font-medium">Leiligheter</h2>
        <ul className="mt-3 max-h-64 divide-y divide-border overflow-y-auto">
          {apartments.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2">
              <span>
                Leil. {a.number}
                {a.andelsnummer ? ` · Andel ${a.andelsnummer}` : ""}
                {a.name ? ` · ${a.name}` : ""}
              </span>
              <form action={deleteApartment}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-sm text-clay underline">
                  Slett
                </button>
              </form>
            </li>
          ))}
          {apartments.length === 0 && (
            <li className="py-2 text-sm text-muted">Ingen leiligheter lagt inn.</li>
          )}
        </ul>

        <form action={addApartment} className="mt-4 flex flex-wrap gap-2">
          <input name="number" placeholder="Leilighetsnr." required className="field w-32" />
          <input name="andelsnummer" placeholder="Andelsnr. (valgfritt)" className="field w-40" />
          <input name="name" placeholder="Navn (valgfritt)" className="field w-40" />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Legg til
          </button>
        </form>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-pine">
            Legg til flere på én gang
          </summary>
          <form action={addApartmentsBulk} className="mt-3 space-y-2">
            <label htmlFor="bulk" className="label">
              Én leilighet per linje: leilighetsnr, andelsnr, navn
            </label>
            <textarea id="bulk" name="bulk" rows={5} className="field font-mono text-xs" />
            <button type="submit" className="btn-primary">
              Importer
            </button>
          </form>
        </details>
      </section>

      {/* Bookinger og historikk */}
      <section className="card mt-6">
        <h2 className="font-medium">Bookinger og historikk</h2>
        <form action="/admin" method="get" className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="fra" className="label">
              Fra dato
            </label>
            <input type="date" id="fra" name="fra" defaultValue={fra} className="field" />
          </div>
          <div>
            <label htmlFor="til" className="label">
              Til dato
            </label>
            <input type="date" id="til" name="til" defaultValue={til} className="field" />
          </div>
          <button type="submit" className="btn-secondary">
            Filtrer
          </button>
        </form>

        <div className="mt-4 rounded border border-border bg-paper px-4 py-3 text-sm">
          <span className="text-muted">Leieinntekter i valgt periode</span>{" "}
          <span className="font-semibold">{totalRevenue},- kr</span>{" "}
          <span className="text-muted">
            ({confirmedInPeriod.length} betalt{confirmedInPeriod.length === 1 ? "" : "e"} booking{confirmedInPeriod.length === 1 ? "" : "er"})
          </span>
        </div>

        <ul className="mt-4 max-h-[32rem] divide-y divide-border overflow-y-auto">
          {bookings.map((b) => (
            <li key={b.id} className="py-2.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-medium">{b.spot.name}</span>{" "}
                  <span>· Leil. {b.apartment.number}</span>
                  <div className="text-xs text-muted">
                    {formatDateTime(b.startTime)} – {formatDateTime(b.endTime)} · {b.priceKr},- kr
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                  {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                    <form action={cancelBookingAsAdmin}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className="text-xs text-clay underline">
                        Avbestill
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
          {bookings.length === 0 && (
            <li className="py-2 text-sm text-muted">Ingen bookinger i valgt periode.</li>
          )}
        </ul>
        {bookings.length === 300 && (
          <p className="mt-2 text-xs text-muted">
            Viser de første 300 — snevre inn datofilteret for å se alle
            (summen over dekker kun de viste).
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          Avbestilling av en allerede betalt booking refunderer ikke
          automatisk — gjør det manuelt i Vipps-appen ved behov.
        </p>
      </section>
    </main>
  );
}
