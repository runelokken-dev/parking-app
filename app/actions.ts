"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearApartment, setApartmentId } from "@/lib/session";

export async function selectApartment(formData: FormData) {
  const apartmentId = String(formData.get("apartmentId") || "");
  if (!apartmentId) return;

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });
  if (!apartment) return;

  setApartmentId(apartment.id);
  redirect("/book");
}

export async function switchApartment() {
  clearApartment();
  redirect("/");
}
