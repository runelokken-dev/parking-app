"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { clearAdmin, isAdmin, setAdmin } from "@/lib/session";

function requireAdmin() {
  if (!isAdmin()) redirect("/admin");
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password && password === process.env.ADMIN_PASSWORD) {
    setAdmin();
  } else {
    redirect("/admin?feil=1");
  }
  redirect("/admin");
}

export async function adminLogout() {
  clearAdmin();
  redirect("/admin");
}

export async function addApartment(formData: FormData) {
  requireAdmin();
  const number = String(formData.get("number") || "").trim();
  const andelsnummer = String(formData.get("andelsnummer") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!number) return;

  await prisma.apartment.upsert({
    where: { number },
    update: {
      andelsnummer: andelsnummer || null,
      name: name || null,
    },
    create: {
      number,
      andelsnummer: andelsnummer || null,
      name: name || null,
    },
  });

  revalidatePath("/admin");
}

export async function addApartmentsBulk(formData: FormData) {
  requireAdmin();
  const raw = String(formData.get("bulk") || "");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [number, andelsnummer, name] = line.split(",").map((p) => p?.trim());
    if (!number) continue;
    await prisma.apartment.upsert({
      where: { number },
      update: {
        andelsnummer: andelsnummer || null,
        name: name || null,
      },
      create: {
        number,
        andelsnummer: andelsnummer || null,
        name: name || null,
      },
    });
  }

  revalidatePath("/admin");
}

export async function deleteApartment(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.apartment.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function addSpot(formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.parkingSpot.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  revalidatePath("/admin");
}

export async function toggleSpot(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") || "");
  const spot = await prisma.parkingSpot.findUnique({ where: { id } });
  if (!spot) return;
  await prisma.parkingSpot.update({
    where: { id },
    data: { active: !spot.active },
  });
  revalidatePath("/admin");
}

export async function deleteSpot(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.parkingSpot.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function deleteBookingAsAdmin(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.booking.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function updateSettings(formData: FormData) {
  requireAdmin();
  const pricePerDay = Number(formData.get("pricePerDay") || 0);
  const vippsNumber = String(formData.get("vippsNumber") || "").trim();

  await prisma.settings.upsert({
    where: { id: 1 },
    update: { pricePerDay, vippsNumber },
    create: { id: 1, pricePerDay, vippsNumber },
  });

  revalidatePath("/admin");
  revalidatePath("/book");
}
