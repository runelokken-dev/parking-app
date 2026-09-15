import { FIRMA } from "@/lib/firma";
import { VilkarInnhold } from "@/components/VilkarInnhold";

/**
 * Firma-/kontaktinfo og salgsvilkår (utvidbar), for å oppfylle Vipps
 * MobilePay sine krav til nettsider med integrert betaling:
 * https://vippsmobilepay.com/nb-NO/legal/krav-til-nettside
 */
export function VilkarFooter({
  pricePerHour,
  pricePerDay,
  dailyThresholdHours,
}: {
  pricePerHour: number;
  pricePerDay: number;
  dailyThresholdHours: number;
}) {
  return (
    <footer className="mt-10 border-t border-border pt-4 text-xs text-muted">
      <p>
        {FIRMA.navn} · Org.nr {FIRMA.orgnr} · {FIRMA.adresse} · {FIRMA.epost}
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-pine">
          Vilkår for booking og betaling
        </summary>
        <div className="mt-2">
          <VilkarInnhold
            pricePerHour={pricePerHour}
            pricePerDay={pricePerDay}
            dailyThresholdHours={dailyThresholdHours}
          />
        </div>
      </details>
    </footer>
  );
}
