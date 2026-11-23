"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Laster siden på nytt hvert 3. sekund (maks 20 ganger) mens betalingen
// bekreftes, slik at brukeren ikke blir stående på "Bekrefter betaling".
export function AutoRefresh({ intervalMs = 3000, maxTimes = 20 }: { intervalMs?: number; maxTimes?: number }) {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= maxTimes) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, maxTimes]);
  return null;
}
