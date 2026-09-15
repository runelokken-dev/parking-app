import { FIRMA } from "@/lib/firma";

/**
 * Selve salgsvilkårsteksten (uten innpakning), delt mellom footeren på
 * forsiden og den dedikerte /vilkar-siden.
 */
export function VilkarInnhold({
  pricePerHour,
  pricePerDay,
  dailyThresholdHours,
}: {
  pricePerHour: number;
  pricePerDay: number;
  dailyThresholdHours: number;
}) {
  return (
    <div className="space-y-3 leading-relaxed">
      <p>
        <strong>Tjeneste og priser.</strong> {FIRMA.navn} leier ut ledige
        gjesteparkeringsplasser til beboere i borettslaget, for et
        selvvalgt tidsrom bestilt i denne løsningen. Prisen beregnes
        automatisk ut fra valgt tidsrom og vises før betaling: kr{" "}
        {pricePerHour},- per time ved bookinger under {dailyThresholdHours}{" "}
        timer, ellers kr {pricePerDay},- per påbegynt døgn. Gjeldende
        priser fastsettes av styret og kan endres.
      </p>
      <p>
        <strong>Parter.</strong> Avtalen inngås mellom {FIRMA.navn}{" "}
        (utleier) og beboeren/andelseieren som foretar bookingen
        (leietaker).
      </p>
      <p>
        <strong>Betaling.</strong> Betaling skjer via Vipps på
        bestillingstidspunktet. Bookingen er først gyldig og bekreftet når
        betalingen er godkjent.
      </p>
      <p>
        <strong>Levering.</strong> Leveransen består av tilgang til den
        bookede parkeringsplassen i det avtalte tidsrommet. Det leveres
        ingen fysisk vare.
      </p>
      <p>
        <strong>Angrerett.</strong> Kjøpet gjelder leie av en
        parkeringsplass for et bestemt, forhåndsvalgt tidsrom. Tjenester
        av denne typen er unntatt fra angreretten, jf. angrerettloven § 22
        bokstav n. Kjøpet er derfor bindende fra betalingen er
        gjennomført.
      </p>
      <p>
        <strong>Retur.</strong> Siden dette er en tjeneste og ikke en vare,
        er fysisk retur ikke aktuelt.
      </p>
      <p>
        <strong>Avbestilling og leieforhold.</strong> Hver booking gjelder
        ett avgrenset tidsrom — det er ikke et løpende abonnement, og
        krever derfor ingen oppsigelse. En ubetalt reservasjon kan
        avbestilles av beboeren selv fram til betaling. En allerede betalt
        booking avbestilles ved å kontakte styret på {FIRMA.epost}, så
        snart som mulig og senest før bookingens starttidspunkt. Styret
        vurderer eventuell tilbakebetaling i det enkelte tilfellet.
      </p>
      <p>
        <strong>Reklamasjon.</strong> Ved feil ved den bookede plassen
        eller tjenesten, kontakt styret på {FIRMA.epost} med en
        beskrivelse av forholdet. Styret behandler henvendelsen og avgjør
        eventuell kompensasjon.
      </p>
      <p>
        <strong>Konfliktløsning.</strong> Uenighet mellom partene søkes
        først løst i minnelighet. Beboere kan også kontakte
        Forbrukerrådet (forbrukerradet.no) eller Forbrukertilsynet
        (forbrukertilsynet.no) for veiledning.
      </p>
    </div>
  );
}
