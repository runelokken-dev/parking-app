import { durationHours } from "@/lib/dates";

export type PriceSettings = {
  pricePerHour: number;
  pricePerDay: number;
  dailyThresholdHours: number;
};

export type PriceBreakdown = {
  hours: number;
  totalKr: number;
  days: number; // antall hele/påbegynte døgn priset til døgnpris
  extraHours: number; // resterende timer priset per time (0 hvis ingen)
};

/**
 * Prisregel, brukt om igjen for hver påbegynte dag i bookingen:
 * - Under terskelen (standard 5 timer) inn i en (ny) dag: pris per time
 *   for de timene.
 * - Fra og med terskelen inn i en dag: hele dagen prises til døgnpris.
 *
 * Eksempel med default-priser (20 kr/t, 100 kr/døgn, terskel 5t):
 * 1 døgn + 2 timer = 100 + 2*20 = 140 kr (ikke 2*100 = 200 kr).
 * 1 døgn + 6 timer = 100 + 100 = 200 kr (6 timer inn i dag 2 ≥ terskel).
 */
export function calculatePrice(
  start: Date,
  end: Date,
  settings: PriceSettings
): PriceBreakdown {
  const hours = durationHours(start, end);
  const fullDays = Math.floor(hours / 24);
  const remainder = hours - fullDays * 24;

  let days = fullDays;
  let extraHours = 0;

  if (remainder >= settings.dailyThresholdHours) {
    days += 1;
  } else if (remainder > 0) {
    extraHours = remainder;
  }

  const totalKr =
    days * settings.pricePerDay + Math.round(extraHours * settings.pricePerHour);

  return { hours, totalKr, days, extraHours };
}
