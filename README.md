# Parkering i borettslaget

En Next.js-app som erstatter Google Sheets-arket for booking av
gjesteparkering. Beboere velger leiligheten sin (ingen passord), velger et
tidsrom (på hele timer, inntil ca. 2 måneder fram i tid), velger en ledig
plass og betaler via Vipps. Styret har et eget admin-panel
(passordbeskyttet) for å administrere leiligheter, plasser, priser, og for
å se bookinger og historikk.

## Hvordan bookingflyten fungerer

1. Beboer velger leilighet (ingen passord).
2. Beboer velger tidsrom (fra/til dato + klokkeslett, hele timer).
3. Appen viser hvilke plasser som er ledige i akkurat det tidsrommet, og
   prisen (se prisregel under).
4. Beboer velger en ledig plass og sendes til Vipps for betaling.
5. Etter betaling bekreftes bookingen automatisk.
6. Styret ser alle bookinger og historikk under `/admin`, med mulighet til
   å filtrere på periode og avbestille.

### Prisregel

- Under terskelen (standard 5 timer): **kr per time**.
- Fra og med terskelen: **kr per påbegynt døgn** (f.eks. 30 timer = 2
  påbegynte døgn).

Alle tre verdiene (kr/time, kr/døgn, terskel i timer) kan endres av styret
under `/admin`.

### Vipps: test-modus vs. ekte betaling

Appen bruker Vipps' offisielle [ePayment API](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/).
Så lenge de fire miljøvariablene under ikke er satt, sendes beboeren i
stedet til en innebygd, simulert Vipps-side i appen (tydelig merket
"test-modus") — slik kan hele flyten testes fra start til slutt uten en
ekte Vipps-avtale. Så snart nøklene legges inn på Vercel, brukes automatisk
ekte Vipps, uten kodeendringer:

- `VIPPS_CLIENT_ID`
- `VIPPS_CLIENT_SECRET`
- `VIPPS_SUBSCRIPTION_KEY`
- `VIPPS_MERCHANT_SERIAL_NUMBER`
- `VIPPS_ENVIRONMENT` (`test` eller `production`)

Disse får dere fra Vipps sin [portal for bedrifter](https://portal.vippsmobilepay.com/)
når borettslaget har en Vipps-avtale. Det finnes også en `/api/vipps/webhook`-rute
som tar imot statusoppdateringer fra Vipps — **før dette kobles til med
ekte penger i produksjon, bør webhooken utvides med signaturverifisering**
(se kommentar i `app/api/vipps/webhook/route.ts` og
[Vipps' webhook-dokumentasjon](https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/)).

## Teknologi

- **Next.js 14** (App Router, Server Actions) — ingen egen backend nødvendig
- **Prisma + Postgres** for lagring (fungerer med Vercel Postgres/Neon sitt gratisnivå)
- **Tailwind CSS** for styling
- Enkel cookie-basert "innlogging": ingen passord for beboere, ett felles
  passord for styret

## Kom i gang lokalt

1. Installer avhengigheter:

   ```bash
   npm install
   ```

2. Kopier `.env.example` til `.env` og fyll inn database-tilkobling og
   admin-passord (Vipps-variablene kan stå tomme — da brukes test-modus):

   ```bash
   cp .env.example .env
   ```

3. Opprett databasetabellene:

   ```bash
   npm run db:push
   ```

   > **Merk ved oppgradering fra en eldre versjon:** datamodellen for
   > bookinger er endret fundamentalt (fra hele dager til tidsrom +
   > betalingsstatus). `db:push` vil be om å nullstille eksisterende
   > booking-data — det er forventet og trygt før dere er live med ekte
   > bookinger.

4. Legg inn de tre parkeringsplassene og standardpriser:

   ```bash
   npm run db:seed
   ```

5. Start appen:

   ```bash
   npm run dev
   ```

   Åpne <http://localhost:3000>. Gå til `/admin` og logg inn med
   `ADMIN_PASSWORD` for å legge inn leilighetene i borettslaget.

## Deploy til Vercel (gratis)

1. Push koden til et GitHub-repo (filene skal ligge i roten av repoet).
2. Gå til [vercel.com](https://vercel.com) → **Add New Project** → velg
   repoet.
3. Under **Storage**-fanen på prosjektet: **Create Database** → velg
   **Postgres** (drives av Neon). Vercel setter da automatisk
   `POSTGRES_PRISMA_URL` og `POSTGRES_URL_NON_POOLING` som miljøvariabler.
4. Under **Settings → Environment Variables**, legg til:
   - `ADMIN_PASSWORD` – passordet styret skal logge inn med
   - `SESSION_SECRET` – en tilfeldig streng (f.eks. `openssl rand -hex 32`)
   - (valgfritt) de fire `VIPPS_...`-variablene når dere har en Vipps-avtale
5. Deploy.
6. Kjør databasemigrering mot produksjonsdatabasen (lokalt, mot de samme
   `POSTGRES_...`-verdiene som ligger på Vercel):

   ```bash
   npm run db:push
   npm run db:seed
   ```

7. Besøk `https://<ditt-prosjekt>.vercel.app/admin`, logg inn, og legg inn
   leilighetene i borettslaget.

Del `https://<ditt-prosjekt>.vercel.app` med beboerne, og
`https://<ditt-prosjekt>.vercel.app/admin` med styret.

## Mappestruktur

```
app/
  page.tsx                    Velg leilighet (forsiden)
  book/page.tsx                Steg 1: velg tidsrom + dine bookinger
  book/ledige/page.tsx          Steg 2: ledige plasser + pris
  betaling/mock/[ref]/page.tsx   Simulert Vipps-side (kun i test-modus)
  betaling/retur/page.tsx        Bekrefter betaling etter Vipps
  api/vipps/webhook/route.ts     Tar imot statusoppdateringer fra Vipps
  admin/page.tsx                Styrepanel: priser, plasser, leiligheter,
                                  bookinger og historikk
lib/
  prisma.ts        Databasetilkobling
  session.ts        Cookie-håndtering (leilighet + admin)
  dates.ts           Datohjelpere
  pricing.ts          Prisberegning (time/døgn-regelen)
  vipps.ts            Vipps ePayment-klient (ekte API + test-fallback)
  availability.ts      Sjekker ledighet, rydder utgåtte reservasjoner
  url.ts               Finner appens egen URL (for Vipps returnUrl)
prisma/
  schema.prisma      Datamodell
  seed.mjs            Fyller inn plassene og standardpriser
```

## Videre idéer

- Varsle beboer på e-post/SMS når booking bekreftes (krever f.eks. Resend)
- Automatisk refusjon via Vipps når styret avbestiller en betalt booking
- Statistikk over bruk per leilighet for styret
- Visuell kalender-widget i stedet for dato/klokkeslett-felter
