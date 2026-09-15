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

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const pricePerHour = settings?.pricePerHour ?? 20;
  const pricePerDay = settings?.pricePerDay ?? 100;
  const dailyThresholdHours = settings?.dailyThresholdHours ?? 5;

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
          {FIRMA.navn} · Org.nr {FIRMA.orgnr} · {FIRMA.adresse} ·{" "}
          {FIRMA.epost}
        </p>

        <details className="mt-3">
          <summary className="cursor-pointer text-pine">
            Vilkår for booking og betaling
          </summary>
          <div className="mt-2 space-y-3 leading-relaxed">
            <p>
              <strong>Tjeneste og priser.</strong> {FIRMA.navn} leier ut
              ledige gjesteparkeringsplasser til beboere i borettslaget, for
              et selvvalgt tidsrom bestilt i denne løsningen. Prisen
              beregnes automatisk ut fra valgt tidsrom og vises før
              betaling: kr {pricePerHour},- per time ved bookinger under{" "}
              {dailyThresholdHours} timer, ellers kr {pricePerDay},- per
              påbegynt døgn. Gjeldende priser fastsettes av styret og kan
              endres.
            </p>
            <p>
              <strong>Parter.</strong> Avtalen inngås mellom {FIRMA.navn}{" "}
              (utleier) og beboeren/andelseieren som foretar bookingen
              (leietaker).
            </p>
            <p>
              <strong>Betaling.</strong> Betaling skjer via Vipps på
              bestillingstidspunktet. Bookingen er først gyldig og bekreftet
              når betalingen er godkjent.
            </p>
            <p>
              <strong>Levering.</strong> Leveransen består av tilgang til
              den bookede parkeringsplassen i det avtalte tidsrommet. Det
              leveres ingen fysisk vare.
            </p>
            <p>
              <strong>Angrerett.</strong> Kjøpet gjelder leie av en
              parkeringsplass for et bestemt, forhåndsvalgt tidsrom.
              Tjenester av denne typen er unntatt fra angreretten, jf.
              angrerettloven § 22 bokstav n. Kjøpet er derfor bindende fra
              betalingen er gjennomført.
            </p>
            <p>
              <strong>Retur.</strong> Siden dette er en tjeneste og ikke en
              vare, er fysisk retur ikke aktuelt.
            </p>
            <p>
              <strong>Avbestilling og leieforhold.</strong> Hver booking
              gjelder ett avgrenset tidsrom — det er ikke et løpende
              abonnement, og krever derfor ingen oppsigelse. En ubetalt
              reservasjon kan avbestilles av beboeren selv fram til
              betaling. En allerede betalt booking avbestilles ved å
              kontakte styret på {FIRMA.epost}, så
              snart som mulig og senest før bookingens starttidspunkt.
              Styret vurderer eventuell tilbakebetaling i det enkelte
              tilfellet.
            </p>
            <p>
              <strong>Reklamasjon.</strong> Ved feil ved den bookede
              plassen eller tjenesten, kontakt styret på {FIRMA.epost} med
              en beskrivelse av forholdet. Styret behandler henvendelsen og
              avgjør eventuell kompensasjon.
            </p>
            <p>
              <strong>Konfliktløsning.</strong> Uenighet mellom partene
              søkes først løst i minnelighet. Beboere kan også kontakte{" "}
              Forbrukerrådet (forbrukerradet.no) eller Forbrukertilsynet
              (forbrukertilsynet.no) for veiledning.
            </p>
          </div>
        </details>
      </footer>
    </main>
  );
}
