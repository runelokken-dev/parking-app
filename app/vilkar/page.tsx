import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FIRMA } from "@/lib/firma";
import { VilkarInnhold } from "@/components/VilkarInnhold";

export const dynamic = "force-dynamic";

export default async function VilkarPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <main>
      <p className="text-sm">
        <Link href="/book" className="text-pine underline">
          ← Tilbake til booking
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Vilkår for booking og betaling
      </h1>
      <p className="mt-1 text-sm text-muted">
        {FIRMA.navn} · Org.nr {FIRMA.orgnr} · {FIRMA.adresse} · {FIRMA.epost}
      </p>

      <div className="card mt-6 text-sm">
        <VilkarInnhold
          pricePerHour={settings?.pricePerHour ?? 20}
          pricePerDay={settings?.pricePerDay ?? 100}
          dailyThresholdHours={settings?.dailyThresholdHours ?? 5}
        />
      </div>
    </main>
  );
}
