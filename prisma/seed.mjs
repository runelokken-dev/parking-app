import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Hentet fra det gamle regnearket – juster/legg til flere i admin-panelet etterpå.
  const spots = ["Plass 12", "Plass 7", "Plass 5"];
  for (const name of spots) {
    await prisma.parkingSpot.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, pricePerDay: 100, vippsNumber: "18362" },
  });

  console.log("Ferdig: parkeringsplasser og innstillinger er lagt inn.");
  console.log("Husk å legge inn leiligheter under Styret \u2192 Leiligheter.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
