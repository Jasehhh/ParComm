"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { LogOut, QrCode, ScanLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getPercentFull, getStatus } from "@/lib/parkingStatus";
import { subscribeToParkingAreas } from "@/lib/services/db";
import type { ParkingArea } from "@/lib/types/schema";
import { LotCard } from "@/components/LotCard";
import { LotPicker } from "@/components/LotPicker";
import { OccupancyGauge } from "@/components/OccupancyGauge";
import { StatTile } from "@/components/StatTile";
import { LoadingState } from "@/components/LoadingState";
import { Wordmark } from "@/components/Wordmark";

export default function GuardDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const email = firebaseUser?.email?.toLowerCase();
      if (!firebaseUser || email !== "guard@cpu.edu.ph") {
        router.push("/login-page");
      } else {
        setUser(firebaseUser);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

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

  const campus = useMemo(
    () =>
      parkingAreas.reduce(
        (totals, area) => ({
          occupied: totals.occupied + area.occupied,
          capacity: totals.capacity + area.capacity,
        }),
        { occupied: 0, capacity: 0 }
      ),
    [parkingAreas]
  );

  async function handleLogout() {
    await signOut(auth);
    router.push("/login-page");
  }

  if (checkingAuth || !user || loading || !selectedLot) {
    return <LoadingState message="Opening the guard console" />;
  }

  const campusPercent = getPercentFull(campus.occupied, campus.capacity);
  const campusStatus = getStatus(campusPercent);
  const lotAvailable = Math.max(0, selectedLot.capacity - selectedLot.occupied);

  return (
    <div className="bg-sand-50 min-h-screen w-full pb-10">
      <header className="border-sand-200 bg-sand-50/85 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Wordmark withMark size="md" />
            <span className="bg-brand-50 text-brand-700 hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline">
              Guard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="text-ink-500 hover:bg-sand-100 hover:text-ink-900 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-ink-900 text-2xl font-extrabold tracking-tight">Guard console</h1>
            <p className="text-ink-500 mt-1 truncate text-sm">{user.email}</p>
          </div>
          <span
            className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${campusStatus.color} 14%, transparent)`,
              color: `color-mix(in srgb, ${campusStatus.color} 82%, #1c1814)`,
            }}
          >
            Campus {campusStatus.label.toLowerCase()} · {campusPercent}% full
          </span>
        </div>

        {/* Primary guard actions — the reason this screen exists */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <ActionCard
            href="/guard/vehicle-tracking/scan"
            icon={<ScanLine size={22} strokeWidth={2.2} />}
            title="Scan QR"
            description="Log a vehicle in or out"
            primary
          />
          <ActionCard
            href="/guard/vehicle-tracking/generate"
            icon={<QrCode size={22} strokeWidth={2.2} />}
            title="Generate QR"
            description="Issue a ticket for a new vehicle"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <section className="flex flex-col gap-3 lg:sticky lg:top-20">
            <LotPicker
              areas={parkingAreas}
              selectedId={selectedLocationId}
              onSelect={setSelectedLocationId}
            />

            <div className="pc-card p-5">
              <p className="pc-eyebrow">Occupancy</p>
              <p className="text-ink-900 truncate text-sm font-semibold">{selectedLot.name}</p>

              <div className="py-4">
                <OccupancyGauge
                  occupied={selectedLot.occupied}
                  capacity={selectedLot.capacity}
                  size={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <StatTile label="Open spaces" value={lotAvailable} hint="This lot" />
                <StatTile
                  label="Campus open"
                  value={Math.max(0, campus.capacity - campus.occupied)}
                  hint={`of ${campus.capacity}`}
                />
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
          </section>
        </div>
      </main>

    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`hover:shadow-raised flex items-center gap-3.5 rounded-[1rem] p-4 transition-all hover:-translate-y-0.5 ${
        primary ? "bg-brand-400 shadow-raised text-white" : "pc-card text-ink-900"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          primary ? "bg-white/20 text-white" : "bg-brand-50 text-brand-600"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold leading-tight">{title}</span>
        <span className={`block text-xs ${primary ? "text-white/85" : "text-ink-500"}`}>
          {description}
        </span>
      </span>
    </Link>
  );
}
