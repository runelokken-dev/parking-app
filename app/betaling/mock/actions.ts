"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isVippsConfigured } from "@/lib/vipps";

export async function confirmMock(formData: FormData) {
  if (isVippsConfigured()) redirect("/");
  const ref = String(formData.get("ref") || "");
  if (!ref) redirect("/book");

  await prisma.booking.updateMany({
    where: { paymentRef: ref, status: "PENDING" },
    data: { status: "CONFIRMED", paidAt: new Date(), vippsState: "AUTHORIZED (test)" },
  });

  redirect(`/betaling/retur?ref=${ref}`);
}

export async function cancelMock(formData: FormData) {
  if (isVippsConfigured()) redirect("/");
  const ref = String(formData.get("ref") || "");
  if (!ref) redirect("/book");

  await prisma.booking.updateMany({
    where: { paymentRef: ref, status: "PENDING" },
    data: { status: "CANCELLED", vippsState: "CANCELLED (test)" },
  });

  redirect(`/betaling/retur?ref=${ref}`);
}
