"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";

// Beboere kan kun avbryte sine egne ubetalte (PENDING) bookinger selv.
// Betalte bookinger må styret avbestille, siden det kan involvere refusjon.
export async function cancelPendingBooking(formData: FormData) {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;

  await prisma.booking.updateMany({
    where: { id: bookingId, apartmentId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/book");
  redirect("/book");
}
