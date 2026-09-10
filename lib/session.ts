import { cookies } from "next/headers";
import crypto from "crypto";

const APARTMENT_COOKIE = "leilighet_id";
const ADMIN_COOKIE = "styret_token";
const YEAR = 60 * 60 * 24 * 365;

export function getApartmentId(): string | null {
  return cookies().get(APARTMENT_COOKIE)?.value ?? null;
}

export function setApartmentId(id: string) {
  cookies().set(APARTMENT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  });
}

export function clearApartment() {
  cookies().delete(APARTMENT_COOKIE);
}

function sessionSecret() {
  return process.env.SESSION_SECRET || "utvikling-hemmelighet-bytt-meg";
}

function signAdminToken() {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update("styret-innlogget")
    .digest("hex");
}

export function isAdmin(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return Boolean(token) && token === signAdminToken();
}

export function setAdmin() {
  cookies().set(ADMIN_COOKIE, signAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdmin() {
  cookies().delete(ADMIN_COOKIE);
}
