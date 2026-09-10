import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";
import { selectApartment } from "@/app/actions";

export default async function HomePage() {
  const existingId = getApartmentId();
  if (existingId) {
    const existing = await prisma.apartment.findUnique({
      where: { id: existingId },
    });
    if (existing) redirect("/book");
  }

  const apartments = await prisma.apartment.findMany({
    orderBy: { number: "asc" },
  });

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">
        Parkering i borettslaget
      </h1>
      <p className="mt-2 text-sm text-muted">
        Velg leiligheten din for å se ledige plasser og booke.
      </p>

      <div className="card mt-6">
        {apartments.length === 0 ? (
          <p className="text-sm text-muted">
            Ingen leiligheter er lagt inn ennå. Styret må legge inn
            leiligheter under{" "}
            <Link href="/admin" className="text-pine underline">
              Styret-panelet
            </Link>{" "}
            før booking kan starte.
          </p>
        ) : (
          <form action={selectApartment} className="space-y-4">
            <div>
              <label htmlFor="apartmentId" className="label">
                Leilighet
              </label>
              <select
                id="apartmentId"
                name="apartmentId"
                required
                className="field"
                defaultValue=""
              >
                <option value="" disabled>
                  Velg leilighet…
                </option>
                {apartments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Leil. {a.number}
                    {a.andelsnummer ? ` · Andel ${a.andelsnummer}` : ""}
                    {a.name ? ` · ${a.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">
              Fortsett
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-xs text-muted">
        Er du i styret?{" "}
        <Link href="/admin" className="text-pine underline">
          Logg inn som styret
        </Link>
      </p>
    </main>
  );
}
