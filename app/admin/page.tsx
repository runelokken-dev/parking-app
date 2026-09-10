import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";
import { formatDayMonth, todayUtcMidnight } from "@/lib/dates";
import {
  addApartment,
  addApartmentsBulk,
  addSpot,
  adminLogin,
  adminLogout,
  deleteApartment,
  deleteBookingAsAdmin,
  deleteSpot,
  toggleSpot,
  updateSettings,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

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

  const [apartments, spots, settings, upcomingBookings] = await Promise.all([
    prisma.apartment.findMany({ orderBy: { number: "asc" } }),
    prisma.parkingSpot.findMany({ orderBy: { name: "asc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.booking.findMany({
      where: { date: { gte: todayUtcMidnight() } },
      include: { apartment: true, spot: true },
      orderBy: { date: "asc" },
      take: 100,
    }),
  ]);

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

      {/* Innstillinger */}
      <section className="card mt-6">
        <h2 className="font-medium">Pris og betaling</h2>
        <form action={updateSettings} className="mt-3 flex flex-wrap gap-4">
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
              className="field w-32"
            />
          </div>
          <div>
            <label htmlFor="vippsNumber" className="label">
              Vipps-nummer
            </label>
            <input
              id="vippsNumber"
              name="vippsNumber"
              defaultValue={settings?.vippsNumber ?? ""}
              className="field w-40"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Lagre
            </button>
          </div>
        </form>
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
                  <button
                    type="submit"
                    className="text-sm text-clay underline"
                  >
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
          <input
            name="name"
            placeholder="F.eks. Plass 9"
            required
            className="field"
          />
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
            <li className="py-2 text-sm text-muted">
              Ingen leiligheter lagt inn.
            </li>
          )}
        </ul>

        <form action={addApartment} className="mt-4 flex flex-wrap gap-2">
          <input
            name="number"
            placeholder="Leilighetsnr."
            required
            className="field w-32"
          />
          <input
            name="andelsnummer"
            placeholder="Andelsnr. (valgfritt)"
            className="field w-40"
          />
          <input
            name="name"
            placeholder="Navn (valgfritt)"
            className="field w-40"
          />
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
            <textarea
              id="bulk"
              name="bulk"
              rows={5}
              placeholder={"101, 12, \n102, 13, "}
              className="field font-mono text-xs"
            />
            <button type="submit" className="btn-primary">
              Importer
            </button>
          </form>
        </details>
      </section>

      {/* Kommende bookinger */}
      <section className="card mt-6">
        <h2 className="font-medium">Kommende bookinger</h2>
        <ul className="mt-3 max-h-96 divide-y divide-border overflow-y-auto">
          {upcomingBookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {formatDayMonth(b.date)} · {b.spot.name} · Leil.{" "}
                {b.apartment.number}
              </span>
              <form action={deleteBookingAsAdmin}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="text-sm text-clay underline">
                  Slett
                </button>
              </form>
            </li>
          ))}
          {upcomingBookings.length === 0 && (
            <li className="py-2 text-sm text-muted">
              Ingen kommende bookinger.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
