import { headers } from "next/headers";

/**
 * Finner appens egen base-URL (for Vipps returnUrl/webhook), uten å måtte
 * hardkode domenet. Bruker forespørselens host-header (satt av Vercel/nettleser),
 * med fall-back til Vercel sin automatiske VERCEL_URL, og til slutt en
 * manuelt satt NEXT_PUBLIC_BASE_URL for lokal utvikling.
 */
export function getBaseUrl(): string {
  const host = headers().get("host");
  if (host) {
    const protocol = host.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}
