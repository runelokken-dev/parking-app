"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApartmentId } from "@/lib/session";
import { parseDateKey, todayUtcMidnight } from "@/lib/dates";

export async function bookSpot(formData: FormData) {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const spotId = String(formData.get("spotId") || "");
  const dateKey = String(formData.get("date") || "");
  if (!spotId || !dateKey) return;

  const date = parseDateKey(dateKey);
  if (date < todayUtcMidnight()) return;

  try {
    await prisma.booking.create({
      data: { spotId, apartmentId, date },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      redirect("/book?feil=opptatt");
    }
    throw err;
  }

  revalidatePath("/book");
  redirect("/book");
}

export async function cancelBooking(formData: FormData) {
  const apartmentId = getApartmentId();
  if (!apartmentId) redirect("/");

  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) return;

  // En beboer kan bare avbestille sine egne bookinger.
  await prisma.booking.deleteMany({
    where: { id: bookingId, apartmentId },
  });

  revalidatePath("/book");
  redirect("/book");
}
