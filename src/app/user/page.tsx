"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CarFront, ChevronLeft } from "lucide-react";
import type { ParkingArea } from "@/lib/types/schema";
import { freeSpaces, getPercentFull, getStatus, totalOccupancy } from "@/lib/parkingStatus";
import { subscribeToParkingAreas } from "@/lib/services/db";
import { LotCard, LotCardSkeleton } from "@/components/LotCard";
import { LotPicker } from "@/components/LotPicker";
import { OccupancyGauge } from "@/components/OccupancyGauge";
import { StatTile } from "@/components/StatTile";
import { Wordmark } from "@/components/Wordmark";

export default function UserDashboardPage() {
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToParkingAreas((liveData) => {
      setParkingAreas(liveData);

      setSelectedLocationId((currentId) => {
        if (!currentId && liveData.length > 0) {
          return liveData[0].id;
        }
        return currentId;
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectedLot = parkingAreas.find((location) => location.id === selectedLocationId);

  const campus = useMemo(() => totalOccupancy(parkingAreas), [parkingAreas]);

  const availableSpaces = selectedLot ? freeSpaces(selectedLot) : 0;
  const lotStatus = selectedLot
    ? getStatus(getPercentFull(selectedLot.occupied, selectedLot.capacity))
    : null;

  return (
    <div className="bg-sand-50 min-h-screen w-full">
      <header className="border-sand-200 bg-sand-50/85 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3">
          {/* Students arrive here from the login screen — always give them a way back */}
          <Link
            href="/login-page"
            aria-label="Back to sign in"
            className="text-ink-500 hover:bg-sand-100 hover:text-ink-900 -ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <ChevronLeft size={22} />
          </Link>

          <Wordmark withMark size="md" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-5">
        <div className="mb-5">
          <h1 className="text-ink-900 text-2xl font-extrabold tracking-tight">
            Find a space on campus
          </h1>
          <p className="text-ink-500 mt-1 text-sm">
            {loading
              ? "Connecting to the campus feed…"
              : `${freeSpaces(campus)} of ${campus.capacity} spaces open right now.`}
          </p>
        </div>

        {loading || !selectedLot || !lotStatus ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
            <section className="flex flex-col gap-3 lg:sticky lg:top-20">
              <LotPicker
                areas={parkingAreas}
                selectedId={selectedLocationId}
                onSelect={setSelectedLocationId}
              />

              <div className="pc-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="pc-eyebrow">Occupancy</p>
                    <p className="text-ink-900 truncate text-sm font-semibold">{selectedLot.name}</p>
                  </div>
                  <CarFront size={18} className="text-ink-300 shrink-0" />
                </div>

                <div className="py-4">
                  <OccupancyGauge
                    occupied={selectedLot.occupied}
                    capacity={selectedLot.capacity}
                    size={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <StatTile
                    label="Open spaces"
                    value={availableSpaces}
                    accent={lotStatus.color}
                    hint={lotStatus.label}
                  />
                  <StatTile label="Total capacity" value={selectedLot.capacity} hint="This lot" />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 className="text-ink-900 text-sm font-bold">All parking areas</h2>
                <span className="text-ink-400 text-xs">{parkingAreas.length} lots</span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {parkingAreas.map((location) => (
                  <LotCard
                    key={location.id}
                    {...location}
                    active={location.id === selectedLocationId}
                    onSelect={setSelectedLocationId}
                  />
                ))}
              </div>

              <p className="text-ink-400 mt-4 text-xs leading-relaxed">
                Counts update the moment a guard scans a vehicle in or out. Tap a lot to see it in
                the gauge.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <div className="flex flex-col gap-3">
        <div className="pc-skeleton h-16 rounded-[1rem]" />
        <div className="pc-card flex flex-col items-center gap-4 p-5">
          <div className="pc-skeleton h-[200px] w-[200px] max-w-full rounded-full" />
          <div className="grid w-full grid-cols-2 gap-2.5">
            <div className="pc-skeleton h-16 rounded-[0.75rem]" />
            <div className="pc-skeleton h-16 rounded-[0.75rem]" />
          </div>
        </div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <LotCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
