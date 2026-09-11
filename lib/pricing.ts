import { durationHours } from "@/lib/dates";

export type PriceSettings = {
  pricePerHour: number;
  pricePerDay: number;
  dailyThresholdHours: number;
};

export type PriceBreakdown = {
  hours: number;
  totalKr: number;
  basis: "hourly" | "daily";
  days?: number; // kun satt når basis er "daily"
};

/**
 * Prisregel:
 * - Under terskelen (standard 5 timer): pris per time.
 * - Fra og med terskelen: påbegynte døgn à døgnpris
 *   (f.eks. 30 timer = 2 påbegynte døgn).
 */
export function calculatePrice(
  start: Date,
  end: Date,
  settings: PriceSettings
): PriceBreakdown {
  const hours = durationHours(start, end);

  if (hours < settings.dailyThresholdHours) {
    return {
      hours,
      totalKr: Math.round(hours * settings.pricePerHour),
      basis: "hourly",
    };
  }

  const days = Math.ceil(hours / 24);
  return {
    hours,
    totalKr: days * settings.pricePerDay,
    basis: "daily",
    days,
  };
}
