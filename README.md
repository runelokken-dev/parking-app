# Parkering i borettslaget

En liten Next.js-app som erstatter Google Sheets-arket for booking av
gjesteparkering. Beboere velger leiligheten sin (ingen passord) og booker
ledige datoer på de tilgjengelige plassene. Styret har et eget
admin-panel (passordbeskyttet) for å legge inn leiligheter, plasser,
pris/Vipps-nummer, og for å slette bookinger ved behov.

Betaling skjer fortsatt manuelt via Vipps, akkurat som i dag — appen viser
bare prisen og Vipps-nummeret, den tar ikke betalt.

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

2. Opprett en gratis Postgres-database, f.eks. via [Neon](https://neon.tech)
   eller ved å opprette et Vercel-prosjekt og legge til "Postgres" under
   **Storage**-fanen (se under). Kopier `.env.example` til `.env` og fyll inn
   tilkoblingsstrengene, samt et admin-passord:

   ```bash
   cp .env.example .env
   ```

3. Opprett databasetabellene:

   ```bash
   npm run db:push
   ```

4. Legg inn de tre parkeringsplassene og standard pris/Vipps-nummer fra det
   gamle arket:

   ```bash
   npm run db:seed
   ```

5. Start appen:

   ```bash
   npm run dev
   ```

   Åpne <http://localhost:3000>. Gå til `/admin` og logg inn med
   `ADMIN_PASSWORD` for å legge inn leilighetene i borettslaget (ett skjema
   for å legge inn én og én, eller "Legg til flere på én gang" for å lime inn
   mange samtidig).

## Deploy til Vercel (gratis)

1. Push koden til et GitHub-repo.
2. Gå til [vercel.com](https://vercel.com) → **Add New Project** → velg
   repoet.
3. Under **Storage**-fanen på prosjektet: **Create Database** → velg
   **Postgres** (drives av Neon). Vercel setter da automatisk
   `POSTGRES_PRISMA_URL` og `POSTGRES_URL_NON_POOLING` som miljøvariabler på
   prosjektet.
4. Under **Settings → Environment Variables**, legg til:
   - `ADMIN_PASSWORD` – passordet styret skal logge inn med
   - `SESSION_SECRET` – en tilfeldig streng (f.eks. `openssl rand -hex 32`)
5. Deploy.
6. Kjør databasemigrering mot produksjonsdatabasen. Enkleste måte lokalt:

   ```bash
   npx vercel link
   npx vercel env pull .env.local
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
  page.tsx          Velg leilighet (forsiden)
  book/page.tsx      Booking-kalenderen
  admin/page.tsx      Styrepanel (passordbeskyttet)
lib/
  prisma.ts          Databasetilkobling
  session.ts         Cookie-håndtering (leilighet + admin)
  dates.ts            Datohjelpere
prisma/
  schema.prisma      Datamodell
  seed.mjs            Fyller inn plassene fra det gamle arket
```

## Videre idéer

- Varsle beboer på e-post/SMS når booking bekreftes (krever f.eks. Resend)
- Ekte Vipps-integrasjon for automatisk betaling
- Statistikk over bruk per leilighet for styret
